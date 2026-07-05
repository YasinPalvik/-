import React, { useState, useEffect } from "react";
import { UserState, SubjectId } from "../types";
import { db, auth } from "../lib/firebase";
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  getDocs
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  MessageSquare,
  BookOpen,
  Send,
  CheckCircle,
  MessageCircle,
  Clock,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Flame,
  ChevronLeft,
  AlertCircle
} from "lucide-react";

// Firestore Error handler as per the firebase-integration skill instructions
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface StudentPresence {
  id: string;
  fullName: string;
  topic: string;
  lastActive: string;
  isGuest: boolean;
}

interface QARecord {
  id: string;
  topic: string;
  authorId: string;
  authorName: string;
  questionText: string;
  createdAt: string;
  status: "open" | "solved";
}

interface AnswerRecord {
  id: string;
  authorId: string;
  authorName: string;
  answerText: string;
  createdAt: string;
}

// Map subject IDs to beautiful Persian labels
const SUBJECT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  surgery: { label: "جراحی عمومی", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  cardiology: { label: "قلب و عروق", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  pediatrics: { label: "کودکان", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  gynecology: { label: "زنان و زایمان", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  pharmacology: { label: "داروشناسی بالینی", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

interface GlobalStudyHallProps {
  userState: UserState;
  onUpdateState: (newState: UserState) => void;
  themeColor: string;
}

export default function GlobalStudyHall({ userState, onUpdateState, themeColor }: GlobalStudyHallProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [activeTopic, setActiveTopic] = useState<string>("surgery");
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
  const [displayName, setDisplayName] = useState<string>("");
  const [hasEnteredName, setHasEnteredName] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Lists & Feeds state
  const [onlineStudents, setOnlineStudents] = useState<StudentPresence[]>([]);
  const [questions, setQuestions] = useState<QARecord[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QARecord | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // Form input states
  const [newQuestionText, setNewQuestionText] = useState<string>("");
  const [newAnswerText, setNewAnswerText] = useState<string>("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState<boolean>(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);

  // Set default active topic to user's current study subject if available
  useEffect(() => {
    if (userState.currentSubject && SUBJECT_MAP[userState.currentSubject]) {
      setActiveTopic(userState.currentSubject);
    }
  }, [userState.currentSubject]);

  // Auth synchronization & setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // If logged in via credentialed user
        if (userState.fullName) {
          setDisplayName(userState.fullName);
          setHasEnteredName(true);
        } else if (user.displayName) {
          setDisplayName(user.displayName);
          setHasEnteredName(true);
        } else {
          // If we have local storage username or fallback
          const savedName = localStorage.getItem("study_hall_nickname");
          if (savedName) {
            setDisplayName(savedName);
            setHasEnteredName(true);
          }
        }
      } else {
        // If not logged in, auto sign in anonymously
        setIsAuthenticating(true);
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Anonymous authentication error:", e);
        } finally {
          setIsAuthenticating(false);
        }
      }
    });

    return () => unsubscribe();
  }, [userState.fullName]);

  // Submit Nickname for Guests
  const handleJoinStudyHall = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      localStorage.setItem("study_hall_nickname", displayName.trim());
      setHasEnteredName(true);
    }
  };

  // Heartbeat Presence Ping
  useEffect(() => {
    if (!currentUser || !hasEnteredName || !displayName.trim()) return;

    const uid = currentUser.uid;
    const path = `study_hall_presence/${uid}`;

    const pingPresence = async () => {
      try {
        await setDoc(doc(db, "study_hall_presence", uid), {
          fullName: displayName.trim(),
          topic: activeTopic,
          lastActive: new Date().toISOString(),
          isGuest: currentUser.isAnonymous
        });
      } catch (err) {
        // Log secure details if permission issue
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    };

    // Ping immediately
    pingPresence();

    // Ping every 15 seconds to keep presence alive
    const interval = setInterval(pingPresence, 15000);

    // Clean up presence on unmount
    return () => {
      clearInterval(interval);
      deleteDoc(doc(db, "study_hall_presence", uid)).catch((err) => {
        console.error("Cleanup presence failed:", err);
      });
    };
  }, [currentUser, hasEnteredName, displayName, activeTopic]);

  // Read presence in real-time
  useEffect(() => {
    if (!currentUser || !hasEnteredName) return;

    const path = "study_hall_presence";
    const q = query(collection(db, "study_hall_presence"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: StudentPresence[] = [];
      const now = Date.now();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Only include if active in the last 45 seconds (prevent ghost presence)
        const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
        if (now - lastActiveTime < 45000) {
          list.push({
            id: docSnap.id,
            fullName: data.fullName || "کاربر ناشناس",
            topic: data.topic || "surgery",
            lastActive: data.lastActive || "",
            isGuest: !!data.isGuest,
          });
        }
      });
      setOnlineStudents(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [currentUser, hasEnteredName]);

  // Read Questions in real-time
  useEffect(() => {
    if (!currentUser || !hasEnteredName) return;

    const path = "study_hall_questions";
    let q = query(collection(db, "study_hall_questions"), orderBy("createdAt", "desc"));

    // If specific filter selected (not "all"), filter questions
    if (selectedTopicFilter !== "all") {
      q = query(
        collection(db, "study_hall_questions"),
        where("topic", "==", selectedTopicFilter),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: QARecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          topic: data.topic || "surgery",
          authorId: data.authorId || "",
          authorName: data.authorName || "کاربر ناشناس",
          questionText: data.questionText || "",
          createdAt: data.createdAt || "",
          status: (data.status as "open" | "solved") || "open",
        });
      });
      setQuestions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [currentUser, hasEnteredName, selectedTopicFilter]);

  // Read Answers for selected question
  useEffect(() => {
    if (!currentUser || !hasEnteredName || !selectedQuestion) {
      setAnswers([]);
      return;
    }

    const path = `study_hall_questions/${selectedQuestion.id}/answers`;
    const q = query(
      collection(db, "study_hall_questions", selectedQuestion.id, "answers"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AnswerRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          authorId: data.authorId || "",
          authorName: data.authorName || "پاسخ‌دهنده",
          answerText: data.answerText || "",
          createdAt: data.createdAt || "",
        });
      });
      setAnswers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [currentUser, hasEnteredName, selectedQuestion]);

  // Post Question
  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newQuestionText.trim() || isSubmittingQuestion) return;

    setIsSubmittingQuestion(true);
    const path = "study_hall_questions";
    try {
      await addDoc(collection(db, "study_hall_questions"), {
        topic: activeTopic,
        authorId: currentUser.uid,
        authorName: displayName.trim(),
        questionText: newQuestionText.trim(),
        createdAt: new Date().toISOString(),
        status: "open",
      });
      setNewQuestionText("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Post Answer
  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedQuestion || !newAnswerText.trim() || isSubmittingAnswer) return;

    setIsSubmittingAnswer(true);
    const path = `study_hall_questions/${selectedQuestion.id}/answers`;
    try {
      await addDoc(collection(db, "study_hall_questions", selectedQuestion.id, "answers"), {
        authorId: currentUser.uid,
        authorName: displayName.trim(),
        answerText: newAnswerText.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewAnswerText("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Toggle Question solved status
  const handleToggleSolved = async (question: QARecord) => {
    if (!currentUser || currentUser.uid !== question.authorId) return;

    const newStatus = question.status === "open" ? "solved" : "open";
    const path = `study_hall_questions/${question.id}`;
    try {
      await updateDoc(doc(db, "study_hall_questions", question.id), {
        status: newStatus
      });
      setSelectedQuestion(prev => prev && prev.id === question.id ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // UI loading states
  if (isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-100">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-black animate-pulse">در حال اتصال به شبکه تالار مطالعه جهانی...</p>
      </div>
    );
  }

  // Name Entry View for Guests
  if (!hasEnteredName) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 text-right shadow-[0_0_50px_rgba(99,102,241,0.1)]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Users className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-black text-white text-center mb-2">ورود به تالار مطالعه بالینی جهانی</h3>
        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
          برای حضور در تالار مطالعه زنده و اشتراک‌گذاری سوالات بالینی با سایر پزشکان و دانشجویان آنلاین، یک نام یا نام مستعار بالینی انتخاب کنید.
        </p>
        <form onSubmit={handleJoinStudyHall} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-2 mr-1">نام یا عنوان بالینی شما</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثال: دکتر علوی / دانشجوی فیزیوپت"
              maxLength={40}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-right transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-1.5"
          >
            <span>ورود و اتصال زنده</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Active Subject List
  const onlineInTopic = (subId: string) => onlineStudents.filter(s => s.topic === subId).length;

  return (
    <div className="space-y-6 text-right pb-12">
      {/* Visual Header Banner */}
      <div className="relative bg-slate-900/40 border border-white/5 rounded-3xl p-6 md:p-8 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>{onlineStudents.length} پزشک آنلاین در تالار</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">تالار مطالعه بالینی جهانی</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              شبکه اشتراک‌گذاری زنده دانش پزشکی. مشاهده کنید چه کسی چه موضوعی را مطالعه می‌کند، مباحثه بالینی زنده را آغاز کنید و چالش‌های دشوار را به کمک جامعه پزشکی حل نمایید.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 min-w-[200px]">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-extrabold border border-indigo-500/20 shadow-inner">
              {displayName.substring(0, 1)}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-300">پروفایل تالار زنده</p>
              <h4 className="text-xs font-black text-white">{displayName}</h4>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">در حال مطالعه: {SUBJECT_MAP[activeTopic]?.label || "عمومی"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Presence and Filters (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* My Topic Selector Card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white">موضوع فعلی مطالعه شما</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              با انتخاب هر موضوع، نام شما در دسته‌بندی پزشکان آنلاین آن درس قرار می‌گیرد تا بقیه هم‌تیمی‌ها مطلع شوند.
            </p>
            <div className="space-y-2">
              {Object.entries(SUBJECT_MAP).map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => setActiveTopic(id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-right text-xs font-bold transition-all ${
                    activeTopic === id
                      ? "bg-indigo-600/15 border-indigo-500/40 text-white shadow-lg"
                      : "bg-slate-950/20 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${info.color.replace('text-', 'bg-')}`} />
                    <span>{info.label}</span>
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400">
                    {onlineInTopic(id)} آنلاین
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Online Physicians List */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white">پزشکان فعال در تالار</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                {onlineStudents.length} زنده
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {onlineStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  در حال حاضر پزشک دیگری آنلاین نیست.
                </div>
              ) : (
                onlineStudents.map((student) => {
                  const subInfo = SUBJECT_MAP[student.topic];
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-indigo-900/60 flex items-center justify-center font-extrabold text-xs text-indigo-200 border border-white/5 shadow-inner">
                            {student.fullName.substring(0, 1)}
                          </div>
                          <span className="absolute bottom-0 left-0 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950" />
                        </div>
                        <div className="min-w-0 text-right">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{student.fullName}</h4>
                          <span className={`text-[9px] font-medium ${subInfo?.color || "text-slate-400"} block mt-0.5`}>
                            {subInfo?.label || "مطالعه عمومی"}
                          </span>
                        </div>
                      </div>
                      {student.id === currentUser?.uid && (
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold">
                          خودم
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Q&A Board (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-5">
            {/* QA Board Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black text-white">تالار مباحثه و پرسش و پاسخ بالینی</h3>
              </div>

              {/* Subject Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTopicFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedTopicFilter === "all"
                      ? "bg-slate-100 text-slate-950"
                      : "bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  همه موضوعات
                </button>
                {Object.entries(SUBJECT_MAP).map(([id, info]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedTopicFilter(id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedTopicFilter === id
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : "bg-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Question Form */}
            <form onSubmit={handlePostQuestion} className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">سوال خود را در دسته <span className="text-indigo-400">{SUBJECT_MAP[activeTopic]?.label}</span> بپرسید:</span>
                <span className="text-slate-500 font-mono">{newQuestionText.length}/1000</span>
              </div>
              <textarea
                required
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                maxLength={1000}
                placeholder="سوال بالینی، مورد مشکوک، یا چالش داروشناسی خود را اینجا به اشتراک بگذارید..."
                className="w-full bg-slate-900/40 border border-white/5 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 min-h-[80px] max-h-[150px] resize-y text-right"
              />
              <div className="flex justify-between items-center">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>پرسش شما فوراً برای همه اعضای آنلاین همگام‌سازی می‌شود.</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingQuestion || !newQuestionText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isSubmittingQuestion ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  )}
                  <span>ارسال پرسش</span>
                </button>
              </div>
            </form>

            {/* Questions Feed */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 mr-1">پرسش‌های اخیر بالینی</h4>
              <div className="space-y-3">
                {questions.length === 0 ? (
                  <div className="py-12 text-center bg-slate-950/20 rounded-xl border border-white/5 text-slate-500 text-xs">
                    پرسشی یافت نشد. اولین سوال بالینی را شما مطرح کنید!
                  </div>
                ) : (
                  questions.map((q) => {
                    const subInfo = SUBJECT_MAP[q.topic];
                    const isAuthor = q.authorId === currentUser?.uid;
                    const dateFormatted = new Date(q.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                          selectedQuestion?.id === q.id
                            ? "bg-slate-950/80 border-indigo-500/50 shadow-lg shadow-indigo-950/20"
                            : "bg-slate-950/30 border-white/5 hover:border-white/10 hover:bg-slate-950/40"
                        }`}
                        onClick={() => setSelectedQuestion(q)}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-300">دکتر {q.authorName}</span>
                            <span className="text-[9px] text-slate-500 font-bold font-mono">{dateFormatted}</span>
                            {isAuthor && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                                من
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${subInfo?.bg || "bg-slate-800"}`}>
                              {subInfo?.label || "عمومی"}
                            </span>
                            {q.status === "solved" ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>حل شده</span>
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                <span>در انتظار حل</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-3">
                          {q.questionText}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2.5 mt-1.5">
                          <div className="flex items-center gap-1 text-indigo-400 font-bold">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>مشاهده مباحثه و پاسخ‌ها</span>
                          </div>
                          
                          {isAuthor && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSolved(q);
                              }}
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
                                q.status === "solved"
                                  ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                  : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              }`}
                            >
                              {q.status === "solved" ? "علامت‌گذاری به عنوان باز" : "علامت‌گذاری به عنوان حل شده"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION THREAD MODAL / SLIDE-OVER */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-4">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setSelectedQuestion(null)} />

            {/* Modal content body */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-slate-900 border-r md:border-l border-white/10 rounded-2xl md:rounded-r-none md:rounded-l-2xl shadow-2xl flex flex-col z-10 text-right overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBJECT_MAP[selectedQuestion.topic]?.bg || "bg-slate-800"}`}>
                    {SUBJECT_MAP[selectedQuestion.topic]?.label || "عمومی"}
                  </span>
                  <h3 className="text-xs font-black text-white">مشاهده مباحثه زنده</h3>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Original Question Card */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-indigo-400">دکتر {selectedQuestion.authorName}</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono">
                      {new Date(selectedQuestion.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedQuestion.questionText}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                    {selectedQuestion.status === "solved" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>این سوال با مشورت حل شده است</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>در انتظار نظرات بالینی همکاران</span>
                      </span>
                    )}

                    {selectedQuestion.authorId === currentUser?.uid && (
                      <button
                        onClick={() => handleToggleSolved(selectedQuestion)}
                        className="text-[10px] font-black text-indigo-300 hover:text-indigo-200 underline"
                      >
                        {selectedQuestion.status === "solved" ? "تغییر وضعیت به باز" : "حل شد ✓"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Answers / Discussion Feed */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 border-b border-white/5 pb-2">پاسخ‌ها و تحلیل‌های بالینی همکاران ({answers.length})</h4>
                  <div className="space-y-3">
                    {answers.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs">
                        هنوز تحلیلی برای این سوال ثبت نشده است. اولین پاسخ بالینی را شما ثبت کنید!
                      </div>
                    ) : (
                      answers.map((ans) => {
                        const isAnsAuthor = ans.authorId === currentUser?.uid;
                        const dateFormatted = new Date(ans.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div
                            key={ans.id}
                            className={`p-3.5 rounded-xl border ${
                              isAnsAuthor
                                ? "bg-indigo-650/10 border-indigo-500/25 mr-4"
                                : "bg-slate-950/30 border-white/5 ml-4"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="text-[11px] font-black text-slate-300">
                                دکتر {ans.authorName} {isAnsAuthor && <span className="text-[9px] text-indigo-400">(من)</span>}
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold font-mono">{dateFormatted}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {ans.answerText}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Footer Input Form */}
              <form onSubmit={handlePostAnswer} className="p-4 border-t border-white/5 bg-slate-950/80 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>پاسخ یا تحلیل علمی خود را بنویسید:</span>
                  <span className="font-mono">{newAnswerText.length}/1000</span>
                </div>
                <div className="flex gap-2 items-end">
                  <textarea
                    required
                    value={newAnswerText}
                    onChange={(e) => setNewAnswerText(e.target.value)}
                    maxLength={1000}
                    placeholder="پیشنهاد درمانی، فرضیه تشخیصی یا منبع علمی..."
                    className="flex-1 bg-slate-900 border border-white/5 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 min-h-[60px] max-h-[120px] resize-none text-right"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingAnswer || !newAnswerText.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
                  >
                    {isSubmittingAnswer ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 rotate-180 text-white" />
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
