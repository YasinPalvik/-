import React, { useState } from "react";
import { UserState } from "../types";
import { DEFAULT_STATE } from "../lib/state";
import { verifyPremiumAccount } from "../lib/premium_verifier";
import { auth, googleAuthProvider } from "../lib/firebase.ts";
import { signInWithPopup } from "firebase/auth";
import { 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Key,
  HelpCircle,
  X,
  Sparkles,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthManagerProps {
  userState: UserState;
  onUpdateState: (newState: UserState) => void;
  onClose: () => void;
}

interface StoredAccount {
  email: string;
  fullName: string;
  passwordHash: string;
  state: UserState;
}

const STORAGE_ACCOUNTS_KEY = "medophil_registered_accounts";

export default function AuthManager({ userState, onUpdateState, onClose }: AuthManagerProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  
  // Fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      setSuccess(`خوش‌آمدید، دکتر ${user.displayName || "گرام"}! حساب کاربری شما متصل شد.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error("Google Sign-In failed", e);
      setError("اتصال به حساب گوگل با خطا مواجه شد.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load all accounts registered locally
  const getRegisteredAccounts = (): StoredAccount[] => {
    try {
      const data = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  // Save all accounts registered locally
  const saveRegisteredAccounts = (accounts: StoredAccount[]) => {
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !fullName || !password) {
      setError("لطفاً تمامی فیلدهای الزامی را پر کنید.");
      return;
    }
    if (password.length < 6) {
      setError("کلمه عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (password !== confirmPassword) {
      setError("کلمه عبور و تاییدیه آن با هم مطابقت ندارند.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = getRegisteredAccounts();
      const exists = accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase());

      if (exists) {
        setError("این ایمیل قبلاً ثبت‌نام شده است.");
        setIsLoading(false);
        return;
      }

      // Create new account starting with current progress or base default
      // This is a great UX touch! It preserves guest progress upon registration
      const newUserState: UserState = {
        ...userState,
        email: email,
        fullName: fullName,
      };

      const newAccount: StoredAccount = {
        email: email.toLowerCase(),
        fullName: fullName,
        passwordHash: password, // simple simulated hashing
        state: newUserState,
      };

      accounts.push(newAccount);
      saveRegisteredAccounts(accounts);
      onUpdateState(newUserState);

      setIsLoading(false);
      setSuccess("ثبت‌نام شما با موفقیت انجام شد! حساب متصل گردید.");
      
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("لطفاً ایمیل و کلمه عبور خود را وارد کنید.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Check if the login credentials match a manually generated premium account
      const isPremiumCredential = verifyPremiumAccount(email, password);
      
      let account: StoredAccount | undefined;
      const accounts = getRegisteredAccounts();

      if (isPremiumCredential) {
        const cleanEmail = email.trim().toLowerCase();
        const existingAcc = accounts.find(acc => acc.email.toLowerCase() === cleanEmail);
        
        if (existingAcc) {
          account = existingAcc;
          account.state.isPremium = true;
          account.state.planType = "lifetime";
          account.state.hearts = 5;
          account.state.subscriptionDate = new Date().toISOString().split("T")[0];
        } else {
          // Create a new account with lifetime premium already active
          const displayUsername = email.includes("@") ? email.split("@")[0] : email;
          const preState: UserState = {
            ...DEFAULT_STATE,
            email: cleanEmail,
            fullName: displayUsername,
            isPremium: true,
            planType: "lifetime",
            hearts: 5,
            subscriptionDate: new Date().toISOString().split("T")[0]
          };
          
          account = {
            email: cleanEmail,
            fullName: displayUsername,
            passwordHash: password,
            state: preState
          };
          
          accounts.push(account);
          saveRegisteredAccounts(accounts);
        }
      } else {
        // Standard registered account check
        account = accounts.find(
          acc => acc.email.toLowerCase() === email.toLowerCase() && acc.passwordHash === password
        );
      }

      if (!account) {
        setError("ایمیل یا کلمه عبور وارد شده اشتباه است.");
        setIsLoading(false);
        return;
      }

      // Load this user's state
      onUpdateState({
        ...account.state,
        email: account.email,
        fullName: account.fullName,
      });

      setIsLoading(false);
      setSuccess(`خوش‌آمدید، دکتر ${account.fullName}! حساب طلایی (Premium) شما فعال شد.`);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1000);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("لطفاً ایمیل خود را وارد کنید.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = getRegisteredAccounts();
      const exists = accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase());

      setIsLoading(false);
      if (exists) {
        setSuccess("ایمیل بازنشانی کلمه عبور ارسال شد (در محیط دمو رمز شما شبیه‌سازی گردید).");
      } else {
        setError("حسابی با این ایمیل یافت نشد.");
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4 text-right" dir="rtl" id="auth-portal">
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative p-6 md:p-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand visual header */}
        <div className="text-center space-y-2 mb-6 pt-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold mx-auto shadow-sm">
            <span className="text-xl">M</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">ایجاد حساب کاربری مدوفیل</h3>
            <p className="text-[10px] text-slate-400">ذخیره خودکار پیشرفت، آنالیز زنده و ارتقا به بخش طلایی</p>
          </div>
        </div>

        {/* Native Google Sign-In Button */}
        {mode !== "forgot" && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-extrabold text-xs py-3 rounded-2xl transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>ورود / عضویت با حساب گوگل</span>
            </button>
            <div className="flex items-center gap-3 my-4">
              <span className="h-px bg-slate-200 flex-1"></span>
              <span className="text-[10px] text-slate-400 font-bold">یا روش‌های دیگر</span>
              <span className="h-px bg-slate-200 flex-1"></span>
            </div>
          </div>
        )}

        {/* Tab Buttons */}
        {mode !== "forgot" && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "login"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ورود به حساب</span>
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "signup"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ثبت‌نام جدید</span>
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-[11px] rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Body */}
        <AnimatePresence mode="wait">
          
          {/* LOGIN */}
          {mode === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLogin}
              className="space-y-4 text-right"
            >
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">پست الکترونیک (ایمیل):</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 font-bold">کلمه عبور (پسورد):</label>
                  <button 
                    type="button" 
                    onClick={() => setMode("forgot")}
                    className="text-[9px] text-blue-600 hover:underline font-bold"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    dir="ltr"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 mt-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به حساب کاربری</span>
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSignup}
              className="space-y-4 text-right"
            >
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">نام و نام خانوادگی:</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مانند: دکتر علی باقری"
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">آدرس ایمیل:</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">کلمه عبور:</label>
                  <input
                    type="password"
                    dir="ltr"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">تکرار کلمه عبور:</label>
                  <input
                    type="password"
                    dir="ltr"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار مجدد"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 mt-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>تایید و ساخت حساب</span>
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === "forgot" && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleForgot}
              className="space-y-4 text-right"
            >
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">ایمیل حساب کاربری:</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
                >
                  {isLoading ? "ارسال..." : "ارسال درخواست"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors"
                >
                  بازگشت
                </button>
              </div>
            </motion.form>
          )}

        </AnimatePresence>

        <p className="text-[9px] text-slate-400 text-center leading-relaxed mt-6 border-t pt-4">
          👨‍⚕️ حساب کاربری مدوفیل به صورت محلی در مرورگر شما ذخیره و هماهنگ می‌شود تا بتوانید به راحتی MVP را تست، و داده‌های پیشرفت چندین کاربر را شبیه‌سازی کنید.
        </p>

      </div>
    </div>
  );
}
