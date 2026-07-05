import React, { useState, useEffect } from "react";
import { ConceptNode, Exercise, UserState } from "../types";
import { useContent } from "../lib/contentContext";
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Eye, 
  RefreshCw, 
  Volume2, 
  BookOpen, 
  Skull, 
  Activity, 
  Stethoscope, 
  Dna, 
  Lightbulb, 
  ClipboardList, 
  Flame, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LessonProps {
  chapterId: string;
  isReview: boolean;
  userState: UserState;
  onLessonComplete: (xpEarned: number, failedConcepts: string[]) => void;
  onLessonExit: () => void;
}

interface Slide {
  type: "concept" | "exercise";
  concept: ConceptNode;
  exercise?: Exercise;
}

export default function Lesson({ chapterId, isReview, userState, onLessonComplete, onLessonExit }: LessonProps) {
  const { concepts, exercises, chapters, syllabi } = useContent();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [hearts, setHearts] = useState(userState.hearts);
  const [xpEarned, setXpEarned] = useState(0);
  const [failedConcepts, setFailedConcepts] = useState<string[]>([]);
  
  // Interactive exercise state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Matching exercise state
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  // Clinical confidence meter state
  const [confidence, setConfidence] = useState<"high" | "low" | null>(null);
  const [showConfidencePrompt, setShowConfidencePrompt] = useState(false);

  // Syllabus vs Quiz Stages
  const [currentStage, setCurrentStage] = useState<"syllabus" | "quiz">(isReview ? "quiz" : "syllabus");
  const [syllabusTab, setSyllabusTab] = useState<"overview" | "content" | "pitfalls" | "pearls">("overview");
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [syllabusPage, setSyllabusPage] = useState(0);

  // Trigger sound feedback using the browser Web Audio API
  const playSound = (type: "correct" | "wrong" | "complete") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "correct") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "wrong") {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(147, ctx.currentTime + 0.1); // D3
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "complete") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Ignored if browser prevents audio before interaction
    }
  };

  // Build the slides queue upon lesson start
  useEffect(() => {
    let lessonConcepts: ConceptNode[] = [];
    
    if (isReview) {
      // Load weak concepts first
      const weakConceptIds = Object.keys(userState.weakConcepts);
      const learnedConceptIds = userState.completedConcepts;
      
      let candidateIds = [...weakConceptIds];
      if (candidateIds.length < 3) {
        // Supplement with already learned concepts for reinforcement
        candidateIds = [...candidateIds, ...learnedConceptIds.filter(id => !candidateIds.includes(id))];
      }

      // Final fallback to any concepts
      if (candidateIds.length < 3) {
        candidateIds = concepts.map(c => c.id);
      }

      // Take up to 4 concepts for the review session
      const selectedIds = candidateIds.slice(0, 4);
      lessonConcepts = concepts.filter(c => selectedIds.includes(c.id));
    } else {
      // Standard Chapter Lesson: get all concepts for this chapter
      lessonConcepts = concepts.filter(c => c.chapterId === chapterId);
    }

    const queue: Slide[] = [];

    // For each concept, add its introduction slide, then MCQ, then fill-in-the-blank or matching
    lessonConcepts.forEach((concept) => {
      // Step 1: Definition Card
      queue.push({ type: "concept", concept });

      // Step 2: Get exercises for this concept
      const conceptExercises = exercises.filter(e => e.conceptId === concept.id);
      
      // Split into simple MCQ vs others
      const normalExercises = conceptExercises.filter(e => e.type !== "caseStudy");
      const caseStudies = conceptExercises.filter(e => e.type === "caseStudy");

      normalExercises.forEach(ex => {
        queue.push({ type: "concept", concept }); // Keep concept context
        queue.push({ type: "exercise", concept, exercise: ex });
      });

      // We will queue Case Studies at the very end as "Boss Levels"
    });

    // Append Case Studies (Boss Level) at the end of the lesson queue
    const allConceptIds = lessonConcepts.map(c => c.id);
    const chapterCaseStudies = exercises.filter(
      e => e.type === "caseStudy" && allConceptIds.includes(e.conceptId)
    );

    chapterCaseStudies.forEach(cs => {
      const parentConcept = concepts.find(c => c.id === cs.conceptId);
      if (parentConcept) {
        queue.push({ type: "exercise", concept: parentConcept, exercise: cs });
      }
    });

    // Remove consecutive redundant 'concept' slides to keep the pace fast
    const cleanQueue: Slide[] = [];
    queue.forEach((slide) => {
      if (slide.type === "concept") {
        const lastSlide = cleanQueue[cleanQueue.length - 1];
        if (lastSlide && lastSlide.type === "concept" && lastSlide.concept.id === slide.concept.id) {
          // Skip redundant concept card
          return;
        }
      }
      cleanQueue.push(slide);
    });

    setSlides(cleanQueue);
  }, [chapterId, isReview]);

  const activeSlide = slides[currentSlideIdx];

  // Monitor when to prompt the Confidence Meter for Case Studies
  useEffect(() => {
    if (activeSlide && activeSlide.type === "exercise" && activeSlide.exercise?.type === "caseStudy") {
      setShowConfidencePrompt(true);
      setConfidence(null);
    } else {
      setShowConfidencePrompt(false);
      setConfidence(null);
    }
    // Reset answers
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchingPairs([]);
  }, [currentSlideIdx, slides]);

  // Handle checking the user's answer
  const handleCheckAnswer = () => {
    if (!activeSlide || activeSlide.type !== "exercise" || !activeSlide.exercise) return;
    const exercise = activeSlide.exercise;
    const concept = activeSlide.concept;

    let isUserCorrect = false;

    if (exercise.type === "multipleChoice" || exercise.type === "differential" || exercise.type === "caseStudy") {
      isUserCorrect = selectedOption === exercise.correctAnswer;
    } else if (exercise.type === "fillBlank") {
      isUserCorrect = selectedOption?.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();
    } else if (exercise.type === "matching") {
      isUserCorrect = selectedOption === exercise.correctAnswer;
    }

    setIsCorrect(isUserCorrect);
    setIsChecked(true);

    if (isUserCorrect) {
      playSound("correct");
      // Calculate XP award
      let baseXP = concept.highStakes ? 15 : 10;
      if (exercise.type === "caseStudy") {
        baseXP = 20;
        // Confidence bonus
        if (confidence === "high") {
          baseXP += 10; // +10 XP confidence bonus
        }
      }
      setXpEarned(prev => prev + baseXP);
    } else {
      playSound("wrong");
      // Record failed concept ID for profile metrics
      if (!failedConcepts.includes(concept.id)) {
        setFailedConcepts(prev => [...prev, concept.id]);
      }

      // Hearts deduction logic:
      const cost = concept.highStakes ? 2 : 1;
      const newHearts = Math.max(0, hearts - cost);
      setHearts(newHearts);
    }
  };

  // Continue to the next slide
  const handleNextSlide = () => {
    if (hearts <= 0) {
      // Exit lesson prematurely due to failure
      onLessonComplete(0, failedConcepts);
      return;
    }

    if (currentSlideIdx >= slides.length - 1) {
      // Completed the lesson successfully!
      playSound("complete");
      onLessonComplete(xpEarned, failedConcepts);
    } else {
      setCurrentSlideIdx(prev => prev + 1);
    }
  };

  // Skip / Continue on reading concept definition
  const handleContinueConcept = () => {
    if (currentSlideIdx >= slides.length - 1) {
      onLessonComplete(xpEarned, failedConcepts);
    } else {
      setCurrentSlideIdx(prev => prev + 1);
    }
  };

  // Calculate overall progress percentage
  const progressPercent = slides.length > 0 ? Math.round((currentSlideIdx / slides.length) * 100) : 0;

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-bold">در حال بارگذاری شبیه‌ساز تمرین بالینی...</p>
        </div>
      </div>
    );
  }

  // Hearts Depleted Screen
  if (hearts <= 0) {
    return (
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-rose-200 rounded-[32px] shadow-xl p-8 text-center space-y-6 animate-fade-in" dir="rtl">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-rose-700">جان‌های بالینی شما تمام شد!</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            در حین تمرین اشتباهات پرخطری انجام دادید. در دنیای واقعی این ناهماهنگی‌ها آسیب‌های جبران‌ناپذیری به بیماران وارد می‌کنند.
          </p>
        </div>

        <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100 text-right space-y-3">
          <h4 className="text-xs font-black text-rose-800">راهکار احیا:</h4>
          <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
            <li>می‌توانید به داشبورد بازگردید و یک <strong>جلسه مرور بالینی هوشمند</strong> انجام دهید تا تمام ۵ جان شما فوراً شارژ شود.</li>
            <li>یا مدتی صبر کنید تا جان‌های شما خودبه‌خود بازیابی شوند.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onLessonComplete(0, failedConcepts)}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-xs"
          >
            مشاهده پرونده و نتایج خطاها (Error Audit)
          </button>
          <button
            onClick={onLessonExit}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors"
          >
            انصراف و بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  if (currentStage === "syllabus") {
    const syllabus = syllabi[chapterId] || syllabi["ch1"];
    const currentChapter = chapters.find(c => c.id === chapterId);
    const sectionsCount = syllabus.sections.length;
    
    // Page allocation:
    // Page 0: Overview & Goals
    // Page 1 to sectionsCount: Detailed Sections
    // Page sectionsCount + 1: Clinical Pitfalls
    // Page sectionsCount + 2: Surgical Pearls
    // Page sectionsCount + 3: Finished / Ready to start quiz
    const totalSyllabusPages = 1 + sectionsCount + 1 + 1 + 1;

    const handleNextPage = () => {
      if (syllabusPage < totalSyllabusPages - 1) {
        setSyllabusPage(prev => prev + 1);
      } else {
        setCurrentStage("quiz");
      }
    };

    const handlePrevPage = () => {
      if (syllabusPage > 0) {
        setSyllabusPage(prev => prev - 1);
      }
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6 relative z-10" dir="rtl" id="syllabus-container">
        {/* Top Header Controls for Syllabus */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onLessonExit}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-white/5 transition-all shrink-0 flex items-center gap-1 text-xs font-bold"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>خروج</span>
          </button>
          
          <div className="flex-1 text-center">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-extrabold px-3 py-1.5 rounded-full border border-indigo-500/25">
              🎓 برنامه‌ریز درسی: بخش‌های درسنامه جراحی
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStage("quiz")}
              className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              شروع مستقیم کوییز ◀
            </button>
          </div>
        </div>

        {/* Dynamic Chapter Theme Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-white/10 rounded-[32px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute top-4 left-4 text-white/[0.03]">
            <BookOpen className="w-32 h-32" />
          </div>
          <div className="space-y-3 relative z-10 text-right">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                کلاس درس جراحی مدوفیل
              </span>
              <span className="bg-slate-900 border border-white/5 text-slate-400 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold">
                صفحه {syllabusPage + 1} از {totalSyllabusPages}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black">{currentChapter?.title || "درسنامه جراحی بالینی"}</h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
              {syllabus.overview}
            </p>
          </div>
        </div>

        {/* Main Paginated Syllabus Card */}
        <div className="bg-slate-900/40 border border-white/[0.06] backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Top Multi-Page Stepper Timeline */}
          <div className="border-b border-white/5 bg-slate-950/40 px-6 py-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[...Array(totalSyllabusPages)].map((_, idx) => {
                const isActive = syllabusPage === idx;
                const isCompleted = syllabusPage > idx;
                
                let label = "";
                if (idx === 0) label = "نمای کلی";
                else if (idx <= sectionsCount) label = `بخش ${idx}`;
                else if (idx === sectionsCount + 1) label = "دام‌های بالینی";
                else if (idx === sectionsCount + 2) label = "نکات طلایی";
                else label = "اتمام و شروع";

                return (
                  <button
                    key={idx}
                    onClick={() => setSyllabusPage(idx)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 border ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/15 scale-105"
                        : isCompleted
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                        : "bg-slate-900/40 text-slate-500 border-white/[0.02] hover:text-slate-300 hover:border-white/10"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black font-sans ${
                      isActive 
                        ? "bg-white text-indigo-900" 
                        : isCompleted 
                        ? "bg-emerald-500 text-slate-950" 
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Page Content Display Area */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`syllabus-page-${syllabusPage}`}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Render Page 0: Overview & Goals */}
                  {syllabusPage === 0 && (
                    <div className="space-y-5 text-right">
                      <div className="space-y-1">
                        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-black px-2.5 py-1 rounded-md">۱. اهداف یادگیری و دورنمای تحصیلی</span>
                        <h3 className="text-base font-black text-white pt-2">نقشه راه و اهداف تحصیلی فصل جراحی</h3>
                        <p className="text-[11px] text-slate-400 font-sans">به عنوان پزشک معالج، پیش از ورود به کوییز باید به این سرفصل‌ها تسلط یابید:</p>
                      </div>

                      <div className="bg-slate-950/60 border border-white/[0.04] p-5 rounded-2xl leading-relaxed text-xs text-slate-300 space-y-4 font-sans">
                        <p className="font-semibold text-slate-200">
                          تسلط بر اصول فیزیولوژیک این بخش، ابزار بقای شما در مواجهه با بیماران اورژانسی یا بستری در بخش است. در ادامه بخش‌های این درسنامه آورده شده است:
                        </p>
                        <div className="space-y-3 pt-2">
                          {syllabus.sections.map((sec, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-white/[0.02]">
                              <span className="w-5 h-5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <strong className="text-indigo-300 text-xs">{sec.title}</strong>
                                <p className="text-[10px] text-slate-400 mt-1">بررسی فیزیولوژی، تشخیص بالینی و درمان انتخابی مبحث</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl text-right">
                        <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                          <strong>توصیه جراح ارشد:</strong> درسنامه به گونه‌ای طراحی شده تا سناریوهای بالینی واقعی را به چالش بکشد. با مطالعه دقیق ورق بزنید و برای امتحان کوییز آماده شوید.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Render Page 1 to sectionsCount: Detailed Sections */}
                  {syllabusPage > 0 && syllabusPage <= sectionsCount && (() => {
                    const secIndex = syllabusPage - 1;
                    const activeSec = syllabus.sections[secIndex];
                    return (
                      <div className="space-y-5 text-right">
                        <div className="space-y-1">
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-black px-2.5 py-1 rounded-md">
                            بخش {syllabusPage} از {sectionsCount}: مفاهیم پایه
                          </span>
                          <h3 className="text-base font-black text-white pt-2 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            {activeSec?.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-sans">توضیحات و درسنامه تشخیصی عمیق جراحی</p>
                        </div>

                        <div className="bg-slate-950/60 border border-white/[0.04] p-5 rounded-2xl leading-relaxed text-xs text-slate-300 whitespace-pre-line font-sans shadow-inner max-h-[290px] overflow-y-auto">
                          {activeSec?.content}
                        </div>

                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 text-[10px] text-slate-400 font-sans flex justify-between items-center">
                          <span>پیشرفت مبانی درسنامه</span>
                          <span className="font-mono">{Math.round((syllabusPage / sectionsCount) * 100)}%</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Render Page sectionsCount + 1: Clinical Pitfalls */}
                  {syllabusPage === sectionsCount + 1 && (
                    <div className="space-y-5 text-right">
                      <div className="space-y-1">
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black px-2.5 py-1 rounded-md">دام‌های بحرانی بخش جراحی</span>
                        <h3 className="text-base font-black text-rose-400 pt-2 flex items-center gap-2">
                          <Skull className="w-5 h-5 text-rose-500" />
                          دام‌های پرتکرار و سناریوهای فاجعه‌آفرین بالینی
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans">اشتباهاتی که یک جراح هرگز نباید در بالین مرتکب شود:</p>
                      </div>

                      <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
                        {syllabus.pitfalls.map((pit, idx) => (
                          <div key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 space-y-2.5 text-right">
                            <h4 className="text-xs font-black text-rose-300 flex items-center gap-2">
                              <span className="w-5 h-5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                              {pit.title}
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {pit.description}
                            </p>
                            <div className="bg-rose-950/60 text-rose-200 p-3 rounded-xl border border-rose-500/20 text-[10px] leading-relaxed flex gap-2 font-sans">
                              <span className="font-extrabold text-rose-400 shrink-0">💀 پیامد بالینی واقعی:</span>
                              <p>{pit.consequence}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Page sectionsCount + 2: Surgical Pearls */}
                  {syllabusPage === sectionsCount + 2 && (
                    <div className="space-y-5 text-right">
                      <div className="space-y-1">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2.5 py-1 rounded-md">مرواریدهای جراحی (Surgical Pearls)</span>
                        <h3 className="text-base font-black text-amber-400 pt-2 flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-400 fill-amber-400/10" />
                          نکات ترکیبی و مرواریدهای جراحی بالینی
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans">ارتباطات همگرا بین داروشناسی، جراحی و پاتولوژی:</p>
                      </div>

                      <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                        {syllabus.combinedPearls.map((pearl, idx) => (
                          <div key={idx} className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-2 text-right">
                            <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              {pearl.title}
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {pearl.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Page sectionsCount + 3: Ready Screen */}
                  {syllabusPage === sectionsCount + 3 && (
                    <div className="space-y-6 text-center py-6">
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-2">
                        <Check className="w-8 h-8 stroke-[3]" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base font-black text-white">تبریک! تمام صفحات درسنامه را مطالعه کردید 🎓</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
                          شما با موفقیت فرآیند سگمنت‌بندی شده و فازهای درسنامه جراحی را ورق زدید و هم‌اکنون آماده شروع سناریوهای کوییز بالینی هستید.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/[0.04] text-right space-y-3 max-w-md mx-auto">
                        <h4 className="text-xs font-black text-indigo-300">خلاصه آمادگی شما:</h4>
                        <ul className="text-[11px] text-slate-400 space-y-2 list-none font-sans">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>مطالعه عمیق <strong>{sectionsCount} بخش</strong> علمی درسنامه جراحی</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>بررسی تله‌های امتحانی و <strong>پیشگیری از اشتباهات مرگبار</strong></span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>ارتباط کانسپت‌ها و نکات همگرای مروارید جراحی</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Multi-Page Navigation Controls */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-6 gap-4">
              <button
                onClick={handlePrevPage}
                disabled={syllabusPage === 0}
                className="bg-slate-900/60 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900/60 text-slate-300 border border-white/10 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shrink-0"
              >
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span>صفحه قبل</span>
              </button>

              <div className="text-[10px] text-slate-500 font-mono font-bold hidden sm:block">
                ورق‌زدن درسنامه جراحی • صفحه {syllabusPage + 1} از {totalSyllabusPages}
              </div>

              {syllabusPage === totalSyllabusPages - 1 ? (
                <button
                  onClick={() => setCurrentStage("quiz")}
                  className="bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center gap-1.5 animate-pulse"
                >
                  <span>ورود به شبیه‌ساز بالینی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNextPage}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <span>صفحه بعد</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative z-10" dir="rtl" id="lesson-view">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Back button */}
        <button
          onClick={onLessonExit}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white/40 transition-all shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>پیشرفت تمرین</span>
            <span>{progressPercent}% ({currentSlideIdx} از {slides.length})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Dynamic score & Hearts display */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50/50 border border-blue-100/30 px-2.5 py-1 rounded-full backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{xpEarned} XP</span>
          </div>

          <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="text-xs font-bold text-rose-700 font-mono">{hearts}</span>
          </div>
        </div>
      </div>

      {/* Main Slide Card Area */}
      <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-xs overflow-hidden min-h-[380px] flex flex-col justify-between relative z-10">
        
        {/* Slide Content wrapper */}
        <div className="p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            
            {/* 1. CONCEPT Card view */}
            {activeSlide.type === "concept" && (
              <motion.div
                key={`concept-${activeSlide.concept.id}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6 text-right"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 block animate-pulse"></span>
                    <span className="text-xs font-bold text-blue-600">کارت معرفی مفهوم جراحی</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    {activeSlide.concept.title}
                    {activeSlide.concept.highStakes && (
                      <span className="bg-rose-50 text-[10px] text-rose-600 font-bold px-1.5 py-0.5 rounded border border-rose-100">
                        پیامد بالینی پرخطر (High-Stakes)
                      </span>
                    )}
                  </h2>
                </div>

                <div className="space-y-4">
                  {activeSlide.concept.narrativeHook ? (
                    <div className="bg-amber-50/20 border border-amber-200/50 p-6 rounded-2xl leading-relaxed text-sm text-slate-700 font-sans whitespace-pre-line shadow-2xs">
                      <div className="text-[10px] text-amber-700 font-black mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>شرح داستانی و مثال بالینی (Narrative Hook)</span>
                      </div>
                      {activeSlide.concept.narrativeHook}
                    </div>
                  ) : (
                    <div className="bg-white/50 border border-white/60 p-6 rounded-2xl leading-relaxed text-sm text-slate-700 font-sans whitespace-pre-line shadow-2xs">
                      {activeSlide.concept.definition}
                    </div>
                  )}

                  {activeSlide.concept.examTrap && activeSlide.concept.examTrapNote && (
                    <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl leading-relaxed text-xs text-rose-950 space-y-2 text-right shadow-2xs">
                      <div className="flex items-center gap-2 text-rose-800 font-black">
                        <Skull className="w-4 h-4 animate-pulse" />
                        <span>⚠️ تله‌ی امتحانی بالینی (Exam Trap)</span>
                      </div>
                      <p className="font-sans leading-relaxed">{activeSlide.concept.examTrapNote}</p>
                    </div>
                  )}

                  {activeSlide.concept.narrativeHook && (
                    <div className="bg-slate-50/60 border border-slate-200/60 p-4 rounded-xl leading-relaxed text-xs text-slate-600 font-sans whitespace-pre-line">
                      <div className="font-bold text-slate-500 mb-1">خلاصه علمی اتمی (Atomic Definition):</div>
                      {activeSlide.concept.definition}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 leading-relaxed">
                  💡 <strong>نکته آموزش بالینی:</strong> این مفهوم را با دقت مطالعه کنید. در اسلایدهای بعدی تمرین‌های تعاملی و کیس‌های بالینی فرضی مرتبط با این مفهوم را حل خواهید کرد.
                </div>
              </motion.div>
            )}

            {/* 2. EXERCISE view */}
            {activeSlide.type === "exercise" && activeSlide.exercise && (
              <motion.div
                key={`exercise-${activeSlide.exercise.id}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6 text-right"
              >
                {/* Exercise Metadata header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100/30">
                      {activeSlide.exercise.type === "caseStudy"
                        ? "سناریو بالینی (Boss Level)"
                        : "تمرین یادگیری جراحی"}
                    </span>
                    {activeSlide.concept.highStakes && (
                      <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                        محیط بحرانی (High-Stakes)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">مفهوم: {activeSlide.concept.title}</span>
                </div>

                {/* 2.A Confidence meter prompt for Case Studies */}
                {showConfidencePrompt && (
                  <div className="space-y-5 py-4 text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <HelpCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-2 max-w-sm mx-auto">
                      <h3 className="text-sm font-black text-slate-800">میزان اطمینان تشخیصی (Clinical Confidence)</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        این یک کیس شبیه‌سازی بالینی است. قبل از دیدن گزینه‌ها، چقدر به تشخیص و قضاوت درمانی خود اطمینان دارید؟
                      </p>
                    </div>

                    <div className="flex gap-4 max-w-xs mx-auto">
                      <button
                        onClick={() => {
                          setConfidence("high");
                          setShowConfidencePrompt(false);
                        }}
                        className="flex-1 bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 font-extrabold text-xs py-3 rounded-xl border border-blue-200/50 transition-colors shadow-2xs"
                      >
                        کاملاً مطمئنم! (+XP بیشتر)
                      </button>
                      <button
                        onClick={() => {
                          setConfidence("low");
                          setShowConfidencePrompt(false);
                        }}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-3 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                      >
                        اطمینان ندارم / حدس می‌زنم
                      </button>
                    </div>
                  </div>
                )}

                {/* Main exercise details */}
                {!showConfidencePrompt && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Prompt question */}
                    <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/50 shadow-2xs">
                      <p className="text-sm font-black text-slate-800 leading-relaxed">
                        {activeSlide.exercise.prompt}
                      </p>
                    </div>

                    {/* Exercise Option List */}
                    <div className="space-y-3">
                      {activeSlide.exercise.options?.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        return (
                          <button
                            key={idx}
                            disabled={isChecked}
                            onClick={() => setSelectedOption(option)}
                            className={`w-full text-right p-4 rounded-2xl border-2 text-xs font-extrabold leading-relaxed transition-all flex items-center gap-3 select-none active:translate-y-[2px] ${
                              isChecked
                                ? option === activeSlide.exercise?.correctAnswer
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 border-b-[6px] border-emerald-600"
                                  : isSelected
                                  ? "bg-rose-50 border-rose-400 text-rose-900 border-b-[6px] border-rose-600"
                                  : "bg-slate-50 border-slate-200 text-slate-400 border-b-[6px] border-slate-300 opacity-60"
                                : isSelected
                                ? "bg-blue-50 border-blue-400 text-blue-900 border-b-[6px] border-blue-600 translate-y-[2px]"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 border-b-[6px] border-slate-300 hover:border-slate-300"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border-2 ${
                              isChecked
                                ? option === activeSlide.exercise?.correctAnswer
                                  ? "bg-emerald-500 border-emerald-600 text-white"
                                  : isSelected
                                  ? "bg-rose-500 border-rose-600 text-white"
                                  : "bg-slate-200 border-slate-300 text-slate-400"
                                : isSelected
                                ? "bg-blue-500 border-blue-600 text-white"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="flex-1">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Foot Action Buttons / Autopsy Display */}
        <div className="p-4 border-t border-slate-200/60 bg-white/20 backdrop-blur-md">
          
          {/* Autopsy / Explanations Section */}
          {isChecked && activeSlide.type === "exercise" && activeSlide.exercise && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-[24px] border-2 text-right space-y-4 mb-4 ${
                isCorrect
                  ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-emerald-500/5"
                  : "bg-rose-50/90 border-rose-300 text-rose-950 shadow-rose-500/5"
              }`}
            >
              {/* Diagnostic Alert Banner */}
              <div className="flex items-center gap-3 border-b pb-3 border-slate-200/50">
                {isCorrect ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-black tracking-tight leading-none text-slate-800">
                    {isCorrect ? "قضاوت بالینی کاملاً صحیح و طلایی" : "کالبدشکافی خطای بالینی و تصمیم نادرست"}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">بخش پاسخ تشریحی تفصیلی و مستند</span>
                </div>
              </div>

              {/* Section 1: Detailed explanation (پاسخ تشریحی) */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>۱. تحلیل فیزیولوژیک و پاتوفیزیولوژی سناریو:</span>
                </h5>
                <p className="text-xs leading-relaxed text-slate-600 font-sans pl-1">
                  {isCorrect 
                    ? activeSlide.exercise.explanationCorrect 
                    : (activeSlide.exercise.explanationWrong || "پاسخ انتخابی با اصول جراحی بالینی مغایرت دارد. گزینه‌های دیگر را برای درک علت نادرستی بررسی کنید.")
                  }
                </p>
              </div>

              {/* Section 2: Distractor Analysis (بررسی سایر گزینه‌ها) */}
              <div className="space-y-2 bg-white/60 p-3 rounded-xl border border-slate-200/40">
                <h5 className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                  <span>۲. کالبدشکافی و رد سایر گزینه‌های انحرافی (Distractors Autopsy):</span>
                </h5>
                <div className="text-[10px] leading-relaxed text-slate-500 space-y-1.5 pr-1">
                  {activeSlide.exercise.options?.filter(opt => opt !== activeSlide.exercise?.correctAnswer).map((distractor, dIdx) => (
                    <div key={dIdx} className="flex gap-2">
                      <span className="text-rose-500 font-bold shrink-0">◀</span>
                      <p>
                        گزینه <strong className="text-rose-600">"{distractor.substring(0, 30)}..."</strong> به دلیل انحراف از راهنمای بالینی و یا ایجاد تداخل دارویی/فیزیولوژیک رد می‌شود. {dIdx === 0 && "این رویکرد به معنای بی‌دقتی در تفسیر علائم پایشگر و تعجیل در جراحی است."} {dIdx === 1 && "انتخاب این گزینه خطر سقوط همودینامیک و عواقب قلبی برای بیمار به همراه دارد."} {dIdx === 2 && "این تصمیم بالینی فاقد پایه‌های فیزیولوژی انعقاد یا شوک بوده و مایه تاخیر است."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Real World Consequence */}
              <div className="space-y-1.5 bg-rose-50 border border-rose-200/50 p-3 rounded-xl">
                <h5 className="text-[11px] font-black text-rose-800 flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5 text-rose-600" />
                  <span>۳. پیامد واقعی این تصمیم بر بالین بیمار جراحی:</span>
                </h5>
                <p className="text-[10px] leading-relaxed text-slate-600">
                  {isCorrect 
                    ? "با این اقدام طلایی، از بروز عوارض مرگباری چون ایست قلبی حین شوک، عفونت نکروزان عمیق زخم جراحی یا دمیلیناسیون سیستم عصبی پل مغزی به خوبی پیشگیری نمودید." 
                    : "بر اساس گزارشات مراجع پزشکی قانونی جراحی، چنین تصمیمی حین شوک یا جراحی می‌تواند به خونریزی وسیع ریوی، ایسکمی مطلق بافتی یا سپتیسمی مقاوم به آنتی‌بیوتیک و در نهایت خفگی یا ایست قلبی منتهی شود."
                  }
                </p>
              </div>

              {/* Section 4: Pearl */}
              <div className="space-y-1 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <h5 className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 fill-amber-500/10" />
                  <span>💎 مروارید طلایی و نکته حفظ جان بیمار:</span>
                </h5>
                <p className="text-[10px] leading-relaxed text-amber-950 font-bold">
                  {activeSlide.concept.definition.split(".").slice(0, 2).join(".") + "."}
                </p>
              </div>

              {/* Confidence feedback autopsy */}
              {!isCorrect && confidence === "high" && (
                <div className="bg-rose-950 text-white p-3 rounded-xl border border-rose-700 text-[10px] font-bold leading-relaxed">
                  ⚠️ <strong>اشتباه پرهزینه بالینی (High Confidence Error):</strong> شما با اطمینانِ بالا تشخیص اشتباه دادید! در بالین واقعی این نوع قضاوت قاطع نادرست منجر به فاجعه قلبی-عروقی، عفونت‌های مرگبار یا مرگ حتمی بیمار می‌شود. همیشه علائم را دوباره پایش کنید!
                </div>
              )}
            </motion.div>
          )}

          {/* Core Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            
            {activeSlide.type === "concept" ? (
              <button
                onClick={handleContinueConcept}
                className="w-full bg-blue-500 hover:bg-blue-400 active:bg-blue-500 text-white font-black text-xs py-3.5 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
              >
                فهمیدم، رفتن به تمرین‌ها
              </button>
            ) : (
              !showConfidencePrompt && (
                <button
                  onClick={isChecked ? handleNextSlide : handleCheckAnswer}
                  disabled={!selectedOption && !isChecked}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    isChecked
                      ? "bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white border-b-4 border-slate-950 active:border-b-0 active:translate-y-[4px]"
                      : selectedOption
                      ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 text-white border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[4px]"
                      : "bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed"
                  }`}
                >
                  {isChecked ? (
                    currentSlideIdx >= slides.length - 1 ? "پایان درس و بررسی نتایج" : "سوال بعدی"
                  ) : "بررسی پاسخ تشخیصی"}
                </button>
              )
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
