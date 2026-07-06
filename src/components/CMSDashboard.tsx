import React, { useState, useEffect } from "react";
import { UserState } from "../types";
import { 
  Database, Plus, FileJson, Download, Upload, Trash, Edit, Check, AlertCircle, 
  Sparkles, BookOpen, HelpCircle, ArrowRight, Save, Copy, FileText, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CMSDashboardProps {
  userState: UserState;
  onNavigateHome: () => void;
  idToken: string | null;
}

interface CMSContentItem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  content_type: "lesson" | "question";
  data: any;
}

export default function CMSDashboard({ userState, onNavigateHome, idToken }: CMSDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"explorer" | "editor" | "jsonEditor">("explorer");
  const [items, setItems] = useState<CMSContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Editor form state
  const [contentType, setContentType] = useState<"lesson" | "question">("lesson");
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [tagsInput, setTagsInput] = useState("");

  // Lesson specific states
  const [overview, setOverview] = useState("");
  const [sections, setSections] = useState<{ title: string; content: string }[]>([
    { title: "", content: "" }
  ]);
  const [pitfalls, setPitfalls] = useState<{ title: string; description: string; consequence: string }[]>([
    { title: "", description: "", consequence: "" }
  ]);
  const [combinedPearls, setCombinedPearls] = useState<{ title: string; content: string }[]>([
    { title: "", content: "" }
  ]);

  // Question specific states
  const [chapterId, setChapterId] = useState("");
  const [islandId, setIslandId] = useState<number>(2);
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanationCorrect, setExplanationCorrect] = useState("");
  const [explanationWrong, setExplanationWrong] = useState("");

  // Raw JSON state
  const [rawJson, setRawJson] = useState("");

  // Load items from API
  const loadCmsItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setRawJson(JSON.stringify(data, null, 2));
      } else {
        setErrorMsg("خطا در بارگذاری اطلاعات CMS");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("خطا در اتصال به سرور جهت دریافت اطلاعات CMS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsItems();
  }, []);

  const handleAddSection = () => {
    setSections([...sections, { title: "", content: "" }]);
  };

  const handleAddPitfall = () => {
    setPitfalls([...pitfalls, { title: "", description: "", consequence: "" }]);
  };

  const handleAddPearl = () => {
    setCombinedPearls([...combinedPearls, { title: "", content: "" }]);
  };

  // Submit single item form
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title) {
      setErrorMsg("لطفاً شناسه و عنوان را وارد کنید.");
      return;
    }

    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    let itemData: any = {};

    if (contentType === "lesson") {
      itemData = {
        overview,
        sections: sections.filter(s => s.title && s.content),
        pitfalls: pitfalls.filter(p => p.title && p.description),
        combinedPearls: combinedPearls.filter(cp => cp.title && cp.content)
      };
    } else {
      if (!correctAnswer) {
        setErrorMsg("لطفاً پاسخ صحیح را مشخص کنید.");
        return;
      }
      itemData = {
        chapterId: chapterId || "cardio_ch1",
        islandId: Number(islandId),
        type: "multipleChoice",
        options: options.filter(Boolean),
        correctAnswer,
        explanationCorrect,
        explanationWrong
      };
    }

    const item: CMSContentItem = {
      id,
      title,
      difficulty,
      tags,
      content_type: contentType,
      data: itemData
    };

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/cms/item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify(item)
      });

      if (res.ok) {
        setSuccessMsg("آیتم با موفقیت ذخیره شد و در پایگاه‌داده ادغام گردید.");
        // Reset form
        setId("");
        setTitle("");
        setTagsInput("");
        setOverview("");
        setSections([{ title: "", content: "" }]);
        setPitfalls([{ title: "", description: "", consequence: "" }]);
        setCombinedPearls([{ title: "", content: "" }]);
        setOptions(["", "", "", ""]);
        setCorrectAnswer("");
        setExplanationCorrect("");
        setExplanationWrong("");
        
        loadCmsItems();
        setActiveSubTab("explorer");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "خطا در ذخیره آیتم.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  };

  // Submit entire raw JSON
  const handleSaveRawJson = async () => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) {
        setErrorMsg("محتوا باید یک آرایه معتبر از آبجکت‌های JSON باشد.");
        return;
      }

      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // Save each item sequentially to server
      for (const item of parsed) {
        const res = await fetch("/api/cms/item", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify(item)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `خطا در ذخیره آیتم با شناسه ${item.id}`);
        }
      }

      setSuccessMsg("تمام آیتم‌ها با موفقیت ذخیره شدند!");
      loadCmsItems();
      setActiveSubTab("explorer");
    } catch (e: any) {
      setErrorMsg(e.message || "قالب JSON نامعتبر است.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger file download of JSON content
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "cms_content.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle file import of JSON content
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        if (event.target?.result) {
          try {
            const parsed = JSON.parse(event.target.result as string);
            if (Array.isArray(parsed)) {
              setRawJson(JSON.stringify(parsed, null, 2));
              setActiveSubTab("jsonEditor");
              setSuccessMsg("فایل با موفقیت در ویرایشگر بارگذاری شد. برای نهایی‌سازی ذخیره، روی دکمه ذخیره کلیک کنید.");
            } else {
              setErrorMsg("فایل انتخابی باید یک آرایه معتبر JSON باشد.");
            }
          } catch (err) {
            setErrorMsg("خطا در تحلیل فرمت فایل JSON.");
          }
        }
      };
    }
  };

  // Populates form to edit existing item
  const handleEditItem = (item: CMSContentItem) => {
    setContentType(item.content_type);
    setId(item.id);
    setTitle(item.title);
    setDifficulty(item.difficulty);
    setTagsInput(item.tags.join(", "));

    if (item.content_type === "lesson") {
      setOverview(item.data?.overview || "");
      setSections(item.data?.sections || [{ title: "", content: "" }]);
      setPitfalls(item.data?.pitfalls || [{ title: "", description: "", consequence: "" }]);
      setCombinedPearls(item.data?.combinedPearls || [{ title: "", content: "" }]);
    } else {
      setChapterId(item.data?.chapterId || "");
      setIslandId(item.data?.islandId || 2);
      setOptions(item.data?.options || ["", "", "", ""]);
      setCorrectAnswer(item.data?.correctAnswer || "");
      setExplanationCorrect(item.data?.explanationCorrect || "");
      setExplanationWrong(item.data?.explanationWrong || "");
    }

    setActiveSubTab("editor");
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 md:p-8 font-sans pb-24" dir="rtl">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl shadow-lg shadow-indigo-500/15">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-300">
              مدیریت هوشمند و یکپارچه محتوا (CMS)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">
              افزودن، ویرایش و پایداری درسنامه‌ها و سوالات قلب و کودکان بر پایه معماری استاندارد JSON
            </p>
          </div>
        </div>
        
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/50 transition-all shadow-md"
        >
          <span>بازگشت به داشبورد</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* Status Indicators */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-medium"
            >
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800/60 pb-4">
          <button
            onClick={() => { setActiveSubTab("explorer"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "explorer"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>لیست درسنامه‌ها و سوالات</span>
          </button>

          <button
            onClick={() => { setActiveSubTab("editor"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "editor"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>افزودن / ویرایش بصری محتوا</span>
          </button>

          <button
            onClick={() => { setActiveSubTab("jsonEditor"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "jsonEditor"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>ویرایشگر مستقیم ساختار JSON</span>
          </button>

          <div className="mr-auto flex items-center gap-2">
            {/* Download/Export */}
            <button
              onClick={handleExportJson}
              title="خروجی گرفتن به صورت فایل JSON"
              className="p-2.5 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Upload/Import */}
            <label className="p-2.5 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Dynamic Inner Panels */}
        <div className="bg-[#101625] border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-black/25">
          
          {/* TAB 1: CONTENT EXPLORER */}
          {activeSubTab === "explorer" && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    <span>آرشیو محتوای یکپارچه CMS</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    دروس و سوالاتی که در سیستم لود شده و مستقیماً روی نقشه، شبیه‌سازها، درسنامه‌ها و چت‌بات Gemini تاثیرگذار هستند.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800/80 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  <span>تعداد کل آیتم‌ها: {items.length}</span>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-medium text-slate-400">در حال دریافت داده‌های همگام‌سازی شده...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-20 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-300">هیچ محتوای استاندارد JSON یافت نشد</p>
                  <p className="text-xs text-slate-400 mt-1">برای افزودن محتوا از تب‌های بالا استفاده کنید.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider">
                        <th className="py-3 px-4">شناسه یکتا (ID)</th>
                        <th className="py-3 px-4">عنوان محتوا</th>
                        <th className="py-3 px-4">نوع محتوا</th>
                        <th className="py-3 px-4">درجه سختی</th>
                        <th className="py-3 px-4">برچسب‌ها (Tags)</th>
                        <th className="py-3 px-4 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">{item.id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-100 max-w-xs truncate">{item.title}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                              item.content_type === "lesson"
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "bg-purple-500/10 text-purple-400"
                            }`}>
                              {item.content_type === "lesson" ? "درسنامه" : "سوال تعاملی"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                              item.difficulty === "hard"
                                ? "bg-rose-500/10 text-rose-400"
                                : item.difficulty === "medium"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-emerald-500/10 text-emerald-400"
                            }`}>
                              {item.difficulty === "hard" ? "سخت" : item.difficulty === "medium" ? "متوسط" : "آسان"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag, i) => (
                                <span key={i} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md text-[9px] font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/20 transition-all"
                            >
                              <Edit className="w-3.5 h-3.5 inline-block mr-1" />
                              <span>ویرایش</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL FORM EDITOR */}
          {activeSubTab === "editor" && (
            <form onSubmit={handleSubmitItem} className="space-y-6">
              <div className="border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-200">فرم بصری طراحی و ثبت محتوای استاندارد CMS</h3>
                <p className="text-xs text-slate-400 mt-1">با ثبت این فرم، محتوای مربوطه به صورت خودکار به پلتفرم تزریق خواهد شد.</p>
              </div>

              {/* Content Type Picker */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setContentType("lesson")}
                  className={`py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    contentType === "lesson"
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ایجاد درسنامه استاندارد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentType("question")}
                  className={`py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    contentType === "question"
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>ایجاد سوال تعاملی کپسول</span>
                </button>
              </div>

              {/* Shared Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">شناسه یکتا (Unique ID) *</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="مثال: cardio_ch2 یا pedi_q4"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">پیشنهاد: برای دروس قلب با cardio_ و برای کودکان با pedi_ شروع کنید.</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-2">عنوان محتوا (فارسی روان) *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: اورژانس‌های حاد جراحی اطفال یا نارسایی دریچه میترال"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">درجه سختی (Difficulty)</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="easy">آسان (Easy)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="hard">سخت (Hard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">برچسب‌ها (با ویرگول انگلیسی جدا کنید)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="مثال: cardiology, valve, surgery"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* LESSON SPECIFIC FIELDS */}
              {contentType === "lesson" && (
                <div className="space-y-6 pt-4 border-t border-slate-800/60">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">بررسی کلی درسنامه (Overview / Summary) *</label>
                    <textarea
                      value={overview}
                      onChange={(e) => setOverview(e.target.value)}
                      placeholder="توضیح کوتاه و جذاب در مورد اهمیت بالینی مبحث..."
                      rows={3}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>بخش‌های محتوایی درسنامه (Syllabus Sections)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن بخش جدید</span>
                      </button>
                    </div>

                    {sections.map((sec, idx) => (
                      <div key={idx} className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-indigo-400 font-bold">بخش شماره {idx + 1}</span>
                          {sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSections(sections.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                            >
                              حذف بخش
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].title = e.target.value;
                            setSections(updated);
                          }}
                          placeholder="عنوان بخش (مثال: پاتولوژی و تظاهرات بالینی)"
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                        <textarea
                          value={sec.content}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].content = e.target.value;
                            setSections(updated);
                          }}
                          placeholder="متن کامل و غنی علمی بخش..."
                          rows={4}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pitfalls */}
                  <div className="space-y-4 pt-4 border-t border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>تله‌های خطرناک بالینی (Clinical Pitfalls)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddPitfall}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن تله جدید</span>
                      </button>
                    </div>

                    {pitfalls.map((pit, idx) => (
                      <div key={idx} className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-rose-400 font-bold">تله شماره {idx + 1}</span>
                          {pitfalls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPitfalls(pitfalls.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                            >
                              حذف تله
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={pit.title}
                          onChange={(e) => {
                            const updated = [...pitfalls];
                            updated[idx].title = e.target.value;
                            setPitfalls(updated);
                          }}
                          placeholder="عنوان تله (مثال: عدم توجه به استریدور)"
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                        <input
                          type="text"
                          value={pit.description}
                          onChange={(e) => {
                            const updated = [...pitfalls];
                            updated[idx].description = e.target.value;
                            setPitfalls(updated);
                          }}
                          placeholder="توضیح علمی پاتولوژی تله..."
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                        <input
                          type="text"
                          value={pit.consequence}
                          onChange={(e) => {
                            const updated = [...pitfalls];
                            updated[idx].consequence = e.target.value;
                            setPitfalls(updated);
                          }}
                          placeholder="عواقب مرگبار بی توجهی..."
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Combined Pearls */}
                  <div className="space-y-4 pt-4 border-t border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>مرواریدهای طلایی جراحی (Combined Pearls)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddPearl}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن مروارید جدید</span>
                      </button>
                    </div>

                    {combinedPearls.map((cp, idx) => (
                      <div key={idx} className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-bold">مروارید شماره {idx + 1}</span>
                          {combinedPearls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCombinedPearls(combinedPearls.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                            >
                              حذف مروارید
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={cp.title}
                          onChange={(e) => {
                            const updated = [...combinedPearls];
                            updated[idx].title = e.target.value;
                            setCombinedPearls(updated);
                          }}
                          placeholder="عنوان مروارید (مثال: معیار درمانی طلایی)"
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                        <textarea
                          value={cp.content}
                          onChange={(e) => {
                            const updated = [...combinedPearls];
                            updated[idx].content = e.target.value;
                            setCombinedPearls(updated);
                          }}
                          placeholder="نکته علمی متراکم بالینی..."
                          rows={2}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION SPECIFIC FIELDS */}
              {contentType === "question" && (
                <div className="space-y-6 pt-4 border-t border-slate-800/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">شناسه درسنامه مربوطه (Chapter ID)</label>
                      <input
                        type="text"
                        value={chapterId}
                        onChange={(e) => setChapterId(e.target.value)}
                        placeholder="مثال: cardio_ch1 یا pedi_ch1"
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">شناسه جزیره آموزشی نقشه (Island ID)</label>
                      <select
                        value={islandId}
                        onChange={(e) => setIslandId(Number(e.target.value))}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value={2}>جزیره ۲ (سوالات موشکافانه)</option>
                        <option value={3}>جزیره ۳ (سناریوهای بالینی)</option>
                        <option value={4}>جزیره ۴ (تمرین‌های پیشرفته)</option>
                      </select>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-400">گزینه‌های پاسخ چهارگزینه‌ای *</label>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[idx] = e.target.value;
                            setOptions(updated);
                          }}
                          placeholder={`گزینه ${idx + 1}...`}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">گزینه صحیح دقیقاً به عنوان متن *</label>
                    <input
                      type="text"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      placeholder="متن کامل گزینه صحیح را دقیقاً همانند کادرهای بالا وارد کنید..."
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">توضیح کامل در صورت پاسخ صحیح (فارسی روان) *</label>
                      <textarea
                        value={explanationCorrect}
                        onChange={(e) => setExplanationCorrect(e.target.value)}
                        placeholder="استدلال حل سوال و نکات تشخیصی..."
                        rows={3}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">توضیح کامل در صورت پاسخ اشتباه (تله‌های تشخیص) *</label>
                      <textarea
                        value={explanationWrong}
                        onChange={(e) => setExplanationWrong(e.target.value)}
                        placeholder="چرا گزینه‌های دیگر نادرست هستند و تله‌های رایج آزمون چیست..."
                        rows={3}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-6 border-t border-slate-800/80 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("explorer")}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>ثبت و پایداری در پایگاه‌داده CMS</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DIRECT JSON EDITOR */}
          {activeSubTab === "jsonEditor" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">ویرایشگر مستقیم ساختار استاندارد JSON</h3>
                  <p className="text-xs text-slate-400 mt-1">آرایه خام JSON را مستقیماً ویرایش، کپی یا جایگذاری کنید.</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(rawJson);
                    setSuccessMsg("ساختار JSON با موفقیت در کلیپ‌بورد کپی شد.");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی محتوا</span>
                </button>
              </div>

              <div>
                <textarea
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  placeholder="[{ ... }, { ... }]"
                  rows={20}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-xs text-cyan-400 placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-all font-mono leading-relaxed"
                />
              </div>

              {/* Save Raw Button */}
              <div className="pt-6 border-t border-slate-800/80 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("explorer")}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSaveRawJson}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره و اعمال تغییرات گروهی JSON</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
