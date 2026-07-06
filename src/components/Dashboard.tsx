import React, { useState, useEffect } from "react";
import { Chapter, UserState } from "../types";
import { useContent } from "../lib/contentContext";
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
  Check,
  X,
  Stethoscope,
  Activity,
  Compass,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KnowledgeMap from "./KnowledgeMap";
import Tilt3D from "./Tilt3D";
import { subjectsList } from "../data/subjects";

// Premium 3D Rendered assets from Microsoft Fluent UI Emoji (completely free & open-source)
const chapter3DAssets = [
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Brain/3D/brain_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Stethoscope/3D/stethoscope_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/DNA/3D/dna_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Medical%20symbol/3D/medical_symbol_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pills/3D/pills_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Syringe/3D/syringe_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Shield/3D/shield_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Books/3D/books_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png",
];

interface DashboardProps {
  userState: UserState;
  currentUser?: any;
  onStartLesson: (chapterId: string, isReview: boolean) => void;
  onNavigateTo: (view: "profile" | "settings") => void;
  onTriggerPremium: () => void;
  onUpdateState?: (state: UserState) => void;
  
  // Antigravity dynamic simulation control states passed from App.tsx
  gravityValue: number;
  setGravityValue: (v: number) => void;
  speedFactor: number;
  setSpeedFactor: (v: number) => void;
  magneticMode: "attract" | "repel" | "orbit" | "off";
  setMagneticMode: (v: "attract" | "repel" | "orbit" | "off") => void;
  themeColor: "indigo" | "cyan" | "rose" | "emerald" | "amber";
  setThemeColor: (v: "indigo" | "cyan" | "rose" | "emerald" | "amber") => void;
}

// Creative medical-tech glowing color themes for Bento layout
const chapterThemes = [
  {
    bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    border: "border-cyan-500/20",
    hoverBg: "hover:bg-cyan-500/20",
    shadow: "shadow-cyan-500/10",
    progressBar: "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
    glow: "shadow-cyan-500/20",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    iconColor: "text-cyan-400"
  },
  {
    bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    border: "border-indigo-500/20",
    hoverBg: "hover:bg-indigo-500/20",
    shadow: "shadow-indigo-500/10",
    progressBar: "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]",
    glow: "shadow-indigo-500/20",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    iconColor: "text-indigo-400"
  },
  {
    bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    border: "border-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/20",
    shadow: "shadow-emerald-500/10",
    progressBar: "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    glow: "shadow-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    iconColor: "text-emerald-400"
  },
  {
    bg: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    border: "border-pink-500/20",
    hoverBg: "hover:bg-pink-500/20",
    shadow: "shadow-pink-500/10",
    progressBar: "bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]",
    glow: "shadow-pink-500/20",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    iconColor: "text-pink-400"
  },
  {
    bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    border: "border-amber-500/20",
    hoverBg: "hover:bg-amber-500/20",
    shadow: "shadow-amber-500/10",
    progressBar: "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    glow: "shadow-amber-500/20",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    iconColor: "text-amber-400"
  },
  {
    bg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    border: "border-purple-500/20",
    hoverBg: "hover:bg-purple-500/20",
    shadow: "shadow-purple-500/10",
    progressBar: "bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
    glow: "shadow-purple-500/20",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    iconColor: "text-purple-400"
  },
  {
    bg: "bg-teal-500/10 border-teal-500/20 text-teal-400",
    border: "border-teal-500/20",
    hoverBg: "hover:bg-teal-500/20",
    shadow: "shadow-teal-500/10",
    progressBar: "bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]",
    glow: "shadow-teal-500/20",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    iconColor: "text-teal-400"
  },
  {
    bg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    border: "border-sky-500/20",
    hoverBg: "hover:bg-sky-500/20",
    shadow: "shadow-sky-500/10",
    progressBar: "bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]",
    glow: "shadow-sky-500/20",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    iconColor: "text-sky-400"
  },
  {
    bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    border: "border-rose-500/20",
    hoverBg: "hover:bg-rose-500/20",
    shadow: "shadow-rose-500/10",
    progressBar: "bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
    glow: "shadow-rose-500/20",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    iconColor: "text-rose-400"
  }
];

