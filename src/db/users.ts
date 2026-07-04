import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

const DEFAULT_STATE = {
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

export async function getOrCreateUser(uid: string, email: string, fullName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    // Insert new user if not found
    const result = await db.insert(users)
      .values({
        uid,
        email,
        fullName: fullName || null,
        state: DEFAULT_STATE,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database getOrCreateUser failed:", error);
    throw new Error("Failed to load or initialize user account.", { cause: error });
  }
}

export async function updateUserState(uid: string, state: any) {
  try {
    const result = await db.update(users)
      .set({
        state,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    if (result.length === 0) {
      throw new Error("User not found to update state.");
    }
    return result[0];
  } catch (error) {
    console.error("Database updateUserState failed:", error);
    throw new Error("Failed to save user progress.", { cause: error });
  }
}
