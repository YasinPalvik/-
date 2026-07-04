import React, { useState } from "react";
import { UserState } from "../types";
import { concepts, chapters } from "../lib/state";
import ProgressAnalytics from "./ProgressAnalytics";
import Achievements from "./Achievements";
import { Award, Zap, Flame, CheckCircle, ShieldAlert, Sparkles, BookOpen, AlertCircle, RefreshCw, X, HelpCircle, Heart, Crown, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileProps {
  userState: UserState;
  onNavigateHome: () => void;
  onTriggerReview: () => void;
  onTriggerCertificate: () => void;
  onTriggerPremium: () => void;
}

export default function Profile({ userState, onNavigateHome, onTriggerReview, onTriggerCertificate, onTriggerPremium }: ProfileProps) {
  const [activeWeakConceptId, setActiveWeakConceptId] = useState<string | null>(null);

  // List of weak concepts based on errors
  const weakConceptList = Object.entries(userState.weakConcepts)
    .map(([id, errorCount]) => {
      const conc = concepts.find(c => c.id === id);
      return {
        concept: conc,
        errorCount,
      };
    })
    .filter(item => item.concept !== undefined)
    .sort((a, b) => b.errorCount - a.errorCount); // Sort by highest errors

  const completedConceptsCount = userState.completedConcepts.length;
  const totalConceptsCount = concepts.length;
  const masteryPercentage = totalConceptsCount > 0 ? Math.round((completedConceptsCount / totalConceptsCount) * 100) : 0;

  const selectedWeakConcept = concepts.find(c => c.id === activeWeakConceptId);

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* Page Title */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-black text-white">کارنامه بالینی و پرونده پزشک</h2>
          <p className="text-xs text-slate-400">گزارش جامع پیشرفت جراحی، گواهی‌نامه‌ها و تحلیل نقاط آسیب‌پذیر</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs text-indigo-400 font-extrabold hover:text-indigo-300 flex items-center gap-1.5 transition-all bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10"
        >
          <span>بازگشت به خانه</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Account Info and Premium Badge Actions */}
      <div className="bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-6 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <span className="text-xl">{userState.fullName ? userState.fullName.substring(0, 1) : "د"}</span>
            </div>
            
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-black text-slate-100">
                  دکتر {userState.fullName || "کارآموز مهمان خرچهیار"}
                </h3>
                {userState.isPremium ? (
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" />
                    طلایی VIP
                  </span>
                ) : (
                  <span className="bg-slate-800 border border-white/5 text-slate-400 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                    نسخه رایگان (مهمان)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono" dir="ltr">
                {userState.email ? userState.email : "guest_surgeon@kharchehyar.ir"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {userState.isPremium ? (
              <button
                id="profile-cert-trigger"
                onClick={onTriggerCertificate}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs py-2.5 px-5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
              >
                <Award className="w-4 h-4 fill-slate-950/20" />
                <span>مشاهده و چاپ گواهی‌نامه جراحی</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onTriggerPremium}
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs py-2.5 px-5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950/20 animate-pulse" />
                  <span>ارتقای طلایی و فعال‌سازی گواهی‌نامه</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-slate-900/20 backdrop-blur-md p-4 rounded-2xl border border-white/[0.04] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">روزهای متوالی مطالعه</span>
            <span className="text-lg font-black text-orange-400 font-mono">{userState.dailyStreak} روز</span>
          </div>
          <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
            <Flame className="w-4.5 h-4.5 text-orange-400 fill-orange-400" />
          </div>
        </div>

        {/* total XP */}
        <div className="bg-slate-900/20 backdrop-blur-md p-4 rounded-2xl border border-white/[0.04] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">امتیاز کل (XP)</span>
            <span className="text-lg font-black text-blue-400 font-mono">{userState.xp} XP</span>
          </div>
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Zap className="w-4.5 h-4.5 text-blue-400 fill-blue-400" />
          </div>
        </div>

        {/* diagnosis streak */}
        <div className="bg-slate-900/20 backdrop-blur-md p-4 rounded-2xl border border-white/[0.04] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">تسلسل تشخیص‌ها</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{userState.diagnosisStreak} کیس</span>
          </div>
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Award className="w-4.5 h-4.5 text-emerald-400 fill-emerald-500/15" />
          </div>
        </div>

        {/* total mastery percent */}
        <div className="bg-slate-900/20 backdrop-blur-md p-4 rounded-2xl border border-white/[0.04] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">درصد تسلط کتاب جراحی</span>
            <span className="text-lg font-black text-indigo-400 font-mono">{masteryPercentage}%</span>
          </div>
          <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <CheckCircle className="w-4.5 h-4.5 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Progress Analytics Chart */}
      <div className="bg-slate-900/20 border border-white/[0.04] backdrop-blur-md p-6 rounded-[32px]">
        <ProgressAnalytics userState={userState} />
      </div>

      {/* Achievements and Clinical Badges */}
      <div className="bg-slate-900/20 border border-white/[0.04] backdrop-blur-md p-6 rounded-[32px]">
        <Achievements userState={userState} />
      </div>

      {/* Progress Chart & Weak concepts splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Unit Completion Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-6 rounded-[32px] space-y-4">
          <h3 className="text-xs font-black text-slate-200">پیشرفت تفکیکی مباحث ۹ گانه جراحی</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            میزان تسلط شما بر اساس مفاهیم پاسخ داده شده به تفکیک هر یک از فصول جزوه مبانی جراحی بالینی:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {chapters.map((chapter, idx) => {
              const progress = userState.chapterProgress[chapter.id] || 0;
              const unlocked = userState.unlockedChapters.includes(chapter.id) || idx === 0;

              return (
                <div key={chapter.id} className="p-3.5 border border-white/[0.04] rounded-xl space-y-2 bg-slate-950/40 backdrop-blur-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-extrabold ${unlocked ? "text-slate-200" : "text-slate-500"}`}>
                      {idx + 1}. {chapter.title}
                    </span>
                    <span className="font-bold text-indigo-400 font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Concepts / Error Audit Panel */}
        <div className="bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl p-6 rounded-[32px] space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                آنالیز مفاهیم آسیب‌پذیر (خطاهای مکرر)
              </h3>
              <p className="text-[10px] text-slate-400">مفاهیمی که بیشترین پاسخ اشتباه را در آن‌ها ثبت کرده‌اید</p>
            </div>
          </div>

          {weakConceptList.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {weakConceptList.map(({ concept, errorCount }) => {
                  if (!concept) return null;
                  return (
                    <button
                      onClick={() => setActiveWeakConceptId(concept.id)}
                      key={concept.id}
                      className="w-full text-right p-3 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 truncate block group-hover:text-white">{concept.title}</span>
                        <span className="text-[9px] text-rose-400 font-mono">تعداد خطاها: {errorCount} مرتبه</span>
                      </div>
                      <span className="text-[9px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-lg border border-rose-500/20 shrink-0">
                        مرور سریع
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Review Weak Concepts CTA */}
              <div className="pt-2">
                <button
                  onClick={onTriggerReview}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 py-2.5 px-4 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-98"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
                  شروع جلسه مرور خطاها (Spaced Review)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-emerald-300">پزشک با پرونده سفید!</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  شما تا به حال هیچ خطای بالینی یا اشتباه مستمری ثبت نکرده‌اید! پرونده شما فاقد نقاط ضعف جدی است.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Spaced Repetition explanation footer */}
      <div className="bg-slate-900/10 border border-white/[0.04] backdrop-blur-md rounded-[24px] p-5 flex items-start gap-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2 rounded-xl shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-right">
          <h4 className="text-xs font-black text-indigo-300">قانون فراموشی ابینگهاوس در یادگیری جراحی</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            یادگیری جراحی بالینی تکرار مداوم می‌طلبد. بر اساس منحنی فراموشی ابینگهاوس، مفاهیمی که در آن‌ها دچار لغزش شده‌اید به مرور زمان در قالب شبیه‌ساز SuperMemo-2 در داشبورد فعال می‌شوند تا با بازخوانی بهینه مانع از یادرفتگی جزئیات ارزشمند پزشکی شویم.
          </p>
        </div>
      </div>

      {/* Modal Overlay for quick concept review */}
      <AnimatePresence>
        {selectedWeakConcept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 rounded-[28px] shadow-2xl border border-white/10 max-w-md w-full overflow-hidden"
            >
              <div className="p-4.5 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  بررسی مجدد کانون خطا
                </span>
                <button
                  onClick={() => setActiveWeakConceptId(null)}
                  className="text-slate-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-sm font-black text-white">{selectedWeakConcept.title}</h3>
                <div className="bg-slate-950 p-4 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedWeakConcept.definition}
                </div>

                <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  💡 پاسخ صحیح به این مفهوم در جلسات شبیه‌ساز یا آزمون‌ها فوراً نرخ خطای آن را کاهش داده و سرانجام پرونده شما را از این نقطه ضعف پاکسازی خواهد کرد.
                </div>

                <button
                  onClick={() => {
                    setActiveWeakConceptId(null);
                    onTriggerReview();
                  }}
                  className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 px-4 rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>شروع فوری شبیه‌ساز مرور جهت جبران</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