export default function Dashboard({ 
  userState, 
  currentUser, 
  onStartLesson, 
  onNavigateTo, 
  onTriggerPremium,
  onUpdateState,
  gravityValue,
  setGravityValue,
  speedFactor,
  setSpeedFactor,
  magneticMode,
  setMagneticMode,
  themeColor,
  setThemeColor
}: DashboardProps) {
  const { chapters, concepts } = useContent();
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setLeaderboardData(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    };
    fetchLeaderboard();
    return () => {
      active = false;
    };
  }, [userState.xp]);

  const activeSubjectId = userState.currentSubject || "surgery";

  const handleSelectSubject = (subjId: string, accentColor: string) => {
    if (onUpdateState) {
      onUpdateState({
        ...userState,
        currentSubject: subjId
      });
    }
    const themeMap: Record<string, "indigo" | "cyan" | "rose" | "emerald" | "amber"> = {
      surgery: "indigo",
      cardiology: "rose",
      pediatrics: "cyan",
      gynecology: "cyan",
      pharmacology: "emerald"
    };
    setThemeColor(themeMap[subjId] || "indigo");
  };

  const getSubjectForChapter = (chapterId: string): string => {
    if (chapterId.startsWith("cardio_")) return "cardiology";
    if (chapterId.startsWith("pedi_")) return "pediatrics";
    if (chapterId.startsWith("gyn_")) return "gynecology";
    if (chapterId.startsWith("pharma_")) return "pharmacology";
    return "surgery";
  };

  const activeChapters = chapters.filter(ch => getSubjectForChapter(ch.id) === activeSubjectId);
  const activeConcepts = concepts.filter(c => getSubjectForChapter(c.chapterId) === activeSubjectId);

  const isChapterUnlocked = (chapterId: string, idx: number) => {
    if (idx === 0) return true;
    return userState.unlockedChapters.includes(chapterId);
  };

  const completedConceptsCount = activeConcepts.filter(c => userState.completedConcepts.includes(c.id)).length;
  const totalConceptsCount = activeConcepts.length;

  const isConceptUnlocked = (conceptId: string) => {
    const concept = activeConcepts.find(c => c.id === conceptId);
    if (!concept) return false;
    
    const chapterIdx = activeChapters.findIndex(ch => ch.id === concept.chapterId);
    if (!isChapterUnlocked(concept.chapterId, chapterIdx)) return false;

    return concept.prerequisites.every((pid) =>
      userState.completedConcepts.includes(pid)
    );
  };

  const processedLeaderboard = leaderboardData.map((surgeon, sIdx) => {
    const isCurrentUser = currentUser?.uid === surgeon.uid || (userState.email && userState.email === surgeon.email);
    
    const colors = [
      "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      "bg-rose-500/20 text-rose-300 border border-rose-500/30",
      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
    ];
    const avatarColor = isCurrentUser ? "bg-indigo-600 text-white border border-indigo-400" : (colors[sIdx % colors.length]);

    return {
      rank: sIdx + 1,
      name: surgeon.name,
      xp: surgeon.xp,
      avatarColor,
      isCurrentUser,
    };
  });

  const daysOfWeek = [
    { name: "ش", active: userState.dailyStreak > 0, isToday: true },
    { name: "ی", active: false, isToday: false },
    { name: "د", active: false, isToday: false },
    { name: "س", active: false, isToday: false },
    { name: "چ", active: false, isToday: false },
    { name: "پ", active: false, isToday: false },
    { name: "ج", active: false, isToday: false },
  ];

  const isAdmin = userState.email === "yasinbagherzadeh18@gmail.com" || currentUser?.email === "yasinbagherzadeh18@gmail.com";

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Sag Nazan Headquarter & Medical Specialty Learning Hub Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/60 to-purple-950/80 border border-white/10 p-6 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="absolute left-10 top-1/2 -translate-y-1/2 w-28 h-28 hidden md:block select-none pointer-events-none">
          <img 
            src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Stethoscope/3D/stethoscope_3d.png" 
            alt="Stethoscope 3D" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:scale-110 transition-transform duration-300"
          />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-right">
          <div className="w-20 h-20 shrink-0 bg-slate-950/80 rounded-full overflow-hidden border border-white/10 flex items-center justify-center relative shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <img 
              src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Health%20worker/Default/3D/health_worker_3d_default.png" 
              alt="Health Worker 3D" 
              referrerPolicy="no-referrer"
              className="w-14 h-14 object-contain"
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                🎓 آکادمی جامع شبیه‌سازی بالینی سگ نزن
              </span>
              <span className="text-[10px] text-indigo-300 font-extrabold font-mono">هاب یکپارچه یادگیری دروس پزشکی</span>
            </div>
            <h2 className="text-xl font-black text-white leading-snug">
              خوش آمدید، همکار بالینی! به هاب جامع یادگیری و شبیه‌سازی پزشکی سگ نزن خوش آمدید 🩺
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              با تمرین‌های شبیه‌سازی بالینی پیشرفته و متد تکرار فاصله‌دار، مهارت‌های پزشکی خود را در دپارتمان‌های مختلف ارتقا داده و تصمیم‌گیری بالینی چابک را در محیطی تعاملی تمرین کنید!
            </p>
          </div>
        </div>
      </div>

      {/* 🧬 Scalable Medical Subjects Selector (Interactive Hub Mode) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-indigo-400" />
              انتخاب دپارتمان و درس تخصصی هدف
            </h3>
            <p className="text-[10px] text-slate-400">یک شاخه تخصصی را برگزینید تا درخت یادگیری و سرفصل‌های همان دپارتمان نمایش داده شود.</p>
          </div>
          <span className="text-[9px] bg-slate-900 border border-indigo-500/10 text-indigo-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            ۵ دپارتمان فعال علمی
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {subjectsList.map((subject) => {
            const isActive = subject.id === activeSubjectId;
            const subjectChapters = chapters.filter(ch => getSubjectForChapter(ch.id) === subject.id);
            const subjectConcepts = concepts.filter(c => getSubjectForChapter(c.chapterId) === subject.id);
            const completedCount = subjectConcepts.filter(c => userState.completedConcepts.includes(c.id)).length;
            const totalCount = subjectConcepts.length;
            const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            const IconComponent = () => {
              if (subject.icon === "Heart") return <Heart className={`w-4 h-4 ${isActive ? "text-white" : "text-rose-400 group-hover:scale-110 transition-transform"}`} />;
              if (subject.icon === "Activity") return <Activity className={`w-4 h-4 ${isActive ? "text-white" : "text-cyan-400 group-hover:scale-110 transition-transform"}`} />;
              if (subject.icon === "Sparkles") return <Sparkles className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-400 group-hover:scale-110 transition-transform"}`} />;
              if (subject.icon === "Award") return <Award className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-400 group-hover:scale-110 transition-transform"}`} />;
              return <Stethoscope className={`w-4 h-4 ${isActive ? "text-white" : "text-indigo-400 group-hover:scale-110 transition-transform"}`} />;
            };

            const accentBorder = {
              surgery: "hover:border-indigo-500/30",
              cardiology: "hover:border-rose-500/30",
              pediatrics: "hover:border-cyan-500/30",
              gynecology: "hover:border-purple-500/30",
              pharmacology: "hover:border-emerald-500/30"
            }[subject.id as string] || "hover:border-indigo-500/30";

            return (
              <button
                key={subject.id}
                onClick={() => handleSelectSubject(subject.id, subject.accentColor)}
                className={`p-3.5 rounded-2xl border text-right transition-all relative overflow-hidden group select-none ${
                  isActive
                    ? "bg-slate-900 border-indigo-500/40 shadow-lg text-white ring-1 ring-indigo-500/20"
                    : "bg-slate-900/30 border-white/[0.05] text-slate-300 hover:bg-slate-900/50 hover:text-white"
                } ${accentBorder}`}
              >
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
                )}

                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                    isActive 
                      ? "bg-indigo-600/30 border border-indigo-400/30" 
                      : "bg-slate-950/80 border border-white/5"
                  }`}>
                    <IconComponent />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black leading-tight truncate">{subject.title}</h4>
                    <span className="text-[7px] font-bold text-slate-500 block uppercase font-mono tracking-wider truncate">{subject.englishTitle}</span>
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <div className="flex justify-between text-[7px] text-slate-400 font-extrabold font-mono">
                    <span>پیشرفت: {progressPct}%</span>
                    <span>{completedCount}/{totalCount} گره</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        subject.id === "surgery" ? "bg-indigo-500" :
                        subject.id === "cardiology" ? "bg-rose-500" :
                        subject.id === "pediatrics" ? "bg-cyan-500" :
                        subject.id === "gynecology" ? "bg-purple-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* ----------------- ASYMMETRICAL BENTO GRID SYSTEM ----------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-auto">
        
        {/* 🌌 Antigravity Cosmic Physics Laboratory Console */}
        {isAdmin && (
          <div className="lg:col-span-12 bg-slate-950/70 border border-indigo-500/20 rounded-[32px] p-6 shadow-[0_0_35px_rgba(99,102,241,0.12)] backdrop-blur-2xl relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tl from-purple-500/10 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10">
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    آزمایشگاه فیزیک و میدان گرانشی آنتی‌گراویتی (Antigravity Deck) 🚀
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  تنظیم زنده میدان گرانشی، سرعت کوانتومی، و واکنش اشاره‌گر پس‌زمینه. برای معلق کردن کارت‌ها، جاذبه را به زیر صفر کاهش دهید!
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-slate-900 border border-white/5 text-indigo-300 font-mono font-bold px-3 py-1.5 rounded-xl">
                  وضعیت گرانش: {gravityValue < 0 ? "⚠️ تعلیق آنتی‌گراویتی فعال" : gravityValue === 0 ? "🌌 گرانش صفر" : "🪐 جاذبه معمولی"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {/* Control 1: Gravity strength */}
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                  <span>شدت گرانش کیهانی (Vector Gravity)</span>
                  <span className="text-indigo-400 font-mono font-bold" dir="ltr">{gravityValue.toFixed(1)} G</span>
                </label>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.1"
                  value={gravityValue}
                  onChange={(e) => setGravityValue(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-bold font-sans">
                  <span>تعلیق کامل (Floating)</span>
                  <span>جاذبه خنثی</span>
                  <span>جاذبه زمین</span>
                </div>
              </div>

              {/* Control 2: Particle Speed */}
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                  <span>سرعت جریان ذرات (Velocity)</span>
                  <span className="text-indigo-400 font-mono font-bold" dir="ltr">{speedFactor.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={speedFactor}
                  onChange={(e) => setSpeedFactor(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-bold font-sans">
                  <span>جریان آرام</span>
                  <span>نرمال</span>
                  <span>فرکانس بالا</span>
                </div>
              </div>

              {/* Control 3: Pointer Force Field */}
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-bold text-slate-400">
                  میدان مغناطیسی اشاره‌گر (Cursor Force)
                </label>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-900 border border-white/5 rounded-xl">
                  {(["repel", "attract", "orbit", "off"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setMagneticMode(mode)}
                      className={`text-[9px] py-1.5 rounded-lg transition-all font-black ${
                        magneticMode === mode
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {mode === "repel" ? "دفع" : mode === "attract" ? "جذب" : mode === "orbit" ? "مدار" : "بسته"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 4: Theme spectrum */}
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-bold text-slate-400">
                  طیف نور سحابی پس‌زمینه (Nebula Spectrum)
                </label>
                <div className="flex items-center gap-3.5 pt-1.5 justify-center md:justify-start">
                  {(["indigo", "cyan", "rose", "emerald", "amber"] as const).map((color) => {
                    const circleColors = {
                      indigo: "bg-indigo-500 shadow-indigo-500/50",
                      cyan: "bg-cyan-500 shadow-cyan-500/50",
                      rose: "bg-rose-500 shadow-rose-500/50",
                      emerald: "bg-emerald-500 shadow-emerald-500/50",
                      amber: "bg-amber-500 shadow-amber-500/50",
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`w-4 h-4 rounded-full ${circleColors[color]} transition-all relative ${
                          themeColor === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-120"
                            : "hover:scale-110 opacity-70"
                        }`}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bento Stat Card 1: Study Streak with 3D interactive tilt */}
        <Tilt3D className={`lg:col-span-3 md:col-span-2 ${gravityValue < 0 ? "animate-levitate" : ""}`}>
          <div className="bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl p-5 rounded-3xl flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-orange-500/40 group h-full relative overflow-hidden">
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">تداوم مطالعه (Streak)</p>
              <h3 className="text-3xl font-black text-orange-500 font-mono flex items-baseline gap-1">
                {userState.dailyStreak} <span className="text-xs font-extrabold text-orange-400">روز</span>
              </h3>
              <p className="text-[9px] text-slate-500">حضور فعال روزانه در بخش جراحی</p>
            </div>
            <div className="w-14 h-14 relative shrink-0">
              <img 
                src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png" 
                alt="Streak 3D"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(249,115,22,0.3)] group-hover:scale-115 transition-transform duration-300"
              />
            </div>
          </div>
        </Tilt3D>

        {/* Bento Stat Card 2: XP Points with 3D interactive tilt */}
        <Tilt3D className={`lg:col-span-3 md:col-span-2 ${gravityValue < 0 ? "animate-levitate-delayed" : ""}`}>
          <div className="bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl p-5 rounded-3xl flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-blue-500/40 group h-full relative overflow-hidden">
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">امتیاز تجربه (XP)</p>
              <h3 className="text-3xl font-black text-blue-400 font-mono flex items-baseline gap-1">
                {userState.xp} <span className="text-xs font-extrabold text-blue-400">XP</span>
              </h3>
              <p className="text-[9px] text-slate-500">مجموع امتیاز یادگیری پرونده</p>
            </div>
            <div className="w-14 h-14 relative shrink-0">
              <img 
                src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/High%20voltage/3D/high_voltage_3d.png" 
                alt="XP 3D"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(59,130,246,0.3)] group-hover:scale-115 transition-transform duration-300"
              />
            </div>
          </div>
        </Tilt3D>

        {/* Bento Stat Card 3: Diagnosis Streak with 3D interactive tilt */}
        <Tilt3D className={`lg:col-span-3 md:col-span-2 ${gravityValue < 0 ? "animate-levitate" : ""}`}>
          <div className="bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl p-5 rounded-3xl flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-emerald-500/40 group h-full relative overflow-hidden">
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">تشخیص پی‌در‌پی</p>
              <h3 className="text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
                {userState.diagnosisStreak} <span className="text-xs font-extrabold text-emerald-400">کیس</span>
              </h3>
              <p className="text-[9px] text-slate-500">پاسخ‌های بدون خطای متوالی</p>
            </div>
            <div className="w-14 h-14 relative shrink-0">
              <img 
                src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png" 
                alt="Diagnosis 3D"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(16,185,129,0.3)] group-hover:scale-115 transition-transform duration-300 animate-pulse"
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>
        </Tilt3D>

        {/* Bento Stat Card 4: Clinical Hearts with 3D interactive tilt */}
        <Tilt3D className={`lg:col-span-3 md:col-span-2 ${gravityValue < 0 ? "animate-levitate-delayed" : ""}`}>
          <div className="bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl p-5 rounded-3xl flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-rose-500/40 group h-full relative overflow-hidden">
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">جان‌های بالینی</p>
              <div className="flex items-center gap-1 font-mono pt-1">
                {userState.isPremium ? (
                  <span className="text-2xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">∞</span>
                ) : (
                  [...Array(5)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < userState.hearts
                          ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]"
                          : "text-slate-700"
                      }`}
                    />
                  ))
                )}
              </div>
              <p className="text-[9px] text-slate-500 pt-1">
                {userState.isPremium ? "عضویت طلایی و ظرفیت بی‌نهایت" : userState.hearts === 0 ? "جان تمام شده! مرور جراحی کن" : `ظرفیت فعال: ${userState.hearts} از ۵`}
              </p>
            </div>
            <div className="w-14 h-14 relative shrink-0">
              <img 
                src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Red%20heart/3D/red_heart_3d.png" 
                alt="Hearts 3D"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.3)] group-hover:scale-115 transition-transform duration-300"
              />
            </div>
          </div>
        </Tilt3D>

        {/* Bento Central Block (Large): Learning Path & Serpent Map (Cruip layout structured, Arjun visual style) */}
        <motion.div 
          className="lg:col-span-8 md:col-span-4 bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-6 md:p-8 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/5 gap-3">
            <div className="text-right">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-400" />
                نقشه مطالعاتی و مسیر یادگیری {subjectsList.find(s => s.id === activeSubjectId)?.title || "تخصصی"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                برای باز کردن و دسترسی به مفاهیم تعاملی، روی گره‌های دایره‌ای کلیک کنید.
              </p>
            </div>

            <div className="text-left text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-xl font-mono font-extrabold shrink-0 w-max">
              تسلط کل: {completedConceptsCount} / {totalConceptsCount} مفهوم
            </div>
          </div>

          {/* Interactive Serpentine Unit Roadmap */}
          <div className="space-y-12">
            {activeChapters.map((chapter, index) => {
              const unlocked = isChapterUnlocked(chapter.id, index);
              const progress = userState.chapterProgress[chapter.id] || 0;
              const theme = chapterThemes[index % chapterThemes.length];
              const chConcepts = activeConcepts.filter(c => c.chapterId === chapter.id);

              return (
                <div key={chapter.id} className={`relative space-y-6 ${!unlocked && "opacity-40 select-none"}`}>
                  
                  {/* Chapter Section Card with 3D interactive tilt and floating 3D illustration */}
                  <Tilt3D scale={1.01} maxRotation={5}>
                    <div className={`p-5 rounded-2xl border ${unlocked ? "bg-slate-900/60 border-white/10 hover:border-indigo-500/30" : "bg-slate-950/20 border-white/5"} relative overflow-hidden group transition-all duration-300 h-full`}>
                      <div className="absolute left-16 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                      
                      <div className="flex justify-between items-center relative z-10 gap-4">
                        <div className="text-right space-y-1.5 flex-1 min-w-0">
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full border ${theme.badge}`}>
                            بخش {index + 1}
                          </span>
                          <h3 className="text-sm font-black text-slate-100">{chapter.title}</h3>
                          <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">{chapter.description}</p>
                        </div>

                        {/* Floated 3D Icon corresponding to subject */}
                        {unlocked && (
                          <div className="w-12 h-12 relative shrink-0">
                            <img 
                              src={chapter3DAssets[index % chapter3DAssets.length]} 
                              alt="Chapter 3D Icon"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(99,102,241,0.25)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                            />
                          </div>
                        )}

                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-14 h-14 rounded-full bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center font-mono relative">
                            <span className="text-[10px] font-black text-indigo-300">{progress}%</span>
                            <span className="text-[7px] text-slate-500 font-extrabold uppercase tracking-wide">تکمیل</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress slider bar */}
                      {unlocked && (
                        <div className="w-full h-1 bg-slate-950 rounded-full mt-4 overflow-hidden">
                          <div 
                            className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Tilt3D>

                  {/* Serpent Concept Circle Nodes (RTL aligned connected line) */}
                  {unlocked && (
                    <div className="relative py-4 flex flex-col items-center">
                      <div className="w-[2px] bg-slate-800/80 absolute top-0 bottom-0 left-1/2 -translate-x-1/2 -z-0" />

                      <div className="space-y-8 w-full relative z-10">
                        {chConcepts.map((concept, cIdx) => {
                          const isLearned = userState.completedConcepts.includes(concept.id);
                          const activeNode = isConceptUnlocked(concept.id) && !isLearned;
                          const isLocked = !isConceptUnlocked(concept.id);
                          
                          // Duolingo style zig-zag layout
                          const offsetMod = cIdx % 4;
                          let alignmentClass = "justify-center";
                          let translateStyle = "";
                          
                          if (offsetMod === 1) {
                            translateStyle = "-translate-x-12 sm:-translate-x-20";
                          } else if (offsetMod === 3) {
                            translateStyle = "translate-x-12 sm:translate-x-20";
                          }

                          return (
                            <div 
                              key={concept.id} 
                              className={`flex ${alignmentClass} w-full transition-all duration-300 ${translateStyle}`}
                            >
                              <div className="relative group">
                                {activeNode && (
                                  <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping -z-10 scale-125" />
                                )}

                                <button
                                  onClick={() => setSelectedConcept({ ...concept, chapterIdx: index })}
                                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative border-2 ${
                                    isLearned
                                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
                                      : isLocked
                                      ? "bg-slate-950/60 border-slate-800 text-slate-600 cursor-not-allowed"
                                      : "bg-indigo-600/20 border-indigo-400 text-indigo-300 hover:bg-indigo-600/30 hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer"
                                  }`}
                                >
                                  {isLearned ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                  ) : isLocked ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-indigo-400 text-indigo-400 translate-x-[-0.5px]" />
                                  )}

                                  <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-white/10 text-slate-300 font-mono font-bold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                                    {cIdx + 1}
                                  </span>
                                </button>

                                {activeNode && (
                                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg animate-bounce pointer-events-none whitespace-nowrap">
                                    شروع کن!
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
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
                    <div className="py-6 text-center bg-slate-950/20 rounded-xl border border-dashed border-white/5 text-slate-500 flex flex-col items-center justify-center gap-1">
                      <Lock className="w-5 h-5 text-slate-600" />
                      <p className="text-[11px] font-extrabold">بخش آموزشی مربوطه قفل است</p>
                      <p className="text-[9px] text-slate-600">بخش‌های قبلی را کامل کنید تا دسترسی شما فعال شود.</p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </motion.div>

        {/* Bento Sidebar (Right stacked grid column items) */}
        <div className="lg:col-span-4 md:col-span-4 space-y-6 flex flex-col">
          
          {/* Weekly Streak Indicator with 3D Tilt */}
          <Tilt3D scale={1.01}>
            <div className="bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-5 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-4 h-full relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    تقویم هفتگی تداوم (Streak)
                  </h3>
                  <p className="text-[9px] text-slate-400">جوایز ویژه برای حضور فعال پزشکان</p>
                </div>
                <div className="w-8 h-8 shrink-0">
                  <img 
                    src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png" 
                    alt="Streak Mini 3D" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(249,115,22,0.2)]"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-1.5 pt-1">
                {daysOfWeek.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <span className={`text-[9px] font-extrabold ${day.isToday ? "text-indigo-400" : "text-slate-500"}`}>
                      {day.name}
                    </span>
                    
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                      day.active 
                        ? "bg-gradient-to-tr from-orange-500 to-amber-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                        : day.isToday
                        ? "bg-slate-900 border-indigo-500/50 border border-dashed text-indigo-400"
                        : "bg-slate-950/40 border-slate-800/60 text-slate-600"
                    }`}>
                      {day.active ? (
                        <Flame className="w-3.5 h-3.5 text-white fill-white" />
                      ) : (
                        <span className="text-[8px] font-black font-mono">
                          {day.isToday ? "امروز" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tilt3D>

          {/* Student Leaderboard Card with 3D Tilt */}
          <Tilt3D scale={1.01}>
            <div className="bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-5 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-4 h-full relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    رده‌بندی پزشکان بالینی
                  </h3>
                  <p className="text-[9px] text-slate-400">لیست برترین دانشجویان سگ نزن</p>
                </div>
                <div className="w-8 h-8 shrink-0">
                  <img 
                    src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png" 
                    alt="Trophy Mini 3D" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(16,185,129,0.2)]"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {processedLeaderboard.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-[10px] font-bold bg-slate-950/20 border border-dashed border-white/5 rounded-xl">
                    هنوز رتبه‌ای ثبت نشده است. اولین پزشک باشید!
                  </div>
                ) : (
                  processedLeaderboard.map((surgeon) => (
                    <div 
                      key={surgeon.rank}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                        surgeon.isCurrentUser 
                          ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.05)]" 
                          : "bg-slate-950/10 border-white/[0.02] hover:border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0 font-mono text-[9px] font-black text-slate-400 w-4 text-center">
                          {surgeon.rank === 1 ? "🥇" : surgeon.rank === 2 ? "🥈" : surgeon.rank === 3 ? "🥉" : surgeon.rank}
                        </div>

                        <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${surgeon.avatarColor}`}>
                          <span>{surgeon.name.replace("دکتر ", "").substring(0, 1) || "د"}</span>
                        </div>

                        <span className={`text-[10px] font-black truncate ${
                          surgeon.isCurrentUser ? "text-indigo-300" : "text-slate-200"
                        }`}>
                          {surgeon.name}
                        </span>
                      </div>

                      <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
                        {surgeon.xp} XP
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Tilt3D>

          {/* SM-2 Spaced Repetition Panel with 3D Tilt */}
          <Tilt3D scale={1.01}>
            <div className="bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-5 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-4 h-full relative overflow-hidden group">
              <div className="flex items-start justify-between gap-2">
                <div className="text-right space-y-0.5">
                  <h3 className="text-xs font-black text-white">جلسه مرور فاصله‌دار (SM-2)</h3>
                  <p className="text-[9px] text-slate-400">
                    بهینه‌سازی تکرار کانون خطاها بر اساس منحنی حافظه
                  </p>
                </div>
                <div className="w-10 h-10 shrink-0">
                  <img 
                    src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Brain/3D/brain_3d.png" 
                    alt="Brain 3D" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(168,85,247,0.2)]"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl text-[10px] text-slate-400 border border-white/[0.02] text-right leading-relaxed">
                مرور مستمر خطاها با الگوریتم <strong>SuperMemo-2</strong> علاوه بر افزایش مهارت، تمام ۵ جان بالینی شما را مجدداً تکمیل می‌کند.
              </div>

              <button
                onClick={() => onStartLesson("review", true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-98"
              >
                <BookOpen className="w-3.5 h-3.5" />
                شروع جلسه مرور خطاها
              </button>
            </div>
          </Tilt3D>

          {/* Premium Account Card with 3D Tilt */}
          {userState.isPremium ? (
            <Tilt3D scale={1.01}>
              <div className="bg-gradient-to-br from-amber-950/80 to-slate-950 border border-amber-500/20 text-amber-50 rounded-3xl p-5 relative overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.45)] group h-full">
                <div className="absolute left-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                
                <div className="relative space-y-4 text-right">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 shadow">
                      <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      GOLD MEMBER
                    </span>
                    <div className="w-8 h-8 shrink-0">
                      <img 
                        src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png" 
                        alt="Crown 3D" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.2)] group-hover:scale-110 group-hover:rotate-12 transition-transform"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-amber-200">
                      پرونده طلایی شما فعال است!
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      مهر رسمی، گواهی‌نامه جراحی دیجیتال و منابع مطالعاتی VIP برای شما کاملاً باز می‌باشد.
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigateTo("profile")}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow"
                  >
                    <AwardIcon className="w-3.5 h-3.5" />
                    <span>مشاهده و چاپ گواهی‌نامه</span>
                  </button>
                </div>
              </div>
            </Tilt3D>
          ) : (
            <Tilt3D scale={1.01}>
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/10 text-white rounded-3xl p-5 relative overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.45)] group h-full">
                <div className="absolute left-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
                
                <div className="relative space-y-4 text-right">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 shadow">
                      <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                      Premium
                    </span>
                    <div className="w-8 h-8 shrink-0">
                      <img 
                        src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png" 
                        alt="Crown 3D" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.2)] group-hover:scale-110 group-hover:rotate-12 transition-transform"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-indigo-200">
                      ارتقای پرونده به عضویت طلایی
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      ظرفیت جان‌های نامحدود (∞)، صدور گواهی‌نامه جراحی با مهر معتبر و دسترسی به آزمون‌های تشخیصی VIP.
                    </p>
                  </div>

                  <button
                    onClick={onTriggerPremium}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-98"
                  >
                    ارتقای آنی حساب کاربری
                  </button>
                </div>
              </div>
            </Tilt3D>
          )}

          {/* Quick Shortcuts */}
          <div className="flex gap-4">
            <button
              onClick={() => onNavigateTo("profile")}
              className="flex-1 bg-slate-900/40 border border-white/5 hover:bg-slate-900/60 text-slate-300 font-extrabold text-[10px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              پروفایل و آمار
            </button>
            <button
              onClick={() => onNavigateTo("settings")}
              className="flex-1 bg-slate-900/40 border border-white/5 hover:bg-slate-900/60 text-slate-300 font-extrabold text-[10px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
              تنظیمات عمومی
            </button>
          </div>

        </div>

      </div>

      {/* ----------------- DYNAMIC VISUAL KNOWLEDGE MAP GRAPH ----------------- */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900/20 border border-white/[0.04] backdrop-blur-md rounded-[32px] p-6"
      >
        <KnowledgeMap 
          userState={userState} 
          onSelectConcept={(cid) => {
            const conc = concepts.find(c => c.id === cid);
            if (conc) {
              onStartLesson(conc.chapterId, false);
            }
          }} 
        />
      </motion.div>

      {/* ----------------- DETAILED CONCEPT POPUP MODAL ----------------- */}
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
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
              dir="rtl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-slate-900 border border-white/10 rounded-[28px] max-w-md w-full p-6 md:p-8 space-y-5 relative overflow-hidden shadow-2xl"
              >
                {/* Visual Top Highlight Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="absolute left-6 top-6 text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-4">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 pt-2">
                    {isLearned ? (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        مبحث تسلط یافته
                      </span>
                    ) : isUnlocked ? (
                      <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        آماده شروع آموزش
                      </span>
                    ) : (
                      <span className="bg-slate-950 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        مفهوم قفل شده
                      </span>
                    )}

                    {selectedConcept.highStakes && (
                      <span className="bg-rose-500/10 text-rose-400 text-[9px] font-black px-2.5 py-1 rounded-lg border border-rose-500/20">
                        پیامد بالینی پرخطر
                      </span>
                    )}
                  </div>

                  {/* Concept Titles */}
                  <div className="space-y-0.5">
                    <h3 className="text-base font-black text-white leading-tight">
                      {selectedConcept.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      ارزیابی بالینی: <span className="text-slate-300">{selectedConcept.bloomLevel}</span>
                    </p>
                  </div>

                  {/* Educational Content Panel */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 relative">
                    <h4 className="text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">مرجع جراحی بالینی:</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {selectedConcept.definition}
                    </p>
                  </div>

                  {/* Prerequisites Requirements */}
                  {selectedConcept.prerequisites && selectedConcept.prerequisites.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider">پیش‌نیازهای اجباری:</h4>
                      <div className="space-y-1">
                        {selectedConcept.prerequisites.map((pid: string) => {
                          const pre = concepts.find(c => c.id === pid);
                          const completedPre = userState.completedConcepts.includes(pid);
                          return (
                            <div key={pid} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-white/[0.02] text-[10px]">
                              <span className="font-extrabold text-slate-300">{pre ? pre.title : pid}</span>
                              {completedPre ? (
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> کامل شده
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-slate-500 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> قفل است
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions Area */}
                  <div className="flex flex-col gap-2 pt-2">
                    {isUnlocked || isLearned ? (
                      <button
                        onClick={() => {
                          setSelectedConcept(null);
                          onStartLesson(chapter.id, false);
                        }}
                        className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                        <span>ورود به آزمون یادگیری بخش</span>
                      </button>
                    ) : (
                      <div className="text-center p-3 bg-slate-950 rounded-xl border border-white/5 text-[10px] text-slate-500 leading-relaxed font-sans">
                        ⚠️ برای باز کردن این مفهوم، ابتدا پیش‌نیازهای فوق را کامل کنید.
                      </div>
                    )}
                    
                    <button
                      onClick={() => setSelectedConcept(null)}
                      className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 font-extrabold text-xs py-2.5 rounded-xl transition-all border border-white/5"
                    >
                      بستن پنجره
                    </button>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
