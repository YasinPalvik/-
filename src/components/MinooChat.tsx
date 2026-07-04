import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Trash2, X, Bot, Sparkles, Loader2, Key, HelpCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserState } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MinooChatProps {
  isOpen: boolean;
  onClose: () => void;
  idToken: string | null;
  userState: UserState;
  onTriggerAuth: () => void;
}

// Custom parser to render basic markdown structures and Persian text beautifully
const FormatMessageContent: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-slate-200 text-xs sm:text-sm leading-relaxed text-right font-sans">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Check for Warning box / Pitfall highlight
        if (trimmed.startsWith("⚠️") || trimmed.includes("تله") || trimmed.includes("هشدار")) {
          return (
            <motion.div
              key={idx}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="my-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 font-medium flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
            >
              <span className="text-base shrink-0">⚠️</span>
              <p className="flex-1 text-xs leading-relaxed">{trimmed.replace(/^⚠️\s*/, "")}</p>
            </motion.div>
          );
        }

        // Check for Pearl / Highlight boxes
        if (trimmed.startsWith("💎") || trimmed.startsWith("💎 ")) {
          return (
            <div key={idx} className="my-2.5 p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-300 flex items-start gap-2.5">
              <span className="shrink-0 text-base">💎</span>
              <p className="flex-1 text-xs leading-relaxed">{trimmed.replace(/^💎\s*/, "")}</p>
            </div>
          );
        }

        // Bullet point detection
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.match(/^\d+\./)) {
          const content = trimmed.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pr-2 text-slate-300 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <p className="flex-1 font-medium">{parseBoldText(content)}</p>
            </div>
          );
        }

        return <p key={idx} className="font-light">{parseBoldText(line)}</p>;
      })}
    </div>
  );
};

// Simple utility to parse **bold** words inside messages
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-white bg-white/5 px-1 py-0.5 rounded border border-white/5">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// Starter scientific questions aligned with the general syllabus
const STARTER_QUESTIONS = [
  { id: "q1", text: "⚠️ تله‌های بالینی مرگبار در جراحی چیست؟" },
  { id: "q2", text: "🩸 سه‌گانه مرگ تروما (Lethal Triad) را توضیح بده" },
  { id: "q3", text: "🧠 دوزهای حساس لیدوکائین چقدر است؟" },
  { id: "q4", text: "🧬 اصول احیای قلبی ریوی جراحی طبق رفرنس" },
];

export default function MinooChat({ isOpen, onClose, idToken, userState, onTriggerAuth }: MinooChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat history from localStorage on mount (for persistent clinical reference)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medophil_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } else {
        // Welcome message
        setMessages([
          {
            role: "assistant",
            content: `سلام همکار گرامی، دکتر ${userState.fullName || "پژوهشگر"}! 🩺✨\nمن **جراح مینو (Minoo AI)**، دستیار ارشد فوق‌تخصصی جراحی عمومی و هوش مصنوعی شما هستم.\n\nمن با تسلط کامل بر رفرنس‌های آموزشی ۹ فصل این پلتفرم، تله‌های بالینی جراحی، دوزهای حساس داروها و نکات گنجینه جراحی آماده پاسخگویی علمی هستم.\n\nچه مبحثی از پاتولوژی یا تکنیک‌های بالینی جراحی را می‌خواهید با هم مرور کنیم؟`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, [userState.fullName]);

  // Save messages to localStorage whenever history updates
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("medophil_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Automatically scroll to the latest medical message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Check Authentication
    if (!idToken) {
      setError("برای استفاده از هوش مصنوعی مینو، لطفاً ابتدا وارد حساب کاربری خود شوید.");
      return;
    }

    setError(null);
    const userMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // API call to our secure Express backend endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "خطا در پاسخ‌دهی سرور جراحی مینو");
      }

      const data = await response.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat message failed:", err);
      setError(err.message || "برقراری ارتباط با سرور جراحی مینو ناموفق بود.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("آیا می‌خواهید تاریخچه گفتگو با جراح مینو را پاک کنید؟")) {
      const welcome: Message = {
        role: "assistant",
        content: `سلام مجدد دکتر ${userState.fullName || "پژوهشگر"}! 🩺✨\nتاریخچه گفتگو با موفقیت پاک شد. آماده پاسخگویی به سوالات علمی جدید شما در مباحث جراحی عمومی هستم.`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
      localStorage.removeItem("medophil_chat_history");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10" dir="rtl">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Main Chat Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl h-[85vh] sm:h-[75vh] bg-[#020617]/90 border border-indigo-500/20 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.15)] backdrop-blur-2xl z-10"
      >
        {/* Dynamic Starry Accent Glow inside Chat */}
        <div className="absolute top-0 left-1/4 w-72 h-32 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-32 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />

        {/* 1. Header Area */}
        <div className="relative px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white">جراح مینو (Minoo AI)</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-extrabold text-indigo-300 uppercase tracking-wide">RAG Expert</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">پایشگر فوق‌تخصصی مبانی جراحی عمومی</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={handleClearHistory}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                title="پاک کردن گفتگو"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Messages & Scrollable Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin scrollbar-thumb-white/5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3.5 max-w-[85%] ${isAssistant ? "mr-0 ml-auto flex-row" : "mr-auto ml-0 flex-row-reverse"}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-extrabold ${
                    isAssistant
                      ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400"
                      : "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white"
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : (userState.fullName ? userState.fullName.substring(0, 1) : "U")}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl relative shadow-md ${
                    isAssistant
                      ? "bg-slate-900/40 border border-white/5 text-slate-100 rounded-tr-none"
                      : "bg-indigo-600/90 text-white rounded-tl-none font-medium"
                  }`}>
                    {isAssistant ? (
                      <FormatMessageContent text={msg.content} />
                    ) : (
                      <p className="text-xs sm:text-sm leading-relaxed text-right whitespace-pre-line">{msg.content}</p>
                    )}
                    <span className="block text-[8px] text-slate-400 text-left mt-2 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3.5 mr-0 ml-auto max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl rounded-tr-none flex items-center gap-2 text-indigo-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>دکتر مینو در حال پایش فصل‌های مرجع جراحی است...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex flex-col gap-3 items-center text-center justify-center"
              >
                <p className="font-semibold">{error}</p>
                {!idToken && (
                  <button
                    onClick={() => {
                      onClose();
                      onTriggerAuth();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-tr from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-[10px] sm:text-xs transition-all shadow-lg"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>ورود به حساب کاربری و احراز هویت</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preset Helper Cards if message pool is brand new */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pt-4 border-t border-white/5 space-y-3"
            >
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>سؤالات پیشنهادی برای پایش سریع علمی:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSendMessage(q.text)}
                    disabled={isLoading}
                    className="p-3 text-right text-[11px] sm:text-xs font-medium text-slate-300 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 rounded-xl transition-all cursor-pointer"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Input & Action Area */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-950/70 backdrop-blur-md shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-3 bg-white/5 border border-white/5 focus-within:border-indigo-500/30 p-1.5 rounded-2xl transition-all"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder={idToken ? "از جراح مینو بپرسید (مثلاً: دوز لیدوکائین ساده و با اپی‌نفرین چیست؟)" : "ابتدا وارد حساب کاربری شوید..."}
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white text-xs sm:text-sm px-3.5 py-2 text-right placeholder-slate-500"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3.5 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2.5 text-[9px] sm:text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1 font-mono tracking-wider text-indigo-400/80">
              <Sparkles className="w-3 h-3" /> Powered by Gemini RAG Engine
            </span>
            <span>جراح مینو اطلاعات را بر اساس سرفصل‌های معتبر جراحی پایش می‌کند.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
