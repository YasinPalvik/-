import { adminDb } from '../lib/firebase-admin.ts';
import { Chapter, ConceptNode, Exercise } from '../types.ts';
import { chapters as localChapters, concepts as localConcepts, exercises as localExercises } from '../lib/state.ts';
import { syllabi as localSyllabi, ChapterSyllabus } from '../data/syllabus.ts';
import { extendedSyllabi } from '../data/content_extended.ts';
import { islandQuestionsData as localIslandQuestions, IslandQuestion } from '../data/islandQuestions.ts';

// Combine all local static syllabi
const mergedLocalSyllabi: Record<string, ChapterSyllabus> = {
  ...localSyllabi,
  ...extendedSyllabi
};

// Flatten local island questions
const flattenedLocalQuestions: IslandQuestion[] = [];
for (const [chId, qList] of Object.entries(localIslandQuestions)) {
  qList.forEach(q => {
    flattenedLocalQuestions.push({
      ...q,
      // Ensure chapterId is stored
      id: q.id || `${chId}_${q.islandId}_${Math.random().toString(36).substring(2, 7)}`
    });
  });
}

/**
 * Seeds content to Firestore if the collections are empty.
 * This guarantees zero downtime and automatically populates the Firestore database
 * with the entire rich medical curriculum on first launch.
 */
export async function seedContentIfEmpty() {
  try {
    console.log("Checking if dynamic content needs to be seeded...");

    // 1. Seed Chapters
    const chaptersSnap = await adminDb.collection('chapters').limit(1).get();
    if (chaptersSnap.empty) {
      console.log(`Seeding ${localChapters.length} chapters to Firestore...`);
      const batch = adminDb.batch();
      localChapters.forEach(ch => {
        const docRef = adminDb.collection('chapters').doc(ch.id);
        batch.set(docRef, ch);
      });
      await batch.commit();
      console.log("Chapters seeded successfully.");
    }

    // 2. Seed Concepts
    const conceptsSnap = await adminDb.collection('concepts').limit(1).get();
    if (conceptsSnap.empty) {
      console.log(`Seeding ${localConcepts.length} concepts to Firestore...`);
      // Since concepts can be many, let's batch them in groups of 200
      const chunks = chunkArray(localConcepts, 200);
      for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(concept => {
          const docRef = adminDb.collection('concepts').doc(concept.id);
          batch.set(docRef, concept);
        });
        await batch.commit();
      }
      console.log("Concepts seeded successfully.");
    }

    // 3. Seed Exercises
    const exercisesSnap = await adminDb.collection('exercises').limit(1).get();
    if (exercisesSnap.empty) {
      console.log(`Seeding ${localExercises.length} exercises to Firestore...`);
      const chunks = chunkArray(localExercises, 200);
      for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(ex => {
          const docRef = adminDb.collection('exercises').doc(ex.id);
          batch.set(docRef, ex);
        });
        await batch.commit();
      }
      console.log("Exercises seeded successfully.");
    }

    // 4. Seed Syllabi (lessons)
    const syllabusSnap = await adminDb.collection('syllabus').limit(1).get();
    if (syllabusSnap.empty) {
      const syllabiList = Object.values(mergedLocalSyllabi);
      console.log(`Seeding ${syllabiList.length} syllabus capsules to Firestore...`);
      const batch = adminDb.batch();
      syllabiList.forEach(syllabus => {
        const docRef = adminDb.collection('syllabus').doc(syllabus.chapterId);
        batch.set(docRef, syllabus);
      });
      await batch.commit();
      console.log("Syllabi seeded successfully.");
    }

    // 5. Seed Island Questions
    const questionsSnap = await adminDb.collection('island_questions').limit(1).get();
    if (questionsSnap.empty) {
      console.log(`Seeding ${flattenedLocalQuestions.length} island questions to Firestore...`);
      const chunks = chunkArray(flattenedLocalQuestions, 200);
      for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(q => {
          const docRef = adminDb.collection('island_questions').doc(q.id);
          batch.set(docRef, q);
        });
        await batch.commit();
      }
      console.log("Island questions seeded successfully.");
    }

    console.log("Dynamic content sync and seeding check completed successfully!");
  } catch (error) {
    console.error("Failed to seed content to Firestore:", error);
  }
}

// Helper to chunk arrays for Firestore batch writes
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Retrieves all chapters, merging Firestore data with local fallbacks.
 */
