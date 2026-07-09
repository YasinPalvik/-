import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Smartphone, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  Terminal, 
  Code, 
  Info, 
  Share2, 
  Plus, 
  Play, 
  ExternalLink,
  Laptop,
  Check,
  Cpu,
  Monitor
} from "lucide-react";

interface AndroidPortalProps {
  onClose: () => void;
  themeColor?: string;
}

export default function AndroidPortal({ onClose, themeColor = "#6366f1" }: AndroidPortalProps) {
  const [activeTab, setActiveTab] = useState<"pwa" | "capacitor">("pwa");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  useEffect(() => {
    // Listen for the PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) {
      alert("قابلیت نصب مستقیم مرورگر در حال حاضر در دسترس نیست. لطفا از راهنمای تصویری زیر استفاده کنید.");
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6" dir="rtl">
      {/* Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] flex flex-col md:flex-row h-[90vh] md:h-[85vh]"
      >
        
        {/* Left Side: Interactive Simulated Android Phone Frame (For PWA visual proof) */}
        <div className="hidden lg:flex w-80 bg-slate-950/50 p-6 flex-col justify-between border-l border-white/5 relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
          
          <div className="relative text-center space-y-2 z-10">
            <div className="inline-flex p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
            <h3 className="text-sm font-black text-slate-100">پیش‌نمایش نسخه موبایل</h3>
            <p className="text-[11px] text-slate-400">شبیه‌سازی کامل رابط کاربری سگ نزن در سیستم‌عامل اندروید</p>
          </div>

          {/* Interactive Phone Shell */}
          <div className="my-auto flex justify-center relative">
            <div className="w-[210px] h-[380px] bg-slate-900 rounded-[36px] p-2.5 border-4 border-slate-700 shadow-2xl relative flex flex-col overflow-hidden">
              {/* Speaker & Camera Notch */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-700 rounded-full flex items-center justify-center z-30">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mr-2"></div>
                <div className="w-6 h-0.5 bg-slate-800 rounded-full"></div>
              </div>

              {/* Screen Content */}
              <div className="flex-1 rounded-[28px] overflow-hidden bg-slate-950 relative flex flex-col justify-between p-3 select-none text-right">
                {/* Mock Status Bar */}
                <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 px-1 pt-0.5 font-mono">
                  <span>10:10</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-3 h-1.5 bg-emerald-500 rounded-sm"></div>
                  </div>
                </div>

                {/* Simulated HomeScreen App Icon or App Window */}
                {!simulatorOpen ? (
                  <div className="flex-1 flex flex-col justify-center items-center space-y-4">
                    {/* Simulated App Icon Grid */}
                    <div className="grid grid-cols-3 gap-4 w-full px-2">
                      <div className="flex flex-col items-center space-y-1 opacity-40">
                        <div className="w-9 h-9 bg-slate-800 rounded-lg"></div>
                        <span className="text-[7px] text-slate-500">تماس‌ها</span>
                      </div>
                      
                      {/* Active Sag Nazan Icon */}
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSimulatorOpen(true)}
                        className="flex flex-col items-center space-y-1 cursor-pointer group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-[0_0_12px_rgba(99,102,241,0.4)] border border-indigo-400/30 group-hover:border-indigo-400">
                          <span>س</span>
                        </div>
                        <span className="text-[8px] font-black text-indigo-300">سگ نزن</span>
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></div>
                      </motion.div>

                      <div className="flex flex-col items-center space-y-1 opacity-40">
                        <div className="w-9 h-9 bg-slate-800 rounded-lg"></div>
                        <span className="text-[7px] text-slate-500">گالری</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 text-center animate-pulse">برای اجرای وب‌اپلیکیشن روی آیکون برنامه ضربه بزنید</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between pt-2">
                    {/* Simulator App Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center text-[8px] text-white font-extrabold">س</div>
                        <span className="text-[8px] font-black text-white">سگ نزن</span>
                      </div>
                      <button 
                        onClick={() => setSimulatorOpen(false)}
                        className="text-[8px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded"
                      >
                        بستن
                      </button>
                    </div>

                    {/* App Core Simulation View */}
                    <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-2 text-center">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-200">داشبورد بالینی فعال است</span>
                      <p className="text-[8px] text-slate-400 px-2 leading-relaxed">کل رابط کاربری به صورت بومی و بدون حاشیه مرورگر (Fullscreen) به نمایش در می‌آید.</p>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 text-[7px] font-black text-indigo-300 px-2 py-0.5 rounded-full">
                        پاسخدهی فوق‌العاده سریع
                      </div>
                    </div>

                    {/* Bottom Home Indicator */}
                    <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto my-1"></div>
                  </div>
                )}

                {/* App Drawer Dot */}
                <div className="text-[7px] text-slate-500 text-center">Android OS 14</div>
              </div>
            </div>
          </div>

          {/* Mini Tech Spec Footer */}
          <div className="text-right text-[10px] text-slate-500 font-mono space-y-1 pt-4 border-t border-white/5 z-10">
            <p>• Display: Standalone PWA</p>
            <p>• Cache: Service Worker v1</p>
            <p>• Push API Ready</p>
          </div>
        </div>

        {/* Right Side: Main Core Interactive Panel */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-8">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="text-right space-y-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">خروجی موبایل</span>
              <h2 className="text-xl font-black text-white flex items-center gap-2 mt-1.5">
                <Smartphone className="w-5.5 h-5.5 text-indigo-400" />
                <span>برنامه اندروید و وب‌اپلیکیشن (PWA) سگ نزن</span>
              </h2>
              <p className="text-xs text-slate-400">سامانه سگ نزن را به عنوان اپلیکیشن روی تلفن همراه اندروید خود داشته باشید و بدون فیلترشکن و قطعی مطالعه کنید.</p>
            </div>
            
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-white/5 border border-white/5 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1 bg-slate-950/60 border border-white/5 rounded-2xl my-4 shrink-0">
            <button
              onClick={() => setActiveTab("pwa")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === "pwa"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>نصب فوری وب‌اپلیکیشن (مخصوص پزشکان)</span>
            </button>
            <button
              onClick={() => setActiveTab("capacitor")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === "capacitor"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="w-4 h-4" />
              <span>خروجی بومی APK با Capacitor (توسعه‌دهندگان)</span>
            </button>
          </div>

          {/* Scrollable Content Pane */}
          <div className="flex-1 overflow-y-auto pr-1 pl-3 py-2 space-y-6 text-right">
            
            {activeTab === "pwa" ? (
              <motion.div 
                key="pwa-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Auto Detection Callout */}
                {installPrompt ? (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-indigo-300">دستگاه اندرویدی شناسایی شد!</h4>
                      <p className="text-[11px] text-slate-400">مرورگر شما آماده نصب مستقیم برنامه سگ نزن است. کافیست روی دکمه زیر کلیک کنید.</p>
                    </div>
                    <button
                      onClick={handleInstallPWA}
                      className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>نصب مستقیم سگ نزن</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex items-center gap-3">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-200">نصب به عنوان وب‌اپلیکیشن پیشرفته (PWA)</h4>
                      <p className="text-[11px] text-slate-400">بهترین راه برای اجرای روان برنامه روی تلفن همراه بدون اشغال فضای ذخیره‌سازی اضافی.</p>
                    </div>
                  </div>
                )}

                {/* Steps Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>راهنمای گام‌به‌گام نصب روی اندروید (Chrome / مرورگر گوشی)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl flex gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                        01
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-extrabold text-slate-200">باز کردن در مرورگر کروم</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          آدرس سامانه را در مرورگر کروم (Chrome) گوشی اندرویدی خود باز کنید. ترجیحاً از مرورگرهای استاندارد استفاده کنید.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl flex gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                        02
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-extrabold text-slate-200">کلیک بر روی منوی ۳ نقطه</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          در گوشه بالا یا پایین مرورگر بر روی علامت سه نقطه <strong className="text-indigo-400">⋮</strong> ضربه بزنید تا تنظیمات مرورگر باز شود.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl flex gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                        03
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-extrabold text-slate-200">انتخاب گزینه Install / Add to Home</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          گزینه <strong className="text-indigo-400">«Install App»</strong> یا <strong className="text-indigo-400">«Add to Home screen»</strong> (افزودن به صفحه اصلی) را انتخاب کنید.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl flex gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                        04
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-extrabold text-slate-200">اتمام نصب و شروع کار</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          روی دکمه تأیید ضربه بزنید. حالا آیکون برنامه «سگ نزن» روی صفحه گوشی شما قرار گرفته و مانند یک اپلیکیشن بومی عمل می‌کند.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Benefits / Features List */}
                <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-indigo-300">مزایای نصب نسخه وب‌اپلیکیشن (PWA)</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>بدون نیاز به دانلود فایل حجیم APK (نصب در کمتر از ۲ ثانیه)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>آپدیت‌های اتوماتیک و لحظه‌ای بدون نیاز به دانلود مجدد</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>بدون حاشیه و آدرس‌بار مرورگر با بیشترین فضای دید مطالعاتی</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>امنیت کامل و سازگاری با تمامی تبلت‌ها و گوشی‌های اندرویدی</span>
                    </li>
                  </ul>
                </div>

              </motion.div>
            ) : (
              <motion.div 
                key="capacitor-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Tech Intro */}
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3.5">
                  <Cpu className="w-5.5 h-5.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-indigo-300">خروجی اندروید بومی با استفاده از فریمورک CapacitorJS</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      شما می‌توانید پروژه فرانت‌اند وب این اپلیکیشن را به صورت مستقیم در Android Studio اجرا کنید و خروجی رسمی ساین شده <code className="text-indigo-300">.apk</code> یا <code className="text-indigo-300">.aab</code> بگیرید. ما فایل‌های تنظیمات موردنیاز را در ریشه پروژه شما آماده کرده‌ایم.
                    </p>
                  </div>
                </div>

                {/* Developer Steps - Interactive Terminal mockups */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-indigo-400" />
                    <span>دستورالعمل کامپایل پروژه اندروید بومی</span>
                  </h3>

                  {/* Step 1 Command */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>مرحله اول: نصب پیش‌نیازهای اندروید در ریشه پروژه</span>
                      <button 
                        onClick={() => copyToClipboard("npm install @capacitor/core @capacitor/cli\nnpx cap init \"سگ نزن\" com.medophil.sagnazan --web-dir=dist", "step1")}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        {copiedText === "step1" ? "کپی شد!" : "کپی دستور"}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 text-left overflow-x-auto" dir="ltr">
                      <span className="text-slate-500"># Install core Capacitor packages</span><br />
                      <span className="text-indigo-400">npm</span> install @capacitor/core @capacitor/cli<br />
                      <br />
                      <span className="text-slate-500"># Build current static React app</span><br />
                      <span className="text-indigo-400">npm</span> run build
                    </div>
                  </div>

                  {/* Step 2 Command */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>مرحله دوم: ایجاد پلتفرم بومی اندروید و همگام‌سازی</span>
                      <button 
                        onClick={() => copyToClipboard("npm install @capacitor/android\nnpx cap add android\nnpx cap sync", "step2")}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        {copiedText === "step2" ? "کپی شد!" : "کپی دستور"}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 text-left overflow-x-auto" dir="ltr">
                      <span className="text-slate-500"># Install the Android platform support</span><br />
                      <span className="text-indigo-400">npm</span> install @capacitor/android<br /><br />
                      <span className="text-slate-500"># Add android platform to the project</span><br />
                      <span className="text-indigo-400">npx</span> cap add android<br /><br />
                      <span className="text-slate-500"># Sync your react bundle to android resources</span><br />
                      <span className="text-indigo-400">npx</span> cap sync
                    </div>
                  </div>

                  {/* Step 3 Command */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>مرحله سوم: باز کردن پروژه در Android Studio برای خروجی نهایی</span>
                      <button 
                        onClick={() => copyToClipboard("npx cap open android", "step3")}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        {copiedText === "step3" ? "کپی شد!" : "کپی دستور"}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 text-left overflow-x-auto" dir="ltr">
                      <span className="text-slate-500"># Open the project in Android Studio</span><br />
                      <span className="text-indigo-400">npx</span> cap open android
                    </div>
                  </div>

                </div>

                {/* Developer Alert Box */}
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-[11px] text-slate-400 leading-relaxed space-y-1">
                  <p className="font-extrabold text-slate-300">نکته بسیار مهم برای توسعه‌دهنده:</p>
                  <p>فایل پیکربندی <code className="text-indigo-400 font-mono">capacitor.config.json</code> قبلاً در ریشه پروژه به درستی ساخته و قرار گرفته است و نیازی به تغییر در تنظیمات پایه برای ساخت اپلیکیشن اندروید نیست.</p>
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer of Modal */}
          <div className="pt-4 border-t border-white/10 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[10px] text-slate-500 font-bold">سازگاری با تمامی نسخه‌های اندروید ۵.۰ به بالا</span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
            >
              <span>متوجه شدم و بازگشت</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
