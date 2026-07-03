import React, { useState } from "react";
import { UserState } from "../types";
import { concepts, chapters } from "../lib/state";
import ProgressAnalytics from "./ProgressAnalytics";
import Achievements from "./Achievements";
import { Award, Zap, Flame, CheckCircle, ShieldAlert, Sparkles, BookOpen, AlertCircle, RefreshCw, X, HelpCircle, Heart, Crown } from "lucide-react";
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
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-black text-slate-800">پروفایل کاربری و آمار بالینی من</h2>
          <p className="text-xs text-slate-500">کارنامه پیشرفت و تسلط بر مباحث جراحی بالینی</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs text-blue-600 font-bold hover:underline"
        >
          بازگشت به خانه ←
        </button>
      </div>

      {/* Account Info and Premium Badge Actions */}
      <div className="bg-white/80 backdrop-blur-xl border border-white p-5 md:p-6 rounded-[28px] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-sm">
              <span className="text-xl">{userState.fullName ? userState.fullName.substring(0, 1) : "د"}</span>
            </div>
            
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800">
                  دکتر {userState.fullName || "کاربر مهمان مدوفیل"}
                </h3>
                {userState.isPremium ? (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" />
                    طلایی VIP
                  </span>
                ) : (
                  <span className="bg-slate-100 border text-slate-500 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                    نسخه رایگان (مهمان)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {userState.email ? `آدرس ایمیل: ${userState.email}` : "شما با حساب مهمان وارد شده‌اید. برای همگام‌سازی ابدی، یک حساب کاربری بسازید."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {userState.isPremium ? (
              <button
                id="profile-cert-trigger"
                onClick={onTriggerCertificate}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>مشاهده و چاپ گواهی‌نامه جراحی</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onTriggerPremium}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950/20" />
                  <span>ارتقای طلایی و فعال‌سازی گواهی‌نامه</span>
                </button>
                
                {!userState.email && (
                  <button
                    onClick={() => {
                      // Trigger login portal
                      const authBtn = document.querySelector('[onClick*="setShowAuth"]') as HTMLElement;
                      if (authBtn) authBtn.click();
                    }}
                    className="bg-white border hover:bg-slate-50 text-slate-700 font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all"
                  >
                    ساخت حساب کاربری
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">روزهای متوالی مطالعه</span>
            <span className="text-xl font-black text-orange-600 font-mono">{userState.dailyStreak} روز</span>
          </div>
          <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          </div>
        </div>

        {/* total XP */}
        <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">امتیاز کل (XP)</span>
            <span className="text-xl font-black text-blue-600 font-mono">{userState.xp} XP</span>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
          </div>
        </div>

        {/* diagnosis streak */}
        <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">تسلسل تشخیص‌های صحیح</span>
            <span className="text-xl font-black text-emerald-600 font-mono">{userState.diagnosisStreak} مورد</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Award className="w-5 h-5 text-emerald-500 fill-emerald-500" />
          </div>
        </div>

        {/* total mastery percent */}
        <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">درصد یادگیری کل کتاب</span>
            <span className="text-xl font-black text-blue-600 font-mono">{masteryPercentage}%</span>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-50" />
          </div>
        </div>
      </div>

      {/* Progress Analytics Recharts component */}
      <ProgressAnalytics userState={userState} />

      {/* Achievements and Clinical Badges */}
      <Achievements userState={userState} />

      {/* Progress Chart & Weak concepts splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Unit Completion Breakdown */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-800">پیشرفت تفکیکی مباحث ۹ گانه</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            میزان تسلط شما بر اساس مفاهیم پاسخ داده شده به تفکیک هر یک از فصول جزوه مبانی جراحی:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapters.map((chapter, idx) => {
              const progress = userState.chapterProgress[chapter.id] || 0;
              const unlocked = userState.unlockedChapters.includes(chapter.id) || idx === 0;

              return (
                <div key={chapter.id} className="p-3 border border-white/60 rounded-xl space-y-2 bg-white/40 backdrop-blur-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-extrabold ${unlocked ? "text-slate-800" : "text-slate-400"}`}>
                      {idx + 1}. {chapter.title}
                    </span>
                    <span className="font-bold text-blue-600 font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Concepts / Error Audit Panel */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-6 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                آنالیز مفاهیم آسیب‌پذیر من
              </h3>
              <p className="text-xs text-slate-500">مفاهیمی که بیشترین پاسخ غلط را در آن‌ها ثبت کردید</p>
            </div>
          </div>

          {weakConceptList.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {weakConceptList.map(({ concept, errorCount }) => {
                  if (!concept) return null;
                  return (
                    <button
                      onClick={() => setActiveWeakConceptId(concept.id)}
                      key={concept.id}
                      className="w-full text-right p-3 bg-rose-50/20 hover:bg-rose-50/40 rounded-xl border border-rose-100/50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">{concept.title}</span>
                        <span className="text-[10px] text-rose-600 font-medium">میزان خطاها: {errorCount} بار</span>
                      </div>
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
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
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  شروع جلسه مرور خطاها (Spaced Review)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-emerald-800">بدون نقاط ضعف بارز!</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  شما تا به حال هیچ خطای بالینی یا اشتباه مستمری ثبت نکرده‌اید! پرونده شما کاملاً سفید است.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Spaced Repetition explanation footer */}
      <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-[24px] p-5 flex items-start gap-4">
        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-800">قانون فراموشی ابینگهاوس در یادگیری جراحی</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            یادگیری پزشکی بالینی نیاز به تکرار مجدد دارد. با گذر زمان، مفاهیمی که آموخته‌اید به تدریج بر اساس الگوریتم هوشمند مرور فاصله‌دار در داشبورد شما برای یادآوری دوباره فعال می‌شوند تا مانع فراموشی جزییات ارزشمند (مانند غلظت کلسیم گلوکونات یا دوز لیدوکائین) شویم.
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
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-xl border border-slate-200/60 max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  بررسی مجدد کانون خطا
                </span>
                <button
                  onClick={() => setActiveWeakConceptId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <h3 className="text-base font-black text-slate-800">{selectedWeakConcept.title}</h3>
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedWeakConcept.definition}
                </div>

                <div className="text-[11px] text-slate-400">
                  💡 هر زمان در جلسات مرور بالینی به سوال این مفهوم پاسخ صحیح بدهید، میزان ضعف شما کاهش یافته و نهایتاً از لیست کانون‌های خطا پاک خواهد شد.
                </div>

                <button
                  onClick={() => {
                    setActiveWeakConceptId(null);
                    onTriggerReview();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition-colors"
                >
                  انتقال فوری به شبیه‌ساز مرور جهت جبران
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
