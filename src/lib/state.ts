import { UserState, Chapter, ConceptNode, Exercise } from "../types";
import contentData from "../data/content.json";

// Cast JSON data to typed interfaces
export const chapters: Chapter[] = contentData.chapters as Chapter[];
export const concepts: ConceptNode[] = contentData.concepts as any[];
export const exercises: Exercise[] = contentData.exercises as any[];

const STORAGE_KEY = "medophil_user_state";

export const DEFAULT_STATE: UserState = {
  xp: 0,
  hearts: 5,
  lastHeartRefillTime: null,
  dailyStreak: 0,
  lastActiveDate: null,
  diagnosisStreak: 0,
  completedConcepts: [],
  unlockedChapters: ["ch1"],
  chapterProgress: {},
  weakConcepts: {},
  exerciseHistory: {},
};

// Check and update streak when app loads
export function checkStreak(state: UserState): UserState {
  const todayStr = new Date().toISOString().split("T")[0];
  if (!state.lastActiveDate) {
    return { ...state, dailyStreak: 0 };
  }

  const lastDate = new Date(state.lastActiveDate);
  const today = new Date(todayStr);
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    // Streak broken
    return { ...state, dailyStreak: 0 };
  }
  return state;
}

// Load state from localStorage
export function loadState(): UserState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_STATE;
    const parsed = JSON.parse(data) as UserState;
    return checkStreak(parsed);
  } catch (e) {
    console.error("Failed to load user state", e);
    return DEFAULT_STATE;
  }
}

// Save state to localStorage
export function saveState(state: UserState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save user state", e);
  }
}

// Check and regenerate hearts based on time (e.g., 1 heart every 30 mins)
export function updateHeartsByTime(state: UserState): UserState {
  if (state.hearts >= 5) return state;
  if (!state.lastHeartRefillTime) return { ...state, lastHeartRefillTime: new Date().toISOString() };

  const lastRefill = new Date(state.lastHeartRefillTime).getTime();
  const now = new Date().getTime();
  const diffMins = Math.floor((now - lastRefill) / (1000 * 60));
  const HEARTS_INTERVAL_MINS = 30; // 1 heart every 30 minutes

  if (diffMins >= HEARTS_INTERVAL_MINS) {
    const heartsToAdded = Math.floor(diffMins / HEARTS_INTERVAL_MINS);
    const newHearts = Math.min(5, state.hearts + heartsToAdded);
    const remainderMins = diffMins % HEARTS_INTERVAL_MINS;
    const newRefillTime = new Date(now - remainderMins * 60 * 1000).toISOString();

    return {
      ...state,
      hearts: newHearts,
      lastHeartRefillTime: newHearts >= 5 ? null : newRefillTime,
    };
  }

  return state;
}

// Calculate the progress of a specific chapter
export function getChapterProgress(chapterId: string, completedConcepts: string[]): number {
  const chapterConcepts = concepts.filter((c) => c.chapterId === chapterId);
  if (chapterConcepts.length === 0) return 0;

  const completedCount = chapterConcepts.filter((c) => completedConcepts.includes(c.id)).length;
  return Math.round((completedCount / chapterConcepts.length) * 100);
}

// Simple Spaced Repetition (SM-2 variant) updater
export function updateSpacedRepetition(
  state: UserState,
  conceptId: string,
  isCorrect: boolean
): UserState {
  const nowStr = new Date().toISOString();
  const history = state.exerciseHistory[conceptId] || {
    lastAttempt: nowStr,
    status: "correct",
    ease: 2.5,
    interval: 0,
    repetitions: 0,
  };

  let { ease, interval, repetitions } = history;

  if (isCorrect) {
    if (repetitions === 0) {
      interval = 1; // 1 day
    } else if (repetitions === 1) {
      interval = 3; // 3 days
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions++;
    ease = parseFloat(Math.min(3.0, Math.max(1.3, ease + 0.1)).toFixed(2));
  } else {
    repetitions = 0;
    interval = 1; // Try again tomorrow
    ease = parseFloat(Math.min(3.0, Math.max(1.3, ease - 0.2)).toFixed(2));
  }

  const updatedHistory = {
    ...state.exerciseHistory,
    [conceptId]: {
      lastAttempt: nowStr,
      status: isCorrect ? ("correct" as const) : ("wrong" as const),
      ease,
      interval,
      repetitions,
    },
  };

  // Update weak concepts log
  const updatedWeak = { ...state.weakConcepts };
  if (!isCorrect) {
    updatedWeak[conceptId] = (updatedWeak[conceptId] || 0) + 1;
  } else if (updatedWeak[conceptId] && updatedWeak[conceptId] > 0) {
    // If correct, decrement the weakness slowly or remove it
    updatedWeak[conceptId] = Math.max(0, updatedWeak[conceptId] - 1);
    if (updatedWeak[conceptId] === 0) {
      delete updatedWeak[conceptId];
    }
  }

  return {
    ...state,
    exerciseHistory: updatedHistory,
    weakConcepts: updatedWeak,
  };
}

// Award XP and handle completed concepts/chapters
export function completeConcept(state: UserState, conceptId: string, xpEarned: number): UserState {
  const todayStr = new Date().toISOString().split("T")[0];
  let updatedXP = state.xp + xpEarned;
  
  // Completed concepts list
  let completed = [...state.completedConcepts];
  if (!completed.includes(conceptId)) {
    completed.push(conceptId);
  }

  // Update daily active date & streak
  let streak = state.dailyStreak;
  if (state.lastActiveDate !== todayStr) {
    if (state.lastActiveDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (state.lastActiveDate === yesterdayStr) {
        streak += 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
  }

  // Chapter unlocking logic
  let unlocked = [...state.unlockedChapters];
  const conceptNode = concepts.find((c) => c.id === conceptId);
  if (conceptNode) {
    const currentChapterId = conceptNode.chapterId;
    const progress = getChapterProgress(currentChapterId, completed);
    
    // If chapter is fully completed (100% progress)
    if (progress === 100) {
      // Find index of current chapter
      const currentChIdx = chapters.findIndex((ch) => ch.id === currentChapterId);
      if (currentChIdx !== -1 && currentChIdx < chapters.length - 1) {
        const nextChapterId = chapters[currentChIdx + 1].id;
        if (!unlocked.includes(nextChapterId)) {
          unlocked.push(nextChapterId);
        }
      }
    }
  }

  // Re-calculate all chapter progress metrics
  const newChapterProgress: Record<string, number> = {};
  chapters.forEach((ch) => {
    newChapterProgress[ch.id] = getChapterProgress(ch.id, completed);
  });

  return {
    ...state,
    xp: updatedXP,
    completedConcepts: completed,
    unlockedChapters: unlocked,
    chapterProgress: newChapterProgress,
    lastActiveDate: todayStr,
    dailyStreak: streak,
  };
}
