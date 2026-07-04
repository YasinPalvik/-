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
      const u = existing[0];
      return {
        uid: u.uid,
        email: u.email,
        fullName: u.fullName,
        state: typeof u.state === "string" ? JSON.parse(u.state) : u.state || DEFAULT_STATE,
      };
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

    const u = result[0];
    return {
      uid: u.uid,
      email: u.email,
      fullName: u.fullName,
      state: typeof u.state === "string" ? JSON.parse(u.state) : u.state || DEFAULT_STATE,
    };
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
    const u = result[0];
    return {
      uid: u.uid,
      email: u.email,
      fullName: u.fullName,
      state: typeof u.state === "string" ? JSON.parse(u.state) : u.state || DEFAULT_STATE,
    };
  } catch (error) {
    console.error("Database updateUserState failed:", error);
    throw new Error("Failed to save user progress.", { cause: error });
  }
}

export async function getAllUsersForLeaderboard() {
  try {
    const allUsers = await db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      fullName: users.fullName,
      state: users.state,
    }).from(users);

    return allUsers.map((u) => {
      const stateObj = (typeof u.state === "string" ? JSON.parse(u.state) : u.state) as any || {};
      const xp = typeof stateObj.xp === "number" ? stateObj.xp : 0;
      // Get display name: fallback to email prefix if full name is empty
      const emailPrefix = u.email ? u.email.split("@")[0] : "کاربر مهمان";
      const displayName = u.fullName ? `دکتر ${u.fullName}` : `دکتر ${emailPrefix}`;
      
      return {
        uid: u.uid,
        name: displayName,
        xp,
      };
    }).sort((a, b) => b.xp - a.xp);
  } catch (error) {
    console.error("Database getAllUsersForLeaderboard failed:", error);
    return [];
  }
}

