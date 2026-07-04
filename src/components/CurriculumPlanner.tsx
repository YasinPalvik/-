import React, { useState } from "react";
import { UserState, ConceptNode, Chapter } from "../types";
import { chapters, concepts } from "../lib/state";
import { 
  Award, 
  BookOpen, 
  Lock, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  ChevronLeft, 
  Check, 
  Compass, 
  FileCheck, 
  Flame, 
  Zap, 
  Eye, 
  HelpCircle, 
  AlertTriangle,
  BookOpenCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Tilt3D from "./Tilt3D";

interface CurriculumPlannerProps {
  userState: UserState;
  onStartLesson: (chapterId: string, isReview: boolean) => void;
  onNavigateHome: () => void;
  onTriggerCertificate: () => void;
  onTriggerPremium: () => void;
}

export default function CurriculumPlanner({
  userState,
  onStartLesson,
  onNavigateHome,
  onTriggerCertificate,
  onTriggerPremium
}: CurriculumPlannerProps) {
  const [filterMode, setFilterMode] = useState<"all" | "completed" | "future">("all");
  const [selectedPreviewConcept, setSelectedPreviewConcept] = useState<ConceptNode | null>(null);

  // Certification requirements calculation
  const totalChapters = chapters.length;
  const totalConcepts = concepts.length;
  const completedConceptsCount = userState.completedConcepts.length;
  const xpCount = userState.xp;
  
  // Requirements:
  // 1. At least 6 concepts completed
  // 2. At least 300 XP
  // 3. At least 2 chapters unlocked
  const minConceptsRequired = 6;
  const minXpRequired = 300;
  const minChaptersUnlocked = 2;

  const conceptProgressPercent = Math.min(100, Math.round((completedConceptsCount / minConceptsRequired) * 100));
  const xpProgressPercent = Math.min(100, Math.round((xpCount / minXpRequired) * 100));
  const chaptersUnlockedCount = userState.unlockedChapters.length;
  const chapterProgressPercent = Math.min(100, Math.round((chaptersUnlockedCount / minChaptersUnlocked) * 100));

  const totalCertProgress = Math.round((conceptProgressPercent + xpProgressPercent + chapterProgressPercent) / 3);
  const isEligibleForCert = completedConceptsCount >= minConceptsRequired && xpCount >= minXpRequired && chaptersUnlockedCount >= minChaptersUnlocked;

  // Concept helper functions
  const isConceptLearned = (conceptId: string) => userState.completedConcepts.includes(conceptId);

  const isConceptUnlocked = (conceptId: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept) return false;
    
    const chapterIdx = chapters.findIndex(ch => ch.id === concept.chapterId);
    if (chapterIdx === 0) {
      return concept.prerequisites.every(pid => userState.completedConcepts.includes(pid));
    }
    const isChUnlocked = userState.unlockedChapters.includes(concept.chapterId);
    if (!isChUnlocked) return false;

    return concept.prerequisites.every(pid => userState.completedConcepts.includes(pid));
  };

  const getFilteredConcepts = (chapterId: string) => {
    const chapterConcepts = concepts.filter(c => c.chapterId === chapterId);
    if (filterMode === "completed") {
      return chapterConcepts.filter(c => isConceptLearned(c.id));
    }
    if (filterMode === "future") {
      return chapterConcepts.filter(c => !isConceptLearned(c.id));
    }
    return chapterConcepts;
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Page Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/10 p-6 md:p-8 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-right">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                برنامه‌ریز تحصیلی هوشمند جراحی
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
              برنامه‌ریز درسی و پایش مسیر گواهی‌نامه جراحی 🩺
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
              در این بخش می‌توانید ساختار کل آموزش‌های جراحی را به طور یکجا ببینید، مفاهیم آینده را پیش‌نمایش کنید، تله‌های بالینی هر مبحث را مطالعه کنید و فرآیند واجد شرایط شدن خود برای گواهی‌نامه رسمی را پایش کنید.
            </p>
          </div>

          <button
            onClick={onNavigateHome}
            className="self-start md:self-center bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-98 shrink-0"
          >
            <span>بازگشت به داشبورد</span>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Certification Journey Bento Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Certification Status Gauge (Left Column) */}
        <div className="lg:col-span-4 bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-6 rounded-[32px] shadow-[0_12px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
          
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 fill-amber-400/10" />
                پایشگر مسیر گواهی‌نامه جراحی
              </h3>
              {isEligibleForCert && (
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                  مدرک آماده صدور!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              با یادگیری مفاهیم جراحی و افزایش امتیاز بالینی، شرایط لازم برای دریافت گواهی‌نامه صلاحیت پزشکی جراحی مدوفیل را تکمیل نمایید.
            </p>
          </div>

          {/* Progress Circular representation / Stats */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  className="stroke-amber-400 fill-none"
                  strokeWidth="6"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * totalCertProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-3xl font-black text-amber-400 font-mono">{totalCertProgress}%</span>
              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">آمادگی صدور مدرک</span>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-3 text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">شرایط لازم جهت فارغ‌التحصیلی:</p>
            
            {/* Req 1: Concepts */}
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  completedConceptsCount >= minConceptsRequired ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-950 text-slate-600"
                }`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-slate-300">آموزش حداقل {minConceptsRequired} مفهوم جراحی</span>
              </div>
              <span className="font-mono text-slate-400">{completedConceptsCount} / {minConceptsRequired}</span>
            </div>

            {/* Req 2: XP */}
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  xpCount >= minXpRequired ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-950 text-slate-600"
                }`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-slate-300">کسب حداقل {minXpRequired} امتیاز بالینی (XP)</span>
              </div>
              <span className="font-mono text-slate-400">{xpCount} / {minXpRequired}</span>
            </div>

            {/* Req 3: Chapters Unlocked */}
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  chaptersUnlockedCount >= minChaptersUnlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-950 text-slate-600"
                }`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-slate-300">آزادسازی حداقل {minChaptersUnlocked} بخش جراحی</span>
              </div>
              <span className="font-mono text-slate-400">{chaptersUnlockedCount} / {minChaptersUnlocked}</span>
            </div>
          </div>

          {/* Call to action for certification */}
          <div className="pt-2">
            {isEligibleForCert ? (
              userState.isPremium ? (
                <button
                  onClick={onTriggerCertificate}
                  className="w-full bg-gradient-to-tr from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 fill-slate-950" />
                  <span>مشاهده و پرینت گواهی‌نامه رسمی جراحی</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-amber-300 font-bold leading-normal text-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                    🎉 شما واجد شرایط دریافت مدرک جراحی هستید! برای باز شدن ابزار چاپ، پرونده خود را به طلایی ارتقا دهید.
                  </p>
                  <button
                    onClick={onTriggerPremium}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ارتقا به پرونده طلایی و دریافت مدرک</span>
                  </button>
                </div>
              )
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl text-[10px] text-slate-500 text-center leading-normal border border-white/[0.02]">
                🔒 شرایط لازم برای صدور مدرک هنوز احراز نشده است. گره‌های جراحی پیش رو در نقشه درسی را به اتمام برسانید.
              </div>
            )}
          </div>
        </div>

        {/* Course Curriculum & Roadmap Path (Right Column) */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-6 md:p-8 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/5 gap-4">
            <div className="text-right">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-indigo-400" />
                سرفصل‌های آموزشی و درخت یادگیری جراحی
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                بر روی مفاهیم کلیک کنید تا جزئیات، اهداف یادگیری و تله‌های امتحانی آن‌ها را پیش‌نمایش نمایید.
              </p>
            </div>

            {/* Filter Toggle Controls */}
            <div className="flex bg-slate-950 p-1 border border-white/5 rounded-xl self-start sm:self-auto">
              {(["all", "completed", "future"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all ${
                    filterMode === mode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "all" ? "نمایش همه" : mode === "completed" ? "کامل شده" : "پیش‌نمایش آینده"}
                </button>
              ))}
            </div>
          </div>

          {/* Chronological Surgical Curriculum Path */}
          <div className="space-y-10">
            {chapters.map((chapter, chIdx) => {
              const unlocked = userState.unlockedChapters.includes(chapter.id) || chIdx === 0;
              const progress = userState.chapterProgress[chapter.id] || 0;
              const chConcepts = getFilteredConcepts(chapter.id);

              if (chConcepts.length === 0) return null;

              return (
                <div key={chapter.id} className="relative space-y-4">
                  {/* Vertical Connection Line */}
                  <div className="absolute right-6 top-16 bottom-0 w-[1px] bg-slate-800/60 -z-0" />
                  
                  {/* Chapter Ribbon Header */}
                  <div className="flex items-center gap-3 relative z-10 text-right">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-xs ${
                      unlocked 
                        ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" 
                        : "bg-slate-950 border border-white/5 text-slate-600"
                    }`}>
                      {chIdx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                        {chapter.title}
                        {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">{chapter.description}</p>
                    </div>
                  </div>

                  {/* List of Concepts in this Chapter */}
                  <div className="space-y-3 mr-12 relative z-10">
                    {chConcepts.map((concept) => {
                      const learned = isConceptLearned(concept.id);
                      const isUnlocked = isConceptUnlocked(concept.id);

                      return (
                        <div
                          key={concept.id}
                          onClick={() => setSelectedPreviewConcept(concept)}
                          className={`p-4 rounded-2xl border text-right cursor-pointer group transition-all duration-200 ${
                            learned
                              ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30"
                              : isUnlocked
                              ? "bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30"
                              : "bg-slate-950/40 border-white/[0.02] hover:border-white/5 hover:bg-slate-950/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className={`text-xs font-black truncate ${
                                  learned ? "text-emerald-400" : "text-slate-200"
                                }`}>
                                  {concept.title}
                                </h5>

                                {learned ? (
                                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <CheckCircle className="w-2.5 h-2.5" /> کامل شده
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                    آماده شروع
                                  </span>
                                ) : (
                                  <span className="bg-slate-900 text-slate-500 border border-white/5 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> پیش‌نمایش آینده
                                  </span>
                                )}

                                {concept.highStakes && (
                                  <span className="bg-rose-500/10 text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/20">
                                    ریسک بالینی بالا
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium truncate font-sans leading-relaxed">
                                {concept.definition}
                              </p>
                            </div>

                            {/* Chevron / Eye icon indicator */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] text-slate-500 group-hover:text-slate-300 transition-colors font-bold font-sans flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> جزئیات و تله‌ها
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* DETAILED EDUCATIONAL CONCEPT PREVIEW DRAWER MODAL */}
      <AnimatePresence>
        {selectedPreviewConcept && (() => {
          const learned = isConceptLearned(selectedPreviewConcept.id);
          const isUnlocked = isConceptUnlocked(selectedPreviewConcept.id);
          const currentChapter = chapters.find(ch => ch.id === selectedPreviewConcept.chapterId);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPreviewConcept(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
              dir="rtl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-white/10 rounded-[28px] max-w-lg w-full p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl"
              >
                {/* Accent line based on status */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  learned 
                    ? "bg-emerald-500" 
                    : isUnlocked 
                    ? "bg-indigo-500" 
                    : "bg-slate-600"
                }`} />

                {/* Header title */}
                <div className="flex items-start justify-between gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-slate-950 border border-white/5 text-slate-400 font-bold px-2.5 py-1 rounded-lg">
                      بخش جراحی: {currentChapter?.title}
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">
                      {selectedPreviewConcept.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setSelectedPreviewConcept(null)}
                    className="text-slate-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                  >
                    <Check className="w-5 h-5 hidden" />
                    <span>×</span>
                  </button>
                </div>

                {/* Visual Status card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-right space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">سطح طبقه‌بندی بلوم</span>
                    <p className="text-xs font-extrabold text-indigo-300 font-sans">
                      {selectedPreviewConcept.bloomLevel === "recall" ? "یادآوری (Recall)" :
                       selectedPreviewConcept.bloomLevel === "comprehension" ? "درک مطلب (Comprehension)" :
                       selectedPreviewConcept.bloomLevel === "application" ? "کاربرد بالینی (Application)" : "تجزیه و تحلیل (Analysis)"}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-right space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">وضعیت یادگیری شما</span>
                    <p className={`text-xs font-extrabold font-sans ${
                      learned ? "text-emerald-400" : isUnlocked ? "text-indigo-400" : "text-slate-500"
                    }`}>
                      {learned ? "تکمیل و تسلط یافته" : isUnlocked ? "آماده شروع آموزش" : "قفل شده (پیش‌نمایش)"}
                    </p>
                  </div>
                </div>

                {/* Definition reference block */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">تعریف علمی جراحی:</h4>
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 relative leading-relaxed text-xs text-slate-300 font-sans">
                    {selectedPreviewConcept.definition}
                  </div>
                </div>

                {/* Narrative Hook (Immersive element) */}
                {selectedPreviewConcept.narrativeHook && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">سناریوی بالینی (مقدمه داستان):</h4>
                    <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 relative leading-relaxed text-xs text-indigo-200/90 italic font-sans">
                      {selectedPreviewConcept.narrativeHook}
                    </div>
                  </div>
                )}

                {/* Exam Trap Spec (Preventive education) */}
                {selectedPreviewConcept.examTrapNote && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      تله امتحانی و بالینی (Clinical Pitfall):
                    </h4>
                    <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 relative leading-relaxed text-xs text-rose-200/90 font-sans">
                      {selectedPreviewConcept.examTrapNote}
                    </div>
                  </div>
                )}

                {/* Prerequisites requirements list */}
                {selectedPreviewConcept.prerequisites && selectedPreviewConcept.prerequisites.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">پیش‌نیازهای گره درسی:</h4>
                    <div className="space-y-1.5">
                      {selectedPreviewConcept.prerequisites.map((pid) => {
                        const pre = concepts.find(c => c.id === pid);
                        const completedPre = isConceptLearned(pid);
                        return (
                          <div key={pid} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-white/[0.02] text-xs">
                            <span className="font-extrabold text-slate-300">{pre ? pre.title : pid}</span>
                            {completedPre ? (
                              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> پاس شده
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-slate-500 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> هنوز قفل است
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom actions */}
                <div className="flex flex-col gap-2 pt-2">
                  {(isUnlocked || learned) && currentChapter ? (
                    <button
                      onClick={() => {
                        setSelectedPreviewConcept(null);
                        onStartLesson(currentChapter.id, false);
                      }}
                      className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{learned ? "شروع مجدد آزمون یادگیری" : "ورود به آزمون یادگیری بخش"}</span>
                    </button>
                  ) : (
                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-[10px] text-slate-500 text-center font-sans">
                      ⚠️ این درس در حال حاضر به علت عدم تحقق پیش‌نیازها قفل است.
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedPreviewConcept(null)}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 font-extrabold text-xs py-2.5 rounded-xl transition-all border border-white/5"
                  >
                    بستن پنجره پیش‌نمایش
                  </button>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
