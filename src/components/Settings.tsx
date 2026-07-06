import React, { useState } from "react";
import { DEFAULT_STATE } from "../lib/state";
import { useContent } from "../lib/contentContext";
import { UserState, Chapter, ConceptNode, Exercise } from "../types";
import { 
  RefreshCw, 
  Trash2, 
  Crown, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  CreditCard, 
  Shield, 
  Globe, 
  Award, 
  CheckCircle2, 
  ArrowLeft,
  Database,
  BookOpen,
  PlusCircle,
  FileText,
  HelpCircle,
  Activity,
  Layers,
  Sparkle,
  Lock,
  Loader2,
  ListPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Tilt3D from "./Tilt3D";

interface SettingsProps {
  userState: UserState;
  onUpdateState: (state: UserState) => void;
  onNavigateHome: () => void;
  idToken?: string | null;
}

export default function Settings({ userState, onUpdateState, onNavigateHome, idToken }: SettingsProps) {
  const { 
    chapters, 
    addChapter, 
    addConcept, 
    addExercise, 
    addSyllabusChapter, 
    addIslandQuestion, 
    refreshContent, 
    isLoading: isContentLoading 
  } = useContent();

  const [activeTab, setActiveTab] = useState<"general" | "cms">("general");
  const [cmsMode, setCmsMode] = useState<"syllabus" | "question">("syllabus");
  
  // Settings general states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proUpgradedSimulated, setProUpgradedSimulated] = useState(false);

  // Form: Syllabus chapter / Lesson Capsule State
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.id || "ch1");
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [newChapterId, setNewChapterId] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");

  const [syllabusOverview, setSyllabusOverview] = useState("");
  const [section1Title, setSection1Title] = useState("");
  const [section1Content, setSection1Content] = useState("");
  const [section2Title, setSection2Title] = useState("");
  const [section2Content, setSection2Content] = useState("");
  
  const [pitfallTitle, setPitfallTitle] = useState("");
  const [pitfallDesc, setPitfallDesc] = useState("");
  const [pitfallConsequence, setPitfallConsequence] = useState("");
  
  const [pearlTitle, setPearlTitle] = useState("");
  const [pearlContent, setPearlContent] = useState("");

  // Form: Island Question State
  const [qChapterId, setQChapterId] = useState(chapters[0]?.id || "ch1");
  const [qIslandId, setQIslandId] = useState(1);
  const [qPrompt, setQPrompt] = useState("");
  const [qOptionA, setQOptionA] = useState("");
  const [qOptionB, setQOptionB] = useState("");
  const [qOptionC, setQOptionC] = useState("");
  const [qOptionD, setQOptionD] = useState("");
  const [qCorrectAnswer, setQCorrectAnswer] = useState("");
  const [qExplanationCorrect, setQExplanationCorrect] = useState("");
  const [qExplanationWrong, setQExplanationWrong] = useState("");

  // Submission Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleResetProgress = () => {
    onUpdateState(DEFAULT_STATE);
    setShowResetConfirm(false);
    setProUpgradedSimulated(false);
  };

  const handleSaveSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const finalChapterId = isNewChapter ? newChapterId.trim() : selectedChapterId;
      if (!finalChapterId) {
        throw new Error("شناسه مبحث الزامی است");
      }

      // 1. If it's a new chapter, register the chapter and concept nodes first
      if (isNewChapter) {
        const chData: Chapter = {
          id: finalChapterId,
          title: newChapterTitle.trim(),
          description: newChapterDesc.trim()
        };
        const chSuccess = await addChapter(finalChapterId, chData, idToken);
        if (!chSuccess) throw new Error("ثبت مبحث جدید با خطا مواجه شد");

        // Create a basic concept node for this chapter so study flow runs
        const conceptId = `${finalChapterId}_concept_1`;
        const conceptData: ConceptNode = {
          id: conceptId,
          chapterId: finalChapterId,
          title: `مفاهیم کلیدی: ${newChapterTitle.trim()}`,
          definition: syllabusOverview.trim() || `کپسول اصلی آموزش مبحث ${newChapterTitle.trim()}`,
          bloomLevel: "comprehension",
          prerequisites: [],
          highStakes: true,
          distractors: ["تله کاذب ۱", "تله کاذب ۲", "تله کاذب ۳"]
        };
        const conceptSuccess = await addConcept(conceptId, conceptData, idToken);
        if (!conceptSuccess) throw new Error("ثبت مفهوم اولیه مبحث با خطا مواجه شد");

        // Create a default multiple choice exercise for this concept
        const exId = `ex_${finalChapterId}_1`;
        const exData: Exercise = {
          id: exId,
          conceptId: conceptId,
          type: "multipleChoice",
          prompt: `مهم‌ترین اقدام اورژانسی در مواجهه با عوارض حاد ${newChapterTitle.trim()} چیست؟`,
          options: ["احیای مایعات و تثبیت وضعیت وریدی", "ترخیص سریع بیمار با آرام‌بخش", "تجویز آنتی‌بیوتیک تزریقی بدون بررسی", "مانیتورینگ سرپایی بیمار"],
          correctAnswer: "احیای مایعات و تثبیت وضعیت وریدی",
          explanationCorrect: "بسیار عالی! در جراحی عمومی، پایداری همودینامیک و احیای مایعات خط اول نجات بیمار است."
        };
        await addExercise(exId, exData, idToken);
      }

      // 2. Build the structured Syllabus Capsule
      const syllabusData = {
        chapterId: finalChapterId,
        overview: isNewChapter ? newChapterTitle.trim() : (chapters.find(c => c.id === finalChapterId)?.title || "مبحث جراحی"),
        sections: [
          { title: section1Title.trim() || "فیزیولوژی و پاتولوژی بالینی", content: section1Content.trim() || "محتوای علمی بخش اول" },
          { title: section2Title.trim() || "اصول رویکرد درمانی و جراحی", content: section2Content.trim() || "محتوای علمی بخش دوم" }
        ],
        pitfalls: [
          {
            title: pitfallTitle.trim() || "غفلت از عوارض حاد همودینامیک",
            description: pitfallDesc.trim() || "عدم پایش رفلکس‌ها و فشار شریانی بیمار",
            consequence: pitfallConsequence.trim() || "بروز شوک همودینامیک کشنده و ایست قلبی غیرقابل جبران"
          }
        ],
        combinedPearls: [
          {
            title: pearlTitle.trim() || "نکته طلایی و مروارید جراحی",
            content: pearlContent.trim() || "پایش مستمر بالینی برترین سپر دفاعی جراح است."
          }
        ]
      };

      const success = await addSyllabusChapter(finalChapterId, syllabusData, idToken);
      if (success) {
        setSaveSuccess(true);
        // Clear inputs
        setSyllabusOverview("");
        setSection1Title("");
        setSection1Content("");
        setSection2Title("");
        setSection2Content("");
        setPitfallTitle("");
        setPitfallDesc("");
        setPitfallConsequence("");
        setPearlTitle("");
        setPearlContent("");
        setIsNewChapter(false);
      } else {
        throw new Error("خطا در برقراری ارتباط با پایگاه داده ابری");
      }
    } catch (err: any) {
      setSaveError(err.message || "ذخیره اطلاعات با شکست مواجه شد");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const uniqueId = `q_${qChapterId}_isl${qIslandId}_${Math.random().toString(36).substring(2, 7)}`;
      
      const questionData = {
        id: uniqueId,
        islandId: qIslandId,
        type: qIslandId === 3 ? "caseStudy" as const : "multipleChoice" as const,
        prompt: qPrompt.trim(),
        options: [qOptionA.trim(), qOptionB.trim(), qOptionC.trim(), qOptionD.trim()].filter(Boolean),
        correctAnswer: qCorrectAnswer.trim(),
        explanationCorrect: qExplanationCorrect.trim(),
        explanationWrong: qExplanationWrong.trim() || "دقت کنید، این گزینه با پاتولوژی بالینی بیمار مغایرت دارد."
      };

      const success = await addIslandQuestion(uniqueId, questionData, idToken);
      if (success) {
        setSaveSuccess(true);
        // Clear inputs
        setQPrompt("");
        setQOptionA("");
        setQOptionB("");
        setQOptionC("");
        setQOptionD("");
        setQCorrectAnswer("");
        setQExplanationCorrect("");
        setQExplanationWrong("");
      } else {
        throw new Error("خطا در ثبت نمونه سوال جدید روی سرور");
      }
    } catch (err: any) {
      setSaveError(err.message || "ذخیره اطلاعات با شکست مواجه شد");
    } finally {
      setIsSaving(false);
    }
  };

  const benefits = [
    "بیش از ۲۵۰ سناریوی کیس بالینی پیشرفته (Boss Levels)",
    "سیستم مانیتورینگ ECG تعاملی حین احیا و مانیتورینگ",
    "دسترسی کامل آفلاین بدون نیاز به اتصال مجدد",
    "تحلیل‌گر خطاهای بالینی انفرادی با هوش مصنوعی",
    "بدون هیچ‌گونه آگهی یا محدودیت در تعداد جان‌ها",
  ];

  return (
    <div className="max-w-3xl mx-auto bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl rounded-[32px] p-6 md:p-8 space-y-6 text-right shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative z-10" dir="rtl" id="settings-view">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 justify-end sm:justify-start">
            <Database className="w-5 h-5 text-indigo-400" />
            تنظیمات و سامانه مدیریت محتوای بالینی (CMS)
          </h2>
          <p className="text-xs text-slate-400">پیکربندی پرونده آموزشی، ارتقای پرو و افزودن درسنامه بدون اختلال</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs text-indigo-400 font-extrabold hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-all bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10 self-end sm:self-center"
        >
          <span>بازگشت به خانه</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/40 border border-white/5 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "general"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkle className="w-4 h-4" />
          تنظیمات عمومی و پرو
        </button>
        <button
          onClick={() => {
            setActiveTab("cms");
            setSaveSuccess(false);
            setSaveError("");
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 relative ${
            activeTab === "cms"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" />
          پنل مدیریت محتوای بالینی (CMS)
          <span className="absolute top-1 left-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "general" ? (
          <motion.div
            key="general-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Account Info Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-300">اطلاعات پرونده آموزشی</h3>
              <div className="bg-slate-950/40 border border-white/[0.04] p-4.5 rounded-2xl space-y-3 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>تاریخ شروع پرونده:</span>
                  <span className="font-semibold text-slate-200">جولای ۲۰۲۶ (نسخه همگام ابری)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>پایگاه داده همزمان:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    Firestore (امنیت چندلایه)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>وضعیت اتصال و همگام‌سازی:</span>
                  <span className="font-semibold text-slate-200">فعال (بدون سربار روی مرورگر)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>نوع مجوز دسترسی:</span>
                  {userState.isPremium || proUpgradedSimulated ? (
                    <span className="text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono text-[9px] shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                      پرونده طلایی پرو (Pro Account)
                    </span>
                  ) : (
                    <span className="text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[9px]">پرونده پایه رایگان</span>
                  )}
                </div>
              </div>
            </div>

            {/* Upgrade card */}
            <Tilt3D scale={1.01}>
              <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900/60 to-purple-950/80 border border-white/10 rounded-[28px] p-6 relative overflow-hidden shadow-2xl group text-right">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                
                <div className="absolute left-6 top-6 w-12 h-12 shrink-0">
                  <img 
                    src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png" 
                    alt="Crown 3D" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.2)] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                  />
                </div>

                <div className="relative space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      Upgrade to PRO
                    </span>
                    <span className="text-[10px] text-indigo-300 font-extrabold">بسته جامع آمادگی دستیاری</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white">ارتقای پرونده به سگ نزن پرو (Premium)</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-[80%]">
                      با ارتقا به نسخه پرو به برترین سناریوهای پاتولوژی حاد جراحی کشور، گواهی هوشمند و شبیه‌سازهای نجات جان بیمار دسترسی یابید.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowProModal(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] active:scale-98"
                  >
                    {userState.isPremium || proUpgradedSimulated ? "مشاهده وضعیت اشتراک پرو طلایی" : "مشاهده جزییات پلن اشتراک پرو"}
                  </button>
                </div>
              </div>
            </Tilt3D>

            {/* Reset progress */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-black text-rose-400">بخش امنیتی پرونده بالینی</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                اگر تمایل دارید مجدداً تمام دروس، سناریوها، کانون‌های خطا و پیشرفت مباحث ۹ گانه را از صفر شروع کنید، پرونده را ریست نمایید. اطلاعات به هیچ‌عنوان قابل بازیابی نخواهد بود.
              </p>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 font-extrabold text-xs py-2.5 px-4 rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                پاک‌سازی کامل پرونده و شروع مجدد
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cms-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Auth Barrier */}
            {!idToken ? (
              <div className="bg-slate-950/60 border border-amber-500/10 rounded-2xl p-6 text-center space-y-4">
                <Lock className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-amber-300">نیاز به ورود به حساب کاربری</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    برای ثبت درسنامه‌ها یا نمونه‌سوالات جدید در دیتابیس ابری مستحکم سگ نزن، لطفاً ابتدا از دکمه «ورود به حساب کاربری» در منوی سایدبار استفاده نمایید تا احراز هویت شما تایید شود.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Seed Status & Manual Refresh */}
                <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                      <span className="text-xs font-bold text-white block">پایگاه داده آنلاین و مقیاس‌پذیر</span>
                      <span className="text-[10px] text-slate-400">به‌طور زنده هر ثانیه با Firestore همگام است</span>
                    </div>
                  </div>
                  <button
                    onClick={refreshContent}
                    disabled={isContentLoading}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {isContentLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>به‌روزرسانی مخزن محلی</span>
                  </button>
                </div>

                {/* CMS Mode Toggle */}
                <div className="flex bg-slate-950/20 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => {
                      setCmsMode("syllabus");
                      setSaveSuccess(false);
                      setSaveError("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      cmsMode === "syllabus"
                        ? "bg-slate-800 text-indigo-300 border border-white/5"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    ثبت درسنامه تخصصی جدید
                  </button>
                  <button
                    onClick={() => {
                      setCmsMode("question");
                      setSaveSuccess(false);
                      setSaveError("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      cmsMode === "question"
                        ? "bg-slate-800 text-indigo-300 border border-white/5"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    ثبت نمونه سوال آموزشی جدید
                  </button>
                </div>

                {/* Submissions Alerts */}
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-300 font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>محتوای جدید با موفقیت همگام‌سازی شد و بدون هیچ‌گونه قطعی برای تمام کاربران متصل فعال گردید! 🎉</span>
                  </motion.div>
                )}

                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-300 font-bold"
                  >
                    <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>خطا: {saveError}</span>
                  </motion.div>
                )}

                {/* FORMS */}
                {cmsMode === "syllabus" ? (
                  <form onSubmit={handleSaveSyllabus} className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-300">مبحث هدف درسنامه</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-400">
                        <input
                          type="checkbox"
                          checked={isNewChapter}
                          onChange={(e) => setIsNewChapter(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-white/10"
                        />
                        <span>ایجاد مبحث/سرفصل درسی کاملاً جدید</span>
                      </label>
                    </div>

                    {isNewChapter ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 block font-bold">کد یکتا (مانند ortho_ch1):</label>
                          <input
                            type="text"
                            required
                            placeholder="ortho_ch1"
                            value={newChapterId}
                            onChange={(e) => setNewChapterId(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-slate-400 block font-bold">عنوان کامل مبحث جدید:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلا: مباحث ارتوپدی و آسیب‌های مفاصل"
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-[10px] text-slate-400 block font-bold">شرح خلاصه مبحث جهت نمایش در بورد:</label>
                          <input
                            type="text"
                            required
                            placeholder="توضیحات اجمالی پاتولوژی ارتوپدی"
                            value={newChapterDesc}
                            onChange={(e) => setNewChapterDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block font-bold">انتخاب مبحث موجود:</label>
                        <select
                          value={selectedChapterId}
                          onChange={(e) => setSelectedChapterId(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {chapters.map((ch) => (
                            <option key={ch.id} value={ch.id}>{ch.title} ({ch.id})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block font-bold">خلاصه کلان مبحث (Overview):</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="معرفی جامع بالینی و فیزیوپاتولوژی مبحث جهت خوراک اولیه هوش مصنوعی مینو..."
                        value={syllabusOverview}
                        onChange={(e) => setSyllabusOverview(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <span className="text-[11px] font-black text-slate-300 block">بخش اول درسنامه (سرفصل اول)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 block">عنوان بخش اول:</label>
                          <input
                            type="text"
                            placeholder="مثال: فیزیولوژی و پاتولوژی بالینی"
                            value={section1Title}
                            onChange={(e) => setSection1Title(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-slate-400 block">محتوای تفصیلی بخش اول:</label>
                          <textarea
                            rows={3}
                            placeholder="شرح کامل فیزیولوژی، پاتولوژی و جزئیات دقیق..."
                            value={section1Content}
                            onChange={(e) => setSection1Content(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <span className="text-[11px] font-black text-slate-300 block">بخش دوم درسنامه (سرفصل دوم)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 block">عنوان بخش دوم:</label>
                          <input
                            type="text"
                            placeholder="مثال: رویکردهای جراحی و اورژانسی"
                            value={section2Title}
                            onChange={(e) => setSection2Title(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-slate-400 block">محتوای تفصیلی بخش دوم:</label>
                          <textarea
                            rows={3}
                            placeholder="شرح کامل پروتکل‌ها، روش‌های جراحی انتخابی و اورژانسی..."
                            value={section2Content}
                            onChange={(e) => setSection2Content(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <span className="text-[11px] font-black text-rose-400 block">تله بالینی خطرناک (Clinical Pitfall) - ویژه آزمون و بالین</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-rose-400 block">عنوان تله بالینی:</label>
                          <input
                            type="text"
                            placeholder="مثال: نادیده گرفتن رفلکس پتلا"
                            value={pitfallTitle}
                            onChange={(e) => setPitfallTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 block">شرح پاتولوژی اشتباه:</label>
                          <input
                            type="text"
                            placeholder="مثال: افزایش دوز ناگهانی بدون پایش DTR"
                            value={pitfallDesc}
                            onChange={(e) => setPitfallDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-rose-400 block">عواقب بالینی کشنده:</label>
                          <input
                            type="text"
                            placeholder="مثال: سرکوب شدید تنفسی و ایست قلبی"
                            value={pitfallConsequence}
                            onChange={(e) => setPitfallConsequence(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <span className="text-[11px] font-black text-amber-400 block">مروارید و نکته جراحی طلایی (Golden Pearl)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-amber-400 block">عنوان مروارید:</label>
                          <input
                            type="text"
                            placeholder="مثال: دوز نجات‌بخش سولفات منیزیم"
                            value={pearlTitle}
                            onChange={(e) => setPearlTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-slate-400 block">شرح تفصیلی مروارید جراحی:</label>
                          <input
                            type="text"
                            placeholder="سولفات منیزیم پادزهر طلایی پیشگیری از تشنج اکلامپسی است که با دوز بارگذاری ۴ گرم تزریق وریدی..."
                            value={pearlContent}
                            onChange={(e) => setPearlContent(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>در حال ذخیره‌سازی و همگام‌سازی ابری...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          <span>ثبت درسنامه در مخزن و همگام‌سازی با مینو AI</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSaveQuestion} className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-white/[0.04]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block font-bold">انتخاب مبحث مربوطه:</label>
                        <select
                          value={qChapterId}
                          onChange={(e) => setQChapterId(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {chapters.map((ch) => (
                            <option key={ch.id} value={ch.id}>{ch.title} ({ch.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block font-bold">انتخاب جزیره آموزشی هدف (Learning Island):</label>
                        <select
                          value={qIslandId}
                          onChange={(e) => setQIslandId(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value={2}>جزیره ۲: سوالات موشکافانه تستی</option>
                          <option value={3}>جزیره ۳: شبیه‌سازی کیس بالینی (Case Study)</option>
                          <option value={4}>جزیره ۴: نمونه سوال دانشگاه تهران</option>
                          <option value={5}>جزیره ۵: سوالات آزمون پره‌انترنی</option>
                          <option value={6}>جزیره ۶: سوالات آزمون دستیاری تخصص</option>
                          <option value={7}>جزیره ۷: سوالات به سبک USMLE انگلیسی</option>
                          <option value={8}>جزیره ۸: پیشگامان محاسباتی و داده</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block font-bold">متن صورت سوال (Prompt):</label>
                      <textarea
                        required
                        rows={3}
                        placeholder={qIslandId === 3 ? "کیس بالینی شبیه‌سازی شده: آقای ۴۵ ساله‌ای با درد شدید پهلو و..." : "سوال تستی: کدام یک از علائم زیر به طور مستقیم نشان‌دهنده مسمومیت با..."}
                        value={qPrompt}
                        onChange={(e) => setQPrompt(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block">گزینه اول (الف):</label>
                        <input
                          type="text"
                          required
                          placeholder="مثلا: سونوگرافی اورژانسی مجاری ادرار"
                          value={qOptionA}
                          onChange={(e) => setQOptionA(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block">گزینه دوم (ب):</label>
                        <input
                          type="text"
                          required
                          placeholder="مثلا: سی‌تی اسکن بدون کنتراست شکم و لگن"
                          value={qOptionB}
                          onChange={(e) => setQOptionB(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block">گزینه سوم (ج):</label>
                        <input
                          type="text"
                          required
                          placeholder="مثلا: آنژیوگرافی عروق کرونر"
                          value={qOptionC}
                          onChange={(e) => setQOptionC(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block">گزینه چهارم (د):</label>
                        <input
                          type="text"
                          required
                          placeholder="مثلا: تجویز مدرهای تیازیدی"
                          value={qOptionD}
                          onChange={(e) => setQOptionD(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-white/5 pt-3">
                      <label className="text-[10px] text-emerald-400 block font-bold">پاسخ صحیح (دقیقاً مطابق متن یکی از گزینه‌ها بنویسید):</label>
                      <input
                        type="text"
                        required
                        placeholder="کپی متن دقیق گزینه صحیح"
                        value={qCorrectAnswer}
                        onChange={(e) => setQCorrectAnswer(e.target.value)}
                        className="w-full bg-slate-950 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-emerald-400 block font-bold">تحلیل گزینه صحیح (تشویقی):</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="آفرین همکار گرامی! سی‌تی شکم استاندارد طلایی تشخیص سنگ‌های ادراری است..."
                          value={qExplanationCorrect}
                          onChange={(e) => setQExplanationCorrect(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-rose-400 block">راهنمای گزینه غلط:</label>
                        <textarea
                          rows={2}
                          placeholder="دقت کنید، سونوگرافی ممکن است سنگ‌های کوچک حالب را در فاز حاد نشان ندهد..."
                          value={qExplanationWrong}
                          onChange={(e) => setQExplanationWrong(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-sans"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>در حال ذخیره‌سازی و همگام‌سازی ابری...</span>
                        </>
                      ) : (
                        <>
                          <ListPlus className="w-4 h-4" />
                          <span>ثبت سوال در جزیره مربوطه و همگام‌سازی ابری</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro Plan Modal */}
      <AnimatePresence>
        {showProModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 rounded-[28px] shadow-2xl max-w-md w-full border border-white/10 overflow-hidden"
              dir="rtl"
            >
              <div className="bg-gradient-to-r from-indigo-950 to-slate-950 border-b border-white/5 text-white p-6 relative overflow-hidden text-center space-y-2">
                <div className="w-14 h-14 mx-auto mb-1">
                  <img 
                    src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png" 
                    alt="Crown 3D" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.25)] animate-bounce"
                    style={{ animationDuration: "3s" }}
                  />
                </div>
                <h3 className="text-sm font-black">سگ نزن پرو (Sag Nazan Pro)</h3>
                <p className="text-[11px] text-indigo-300">حرفه‌ای‌ترین پلتفرم تعاملی یادگیری جراحی بالینی</p>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2.5">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                  {userState.isPremium || proUpgradedSimulated ? (
                    <div className="text-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-extrabold text-emerald-300">اشتراک سگ نزن پرو برای شما فعال شد! 🎉</p>
                      <p className="text-[10px] text-slate-400 font-medium font-sans">تمام قابلیت‌های پیشرفته هم‌اکنون به عنوان شبیه‌سازی MVP در دسترس شماست.</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center font-mono">
                        <span className="text-slate-500 text-xs line-through block">۱۸۰,۰۰۰ تومان</span>
                        <span className="text-slate-200 text-lg font-black">۴۹,۰۰۰ تومان / ماهانه</span>
                        <span className="text-[10px] text-indigo-400 font-bold block bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full w-max mx-auto mt-1">تخفیف ویژه دوره دانشجویی</span>
                      </div>

                      <button
                        onClick={() => {
                          setProUpgradedSimulated(true);
                        }}
                        className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-black text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-98 flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        ارتقای آنی حساب به پرو (شبیه‌ساز پرداخت)
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowProModal(false)}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 py-2.5 rounded-xl font-bold text-xs transition-colors border border-white/5"
                  >
                    بستن پیش‌نمایش
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-[28px] shadow-2xl max-w-sm w-full p-6 space-y-5"
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5 animate-bounce" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-sm font-black text-rose-400">آیا پرونده به طور کامل پاک شود؟</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  با این عمل تمام امتیازهای کسب شده، درصد پیشرفت مباحث ۹ گانه، سطح تسلط و کانون‌های خطای پایش شده شما حذف خواهد شد.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetProgress}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  بله، پرونده کامل ریست شود
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs py-2.5 rounded-xl transition-colors border border-white/5"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
