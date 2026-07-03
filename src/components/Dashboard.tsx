import React, { useState } from "react";
import { Chapter, UserState } from "../types";
import { chapters, concepts } from "../lib/state";
import { 
  Heart, 
  Zap, 
  Award, 
  Flame, 
  Play, 
  Lock, 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  RefreshCw, 
  BookMarked, 
  User, 
  Settings as SettingsIcon, 
  Crown,
  Calendar,
  ChevronLeft,
  CheckCircle,
  TrendingUp,
  Award as AwardIcon,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KnowledgeMap from "./KnowledgeMap";

interface DashboardProps {
  userState: UserState;
  onStartLesson: (chapterId: string, isReview: boolean) => void;
  onNavigateTo: (view: "profile" | "settings") => void;
  onTriggerPremium: () => void;
}

// Duolingo style color themes for each chapter index
const chapterThemes = [
  {
    bg: "bg-emerald-500",
    border: "border-emerald-600",
    hoverBg: "hover:bg-emerald-400",
    shadow: "border-emerald-700",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    headingColor: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    progressBar: "bg-emerald-500",
    glow: "shadow-emerald-500/20"
  },
  {
    bg: "bg-blue-500",
    border: "border-blue-600",
    hoverBg: "hover:bg-blue-400",
    shadow: "border-blue-700",
    lightBg: "bg-blue-50",
    textColor: "text-blue-700",
    headingColor: "text-blue-800",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    progressBar: "bg-blue-500",
    glow: "shadow-blue-500/20"
  },
  {
    bg: "bg-purple-500",
    border: "border-purple-600",
    hoverBg: "hover:bg-purple-400",
    shadow: "border-purple-700",
    lightBg: "bg-purple-50",
    textColor: "text-purple-700",
    headingColor: "text-purple-800",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    progressBar: "bg-purple-500",
    glow: "shadow-purple-500/20"
  },
  {
    bg: "bg-orange-500",
    border: "border-orange-600",
    hoverBg: "hover:bg-orange-400",
    shadow: "border-orange-700",
    lightBg: "bg-orange-50",
    textColor: "text-orange-700",
    headingColor: "text-orange-800",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    progressBar: "bg-orange-500",
    glow: "shadow-orange-500/20"
  },
  {
    bg: "bg-rose-500",
    border: "border-rose-600",
    hoverBg: "hover:bg-rose-400",
    shadow: "border-rose-700",
    lightBg: "bg-rose-50",
    textColor: "text-rose-700",
    headingColor: "text-rose-800",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    progressBar: "bg-rose-500",
    glow: "shadow-rose-500/20"
  },
  {
    bg: "bg-amber-500",
    border: "border-amber-600",
    hoverBg: "hover:bg-amber-400",
    shadow: "border-amber-700",
    lightBg: "bg-amber-50",
    textColor: "text-amber-700",
    headingColor: "text-amber-800",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    progressBar: "bg-amber-500",
    glow: "shadow-amber-500/20"
  },
  {
    bg: "bg-teal-500",
    border: "border-teal-600",
    hoverBg: "hover:bg-teal-400",
    shadow: "border-teal-700",
    lightBg: "bg-teal-50",
    textColor: "text-teal-700",
    headingColor: "text-teal-800",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    progressBar: "bg-teal-500",
    glow: "shadow-teal-500/20"
  },
  {
    bg: "bg-indigo-500",
    border: "border-indigo-600",
    hoverBg: "hover:bg-indigo-400",
    shadow: "border-indigo-700",
    lightBg: "bg-indigo-50",
    textColor: "text-indigo-700",
    headingColor: "text-indigo-800",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    progressBar: "bg-indigo-500",
    glow: "shadow-indigo-500/20"
  },
  {
    bg: "bg-sky-500",
    border: "border-sky-600",
    hoverBg: "hover:bg-sky-400",
    shadow: "border-sky-700",
    lightBg: "bg-sky-50",
    textColor: "text-sky-700",
    headingColor: "text-sky-800",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    progressBar: "bg-sky-500",
    glow: "shadow-sky-500/20"
  }
];

export default function Dashboard({ userState, onStartLesson, onNavigateTo, onTriggerPremium }: DashboardProps) {
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null);

  // Check if a chapter is unlocked
  const isChapterUnlocked = (chapterId: string, idx: number) => {
    if (idx === 0) return true;
    return userState.unlockedChapters.includes(chapterId);
  };

  // Get total completed concepts
  const completedConceptsCount = userState.completedConcepts.length;
  const totalConceptsCount = concepts.length;

  // Check if concept is unlocked based on prerequisites & chapter unlocking
  const isConceptUnlocked = (conceptId: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept) return false;
    
    const chapterIdx = chapters.findIndex(ch => ch.id === concept.chapterId);
    if (!isChapterUnlocked(concept.chapterId, chapterIdx)) return false;

    // Prerequisites met
    return concept.prerequisites.every((pid) =>
      userState.completedConcepts.includes(pid)
    );
  };

  // Surgeon Leaderboard Mock Data (Trophy UI / Gamification)
  const leaderboardData = [
    { rank: 1, name: "دکتر مریم رضایی", xp: 540, avatarColor: "bg-amber-100 text-amber-600", isCurrentUser: false },
    { rank: 2, name: "دکتر پوریا حسینی", xp: 410, avatarColor: "bg-blue-100 text-blue-600", isCurrentUser: false },
    { rank: 3, name: `دکتر ${userState.fullName || "کاربر مهمان"} (شما)`, xp: userState.xp, avatarColor: "bg-indigo-600 text-white", isCurrentUser: true },
    { rank: 4, name: "دکتر سارا احمدی", xp: 180, avatarColor: "bg-purple-100 text-purple-600", isCurrentUser: false },
    { rank: 5, name: "دکتر علی اصغری", xp: 120, avatarColor: "bg-rose-100 text-rose-600", isCurrentUser: false },
  ].sort((a, b) => b.xp - a.xp);

  // Weekly streak calendar
  const daysOfWeek = [
    { name: "ش", active: userState.dailyStreak > 0, isToday: true },
    { name: "ی", active: false, isToday: false },
    { name: "د", active: false, isToday: false },
    { name: "س", active: false, isToday: false },
    { name: "چ", active: false, isToday: false },
    { name: "پ", active: false, isToday: false },
    { name: "ج", active: false, isToday: false },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Playful Duolingo-style Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Streak card with Duolingo-style 3D Button look */}
        <div className="bg-white border-2 border-b-6 border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs transition-all hover:translate-y-[-2px] hover:border-b-8">
          <div className="space-y-1 text-right">
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">تداوم مطالعه (Streak)</p>
            <h3 className="text-2xl font-black text-orange-500 font-mono flex items-baseline gap-1">
              {userState.dailyStreak} <span className="text-xs font-extrabold text-orange-600">روز</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
        </div>

        {/* XP card */}
        <div className="bg-white border-2 border-b-6 border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs transition-all hover:translate-y-[-2px] hover:border-b-8">
          <div className="space-y-1 text-right">
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">امتیاز تجربه (XP)</p>
            <h3 className="text-2xl font-black text-blue-500 font-mono flex items-baseline gap-1">
              {userState.xp} <span className="text-xs font-extrabold text-blue-600">XP</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
            <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
          </div>
        </div>

        {/* Diagnosis streak */}
        <div className="bg-white border-2 border-b-6 border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs transition-all hover:translate-y-[-2px] hover:border-b-8">
          <div className="space-y-1 text-right">
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">تشخیص پی‌در‌پی</p>
            <h3 className="text-2xl font-black text-emerald-500 font-mono flex items-baseline gap-1">
              {userState.diagnosisStreak} <span className="text-xs font-extrabold text-emerald-600">کیس</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Award className="w-6 h-6 text-emerald-500 fill-emerald-50" />
          </div>
        </div>

        {/* Remaining hearts */}
        <div className="bg-white border-2 border-b-6 border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs transition-all hover:translate-y-[-2px] hover:border-b-8">
          <div className="space-y-1 text-right">
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">جان‌های بالینی</p>
            <div className="flex items-center gap-1 font-mono">
              {userState.isPremium ? (
                <span className="text-xl font-black text-rose-500">∞</span>
              ) : (
                [...Array(5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < userState.hearts
                        ? "text-rose-500 fill-rose-500"
                        : "text-slate-200"
                    }`}
                  />
                ))
              )}
            </div>
            <p className="text-[10px] text-rose-600 font-bold">
              {userState.isPremium ? "حساب طلایی نامحدود" : userState.hearts === 0 ? "جان تمام شده! مرور کن" : `${userState.hearts} از ۵ جان`}
            </p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
            <Heart className={`w-6 h-6 ${userState.hearts === 0 && !userState.isPremium ? "text-slate-300" : "text-rose-500 fill-rose-500"}`} />
          </div>
        </div>

      </div>

      {/* Main Grid: Learning Path Map (Left) & Sidebar Gamification (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Playful Duolingo Serpent Map */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white border-2 border-b-6 border-slate-200 p-6 md:p-8 rounded-[32px] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="text-right">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-blue-500" />
                  نقشه یادگیری و مسیر جراحی بالینی
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  روی گره‌های دایره‌ای کلیک کنید تا جزئیات مبحث باز شود. مسیر را کامل کنید!
                </p>
              </div>

              {/* Progress counter */}
              <div className="text-left text-xs bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-xl font-mono font-extrabold shrink-0">
                تسلط: {completedConceptsCount} / {totalConceptsCount} گره
              </div>
            </div>

            {/* Path Serpentine Units Flow */}
            <div className="space-y-12">
              {chapters.map((chapter, index) => {
                const unlocked = isChapterUnlocked(chapter.id, index);
                const progress = userState.chapterProgress[chapter.id] || 0;
                const theme = chapterThemes[index % chapterThemes.length];
                
                // Fetch concepts for this specific unit
                const chConcepts = concepts.filter(c => c.chapterId === chapter.id);

                return (
                  <div
                    key={chapter.id}
                    className={`relative space-y-8 ${!unlocked && "opacity-60 select-none"}`}
                  >
                    {/* Unit Box Header (Duolingo Style) */}
                    <div className={`rounded-2xl border-2 border-b-6 ${theme.border} ${theme.shadow} ${unlocked ? theme.bg : "bg-slate-300 border-slate-400"} text-white p-5 shadow-xs relative overflow-hidden transition-all duration-300`}>
                      <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                      
                      <div className="flex justify-between items-center relative z-10">
                        <div className="text-right space-y-1">
                          <span className="bg-white/20 border border-white/25 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            بخش {index + 1}
                          </span>
                          <h3 className="text-base font-black text-white">{chapter.title}</h3>
                          <p className="text-xs text-white/80 leading-relaxed font-sans font-medium">{chapter.description}</p>
                        </div>

                        {/* Round Progress indicator */}
                        <div className="bg-white/10 border border-white/15 w-16 h-16 rounded-full flex flex-col items-center justify-center font-mono shrink-0">
                          <span className="text-xs font-black">{progress}%</span>
                          <span className="text-[8px] uppercase tracking-wide opacity-80">تکمیل</span>
                        </div>
                      </div>
                    </div>

                    {/* Serpent Concept Nodes connected by a vertical dotted pipeline */}
                    {unlocked && (
                      <div className="relative py-4 flex flex-col items-center">
                        {/* Connecting track line */}
                        <div className="w-1 bg-slate-200 absolute top-0 bottom-0 left-1/2 -translate-x-1/2 -z-0 pointer-events-none"></div>

                        <div className="space-y-8 w-full relative z-10">
                          {chConcepts.map((concept, cIdx) => {
                            const isLearned = userState.completedConcepts.includes(concept.id);
                            const activeNode = isConceptUnlocked(concept.id) && !isLearned;
                            const isLocked = !isConceptUnlocked(concept.id);
                            
                            // Determine horizontal offset for Duolingo serpentine layout
                            const offsetMod = cIdx % 4;
                            let alignmentClass = "justify-center";
                            let translateStyle = "";
                            
                            if (offsetMod === 1) {
                              translateStyle = "-translate-x-12 sm:-translate-x-24";
                            } else if (offsetMod === 3) {
                              translateStyle = "translate-x-12 sm:translate-x-24";
                            }

                            return (
                              <div 
                                key={concept.id} 
                                className={`flex ${alignmentClass} w-full transition-all duration-300 ${translateStyle}`}
                              >
                                <div className="relative group">
                                  {/* Active node pulsating background effect */}
                                  {activeNode && (
                                    <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping -z-10 scale-125"></span>
                                  )}

                                  {/* Playful circle button */}
                                  <button
                                    onClick={() => setSelectedConcept({ ...concept, chapterIdx: index })}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex flex-col items-center justify-center transition-all duration-150 relative border-2 ${
                                      isLearned
                                        ? `bg-emerald-500 border-emerald-600 border-b-[6px] md:border-b-[8px] ${theme.shadow} text-white hover:brightness-110 active:border-b-2 active:translate-y-1`
                                        : isLocked
                                        ? "bg-slate-200 border-slate-300 border-b-[6px] md:border-b-[8px] text-slate-400 cursor-not-allowed"
                                        : `bg-blue-500 border-blue-600 border-b-[6px] md:border-b-[8px] border-b-blue-700 text-white hover:scale-105 active:border-b-2 active:translate-y-1`
                                    }`}
                                  >
                                    {isLearned ? (
                                      <CheckCircle className="w-6 h-6 text-white fill-emerald-600" />
                                    ) : isLocked ? (
                                      <Lock className="w-5 h-5" />
                                    ) : (
                                      <Play className="w-5 h-5 fill-white text-white translate-x-[-1px]" />
                                    )}

                                    {/* Mini badge count */}
                                    <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white border border-slate-700 font-mono font-bold text-[8px] w-5 h-5 rounded-full flex items-center justify-center">
                                      {cIdx + 1}
                                    </span>
                                  </button>

                                  {/* Tooltip pointing active */}
                                  {activeNode && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-md animate-bounce pointer-events-none whitespace-nowrap">
                                      شروع کنید!
                                      <div className="w-2 h-2 bg-blue-600 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!unlocked && (
                      <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Lock className="w-6 h-6 text-slate-300" />
                        <p className="text-xs font-extrabold">این بخش قفل است</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">بخش‌های قبلی را کامل کنید تا قفل این بخش به‌طور خودکار باز شود.</p>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>

          {/* Interactive Concept popover Modal (Centered modal with backdrop blur, Duolingo & Trophy UI style) */}
          <AnimatePresence>
            {selectedConcept && (() => {
              const isLearned = userState.completedConcepts.includes(selectedConcept.id);
              const chIdx = selectedConcept.chapterIdx;
              const chapter = chapters[chIdx];
              const isChUnlocked = isChapterUnlocked(chapter.id, chIdx);
              const isUnlocked = isChUnlocked && selectedConcept.prerequisites.every((pid: string) =>
                userState.completedConcepts.includes(pid)
              );
              
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
                  dir="rtl"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="bg-white border-2 border-b-8 border-slate-300 rounded-[32px] max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl"
                  >
                    {/* Top background graphic */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedConcept(null)}
                      className="absolute left-6 top-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>

                    <div className="space-y-4">
                      {/* Badge / Status Indicator */}
                      <div className="flex items-center gap-2">
                        {isLearned ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />
                            مبحث تسلط یافته
                          </span>
                        ) : isUnlocked ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-blue-200 uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />
                            آماده شروع آموزش
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wide flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            مبحث قفل شده
                          </span>
                        )}

                        {selectedConcept.highStakes && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-rose-200 uppercase tracking-wide">
                            پیامد بالینی پرخطر
                          </span>
                        )}
                      </div>

                      {/* Title & Level */}
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-800 leading-tight">
                          {selectedConcept.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">
                          سطح یادگیری ارزیابی: <span className="text-slate-600">{selectedConcept.bloomLevel}</span>
                        </p>
                      </div>

                      {/* Content Box */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative">
                        <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wide">خلاصه مرجع علمی مبحث:</h4>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                          {selectedConcept.definition}
                        </p>
                      </div>

                      {/* Prerequisites Requirement */}
                      {selectedConcept.prerequisites && selectedConcept.prerequisites.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">پیش‌نیازهای کلیدی مبحث:</h4>
                          <div className="space-y-1.5">
                            {selectedConcept.prerequisites.map((pid: string) => {
                              const pre = concepts.find(c => c.id === pid);
                              const completedPre = userState.completedConcepts.includes(pid);
                              return (
                                <div key={pid} className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100 text-xs">
                                  <span className="font-bold text-slate-700">{pre ? pre.title : pid}</span>
                                  {completedPre ? (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                      <Check className="w-3 h-3" /> کامل شده
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> قفل
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Modal Actions */}
                      <div className="flex flex-col gap-3 pt-2">
                        {isUnlocked || isLearned ? (
                          <button
                            onClick={() => {
                              setSelectedConcept(null);
                              onStartLesson(chapter.id, false);
                            }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 text-white font-black text-xs py-3.5 rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Play className="w-4 h-4 fill-white text-white" />
                            <span>شروع آموزش تعاملی بخش مربوطه</span>
                          </button>
                        ) : (
                          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400 leading-relaxed">
                            این مفهوم در حال حاضر <strong>قفل</strong> است. ابتدا باید بخش‌ها و مفاهیم پیش‌نیاز را کامل کنید تا دسترسی فعال شود.
                          </div>
                        )}
                        
                        <button
                          onClick={() => setSelectedConcept(null)}
                          className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs py-3 rounded-2xl border-2 border-slate-200 transition-all text-center"
                        >
                          بستن جزئیات
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

        </div>

        {/* Right Column: Trophy UI style Gamification Components */}
        <div className="space-y-6">
          
          {/* 1. Daily Streak Calendar (Trophy UI Style) */}
          <div className="bg-white border-2 border-b-6 border-slate-200 p-5 rounded-[28px] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  تقویم هفتگی تداوم (Streak)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">پزشکان فعال روزانه جوایز XP دوبرابر دارند</p>
              </div>
              <span className="bg-orange-50 text-orange-600 font-mono text-xs font-bold px-2 py-0.5 rounded-lg border border-orange-100">
                {userState.dailyStreak} روز
              </span>
            </div>

            <div className="flex justify-between gap-1.5 pt-1">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <span className={`text-[10px] font-black ${day.isToday ? "text-blue-600" : "text-slate-400"}`}>
                    {day.name}
                  </span>
                  
                  {/* Playful Circle Streak Indicator */}
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    day.active 
                      ? "bg-gradient-to-tr from-orange-400 to-amber-400 border-orange-500 text-white shadow-xs shadow-orange-500/10"
                      : day.isToday
                      ? "bg-white border-blue-400 border-2 border-dashed text-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-300"
                  }`}>
                    {day.active ? (
                      <Flame className="w-4 h-4 text-white fill-white" />
                    ) : (
                      <span className="text-[9px] font-bold font-mono">
                        {day.isToday ? "امروز" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Surgeon Leaderboard (Trophy UI style competitive rankings) */}
          <div className="bg-white border-2 border-b-6 border-slate-200 p-5 rounded-[28px] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  رده‌بندی رزیدنت‌های جراحی
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">جدول برترین‌های مدوفیل (رده رزیدنتی)</p>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                لیگ عمومی
              </span>
            </div>

            <div className="space-y-2.5">
              {leaderboardData.map((surgeon, sIdx) => {
                const getRankBadge = (rank: number) => {
                  if (rank === 1) return <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />;
                  if (rank === 2) return <span className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center border border-slate-300 text-slate-500 font-mono text-[9px] font-extrabold">2</span>;
                  if (rank === 3) return <span className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 text-amber-700 font-mono text-[9px] font-extrabold">3</span>;
                  return <span className="w-4 h-4 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 font-mono text-[9px] font-extrabold">{rank}</span>;
                };

                return (
                  <div 
                    key={surgeon.rank}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      surgeon.isCurrentUser 
                        ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/10" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0">
                        {getRankBadge(surgeon.rank)}
                      </div>

                      {/* Fake Avatar */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${surgeon.avatarColor}`}>
                        <span>{surgeon.name.substring(5, 6)}</span>
                      </div>

                      <span className={`text-[11px] font-extrabold truncate ${
                        surgeon.isCurrentUser ? "text-indigo-950 font-black" : "text-slate-700"
                      }`}>
                        {surgeon.name}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-black text-slate-500 shrink-0">
                      {surgeon.xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. SM-2 Spaced Repetition Review Panel */}
          <div className="bg-white border-2 border-b-6 border-slate-200 p-5 rounded-[28px] shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-800">جعبه ابزار مرور بالینی</h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  سیستم هوشمند SM-2 برای بهینه‌سازی ماندگاری مطالب
                </p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-2 rounded-xl border border-purple-100 shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-2 text-slate-500 border border-slate-100 text-right">
              <p className="leading-relaxed">
                این جلسه مرور با شبیه‌سازی الگوریتم <strong>Spaced Repetition SM-2</strong> روی اشتباهات گذشته و نقاط ضعف شما متمرکز می‌شود.
              </p>
              <div className="flex items-center gap-1.5 pt-1 font-bold text-blue-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                <span>اتمام جلسه مرور = دریافت ۵ جان کامل</span>
              </div>
            </div>

            <button
              onClick={() => onStartLesson("review", true)}
              className="w-full bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border-b-4 border-slate-950 active:border-b-0 active:translate-y-[4px]"
            >
              <BookOpen className="w-4 h-4" />
              شروع جلسه مرور هوشمند زودهنگام
            </button>
          </div>

          {/* 4. Upgrade to Premium Card */}
          {userState.isPremium ? (
            <div className="bg-gradient-to-br from-amber-950/90 to-amber-900/95 border-2 border-b-6 border-amber-500/30 text-amber-50 rounded-[28px] p-5 relative overflow-hidden shadow-xs">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative space-y-4 text-right">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" />
                    GOLD MEMBER
                  </span>
                  <span className="text-[9px] text-amber-200">وضعیت حساب: فعال طلایی</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black flex items-center gap-1.5 text-amber-300">
                    شما پزشک طلایی مدوفیل هستید!
                  </h3>
                  <p className="text-[10px] text-amber-100/80 leading-relaxed font-sans font-medium">
                    تمام مباحث آموزشی باز، جان‌های شما نامحدود و گواهی‌نامه رسمی جراحی دیجیتال شما صادر شده است.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const certBtn = document.getElementById("profile-cert-trigger");
                    if (certBtn) {
                      certBtn.click();
                    } else {
                      onNavigateTo("profile");
                    }
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition-all border-b-4 border-amber-600 active:border-b-0 active:translate-y-[4px] flex items-center justify-center gap-1.5"
                >
                  <AwardIcon className="w-4 h-4" />
                  <span>مشاهده و چاپ گواهی‌نامه</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-b-6 border-indigo-500/30 text-white rounded-[28px] p-5 relative overflow-hidden shadow-xs">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative space-y-4 text-right">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                    Premium
                  </span>
                  <span className="text-[9px] text-indigo-200">پیشنهاد ویژه دستیار جراحی</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    ارتقا به مدوفیل طلایی (Premium)
                  </h3>
                  <p className="text-[10px] text-indigo-100/80 leading-relaxed font-sans font-medium">
                    باز کردن جان‌های بی‌نهایت (∞ Hearts)، صدور گواهی‌نامه رسمی طلایی با مهر آکادمیک و دسترسی به سناریوهای VIP جراحی.
                  </p>
                </div>

                <button
                  onClick={onTriggerPremium}
                  className="w-full bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs border-b-4 border-slate-200 active:border-b-0 active:translate-y-[4px]"
                >
                  ارتقای طلایی حساب کاربری
                </button>
              </div>
            </div>
          )}

          {/* Quick navigational shortcuts */}
          <div className="flex gap-4">
            <button
              onClick={() => onNavigateTo("profile")}
              className="flex-1 bg-white border-2 border-b-4 border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:border-b-0 active:translate-y-[4px] shadow-2xs"
            >
              <User className="w-4 h-4 text-slate-400" />
              پروفایل و آمار
            </button>
            <button
              onClick={() => onNavigateTo("settings")}
              className="flex-1 bg-white border-2 border-b-4 border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:border-b-0 active:translate-y-[4px] shadow-2xs"
            >
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              تنظیمات
            </button>
          </div>

        </div>
      </div>

      {/* Dynamic Visual Knowledge Map section */}
      <KnowledgeMap userState={userState} onSelectConcept={(cid) => {
        const conc = concepts.find(c => c.id === cid);
        if (conc) {
          onStartLesson(conc.chapterId, false);
        }
      }} />

    </div>
  );
}

// Simple internal helper component for close icon
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
