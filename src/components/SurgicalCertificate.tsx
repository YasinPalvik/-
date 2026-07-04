import React, { useState, useRef } from "react";
import { UserState } from "../types";
import { Award, Printer, Download, Sparkles, Check, ChevronLeft, Calendar, FileText, Share2 } from "lucide-react";
import { motion } from "motion/react";

interface SurgicalCertificateProps {
  userState: UserState;
  onClose: () => void;
}

export default function SurgicalCertificate({ userState, onClose }: SurgicalCertificateProps) {
  const [userName, setUserName] = useState(userState.fullName || "پزشک کارآموز مدوفیل");
  const [isSaved, setIsSaved] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const activeSubjectId = userState.currentSubject || "surgery";
  const getSubjectName = (id: string) => {
    if (id === "cardiology") return "بیماری‌های قلب و عروق";
    if (id === "pediatrics") return "بیماری‌های کودکان";
    if (id === "gynecology") return "زنان و زایمان";
    if (id === "pharmacology") return "داروشناسی بالینی";
    return "جراحی عمومی";
  };

  // Today's date in Persian format (simple calculation or static clean string)
  const persianDate = "۱۳ تیر ۱۴۰۵";
  const certificateId = "MED-CERT-" + Math.floor(100000 + Math.random() * 900000);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4 text-right" dir="rtl" id="certificate-portal">
      <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-2xl w-full max-w-3xl overflow-hidden relative">
        
        {/* Banner header to guide name customization */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-400 fill-amber-400" />
              صدور گواهی‌نامه رسمی شبیه‌سازی تخصصی {getSubjectName(activeSubjectId)} (ویژه کاربران طلایی)
            </h3>
            <p className="text-[10px] text-slate-400">
              نام خود را برای چاپ بر روی سربرگ گواهی‌نامه تایید و اصلاح کنید.
            </p>
          </div>

          <div className="flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setIsSaved(false);
              }}
              placeholder="نام و نام خانوادگی خود را بنویسید"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 max-w-[180px]"
            />
            <button
              onClick={() => setIsSaved(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : "ثبت نام"}
            </button>
          </div>
        </div>

        {/* Outer body for certificate layout */}
        <div className="p-8 bg-slate-100 flex justify-center overflow-x-auto">
          
          {/* Certificate Board */}
          <div 
            ref={printRef}
            className="w-full max-w-2xl bg-[#fdfbf7] aspect-[1.414/1] border-[12px] border-double border-amber-800/40 p-8 shadow-md relative select-none text-center flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0"
            id="certificate-print-area"
          >
            {/* Elegant corner borders */}
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-800/20"></div>
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-800/20"></div>
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-800/20"></div>
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-800/20"></div>

            {/* Inner frame lines */}
            <div className="border border-amber-800/10 p-4 h-full flex flex-col justify-between">
              
              {/* Header logos & Crest */}
              <div className="flex justify-between items-start text-slate-400 text-[8px] font-bold">
                <div className="text-right space-y-0.5">
                  <div>شماره گواهی: {certificateId}</div>
                  <div>تاریخ صدور: {persianDate}</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 border-2 border-amber-800/30 rounded-full flex items-center justify-center text-amber-800/80">
                    <Award className="w-6 h-6 fill-amber-50" />
                  </div>
                  <span className="text-[9px] font-black text-amber-900 tracking-widest">MEDOPHIL</span>
                </div>

                <div className="text-left space-y-0.5">
                  <div>وضعیت: کارنامه طلایی (Premium)</div>
                  <div>سیستم آموزشی گیمیفاید</div>
                </div>
              </div>

              {/* Certificate content text */}
              <div className="space-y-4 my-auto pt-4">
                <h2 className="text-lg font-black text-amber-950 tracking-wide font-sans">
                  گواهی‌نامه شایستگی شبیه‌سازی بالینی {getSubjectName(activeSubjectId)}
                </h2>
                
                <p className="text-[10px] text-slate-400 tracking-wider">
                  CERTIFICATE OF CLINICAL SIMULATION EXCELLENCE
                </p>

                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    بدین‌وسیله گواهی می‌گردد همکار ارجمند جناب آقای / سرکار خانم
                  </p>

                  <h3 className="text-base font-black text-amber-900 border-b border-amber-800/20 pb-1.5 inline-block px-12 font-sans bg-amber-50/30">
                    {userName}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto font-sans text-justify">
                    با طی نمودن موفقیت‌آمیز دوره‌های پیشرفته آموزش بالینی {getSubjectName(activeSubjectId)}، شبیه‌سازی سناریوهای بحرانی پرخطر (High-Stakes)، پایش دقیق علائم تشخیصی و کنترل کامل جان‌های بالینی در بیمارستان شبیه‌ساز <strong>مدوفیل</strong>، شایستگی علمی و تصمیم‌گیری چابک خود را در سطح متخصصان طراز اول با بالاترین نمره تایید نموده‌اند.
                  </p>
                </div>
              </div>

              {/* Bottom seals and signatures */}
              <div className="flex justify-between items-end mt-6 pt-4 border-t border-amber-800/10">
                
                {/* Sign 1 */}
                <div className="text-center space-y-1">
                  <span className="text-[8px] text-slate-400 block">دبیر شورای آموزش {getSubjectName(activeSubjectId)}</span>
                  <div className="w-20 h-6 border-b border-amber-800/20 border-dotted mx-auto flex items-center justify-center">
                    <span className="text-[9px] text-sky-600 font-serif italic">دکتر سهرابی</span>
                  </div>
                </div>

                {/* Central holographic seal */}
                <div className="relative">
                  <div className="w-12 h-12 bg-amber-500/10 border-2 border-amber-500 rounded-full flex items-center justify-center text-amber-600/90 rotate-12 relative shadow-inner">
                    <Sparkles className="w-5 h-5" />
                    <div className="absolute inset-0 border border-amber-500 rounded-full scale-90 border-dashed"></div>
                  </div>
                  <span className="text-[7px] text-amber-800/80 font-bold block mt-1">مهر رسمی شبیه‌ساز مدوفیل</span>
                </div>

                {/* Sign 2 */}
                <div className="text-center space-y-1">
                  <span className="text-[8px] text-slate-400 block">ریاست بورد پزشکی مدوفیل</span>
                  <div className="w-20 h-6 border-b border-amber-800/20 border-dotted mx-auto flex items-center justify-center">
                    <span className="text-[9px] text-indigo-600 font-serif italic">دکتر باقرزاده</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-500">
            💡 <strong>توجه کارآموز:</strong> می‌توانید این گواهی‌نامه را از طریق پرینتر متصل چاپ کرده یا به صورت PDF ذخیره نمایید.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ گواهی / ذخیره PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white border hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl transition-all"
            >
              بستن گواهی
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
