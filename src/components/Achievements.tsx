import React, { useState } from "react";
import { UserState } from "../types";
import { chapters, concepts } from "../lib/state";
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Brain, 
  Activity, 
  Award, 
  TrendingUp,
  CheckCircle2,
  Lock,
  ChevronLeft,
  Calendar,
  Zap,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AchievementsProps {
  userState: UserState;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  badgeGlow: string;
  conditionText: string;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  xpBonus: number;
}

export default function Achievements({ userState }: AchievementsProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Compute stats for conditions
  const totalXP = userState.xp;
  const streak = userState.diagnosisStreak; // Consecutive case studies correct
  const conceptsCount = userState.completedConcepts.length;
  const chaptersCount = userState.unlockedChapters.length;
  const dailyStreak = userState.dailyStreak;

  // Define Badge list
  const badgesData = [
    {
      id: "fast_responder",
      title: "پاسخ‌دهنده چابک (Fast Responder)",
      description: "نشان‌دهنده سرعت بالا و شروع قوی در درک عمیق اولین مفاهیم پیچیده جراحی.",
      icon: Zap,
      colorClass: "text-amber-500 fill-amber-500",
      bgLightClass: "bg-amber-50 border-amber-100/40",
      borderClass: "border-amber-200/50",
      badgeGlow: "shadow-amber-500/10 hover:shadow-amber-500/20",
      conditionText: "درک و ثبت حداقل ۱ مفهوم جراحی در کارنامه",
      currentValue: conceptsCount,
      targetValue: 1,
      isUnlocked: conceptsCount >= 1,
      xpBonus: 50,
    },
    {
      id: "clinical_streak_king",
      title: "پادشاه تداوم بالینی (Clinical Streak King)",
      description: "تشخیص‌های صحیح متوالی بدون حتی یک خطای هدایت‌نشده یا عوارض مرگبار در کیس‌ها.",
      icon: Flame,
      colorClass: "text-orange-600 fill-orange-600",
      bgLightClass: "bg-orange-50 border-orange-100/40",
      borderClass: "border-orange-200/50",
      badgeGlow: "shadow-orange-500/10 hover:shadow-orange-500/20",
      conditionText: "رسیدن به تسلسل حداقل ۳ تشخیص صحیح متوالی",
      currentValue: streak,
      targetValue: 3,
      isUnlocked: streak >= 3,
      xpBonus: 100,
    },
    {
      id: "clinical_expert",
      title: "متخصص کارآزموده بالینی (Clinical Expert)",
      description: "تخصص جامع در قضاوت‌های پزشکی همراه با ثبت نمرات و بازخوردهای بی‌نقص.",
      icon: Award,
      colorClass: "text-blue-600 fill-blue-600",
      bgLightClass: "bg-blue-50 border-blue-100/40",
      borderClass: "border-blue-200/50",
      badgeGlow: "shadow-blue-500/10 hover:shadow-blue-500/20",
      conditionText: "کسب حداقل ۱۵۰ امتیاز تجربه کل (XP)",
      currentValue: totalXP,
      targetValue: 150,
      isUnlocked: totalXP >= 150,
      xpBonus: 150,
    },
    {
      id: "surgical_veteran",
      title: "جراح خستگی‌ناپذیر (Surgical Veteran)",
      description: "باز کردن گام‌به‌گام و تسلط بر بخش‌های وسیع‌تر کتاب و مباحث بحرانی اتاق عمل.",
      icon: ShieldCheck,
      colorClass: "text-emerald-600 fill-emerald-600",
      bgLightClass: "bg-emerald-50 border-emerald-100/40",
      borderClass: "border-emerald-200/50",
      badgeGlow: "shadow-emerald-500/10 hover:shadow-emerald-500/20",
      conditionText: "باز کردن قفل حداقل ۳ فصل مختلف از جراحی",
      currentValue: chaptersCount,
      targetValue: 3,
      isUnlocked: chaptersCount >= 3,
      xpBonus: 200,
    },
    {
      id: "resilient_healer",
      title: "مقاومت احیاگر (Resilient Healer)",
      description: "مداومت بی‌وقفه در تمرینات سخت و پوشش نقاط ضعف بالینی جهت ارتقای ایمنی بیمار.",
      icon: Brain,
      colorClass: "text-purple-600 fill-purple-600",
      bgLightClass: "bg-purple-50 border-purple-100/40",
      borderClass: "border-purple-200/50",
      badgeGlow: "shadow-purple-500/10 hover:shadow-purple-500/20",
      conditionText: "درک عمیق و تسلط بر حداقل ۵ مفهوم بالینی جراحی",
      currentValue: conceptsCount,
      targetValue: 5,
      isUnlocked: conceptsCount >= 5,
      xpBonus: 250,
    },
    {
      id: "golden_brain",
      title: "مغز طلایی پزشکی (Golden Brain)",
      description: "بالاترین سطح تسلط و تمرکز تشخیصی که شایسته جراحان ارشد تراز اول کشور است.",
      icon: Trophy,
      colorClass: "text-amber-500 fill-amber-500",
      bgLightClass: "bg-amber-100/40 border-amber-200/40",
      borderClass: "border-amber-300/50",
      badgeGlow: "shadow-yellow-500/15 hover:shadow-yellow-500/25 animate-pulse",
      conditionText: "کسب حداقل ۳۰۰ امتیاز تجربه کل (XP)",
      currentValue: totalXP,
      targetValue: 300,
      isUnlocked: totalXP >= 300,
      xpBonus: 500,
    }
  ];

  const unlockedCount = badgesData.filter(b => b.isUnlocked).length;
  const totalBadges = badgesData.length;
  const unlockedPercent = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-6 space-y-6 shadow-xs relative overflow-hidden text-right" id="achievements-section" dir="rtl">
      
      {/* Decorative Orbs */}
      <div className="absolute left-0 top-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
      <div className="absolute right-10 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">نشان‌ها و دستاوردهای بالینی</h3>
            <p className="text-xs text-slate-500">کارنامه افتخارات و مدال‌های کسب شده بر اساس ارزیابی‌های پیشرفته جراحی</p>
          </div>
        </div>

        {/* Mini progress tracker */}
        <div className="flex items-center gap-3 bg-white/50 border border-white p-3 rounded-2xl shrink-0 shadow-2xs">
          <div className="text-left font-mono text-xs">
            <div className="font-extrabold text-slate-700">{unlockedCount} از {totalBadges} نشان</div>
            <div className="text-purple-600 font-bold">{unlockedPercent}% تکمیل شده</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-purple-500 flex items-center justify-center text-[10px] font-black text-purple-700 font-mono" style={{ transform: 'rotate(-45deg)' }}>
            <span style={{ transform: 'rotate(45deg)' }}>{unlockedPercent}%</span>
          </div>
        </div>
      </div>

      {/* Badges Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {badgesData.map((badge) => {
          const IconComponent = badge.icon;
          const progress = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden select-none hover:scale-[1.02] active:scale-[0.98] ${
                badge.isUnlocked
                  ? `bg-white/85 shadow-xs border-slate-200/50 ${badge.badgeGlow}`
                  : "bg-slate-50/40 border-slate-200/30 opacity-70"
              }`}
            >
              {/* Unlock badge glow accent */}
              {badge.isUnlocked && (
                <div className="absolute -left-4 -top-4 w-12 h-12 bg-purple-500/5 rounded-full blur-md"></div>
              )}

              <div className="flex items-start gap-3">
                
                {/* Badge Icon wrapper */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative ${
                  badge.isUnlocked 
                    ? badge.bgLightClass + " border " + badge.borderClass
                    : "bg-slate-200/50 text-slate-400 border border-slate-300/20"
                }`}>
                  {badge.isUnlocked ? (
                    <IconComponent className={`w-6 h-6 ${badge.colorClass}`} />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}

                  {/* Tiny check indicator for unlocked badges */}
                  {badge.isUnlocked && (
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white text-white">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Badge details */}
                <div className="min-w-0 flex-1 space-y-1 text-right">
                  <h4 className={`text-xs font-extrabold truncate ${badge.isUnlocked ? "text-slate-800" : "text-slate-500"}`}>
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {badge.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>{badge.isUnlocked ? "آزاد شده" : `${badge.currentValue} / ${badge.targetValue}`}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          badge.isUnlocked ? "bg-purple-500" : "bg-slate-300"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Badge Info Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-xl max-w-sm w-full border border-slate-200/60 overflow-hidden text-right"
              dir="rtl"
            >
              {/* Header section of modal */}
              <div className="p-6 text-center space-y-4 relative border-b border-slate-100">
                <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center relative ${
                  selectedBadge.isUnlocked 
                    ? selectedBadge.bgLightClass + " border " + selectedBadge.borderClass
                    : "bg-slate-200/60 text-slate-400 border border-slate-300/20"
                }`}>
                  {selectedBadge.isUnlocked ? (
                    <selectedBadge.icon className={`w-9 h-9 ${selectedBadge.colorClass}`} />
                  ) : (
                    <Lock className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedBadge.isUnlocked 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {selectedBadge.isUnlocked ? "مدال کسب شده" : "نشان بالینی قفل شده"}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 pt-1">{selectedBadge.title}</h3>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">درباره نشان:</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                    {selectedBadge.description}
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>شرط فعال‌سازی:</span>
                    <span className="font-semibold text-slate-800">{selectedBadge.conditionText}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 pt-1.5 border-t border-slate-100">
                    <span>وضعیت فعلی شما:</span>
                    <span className="font-extrabold text-slate-800 font-mono">
                      {selectedBadge.currentValue} از {selectedBadge.targetValue} ({Math.min(100, Math.round((selectedBadge.currentValue / selectedBadge.targetValue) * 100))}% پیشرفت)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 pt-1.5 border-t border-slate-100">
                    <span>جایزه فعال‌سازی:</span>
                    <span className="font-bold text-purple-600 font-mono">
                      +{selectedBadge.xpBonus} XP تجربه جایزه
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-xs"
                >
                  بستن پیش‌نمایش
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