export async function getChapters(): Promise<Chapter[]> {
  try {
    const snap = await adminDb.collection('chapters').get();
    if (snap.empty) return localChapters;
    const items: Chapter[] = [];
    snap.forEach(doc => {
      items.push(doc.data() as Chapter);
    });
    return items;
  } catch (e) {
    console.error("Failed to fetch chapters from Firestore, returning local data:", e);
    return localChapters;
  }
}

/**
 * Retrieves all concepts, merging Firestore data with local fallbacks.
 */
export async function getConcepts(): Promise<ConceptNode[]> {
  try {
    const snap = await adminDb.collection('concepts').get();
    if (snap.empty) return localConcepts;
    const items: ConceptNode[] = [];
    snap.forEach(doc => {
      items.push(doc.data() as ConceptNode);
    });
    return items;
  } catch (e) {
    console.error("Failed to fetch concepts from Firestore, returning local data:", e);
    return localConcepts;
  }
}

/**
 * Retrieves all exercises, merging Firestore data with local fallbacks.
 */
export async function getExercises(): Promise<Exercise[]> {
  try {
    const snap = await adminDb.collection('exercises').get();
    if (snap.empty) return localExercises;
    const items: Exercise[] = [];
    snap.forEach(doc => {
      items.push(doc.data() as Exercise);
    });
    return items;
  } catch (e) {
    console.error("Failed to fetch exercises from Firestore, returning local data:", e);
    return localExercises;
  }
}

/**
 * Retrieves all syllabi (lessons), merging Firestore data with local fallbacks.
 */
export async function getSyllabi(): Promise<Record<string, ChapterSyllabus>> {
  try {
    const snap = await adminDb.collection('syllabus').get();
    if (snap.empty) return mergedLocalSyllabi;
    const res: Record<string, ChapterSyllabus> = {};
    snap.forEach(doc => {
      const data = doc.data() as ChapterSyllabus;
      res[doc.id] = data;
    });
    return res;
  } catch (e) {
    console.error("Failed to fetch syllabi from Firestore, returning local data:", e);
    return mergedLocalSyllabi;
  }
}

/**
 * Retrieves all island questions, merging Firestore data with local fallbacks.
 */
export async function getIslandQuestions(): Promise<Record<string, IslandQuestion[]>> {
  try {
    const snap = await adminDb.collection('island_questions').get();
    if (snap.empty) return localIslandQuestions;
    const res: Record<string, IslandQuestion[]> = {};
    
    snap.forEach(doc => {
      const data = doc.data() as IslandQuestion;
      // Derive chapterId from the question ID (e.g., ch1_isl2_q1 -> ch1) or use doc fields if we add it
      let chId = "ch1";
      if (data.id && data.id.includes("_")) {
        chId = data.id.split("_")[0];
      }
      if (!res[chId]) {
        res[chId] = [];
      }
      res[chId].push(data);
    });

    // Make sure we sort them by islandId for correct learning path!
    for (const chId in res) {
      res[chId].sort((a, b) => a.islandId - b.islandId);
    }

    return res;
  } catch (e) {
    console.error("Failed to fetch island questions from Firestore, returning local data:", e);
    return localIslandQuestions;
  }
}

/**
 * Saves/Edits a Syllabus Chapter in Firestore.
 */
export async function saveSyllabusChapter(chapterId: string, data: ChapterSyllabus) {
  await adminDb.collection('syllabus').doc(chapterId).set(data, { merge: true });
}

/**
 * Saves/Edits an Island Question in Firestore.
 */
export async function saveIslandQuestion(questionId: string, data: IslandQuestion) {
  await adminDb.collection('island_questions').doc(questionId).set(data, { merge: true });
}

/**
 * Saves/Edits a Chapter in Firestore.
 */
export async function saveChapter(chapterId: string, data: Chapter) {
  await adminDb.collection('chapters').doc(chapterId).set(data, { merge: true });
}

/**
 * Saves/Edits a Concept in Firestore.
 */
export async function saveConcept(conceptId: string, data: ConceptNode) {
  await adminDb.collection('concepts').doc(conceptId).set(data, { merge: true });
}

/**
 * Saves/Edits an Exercise in Firestore.
 */
export async function saveExercise(exerciseId: string, data: Exercise) {
  await adminDb.collection('exercises').doc(exerciseId).set(data, { merge: true });
}
