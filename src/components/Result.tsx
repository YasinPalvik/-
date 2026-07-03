import React from "react";
import { concepts } from "../lib/state";
import { Award, ShieldAlert, Sparkles, CheckCircle, ArrowLeft, RefreshCw, BookmarkCheck } from "lucide-react";
import { motion } from "motion/react";

interface ResultProps {
  xpEarned: number;
  failedConceptIds: string[];
  heartsRemaining: number;
  isReview: boolean;
  onNavigateHome: () => void;
}

export default function Result({ xpEarned, failedConceptIds, heartsRemaining, isReview, onNavigateHome }: ResultProps) {
  const failedConcepts = concepts.filter(c => failedConceptIds.includes(c.id));

  return (
    <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-xs p-6 md:p-8 space-y-6 text-right relative z-10 animate-fade-in" dir="rtl" id="result-view">
      
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-50/80 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
          <Award className="w-8 h-8 animate-bounce" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800">
            {isReview ? "مرور بالینی با موفقیت پایان یافت!" : "جلسه آموزشی به پایان رسید!"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            تلاش شما برای تسلط بر جراحی بالینی ثبت گردید.
          </p>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 text-center">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">کل امتیاز کسب شده</span>
          <h3 className="text-lg font-black text-blue-600 font-mono flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" />
            +{xpEarned} XP
          </h3>
        </div>

        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 text-center">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">جان‌های بالینی باقی‌مانده</span>
          <h3 className="text-lg font-black text-rose-600 font-mono">
            {heartsRemaining} / ۵
          </h3>
        </div>
      </div>

      {/* Audit: Failed concepts log */}
      {failedConcepts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-rose-700 flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            پرونده تحلیل خطاهای بالینی (Error Audit)
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            در مفاهیم زیر پاسخ نادرست ثبت کردید. این مفاهیم جهت مرور مجدد در قالب الگوریتم مکرر فاصله دار (SM-2) نشانه‌گذاری شدند:
          </p>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {failedConcepts.map(c => (
              <div key={c.id} className="p-3 bg-rose-50/30 border border-rose-100/60 rounded-xl space-y-1 text-xs">
                <span className="font-extrabold text-slate-800">{c.title}</span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans line-clamp-2">
                  {c.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-emerald-800">قضاوت بالینی بی‌نقص! (Perfect Clean Audit)</h4>
            <p className="text-[11px] text-emerald-700 leading-relaxed font-sans">
              تبریک! شما در این جلسه هیچ اشتباه یا قضاوت بالینی نادرستی انجام ندادید. این یعنی آمادگی کامل برای مواجهه با کیس‌های واقعی در محیط جراحی!
            </p>
          </div>
        </div>
      )}

      {/* Spaced repetition reminder */}
      <div className="bg-white/40 border border-white/60 p-4 rounded-2xl flex items-start gap-3">
        <BookmarkCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-slate-700">الگوریتم مرور فاصله‌دار (Spaced Repetition)</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            مفاهیمی که امروز پاسخ دادید، بر اساس فرمول تکرار هوشمند، در جلسات مرور آینده شما به طور هوشمند اولویت‌بندی خواهند شد تا در حافظه بلندمدت ثبت شوند.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onNavigateHome}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 rotate-180" />
        بازگشت به نقشه یادگیری اصلی
      </button>

    </div>
  );
}
