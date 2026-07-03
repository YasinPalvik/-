import React, { useState } from "react";
import { concepts, chapters } from "../lib/state";
import { ConceptNode, UserState } from "../types";
import { Award, Lock, BookOpen, CheckCircle, Info, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KnowledgeMapProps {
  userState: UserState;
  onSelectConcept?: (conceptId: string) => void;
}

export default function KnowledgeMap({ userState, onSelectConcept }: KnowledgeMapProps) {
  const [selectedConcept, setSelectedConcept] = useState<ConceptNode | null>(null);

  // Group concepts by chapter
  const conceptsByChapter = chapters.map((ch) => {
    const chConcepts = concepts.filter((c) => c.chapterId === ch.id);
    return {
      chapter: ch,
      concepts: chConcepts,
    };
  });

  // Determine status of each concept
  const getConceptStatus = (concept: ConceptNode) => {
    const isLearned = userState.completedConcepts.includes(concept.id);
    if (isLearned) return "mastered";

    // Check if prerequisites are completed
    const prereqsMet = concept.prerequisites.every((pid) =>
      userState.completedConcepts.includes(pid)
    );
    const isChapterUnlocked = userState.unlockedChapters.includes(concept.chapterId);

    if (prereqsMet && isChapterUnlocked) {
      return "available";
    }
    return "locked";
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-xs p-6 relative overflow-hidden" id="knowledge-map">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            نقشه بصری دانش پزشکی (Knowledge Map)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            با اتمام مفاهیم و پیش‌نیازها، گره‌های جدید فعال و درخشان می‌شوند. روی گره‌ها کلیک کنید.
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 block"></span>
            <span className="text-slate-600">تسلط یافته</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 block animate-pulse"></span>
            <span className="text-slate-600">آماده یادگیری</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 block"></span>
            <span className="text-slate-600">قفل شده</span>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {conceptsByChapter.map(({ chapter, concepts: chConcepts }, chIdx) => {
          const isUnlocked = userState.unlockedChapters.includes(chapter.id);
          const progress = userState.chapterProgress[chapter.id] || 0;

          return (
            <div
              key={chapter.id}
              className={`p-4 rounded-[22px] border transition-all ${
                isUnlocked
                  ? "bg-white/40 border-white/60 shadow-2xs"
                  : "bg-white/10 border-white/10 opacity-60 select-none cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUnlocked ? "bg-blue-50 text-blue-600 border border-blue-100/30" : "bg-slate-200/50 text-slate-400"
                  }`}>
                    {isUnlocked ? (
                      <span className="text-xs font-bold">{chIdx + 1}</span>
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{chapter.title}</h3>
                    <p className="text-[10px] text-slate-400">مبحث {chIdx + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Concepts List inside Chapter */}
              <div className="space-y-3">
                {chConcepts.map((concept, cIdx) => {
                  const status = getConceptStatus(concept);
                  const isHighStakes = concept.highStakes;

                  return (
                    <motion.button
                      whileHover={{ scale: status !== "locked" ? 1.02 : 1 }}
                      whileTap={{ scale: status !== "locked" ? 0.98 : 1 }}
                      key={concept.id}
                      onClick={() => status !== "locked" && setSelectedConcept(concept)}
                      disabled={status === "locked"}
                      className={`w-full text-right p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        status === "mastered"
                          ? "bg-white/85 border-emerald-200 shadow-2xs shadow-emerald-50/20 hover:border-emerald-300"
                          : status === "available"
                          ? "bg-white/85 border-blue-200 shadow-2xs shadow-blue-50/20 hover:border-blue-300 border-dashed"
                          : "bg-slate-200/10 border-transparent text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className={`text-xs font-semibold truncate ${
                            status === "locked" ? "text-slate-400" : "text-slate-700"
                          }`}>
                            {concept.title}
                          </h4>
                          {isHighStakes && status !== "locked" && (
                            <span className="bg-rose-50 text-[9px] text-rose-600 font-bold px-1 rounded scale-90 border border-rose-100 shrink-0">
                              محیط بالینی بحرانی (High-Stakes)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {status === "mastered" ? "فراگرفته شده" : status === "available" ? "آماده شروع" : "نیاز به اتمام پیش‌نیاز"}
                        </p>
                      </div>

                      <div className="shrink-0 mt-0.5">
                        {status === "mastered" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        ) : status === "available" ? (
                          <BookOpen className="w-4 h-4 text-blue-500 animate-pulse" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Concept Detail Modal Overlay */}
      <AnimatePresence>
        {selectedConcept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-20 rounded-[32px]"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-xl max-w-md w-full border border-slate-200/60 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block animate-pulse"></span>
                  <span className="text-xs font-bold text-blue-700">توضیحات علمی مفهوم</span>
                </div>
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 text-right" dir="rtl">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    {selectedConcept.title}
                    {selectedConcept.highStakes && (
                      <span className="bg-rose-50 text-[10px] text-rose-600 font-bold px-1.5 py-0.5 rounded border border-rose-100">
                        پیامد بالینی پرخطر
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    سطح یادگیری بلوم: <span className="font-semibold text-slate-600">{selectedConcept.bloomLevel}</span>
                  </p>
                </div>

                <div className="bg-blue-50/50 border border-blue-100/75 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    محتوای مرجع جزوه جراحی:
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {selectedConcept.definition}
                  </p>
                </div>

                {selectedConcept.prerequisites.length > 0 && (
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium">مفاهیم پیش‌نیاز: </span>
                    <span className="text-slate-600 font-semibold">
                      {selectedConcept.prerequisites.map(pid => {
                        const pre = concepts.find(c => c.id === pid);
                        return pre ? pre.title : pid;
                      }).join("، ")}
                    </span>
                  </div>
                )}

                {/* Quick actions inside the concept popup */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onSelectConcept) {
                        onSelectConcept(selectedConcept.id);
                        setSelectedConcept(null);
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    شروع مرور اختصاصی این مفهوم
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
