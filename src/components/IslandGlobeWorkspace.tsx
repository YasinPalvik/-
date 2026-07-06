import React, { useState, useEffect, useRef } from "react";
import { UserState } from "../types";
import { 
  Heart, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Lightbulb, 
  Compass, 
  HelpCircle, 
  GraduationCap, 
  Atom, 
  Globe, 
  Lock, 
  BookOpenCheck, 
  Zap, 
  RotateCcw, 
  Info,
  ExternalLink,
  MapPin,
  Flame,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useContent } from "../lib/contentContext";
import { IslandQuestion } from "../data/islandQuestions";

interface IslandGlobeWorkspaceProps {
  chapterId: string;
  userState: UserState;
  onUpdateState: (state: UserState) => void;
  onExit: () => void;
  themeColor?: "indigo" | "cyan" | "rose" | "emerald" | "amber";
}

export default function IslandGlobeWorkspace({
  chapterId,
  userState,
  onUpdateState,
  onExit,
  themeColor = "indigo"
}: IslandGlobeWorkspaceProps) {
  const { syllabi, islandQuestions: islandQuestionsData } = useContent();
  // Available islands list
  const islandsList = [
    { id: 1, name: "جزیره ۱: درسنامه تخصصی", desc: "کپسول‌های خلاصه درس و مرواریدهای حفظ جان بیمار", icon: BookOpen, color: "from-blue-600 to-indigo-700", glow: "shadow-blue-500/30" },
    { id: 2, name: "جزیره ۲: سوالات موشکافانه آموزشی", desc: "تمرین‌های مفهومی و خودارزیابی پایه", icon: HelpCircle, color: "from-purple-600 to-indigo-700", glow: "shadow-purple-500/30" },
    { id: 3, name: "جزیره ۳: سناریوهای بالینی (Clinical Cases)", desc: "مواجهه با شرایط حاد جراحی بیمار شبیه‌سازی‌شده", icon: Compass, color: "from-rose-600 to-pink-700", glow: "shadow-rose-500/30" },
    { id: 4, name: "جزیره ۴: نمونه سوالات دانشگاه تهران", desc: "سوالات امتحانی به سبک دپارتمان‌های برتر علمی کشور", icon: GraduationCap, color: "from-cyan-600 to-teal-700", glow: "shadow-cyan-500/30" },
    { id: 5, name: "جزیره ۵: سوالات آزمون پره‌انترنی", desc: "سؤالات تایید صلاحیت کشوری پزشکان عمومی", icon: Award, color: "from-amber-600 to-orange-700", glow: "shadow-amber-500/30" },
    { id: 6, name: "جزیره ۶: سوالات آزمون دستیاری (Residency)", desc: "سؤالات پذیرش تخصص جراحی و بیماری‌های بالینی", icon: Flame, color: "from-emerald-600 to-teal-700", glow: "shadow-emerald-500/30" },
    { id: 7, name: "جزیره ۷: سوالات به سبک آزمون USMLE", desc: "سوالات چندمرحله‌ای انگلیسی-فارسی شبیه‌سازی فدرال", icon: Globe, color: "from-sky-600 to-blue-700", glow: "shadow-sky-500/30" },
    { id: 8, name: "جزیره ۸: پیشگامان علم (Pioneer Interdisciplinary)", desc: "علوم داده، بیوانفورماتیک، فیزیک سیالات، کوانتوم و تصمیم‌گیری محاسباتی", icon: Atom, color: "from-fuchsia-600 to-rose-700", glow: "shadow-fuchsia-500/40" },
  ];

  // Selected Island: null means the main "Globe Planet Map" view
  const [selectedIslandId, setSelectedIslandId] = useState<number | null>(null);

  // Completed islands in this session / local storage
  const [completedIslands, setCompletedIslands] = useState<number[]>([]);
  
  // Audio feedback
  const playSound = (type: "correct" | "wrong" | "complete" | "click") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "correct") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "wrong") {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(147, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "complete") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "click") {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      // Audio prevented or failed
    }
  };

  // Load completed islands from local storage on mount
  useEffect(() => {
    const key = `medophil_chapter_islands_${chapterId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setCompletedIslands(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [chapterId]);

  // Save completed islands to local storage
  const markIslandComplete = (islandId: number) => {
    const updated = [...new Set([...completedIslands, islandId])];
    setCompletedIslands(updated);
    const key = `medophil_chapter_islands_${chapterId}`;
    localStorage.setItem(key, JSON.stringify(updated));

    // Reward XP to the user state
    const xpReward = islandId === 8 ? 50 : 30; // 50 XP for pioneer island, 30 XP for others
    onUpdateState({
      ...userState,
      xp: userState.xp + xpReward
    });
    
    playSound("complete");
  };

  // --- INTERACTIVE ISLAND 1 (درسنامه) STATE ---
  const chapterSyllabus = syllabi[chapterId] || syllabi["ch1"];
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeSyllabusTab, setActiveSyllabusTab] = useState<"content" | "pitfalls" | "pearls">("content");
  const syllabusContentRef = useRef<HTMLDivElement>(null);

  // Function to highlight and focus a syllabus section (for hyperlink redirection)
  const jumpToSyllabusSection = (sectionIdx: number) => {
    setSelectedIslandId(1); // Open Island 1
    setActiveSyllabusTab("content");
    setActiveSectionIdx(sectionIdx);
    playSound("click");
    setTimeout(() => {
      if (syllabusContentRef.current) {
        syllabusContentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // --- INTERACTIVE QUESTIONS STATE (ISLANDS 2 TO 8) ---
  const allQuestions: IslandQuestion[] = islandQuestionsData[chapterId] || islandQuestionsData["ch1"] || [];
  
  // State for current interactive question (per island)
  const [currentQuestion, setCurrentQuestion] = useState<IslandQuestion | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Initialize questions for selected island
  useEffect(() => {
    if (selectedIslandId && selectedIslandId >= 2 && selectedIslandId <= 8) {
      const islandQs = allQuestions.filter(q => q.islandId === selectedIslandId);
      if (islandQs.length > 0) {
        // Pick the first question, or a random one if there are multiple
        setCurrentQuestion(islandQs[0]);
      } else {
        // Fallback or generic placeholder question if no tailored question exists for this island-chapter pair
        const fallbackQ: IslandQuestion = {
          id: `fallback_${selectedIslandId}`,
          islandId: selectedIslandId,
          islandName: islandsList.find(is => is.id === selectedIslandId)?.name || "",
          question: `سؤال تشخیصی ویژه بخش بالینی: یک بیمار با شوک هیپوولمیک ناشی از تروما مراجعه کرده است. با توجه به شرایط همودینامیک، کدام یک از اولویت‌های درمانی زیر صحیح‌ترین تصمیم است؟`,
          options: [
            "شروع فوری رینگر لاکتات گرم به میزان ۱ لیتر و پایش بازگشت همودینامیک",
            "تزریق مسکن‌های قوی اپیوئیدی جهت کنترل درد بدون پایش فشار خون",
            "انتقال مستقیم به اتاق عمل بدون رگ‌گیری موضعی",
            "شروع سریع داروهای وازوپرسور بدون جایگزینی حجم داخل عروقی"
          ],
          correctIndex: 0,
          reasoning: "یادت باشه در شوک‌های هموراژیک، درمان کلیدی و اصلی بازگرداندن حجم خون از دست رفته با کریستالوئیدهای گرم مثل رینگر لاکتات هست. داروی تنگ‌کننده عروق (وازوپرسور) زمانی کاربرد داره که حجم کاملاً اصلاح شده باشه ولی بیمار همچنان هایپوتنشن باشه.",
          clinicalPearls: "سندرم شوک جراحی نیازمند مداخله گام‌به‌گام و مانیتورینگ دقیق برون‌ده ادراری بیمار (حداقل 0.5cc/kg/hr) است.",
          syllabusLinkSectionIdx: 1,
          syllabusLinkName: "لمس هدفمند و افتراق گاردینگ ارادی از غیرارادی"
        };
        setCurrentQuestion(fallbackQ);
      }
      // Reset quiz states
      setSelectedOptionIdx(null);
      setIsChecked(false);
      setIsCorrect(false);
      setIsAnswerRevealed(false);
    }
  }, [selectedIslandId, chapterId]);

  const handleCheckAnswer = () => {
    if (selectedOptionIdx === null || !currentQuestion) return;
    
    const correct = selectedOptionIdx === currentQuestion.correctIndex;
    setIsCorrect(correct);
    setIsChecked(true);
    setIsAnswerRevealed(true);

    if (correct) {
      playSound("correct");
    } else {
      playSound("wrong");
    }
  };

  const handleCompleteQuizIsland = () => {
    if (selectedIslandId) {
      markIslandComplete(selectedIslandId);
      setSelectedIslandId(null); // Return to globe map
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-right font-sans relative overflow-hidden" dir="rtl">
      {/* Dynamic Ambient Background Sparkles */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 z-0 pointer-events-none" />
      <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] z-0 pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] z-0 pointer-events-none" />

      {/* top bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-3 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSound("click");
                if (selectedIslandId !== null) {
                  setSelectedIslandId(null);
                } else {
                  onExit();
                }
              }}
              className="bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center"
              title="بازگشت"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="text-right">
              <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1">
                <Compass className="w-3 h-3 animate-spin" />
                دپارتمان آموزش‌های بالینی سگ نزن
              </span>
              <h2 className="text-sm font-black text-white">
                {selectedIslandId ? (
                  <span className="flex items-center gap-1.5">
                    {islandsList.find(is => is.id === selectedIslandId)?.name}
                  </span>
                ) : (
                  <span>مدار یادگیری کره زمین (Globe Mode)</span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* XP and Hearts indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{userState.xp} XP</span>
            </div>
            
            <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-[10px] px-3 py-1.5 rounded-xl">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>{completedIslands.length} از ۸ جزیره کامل شده</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        <AnimatePresence mode="wait">
          
          {/* ================= VIEW 1: GLOBE MAP ================= */}
          {selectedIslandId === null && (
            <motion.div
              key="globe-map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Educational header intro */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>کیهان یادگیری بالینی سگ نزن</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  سیاره شبیه‌سازی مبحث <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">شرح حال و معاینه جراحی</span> 🩺
                </h1>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto font-sans">
                  به دنیای تعاملی و کهکشانی یادگیری جراحی خوش آمدید! برای تسلط بر این مبحث، از جزیره ۱ (درسنامه) شروع کنید و سپس با حل سوالات تشخیصی و بسیار عمیق در جزایر ۲ تا ۸، روند یادگیری خود را تکمیل کنید.
                </p>
              </div>

              {/* THE SPINNING GLOBE CONTAINER */}
              <div className="relative flex items-center justify-center py-20 overflow-visible">
                {/* Orbital Paths / Star background circles */}
                <div className="absolute w-[600px] h-[600px] border border-indigo-500/5 rounded-full animate-[spin_100s_linear_infinite] pointer-events-none" />
                <div className="absolute w-[450px] h-[450px] border border-purple-500/10 border-dashed rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
                <div className="absolute w-[300px] h-[300px] border border-white/5 rounded-full animate-[spin_25s_linear_infinite] pointer-events-none" />

                {/* CENTRAL EARTH GLOBE VISUAL */}
                <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-full bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 border-2 border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden z-10 group select-none pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600')] opacity-20 bg-cover animate-[pulse_4s_infinite]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-slate-950/80" />
                  
                  {/* Holographic scanning grids */}
                  <div className="absolute inset-0 border-b border-indigo-500/20 animate-[pulse_2s_infinite]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <Globe className="w-16 h-16 text-indigo-400/80 animate-[spin_12s_linear_infinite] mb-2" />
                    <span className="text-[10px] text-indigo-300 font-extrabold uppercase font-mono tracking-widest">CHAPTER 01</span>
                    <span className="text-xs font-black text-white mt-1">شرح حال و معاینه</span>
                  </div>
                </div>

                {/* FLOATING ISLANDS SPREAD AROUND THE CENTRAL GLOBE */}
                {/* Positioned beautifully using custom trigonometric/responsive angles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {islandsList.map((island, idx) => {
                    const isCompleted = completedIslands.includes(island.id);
                    const Icon = island.icon;

                    // Custom radial coordinates for positioning 8 islands in a beautiful orbit
                    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
                    const angle = angles[idx];
                    const radius = 220; // Radius from the center of the globe
                    const radian = (angle * Math.PI) / 180;
                    const x = Math.round(radius * Math.cos(radian));
                    const y = Math.round(radius * Math.sin(radian));

                    return (
                      <motion.div
                        key={island.id}
                        className="absolute pointer-events-auto z-20"
                        style={{
                          transform: `translate(${x}px, ${y}px)`
                        }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => {
                            playSound("click");
                            setSelectedIslandId(island.id);
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border bg-slate-900/90 text-center transition-all ${
                            isCompleted 
                              ? "border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-slate-900"
                              : island.id === 8
                              ? "border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-slate-900"
                              : "border-white/10 hover:border-indigo-500/30 text-slate-300"
                          } max-w-[140px]`}
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${island.color} ${island.glow} flex items-center justify-center relative`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                            ) : (
                              <Icon className="w-5 h-5 text-white" />
                            )}
                            
                            {/* Pioneer star glow badge */}
                            {island.id === 8 && (
                              <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white font-extrabold text-[7px] px-1.5 py-0.5 rounded-full animate-pulse">
                                PIONEER
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[10px] font-black mt-2 leading-tight select-none">
                            {island.name.replace("جزیره " + island.id + ": ", "")}
                          </span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* List of islands view below the interactive globe for easier scrolling/accessibility */}
              <div className="space-y-4 pt-10">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <BookOpenCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">لیست دقیق جزایر یادگیری و پایش پیشرفت</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {islandsList.map((island) => {
                    const isCompleted = completedIslands.includes(island.id);
                    const Icon = island.icon;
                    return (
                      <div
                        key={island.id}
                        onClick={() => {
                          playSound("click");
                          setSelectedIslandId(island.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group text-right ${
                          isCompleted 
                            ? "bg-slate-900/60 border-emerald-500/20 text-slate-300" 
                            : island.id === 8
                            ? "bg-gradient-to-tr from-slate-900 via-rose-950/20 to-slate-900 border-rose-500/30 hover:border-rose-500/50"
                            : "bg-slate-900/30 border-white/[0.05] hover:bg-slate-900/50 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${island.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {isCompleted ? (
                            <span className="bg-emerald-500/10 text-emerald-400 font-extrabold text-[8px] px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              یادگیری کامل شد
                            </span>
                          ) : (
                            <span className="bg-slate-950 text-slate-500 font-extrabold text-[8px] px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              آماده مطالعه
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-black text-white mt-3 group-hover:text-indigo-300 transition-colors">
                          {island.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans mt-1 leading-relaxed line-clamp-2">
                          {island.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {/* ================= VIEW 2: ISLAND 1 - SYLLABUS (درسنامه) ================= */}
          {selectedIslandId === 1 && (
            <motion.div
              key="syllabus-workspace"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Syllabus left list (Navigation tabs) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl space-y-3">
                  <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-300 font-extrabold px-3 py-1 rounded-full inline-block">
                    کپسول‌های خلاصه درس
                  </span>
                  <h3 className="text-sm font-black text-white">سرفصل‌های آموزشی کپسول جراحی</h3>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    برای مطالعه مرواریدهای حفظ جان بیمار و تله‌های بالینی جراحی، هر کپسول را جداگانه انتخاب کنید.
                  </p>
                </div>

                <div className="space-y-2">
                  {chapterSyllabus.sections.map((sec, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        playSound("click");
                        setActiveSectionIdx(sIdx);
                        setActiveSyllabusTab("content");
                      }}
                      className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center gap-3 ${
                        activeSectionIdx === sIdx && activeSyllabusTab === "content"
                          ? "bg-blue-600/15 border-blue-500/40 text-white shadow-lg"
                          : "bg-slate-900/30 border-white/[0.04] text-slate-400 hover:bg-slate-900/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        activeSectionIdx === sIdx && activeSyllabusTab === "content" ? "bg-blue-500 text-white" : "bg-slate-950 text-slate-500"
                      }`}>
                        <span className="font-mono text-xs font-black">۰{sIdx + 1}</span>
                      </div>
                      <span className="text-xs font-black truncate">{sec.title}</span>
                    </button>
                  ))}

                  {/* Pitfalls Tab */}
                  <button
                    onClick={() => {
                      playSound("click");
                      setActiveSyllabusTab("pitfalls");
                    }}
                    className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center gap-3 ${
                      activeSyllabusTab === "pitfalls"
                        ? "bg-rose-600/15 border-rose-500/40 text-white shadow-lg"
                        : "bg-slate-900/30 border-white/[0.04] text-slate-400 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activeSyllabusTab === "pitfalls" ? "bg-rose-500 text-white" : "bg-slate-950 text-slate-500"
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black truncate">تله‌های بالینی و اشتباهات کشنده</span>
                  </button>

                  {/* Combined Pearls Tab */}
                  <button
                    onClick={() => {
                      playSound("click");
                      setActiveSyllabusTab("pearls");
                    }}
                    className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center gap-3 ${
                      activeSyllabusTab === "pearls"
                        ? "bg-amber-600/15 border-amber-500/40 text-white shadow-lg"
                        : "bg-slate-900/30 border-white/[0.04] text-slate-400 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activeSyllabusTab === "pearls" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-500"
                    }`}>
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black truncate">نکات تلفیقی و مرواریدهای طلایی</span>
                  </button>
                </div>

                <button
                  onClick={() => markIslandComplete(1)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>تکمیل مطالعه کپسول‌ها و ثبت امتیاز</span>
                </button>
              </div>

              {/* Syllabus right main content */}
              <div className="lg:col-span-8 bg-slate-900/30 border border-white/5 p-6 md:p-8 rounded-[32px] space-y-6" ref={syllabusContentRef}>
                
                {activeSyllabusTab === "content" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">
                          {chapterSyllabus.sections[activeSectionIdx]?.title}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold">بخش {activeSectionIdx + 1} از کپسول جراحی عمومی</span>
                      </div>
                    </div>

                    <div className="text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-wrap text-justify prose prose-invert max-w-none">
                      {chapterSyllabus.sections[activeSectionIdx]?.content}
                    </div>
                  </div>
                )}

                {activeSyllabusTab === "pitfalls" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">تله‌های بالینی جراحی و اشتباهات کشنده</h2>
                        <span className="text-[10px] text-slate-500 font-bold">مواردی که سبب قصور پزشکی و عواقب مرگبار برای بیمار می‌شوند</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {chapterSyllabus.pitfalls.map((p, pIdx) => (
                        <div key={pIdx} className="bg-slate-950 p-4 rounded-2xl border border-rose-500/10 space-y-2">
                          <h4 className="text-xs font-black text-rose-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            {p.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            {p.description}
                          </p>
                          <div className="bg-rose-950/20 border border-rose-950/40 p-2.5 rounded-xl text-[10px] text-slate-300 leading-normal font-sans">
                            <strong className="text-rose-400 font-black">پیامد واقعی:</strong> {p.consequence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSyllabusTab === "pearls" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">مرواریدهای طلایی و نکات تلفیقی آزمون‌ها</h2>
                        <span className="text-[10px] text-slate-500 font-bold">مفاهیم متقاطع بین فیزیولوژی، پاتوفیزیولوژی و جراحی بالینی</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {chapterSyllabus.combinedPearls.map((pearl, pIdx) => (
                        <div key={pIdx} className="bg-slate-950 p-4 rounded-2xl border border-amber-500/10 space-y-2">
                          <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            {pearl.title}
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans text-justify">
                            {pearl.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* ================= VIEW 3: QUESTIONS ISLANDS (2 TO 8) ================= */}
          {selectedIslandId !== null && selectedIslandId >= 2 && selectedIslandId <= 8 && (
            <motion.div
              key="quiz-workspace"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Island Header banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${islandsList.find(is => is.id === selectedIslandId)?.color} flex items-center justify-center text-white shrink-0`}>
                    {React.createElement(islandsList.find(is => is.id === selectedIslandId)?.icon || HelpCircle, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{islandsList.find(is => is.id === selectedIslandId)?.name}</h3>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">{islandsList.find(is => is.id === selectedIslandId)?.desc}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 font-bold block text-left">امتیاز این جزیره:</span>
                  <span className="text-xs font-black text-amber-400 font-mono">+{selectedIslandId === 8 ? "50" : "30"} XP</span>
                </div>
              </div>

              {/* Main Quiz interface */}
              {currentQuestion && (
                <div className="bg-slate-900/30 border border-white/5 p-6 md:p-8 rounded-[32px] space-y-6">
                  
                  {/* Question Title */}
                  <div className="space-y-3">
                    <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block font-mono">
                      Scenario ID: {currentQuestion.id}
                    </span>
                    <h2 className="text-sm md:text-base font-black text-white leading-relaxed text-justify">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {currentQuestion.options.map((option, oIdx) => {
                      const isSelected = selectedOptionIdx === oIdx;
                      const isCorrectAnswer = currentQuestion.correctIndex === oIdx;
                      
                      let optionBg = "bg-slate-950/40 border-white/5 text-slate-300 hover:bg-slate-950/80 hover:text-white";
                      if (isSelected) {
                        optionBg = "bg-indigo-600/25 border-indigo-500/50 text-white ring-1 ring-indigo-500/20";
                      }
                      if (isChecked) {
                        if (isCorrectAnswer) {
                          optionBg = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
                        } else if (isSelected) {
                          optionBg = "bg-rose-500/10 border-rose-500/40 text-rose-400";
                        } else {
                          optionBg = "bg-slate-950/20 border-white/5 text-slate-500 select-none opacity-50";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isChecked}
                          onClick={() => {
                            playSound("click");
                            setSelectedOptionIdx(oIdx);
                          }}
                          className={`w-full p-4 rounded-2xl border text-right transition-all flex items-start gap-3 text-xs leading-normal font-sans ${optionBg}`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border text-[9px] font-black ${
                            isSelected ? "bg-indigo-500 border-indigo-400 text-white" : "bg-slate-900 border-white/5 text-slate-400"
                          }`}>
                            {["الف", "ب", "ج", "د"][oIdx]}
                          </span>
                          <span className="flex-1">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Check button */}
                  {!isChecked && (
                    <button
                      disabled={selectedOptionIdx === null}
                      onClick={handleCheckAnswer}
                      className={`w-full py-4 rounded-2xl font-black text-xs transition-all ${
                        selectedOptionIdx !== null
                          ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      بررسی پاسخ و کالبدشکافی علمی
                    </button>
                  )}

                  {/* ================= COMPREHENSIVE Persian COLLOQUIAL ANSWER KEY ================= */}
                  <AnimatePresence>
                    {isAnswerRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-3xl border text-right space-y-6 ${
                          isCorrect
                            ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                            : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                        }`}
                      >
                        {/* Status banner */}
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isCorrect ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                          }`}>
                            {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">
                              {isCorrect ? "قضاوت بالینی کاملاً صحیح و طلایی!" : "کالبدشکافی خطای بالینی و تصمیم نادرست"}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold">بخش پاسخ تشریحی تفصیلی و مستند</span>
                          </div>
                        </div>

                        {/* SECTION 1: Clinical reasoning flow */}
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-black text-white flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-400" />
                            <span>۱. روند حل سوال و تفکر بالینی (Clinical Reasoning Flow):</span>
                          </h5>
                          <p className="text-xs leading-relaxed text-slate-300 font-sans pl-1 text-justify">
                            {currentQuestion.reasoning}
                          </p>
                        </div>

                        {/* SECTION 2: Combined Pearls */}
                        <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                          <h5 className="text-[11px] font-black text-white flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-400 fill-amber-400/10" />
                            <span>۲. نکات ترکیبی طلایی بالینی و علمی:</span>
                          </h5>
                          <p className="text-[11.px] leading-relaxed text-slate-400 font-sans">
                            {currentQuestion.clinicalPearls}
                          </p>
                        </div>

                        {/* SECTION 3: SYLLABUS HYPERLINK INTEGRATION */}
                        <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h5 className="text-[11px] font-black text-indigo-300 flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-indigo-400" />
                              <span>۳. نیاز به مطالعه و مرور بیشتر دارید؟</span>
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              شما می‌توانید برای تسلط کامل روی این موضوع، مستقیماً به کپسول درسنامه مربوطه در جزیره ۱ رجوع کنید.
                            </p>
                          </div>
                          
                          <button
                            onClick={() => jumpToSyllabusSection(currentQuestion.syllabusLinkSectionIdx)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                          >
                            <span>مطالعه کپسول: {currentQuestion.syllabusLinkName}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Complete & Exit Button inside correct state */}
                        <button
                          onClick={handleCompleteQuizIsland}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-white/10 font-black text-xs py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>ثبت امتیاز و بازگشت به سیاره جراحی</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
