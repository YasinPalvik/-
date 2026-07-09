import React, { useState, useEffect } from "react";
import { UserState } from "../types";
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  Receipt, 
  AlertCircle,
  Award,
  X,
  Copy,
  ExternalLink,
  Send,
  Check,
  Lock,
  Unlock,
  Settings,
  Users,
  Key,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generatePremiumPassword, generateActivationCode } from "../lib/premium_verifier";

interface PremiumPortalProps {
  userState: UserState;
  onUpdateState: (newState: UserState) => void;
  onClose: () => void;
  idToken: string | null;
  initialStep?: "landing" | "checkout" | "receipt" | "admin";
  paymentRefId?: string | null;
}

interface StoredAccount {
  email: string;
  fullName: string;
  passwordHash: string;
  state: UserState;
}

const STORAGE_ACCOUNTS_KEY = "medophil_registered_accounts";

export default function PremiumPortal({ 
  userState, 
  onUpdateState, 
  onClose,
  idToken,
  initialStep = "landing",
  paymentRefId = null
}: PremiumPortalProps) {
  const [step, setStep] = useState<"landing" | "checkout" | "receipt" | "admin">(initialStep);
  
  // Zarinpal Payment State
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  
  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");
  const [showPasswordGateway, setShowPasswordGateway] = useState(false);
  
  // Admin Tooling State
  const [genUsername, setGenUsername] = useState("");
  const [generatedPremiumPassword, setGeneratedPremiumPassword] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [localAccounts, setLocalAccounts] = useState<StoredAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminCopied, setAdminCopied] = useState("");

  const AMOUNT_TOMAN = "۴۹,۰۰۰";
  const TELEGRAM_ID = "Yasin_Bagherzadeh";

  // Load registered accounts in admin view for direct toggles
  const refreshLocalAccounts = () => {
    try {
      const data = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (data) {
        setLocalAccounts(JSON.parse(data));
      } else {
        setLocalAccounts([]);
      }
    } catch {
      setLocalAccounts([]);
    }
  };

  useEffect(() => {
    if (step === "admin") {
      refreshLocalAccounts();
    }
  }, [step]);

  const handleInitiateZarinpal = async () => {
    setPaymentError("");
    
    if (!idToken) {
      setPaymentError("ابتدا باید از منوی بالای صفحه وارد حساب کاربری خود شوید تا خرید به نام شما ثبت شود.");
      return;
    }

    setLoadingPayment(true);
    try {
      const response = await fetch("/api/zarinpal/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "خطا در ایجاد تراکنش پرداخت");
      }

      const data = await response.json();
      if (data.url) {
        // Redirect browser to Zarinpal secure payment URL or mock gateway
        window.location.href = data.url;
      } else {
        throw new Error("آدرس درگاه پرداخت یافت نشد.");
      }
    } catch (err: any) {
      console.error("Zarinpal trigger error:", err);
      setPaymentError(err.message || "برقراری ارتباط با درگاه پرداخت با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");
    if (adminPasswordInput === "Yasin_Admin_2026" || adminPasswordInput === "yasin_admin") {
      setIsAdminMode(true);
      setStep("admin");
      setShowPasswordGateway(false);
      setAdminPasswordInput("");
    } else {
      setAdminAuthError("رمز عبور مدیریت نادرست است.");
    }
  };

  // Admin Account Generator
  const handleGeneratePremiumAccount = () => {
    if (!genUsername.trim()) return;
    const pwd = generatePremiumPassword(genUsername);
    setGeneratedPremiumPassword(pwd);
  };

  // Admin Code Generator
  const handleGenerateCode = () => {
    if (!genEmail.trim()) return;
    const code = generateActivationCode(genEmail);
    setGeneratedCode(code);
  };

  // Force toggle premium for local account on this browser
  const handleToggleLocalPremium = (email: string) => {
    try {
      const data = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (data) {
        const accounts: StoredAccount[] = JSON.parse(data);
        const index = accounts.findIndex(acc => acc.email.toLowerCase() === email.toLowerCase());
        if (index !== -1) {
          const updatedPrem = !accounts[index].state.isPremium;
          accounts[index].state.isPremium = updatedPrem;
          if (updatedPrem) {
            accounts[index].state.planType = "lifetime";
            accounts[index].state.hearts = 5;
            accounts[index].state.subscriptionDate = new Date().toISOString().split("T")[0];
          }
          localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
          
          // If current logged-in user matches, update their state live
          if (userState.email?.toLowerCase() === email.toLowerCase()) {
            onUpdateState({
              ...userState,
              isPremium: updatedPrem,
              planType: updatedPrem ? "lifetime" : undefined,
              hearts: 5,
            });
          }
          
          refreshLocalAccounts();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setAdminCopied(label);
    setTimeout(() => setAdminCopied(""), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 text-right" dir="rtl" id="premium-portal">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] border-2 border-b-8 border-slate-300 shadow-2xl w-full max-w-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          
          {/* STEP 1: LANDING */}
          {step === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 md:p-8 space-y-6"
            >
              {/* Top Banner */}
              <div className="text-center space-y-3 pt-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-400 text-white rounded-3xl shadow-lg shadow-amber-500/20 animate-bounce">
                  <Crown className="w-7 h-7 fill-white/10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-1.5">
                    ارتقا به <span className="bg-gradient-to-l from-amber-600 to-yellow-500 bg-clip-text text-transparent">سگ نزن طلایی (Premium)</span>
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    با خرید اشتراک پرمیوم، تمام محدودیت‌های آموزشی را کنار بگذارید و به ابزارهای تحلیل تشخیصی فوق‌پیشرفته دسترسی پیدا کنید.
                  </p>
                </div>
              </div>

              {/* Benefits Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 bg-amber-50/40 border border-amber-100/60 rounded-2xl flex gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-right">
                    <h4 className="text-xs font-black text-slate-800">جان‌های بالینی بی‌نهایت (∞ Hearts)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      دیگر نگران اتمام جان نباشید! با تمرین بدون مرز، ریسک خطا را به صفر برسانید.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/40 border border-blue-100/60 rounded-2xl flex gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-right">
                    <h4 className="text-xs font-black text-slate-800">گواهی‌نامه جراحی دیجیتال طلایی</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      دریافت گواهینامه معتبر با خط نستعلیق، مهر اختصاصی و قابلیت پرینت و اشتراک‌گذاری.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-purple-50/40 border border-purple-100/60 rounded-2xl flex gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-right">
                    <h4 className="text-xs font-black text-slate-800">مباحث جراحی VIP و کیس‌های اختصاصی</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      باز کردن سریع تمام سناریوهای پایش علائم حیاتی و تشخیص تفاضلی پیچیده.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl flex gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-right">
                    <h4 className="text-xs font-black text-slate-800">بدون تبلیغات + پشتیبانی VIP</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      محیط کاملاً علمی، بدون هیچ مزاحمتی و اولویت بالا در پاسخگویی به تحلیل کارنامه‌ها.
                    </p>
                  </div>
                </div>

              </div>

              {/* Offer Details Box */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-2 text-center">
                <span className="text-[10px] bg-red-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
                  پیشنهاد ویژه عضویت طلایی
                </span>
                <div className="space-y-0.5 pt-1">
                  <h4 className="text-sm font-black text-slate-800">اشتراک مادام‌العمر طلایی (VIP Lifetime)</h4>
                  <p className="text-xs text-slate-500">دسترسی همیشگی به تمام بخش‌های آموزشی و آپدیت‌های جراحی آینده</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">{AMOUNT_TOMAN}</span>
                  <span className="text-xs text-slate-600 font-black">تومان</span>
                  <span className="text-xs text-slate-400 line-through font-mono mr-2">۲۹۹,۰۰۰ تومان</span>
                </div>
              </div>

              {/* Footer Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block">مبلغ قابل پرداخت نهایی:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-amber-600 font-mono">{AMOUNT_TOMAN}</span>
                    <span className="text-[10px] text-slate-500 font-bold">تومان</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("checkout")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs py-3.5 px-8 rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[4px] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>خرید و فعال‌سازی اکانت طلایی</span>
                </button>
              </div>

              {/* Admin subtle gateway */}
              <div className="pt-2 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setShowPasswordGateway(!showPasswordGateway)} 
                  className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 font-bold"
                >
                  <Lock className="w-3 h-3" />
                  <span>ورود به پنل مدیریت ویژه یاسین باقرزاده</span>
                </button>
              </div>

              {/* Admin Password Gate dialog */}
              <AnimatePresence>
                {showPasswordGateway && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <form onSubmit={handleAdminAuth} className="flex gap-2 items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] text-slate-500 font-extrabold block">رمز عبور مدیریت یاسین:</label>
                        <input
                          type="password"
                          dir="ltr"
                          placeholder="••••••••"
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl mt-4 shrink-0 transition-colors"
                      >
                        ورود به پنل
                      </button>
                    </form>
                    {adminAuthError && <p className="text-[10px] text-red-600 mt-1.5 font-bold">{adminAuthError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 2: ONLINE ZARINPAL CHECKOUT */}
          {step === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="p-6 md:p-8 space-y-6"
            >
              {/* Header with back navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-yellow-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">اتصال به درگاه بانکی زرین‌پال</h3>
                    <p className="text-[10px] text-slate-400">پرداخت امن و آنی با تمامی کارت‌های عضو شتاب</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep("landing")}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 bg-white border px-2.5 py-1.5 rounded-xl shadow-2xs transition-all"
                >
                  <span>بازگشت</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>

              {/* Checkout details card */}
              <div className="space-y-6 max-w-md mx-auto">
                <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden space-y-4">
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-slate-300">طرح عضویت طلایی مادام‌العمر</span>
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">حساب کاربری:</span>
                      <span className="font-bold text-slate-100">{userState.fullName || "پزشک میهمان"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ایمیل متصل:</span>
                      <span className="font-mono text-slate-300">{userState.email || "بدون ایمیل"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                      <span className="text-slate-400">مبلغ قابل پرداخت:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-amber-400 font-mono">{AMOUNT_TOMAN}</span>
                        <span className="text-[10px] text-slate-300 font-bold">تومان</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important notice */}
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-[10px] text-slate-600 leading-relaxed space-y-1.5">
                  <p className="font-black text-amber-800">💡 راهنمای تست درگاه پرداخت:</p>
                  <p>در حال حاضر درگاه پرداخت زرین‌پال کاملاً متصل است. در صورت اجرا در محیط آزمایشی (سندباکس)، برای راحتی کار شما یک شبیه‌ساز درگاه پرداخت با قابلیت رمز پویا تدارک دیده شده است تا فرآیند ارتقا، به‌روزرسانی دیتابیس و تراکنش‌ها را به‌طور کامل و بی‌نقص تست نمایید.</p>
                </div>

                {/* Submit button */}
                <div className="space-y-3">
                  <button
                    onClick={handleInitiateZarinpal}
                    disabled={loadingPayment}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {loadingPayment ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>پرداخت آنلاین با درگاه زرین‌پال</span>
                      </>
                    )}
                  </button>

                  {paymentError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-[10px] rounded-xl flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS RECEIPT */}
          {step === "receipt" && (
            <motion.div
              key="receipt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 md:p-8 space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">تراکنش با موفقیت انجام شد!</h3>
                <p className="text-xs text-emerald-600 font-bold">حساب کاربری شما با موفقیت به سگ نزن طلایی ارتقا یافت 🌟</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-right space-y-3 max-w-sm mx-auto font-sans text-xs">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-200/50 pb-2">
                  <span className="flex items-center gap-1 font-bold">
                    <Receipt className="w-3.5 h-3.5" />
                    جزئیات عضویت طلایی
                  </span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                    {paymentRefId ? `کد رهگیری: ${paymentRefId}` : "درگاه آنلاین"}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>نوع طرح:</span>
                  <span className="font-extrabold text-slate-800">اشتراک مادام‌العمر طلایی (VIP)</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>نام کاربری:</span>
                  <span className="font-bold text-slate-800 font-mono">{userState.fullName}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>ایمیل متصل شده:</span>
                  <span className="font-bold text-slate-800 font-mono">{userState.email || "حساب مهمان"}</span>
                </div>

                <div className="flex justify-between text-slate-600 border-t border-slate-200/50 pt-2 font-bold">
                  <span className="text-slate-800">مجموع هزینه پرداخت شده:</span>
                  <span className="text-emerald-600 font-mono">{AMOUNT_TOMAN} تومان</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-xs bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs mx-auto block"
              >
                بازگشت به برنامه و تجربه آموزش طلایی
              </button>
            </motion.div>
          )}

          {/* STEP 4: YASIN SECRET ADMIN PANEL */}
          {step === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Admin Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">پنل مدیریت اختصاصی دکتر یاسین باقرزاده</h3>
                    <p className="text-[10px] text-amber-600 font-extrabold">ابزار تولید دستی اکانت طلایی و کدهای فعال‌سازی</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep("landing")}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 bg-white border px-2.5 py-1.5 rounded-xl shadow-2xs transition-all"
                >
                  <span>خروج از پنل</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Account Generator Form */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <User className="w-4 h-4 text-slate-600" />
                    <h4 className="text-xs font-black text-slate-800">۱. تولید اکانت طلایی اختصاصی (جدید)</h4>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    نام کاربری درخواستی کاربر را وارد کنید. پسوردی متناسب با آن به صورت انحصاری تولید خواهد شد که کاربر با استفاده از آن می‌تواند روی هر دستگاهی وارد حساب پرمیوم طلایی شود.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">نام کاربری درخواستی (انگلیسی):</label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="e.g. dr_bagheri"
                        value={genUsername}
                        onChange={(e) => {
                          setGenUsername(e.target.value);
                          setGeneratedPremiumPassword("");
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    <button
                      onClick={handleGeneratePremiumAccount}
                      disabled={!genUsername.trim()}
                      className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-extrabold text-xs py-2 rounded-xl transition-all"
                    >
                      تولید اکانت و کلمه عبور طلایی
                    </button>

                    {generatedPremiumPassword && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-center">
                        <p className="text-[10px] text-emerald-800 font-bold">مشخصات اکانت پرمیوم تولید شد!</p>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-slate-400">نام کاربری (ایمیل): </span>
                            <span className="font-extrabold text-slate-800 font-mono">{genUsername}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">کلمه عبور (پسورد): </span>
                            <span className="font-extrabold text-slate-800 font-mono">{generatedPremiumPassword}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => copyToClipboard(`نام کاربری: ${genUsername}\nکلمه عبور: ${generatedPremiumPassword}`, "acc")}
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded-lg mx-auto flex items-center gap-1 justify-center transition-all mt-1"
                        >
                          {adminCopied === "acc" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{adminCopied === "acc" ? "کپی شد" : "کپی مشخصات جهت ارسال به کاربر"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Activation Code Generator */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Key className="w-4 h-4 text-slate-600" />
                    <h4 className="text-xs font-black text-slate-800">۲. تولید کد فعال‌سازی طلایی (برای اکانت موجود)</h4>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    اگر دانشجو از قبل با ایمیل خود ثبت‌نام کرده، آدرس ایمیل دقیق او را وارد کنید تا کد فعال‌سازی طلایی یکتا و ایمن برایش ساخته شود. او می‌تواند این کد را در همین پورتال اعمال کند.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">آدرس ایمیل دقیق کاربر:</label>
                      <input
                        type="email"
                        dir="ltr"
                        placeholder="user@example.com"
                        value={genEmail}
                        onChange={(e) => {
                          setGenEmail(e.target.value);
                          setGeneratedCode("");
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    <button
                      onClick={handleGenerateCode}
                      disabled={!genEmail.trim()}
                      className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-extrabold text-xs py-2 rounded-xl transition-all"
                    >
                      تولید کد فعال‌سازی طلایی
                    </button>

                    {generatedCode && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-center">
                        <p className="text-[10px] text-amber-800 font-bold">کد فعال‌سازی تولید شد!</p>
                        <div className="text-xs font-black text-slate-800 font-mono tracking-wider p-2 bg-white border border-slate-200 rounded-xl">
                          {generatedCode}
                        </div>

                        <button
                          onClick={() => copyToClipboard(generatedCode, "code")}
                          className="text-[10px] bg-amber-600 hover:bg-amber-500 text-slate-900 font-black py-1 px-3 rounded-lg mx-auto flex items-center gap-1 justify-center transition-all mt-1"
                        >
                          {adminCopied === "code" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{adminCopied === "code" ? "کپی شد" : "کپی کد جهت ارسال به کاربر"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Local Registered Users List (Extremely useful for manual override) */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-black text-slate-800">۳. مدیریت حساب‌های ثبت‌نام شده روی این مرورگر</h4>
                  </div>
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold font-mono">
                    {localAccounts.length} حساب
                  </span>
                </div>

                <p className="text-[9px] text-slate-400">
                  جهت تست و فعال‌سازی سریع روی همین کامپیوتر یا موبایل، می‌توانید حساب کاربری ثبت‌شده دانشجو را جستجو کرده و با یک دکمه، وضعیت طلایی (Premium) او را مستقیماً فعال یا غیرفعال نمایید.
                </p>

                <input
                  type="text"
                  placeholder="جستجو در نام یا ایمیل کاربران..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                        <th className="py-2">نام کاربر</th>
                        <th className="py-2">ایمیل / نام کاربری</th>
                        <th className="py-2 text-center">وضعیت فعلی</th>
                        <th className="py-2 text-left">عملیات مدیریت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localAccounts
                        .filter(acc => 
                          acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((acc, index) => (
                          <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-100/40">
                            <td className="py-2.5 font-bold text-slate-800">دکتر {acc.fullName}</td>
                            <td className="py-2.5 font-mono text-slate-500">{acc.email}</td>
                            <td className="py-2.5 text-center">
                              {acc.state.isPremium ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                                  <Crown className="w-3 h-3 text-amber-600 fill-amber-500/20" /> طلایی
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                                  <Lock className="w-3 h-3 text-slate-400" /> عادی
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-left">
                              <button
                                onClick={() => handleToggleLocalPremium(acc.email)}
                                className={`text-[9px] font-black px-2.5 py-1 rounded-lg transition-all border ${
                                  acc.state.isPremium
                                    ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                }`}
                              >
                                {acc.state.isPremium ? "لغو عضویت طلایی" : "فعال‌سازی فوری طلایی"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {localAccounts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 text-[11px]">
                            هیچ حساب کاربری روی این مرورگر ثبت‌نام نشده است. ابتدا ثبت‌نام کنید.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
