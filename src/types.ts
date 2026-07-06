export type BloomLevel = "recall" | "comprehension" | "application" | "analysis";

export type ExerciseType = "multipleChoice" | "fillBlank" | "matching" | "differential" | "caseStudy";

export interface Chapter {
  id: string;
  title: string;
  description: string;
}

export interface ConceptNode {
  id: string;
  chapterId: string;
  title: string;
  definition: string;
  bloomLevel: BloomLevel;
  prerequisites: string[];
  highStakes: boolean;
  distractors: string[];
  narrativeHook?: string;
  examTrap?: boolean;
  examTrapNote?: string;
}

export interface Exercise {
  id: string;
  conceptId: string;
  type: ExerciseType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanationCorrect: string;
  explanationWrong?: string;
}

export interface UserState {
  xp: number;
  hearts: number; // 0 to 5
  lastHeartRefillTime: string | null; // ISO timestamp
  dailyStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  diagnosisStreak: number; // Consecutive correct case studies
  completedConcepts: string[]; // List of concept IDs fully learned
  unlockedChapters: string[]; // List of chapter IDs unlocked
  chapterProgress: Record<string, number>; // chapterId -> progress percentage (0 to 100)
  weakConcepts: Record<string, number>; // conceptId -> number of errors
  exerciseHistory: Record<string, { lastAttempt: string; status: "correct" | "wrong"; ease: number; interval: number; repetitions: number }>; // conceptId -> spaced repetition info
  email?: string;
  fullName?: string;
  isPremium?: boolean;
  planType?: string;
  subscriptionDate?: string;
  currentSubject?: string; // e.g. "surgery" | "cardiology" | "pediatrics" | "gynecology" | "pharmacology"
}

export type SubjectId = "surgery" | "cardiology" | "pediatrics" | "gynecology" | "pharmacology";

export interface SubjectInfo {
  id: SubjectId;
  title: string;
  englishTitle: string;
  description: string;
  icon: string;
  colorTheme: string;
  accentColor: string;
}

export type ViewType = "dashboard" | "lesson" | "result" | "profile" | "settings" | "curriculum" | "studyhall" | "cms";
