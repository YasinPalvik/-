import React, { useState } from "react";
import { DEFAULT_STATE } from "../lib/state";
import { UserState } from "../types";
import { RefreshCw, Trash2, Crown, Sparkles, Check, ChevronLeft, CreditCard, Shield, Globe, Award, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Tilt3D from "./Tilt3D";

interface SettingsProps {
  userState: UserState;
  onUpdateState: (state: UserState) => void;
  onNavigateHome: () => void;
}

export default function Settings({ userState, onUpdateState, onNavigateHome }: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proUpgradedSimulated, setProUpgradedSimulated] = useState(false);

  // Handle fully resetting progress
  const handleResetProgress = () => {
    onUpdateState(DEFAULT_STATE);
    setShowResetConfirm(false);
    setProUpgradedSimulated(false);
  };

  const benefits = [
    "بیش از ۲۵۰ سناریوی کیس بالینی پیشرفته (Boss Levels)",
    "سیستم مانیتورینگ ECG تعاملی حین احیا و مانیتورینگ",
    "دسترسی کامل آفلاین بدون نیاز به اتصال مجدد",
    "تحلیل‌گر خطاهای بالینی انفرادی با هوش مصنوعی",
    "بدون هیچ‌گونه آگهی یا محدودیت در تعداد جان‌ها",
  ];

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/30 border border-white/[0.06] backdrop-blur-xl rounded-[32px] p-6 md:p-8 space-y-6 text-right shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative z-10" dir="rtl" id="settings-view">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-black text-white">تنظیمات کاربری و اپلیکیشن</h2>
          <p className="text-xs text-slate-400">پیکربندی اطلاعات، پیشرفت آموزشی و ارتقای حساب کاربری</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs text-indigo-400 font-extrabold hover:text-indigo-300 flex items-center gap-1.5 transition-all bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10"
        >
          <span>بازگشت به خانه</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Account Info Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-300">اطلاعات پرونده آموزشی</h3>
        <div className="bg-slate-950/40 border border-white/[0.04] p-4.5 rounded-2xl space-y-3 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>تاریخ شروع پرونده:</span>
            <span className="font-semibold text-slate-200">جولای ۲۰۲۶ (نسخه MVP)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>سیستم عامل همگام:</span>
            <span className="font-semibold text-slate-200 font-mono">localStorage</span>
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

      {/* Upgrade to Pro Trigger Card with 3D Tilt */}
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
              <span className="text-[10px] text-indigo-300">فراتر از یک جزوه خطی!</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">ارتقای پرونده به مدوفیل پرو (Premium)</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-[80%]">
                با ارتقا به پرو، به شبیه‌سازهای واقعی اتاق عمل، پالس‌اکسیمترهای تعاملی و مانیتورینگ صوتی دسترسی پیدا کنید.
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

      {/* Reset progress area */}
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

      {/* Pro Plan Modal (simulated placeholder) */}
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
              {/* Modal Cover Image */}
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
                <h3 className="text-sm font-black">مدوفیل پرو (Medophil Pro)</h3>
                <p className="text-[11px] text-indigo-300">حرفه‌ای‌ترین پلتفرم تعاملی یادگیری جراحی بالینی</p>
              </div>

              {/* Benefits list */}
              <div className="p-5 space-y-4">
                <div className="space-y-2.5">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated payment button / status */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  {userState.isPremium || proUpgradedSimulated ? (
                    <div className="text-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-extrabold text-emerald-300">اشتراک مدوفیل پرو برای شما فعال شد! 🎉</p>
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
