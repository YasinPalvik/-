import React, { useState } from "react";
import { DEFAULT_STATE } from "../lib/state";
import { UserState } from "../types";
import { RefreshCw, Trash2, Crown, Sparkles, Check, ChevronLeft, CreditCard, Shield, Globe, Award, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-6 md:p-8 space-y-6 text-right shadow-xs relative z-10" dir="rtl" id="settings-view">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-black text-slate-800">تنظیمات کاربری و اپلیکیشن</h2>
          <p className="text-xs text-slate-500">پیکربندی اطلاعات، پیشرفت آموزشی و ارتقای حساب کاربری</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs text-blue-600 font-bold hover:underline"
        >
          بازگشت به خانه ←
        </button>
      </div>

      {/* Account Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800">اطلاعات پرونده آموزشی</h3>
        <div className="bg-white/40 border border-white/60 backdrop-blur-2xs p-4 rounded-2xl space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>تاریخ شروع پرونده:</span>
            <span className="font-semibold text-slate-800">جولای ۲۰۲۶ (نسخه MVP)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>سیستم عامل همگام:</span>
            <span className="font-semibold text-slate-800">محیط محلی مرورگر (localStorage)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>نوع مجوز دسترسی:</span>
            {proUpgradedSimulated ? (
              <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse font-mono text-[10px]">
                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                پرونده طلایی پرو (Pro Account)
              </span>
            ) : (
              <span className="text-blue-600 font-bold bg-blue-50/50 border border-blue-100/30 px-2 py-0.5 rounded-full">پرونده پایه رایگان</span>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade to Pro Trigger Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-[28px] p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Crown className="w-2.5 h-2.5 fill-slate-950" />
              Upgrade to PRO
            </span>
            <span className="text-[10px] text-indigo-200">فراتر از یک جزوه خطی!</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold">ارتقای پرونده به مدوفیل پرو (Premium)</h3>
            <p className="text-xs text-indigo-100 leading-relaxed">
              با ارتقا به پرو، به شبیه‌سازهای واقعی اتاق عمل، پالس‌اکسیمترهای تعاملی و مانیتورینگ صوتی دسترسی پیدا کنید.
            </p>
          </div>

          <button
            onClick={() => setShowProModal(true)}
            className="w-full bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-xs"
          >
            {proUpgradedSimulated ? "مشاهده وضعیت اشتراک پرو طلایی" : "مشاهده جزییات پلن اشتراک پرو"}
          </button>
        </div>
      </div>

      {/* Reset progress area */}
      <div className="space-y-4 pt-4 border-t border-slate-200/50">
        <h3 className="text-sm font-extrabold text-rose-800">بخش امنیتی پرونده بالینی</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          اگر تمایل دارید مجدداً تمام دروس، سناریوها، کانون‌های خطا و پیشرفت مباحث ۹ گانه را از صفر شروع کنید، پرونده را ریست نمایید. اطلاعات به هیچ‌عنوان قابل بازیابی نخواهد بود.
        </p>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 font-extrabold text-xs py-2.5 px-4 rounded-xl border border-rose-200/50 transition-colors flex items-center justify-center gap-2"
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
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-xl max-w-md w-full border border-slate-200/60 overflow-hidden text-right"
              dir="rtl"
            >
              {/* Modal Cover Image */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-950 text-white p-6 relative overflow-hidden text-center space-y-2">
                <Crown className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto animate-pulse" />
                <h3 className="text-lg font-black">مدوفیل پرو (Medophil Pro)</h3>
                <p className="text-xs text-indigo-200">حرفه‌ای‌ترین پلتفرم تعاملی یادگیری جراحی بالینی</p>
              </div>

              {/* Benefits list */}
              <div className="p-5 space-y-4">
                <div className="space-y-2.5">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated payment button / status */}
                <div className="pt-4 border-t border-slate-200/60 space-y-3">
                  {proUpgradedSimulated ? (
                    <div className="text-center bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-extrabold text-emerald-800">اشتراک مدوفیل پرو برای شما فعال شد! 🎉</p>
                      <p className="text-[10px] text-slate-500 font-medium">تمام قابلیت‌های پیشرفته هم‌اکنون به عنوان شبیه‌سازی MVP در دسترس شماست.</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center font-mono">
                        <span className="text-slate-400 text-xs line-through block">۱۸۰,۰۰۰ تومان</span>
                        <span className="text-slate-800 text-lg font-black">۴۹,۰۰۰ تومان / ماهانه</span>
                        <span className="text-[10px] text-blue-600 font-bold block bg-blue-50 px-2 py-0.5 rounded-full w-max mx-auto mt-1">تخفیف ویژه دوره دانشجویی</span>
                      </div>

                      <button
                        onClick={() => {
                          setProUpgradedSimulated(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        ارتقای آنی حساب به پرو (شبیه‌ساز پرداخت)
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowProModal(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-colors"
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
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-xl max-w-sm w-full p-6 border border-slate-200/60 space-y-5"
            >
              <div className="w-12 h-12 bg-rose-50/50 border border-rose-100/50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5 animate-bounce" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-base font-black text-rose-800">آیا پرونده به طور کامل پاک شود؟</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  با این عمل تمام امتیازهای کسب شده، درصد پیشرفت مباحث ۹ گانه، سطح تسلط و کانون‌های خطای پایش شده شما حذف خواهد شد.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetProgress}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  بله، پرونده کامل ریست شود
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors"
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
