import { adminDb as db } from '../lib/firebase-admin.ts';
import { Chapter, ConceptNode, Exercise } from '../types.ts';
import { chapters as localChapters, concepts as localConcepts, exercises as localExercises } from '../lib/state.ts';
import { syllabi as localSyllabi, ChapterSyllabus } from '../data/syllabus.ts';
import { extendedSyllabi } from '../data/content_extended.ts';
import { islandQuestionsData as localIslandQuestions, IslandQuestion } from '../data/islandQuestions.ts';
import fs from 'fs';
import path from 'path';

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
      id: q.id || `${chId}_${q.islandId}_${Math.random().toString(36).substring(2, 7)}`
    });
  });
}

let isDatabaseUnconfigured = false;

function handleFirestoreError(e: any, contextMsg: string) {
  const errMsg = e?.message || String(e);
  if (
    errMsg.includes("PERMISSION_DENIED") ||
    errMsg.includes("permission-denied") ||
    errMsg.includes("Missing or insufficient permissions") ||
    errMsg.includes("Cloud Firestore API has not been used") ||
    e?.code === "permission-denied" ||
    e?.code === 7
  ) {
    if (!isDatabaseUnconfigured) {
      isDatabaseUnconfigured = true;
      console.warn(`\n[Firestore Status] ⚠️ database is currently unconfigured or requires rules update. Switching to local-first fallback mode gracefully.`);
      console.warn(`To enable cloud data persistence on your personal project "sag-nazan", please visit your Firebase Console -> Firestore Database -> Rules tab, and paste the contents of the "firestore.rules" file.\n`);
    }
  } else {
    console.warn(`${contextMsg}:`, errMsg);
  }
}

/**
 * Standard CMS Content Item Structure
 */
export interface CMSContentItem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  content_type: "lesson" | "question";
  data: any;
}

/**
 * Helper to fetch and merge all CMS items from local JSON and Firestore
 */
export async function getAllCmsItems(): Promise<CMSContentItem[]> {
  const items: CMSContentItem[] = [];

  // 1. Load from local static JSON cms_content.json
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'cms_content.json');
    if (fs.existsSync(jsonPath)) {
      const fileData = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(fileData) as CMSContentItem[];
      items.push(...parsed);
    }
  } catch (err) {
    console.error("Failed to read local cms_content.json:", err);
  }

  if (isDatabaseUnconfigured) {
    return items;
  }

  // 2. Load from Firestore cms_items collection using Admin SDK
  try {
    const snap = await db.collection('cms_items').get();
    if (!snap.empty) {
      snap.forEach(docSnap => {
        const item = { id: docSnap.id, ...docSnap.data() } as CMSContentItem;
        const existingIdx = items.findIndex(x => x.id === item.id);
        if (existingIdx !== -1) {
          items[existingIdx] = item; // override local with Firestore
        } else {
          items.push(item);
        }
      });
    }
  } catch (err) {
    handleFirestoreError(err, "Failed to read cms_items from Firestore");
  }

  return items;
}

/**
 * Dynamic CMS Parsers
 */
export async function getCmsChapters(): Promise<Chapter[]> {
  const items = await getAllCmsItems();
  return items
    .filter(item => item.content_type === "lesson")
    .map(item => ({
      id: item.id,
      title: item.title,
      description: item.data?.overview || ""
    }));
}

export async function getCmsSyllabi(): Promise<Record<string, ChapterSyllabus>> {
  const items = await getAllCmsItems();
  const syllabi: Record<string, ChapterSyllabus> = {};
  items
    .filter(item => item.content_type === "lesson")
    .forEach(item => {
      syllabi[item.id] = {
        chapterId: item.id,
        overview: item.data?.overview || item.title,
        sections: item.data?.sections || [],
        pitfalls: item.data?.pitfalls || [],
        combinedPearls: item.data?.combinedPearls || []
      };
    });
  return syllabi;
}

export async function getCmsConcepts(): Promise<ConceptNode[]> {
  const items = await getAllCmsItems();
  return items
    .filter(item => item.content_type === "lesson")
    .map(item => ({
      id: `${item.id}_concept`,
      chapterId: item.id,
      title: `مفاهیم کلیدی: ${item.title}`,
      definition: item.data?.overview || item.title,
      bloomLevel: item.difficulty === "hard" ? "analysis" : item.difficulty === "medium" ? "comprehension" : "recall",
      prerequisites: [],
      highStakes: true,
      distractors: ["تله تشخیصی اشتباه", "عدم ارزیابی علائم حیاتی"],
      narrativeHook: item.data?.overview
    }));
}

export async function getCmsExercises(): Promise<Exercise[]> {
  const items = await getAllCmsItems();
  return items
    .filter(item => item.content_type === "question")
    .map(item => ({
      id: item.id,
      conceptId: `${item.data?.chapterId || "cardio_ch1"}_concept`,
      type: item.data?.type || "multipleChoice",
      prompt: item.title,
      options: item.data?.options || [],
      correctAnswer: item.data?.correctAnswer || "",
      explanationCorrect: item.data?.explanationCorrect || "پاسخ صحیح بالینی",
      explanationWrong: item.data?.explanationWrong || ""
    }));
}

export async function getCmsIslandQuestions(): Promise<Record<string, IslandQuestion[]>> {
  const items = await getAllCmsItems();
  const qMap: Record<string, IslandQuestion[]> = {};

  items
    .filter(item => item.content_type === "question")
    .forEach(item => {
      const chId = item.data?.chapterId || "cardio_ch1";
      const islandId = item.data?.islandId || 2;
      const q: IslandQuestion = {
        id: item.id,
        islandId,
        islandName: islandId === 3 ? "جزیره ۳: سناریوهای بالینی (Clinical Cases)" : "جزیره ۲: سوالات موشکافانه آموزشی",
        question: item.title,
        options: item.data?.options || [],
        correctIndex: item.data?.options && item.data?.correctAnswer ? item.data.options.indexOf(item.data.correctAnswer) : 0,
        reasoning: item.data?.explanationCorrect || "پاسخ صحیح بالینی",
        clinicalPearls: item.data?.explanationWrong || "نکته علمی مربوط به سوال",
        syllabusLinkSectionIdx: 0,
        syllabusLinkName: "بخش آموزشی درسنامه"
      };

      if (q.correctIndex === -1) q.correctIndex = 0;

      if (!qMap[chId]) qMap[chId] = [];
      qMap[chId].push(q);
    });

  return qMap;
}

/**
 * Seeds content to Firestore if the collections are empty.
 */
export async function seedContentIfEmpty() {
  if (isDatabaseUnconfigured) {
    return;
  }
  try {
    console.log("Checking if dynamic content needs to be seeded...");

    // 1. Seed Chapters
    const chaptersSnap = await db.collection('chapters').limit(1).get();
    if (chaptersSnap.empty) {
      console.log(`Seeding ${localChapters.length} chapters to Firestore...`);
      const batch = db.batch();
      localChapters.forEach(ch => {
        const docRef = db.collection('chapters').doc(ch.id);
        batch.set(docRef, ch);
      });
      await batch.commit();
      console.log("Chapters seeded successfully.");
    }

    // 2. Seed Concepts
    const conceptsSnap = await db.collection('concepts').limit(1).get();
    if (conceptsSnap.empty) {
      console.log(`Seeding ${localConcepts.length} concepts to Firestore...`);
      const chunks = chunkArray(localConcepts, 200);
      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach(concept => {
          const docRef = db.collection('concepts').doc(concept.id);
          batch.set(docRef, concept);
        });
        await batch.commit();
      }
      console.log("Concepts seeded successfully.");
    }

    // 3. Seed Exercises
    const exercisesSnap = await db.collection('exercises').limit(1).get();
    if (exercisesSnap.empty) {
      console.log(`Seeding ${localExercises.length} exercises to Firestore...`);
      const chunks = chunkArray(localExercises, 200);
      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach(ex => {
          const docRef = db.collection('exercises').doc(ex.id);
          batch.set(docRef, ex);
        });
        await batch.commit();
      }
      console.log("Exercises seeded successfully.");
    }

    // 4. Seed Syllabi (lessons)
    const syllabusSnap = await db.collection('syllabus').limit(1).get();
    if (syllabusSnap.empty) {
      const syllabiList = Object.values(mergedLocalSyllabi);
      console.log(`Seeding ${syllabiList.length} syllabus capsules to Firestore...`);
      const batch = db.batch();
      syllabiList.forEach(syllabus => {
        const docRef = db.collection('syllabus').doc(syllabus.chapterId);
        batch.set(docRef, syllabus);
      });
      await batch.commit();
      console.log("Syllabi seeded successfully.");
    }

    // 5. Seed Island Questions
    const questionsSnap = await db.collection('island_questions').limit(1).get();
    if (questionsSnap.empty) {
      console.log(`Seeding ${flattenedLocalQuestions.length} island questions to Firestore...`);
      const chunks = chunkArray(flattenedLocalQuestions, 200);
      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach(q => {
          const docRef = db.collection('island_questions').doc(q.id);
          batch.set(docRef, q);
        });
        await batch.commit();
      }
      console.log("Island questions seeded successfully.");
    }

    console.log("Dynamic content sync and seeding check completed successfully!");
  } catch (error) {
    handleFirestoreError(error, "Failed to seed content to Firestore");
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
 * Retrieves all chapters, merging Firestore data with local fallbacks and dynamic CMS standard items.
 */
export async function getChapters(): Promise<Chapter[]> {
  if (isDatabaseUnconfigured) {
    const cmsItems = await getCmsChapters().catch(() => []);
    const combined = [...localChapters, ...cmsItems];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }
  try {
    const snap = await db.collection('chapters').get();
    const items: Chapter[] = [];
    if (snap.empty) {
      items.push(...localChapters);
    } else {
      snap.forEach(docSnap => {
        items.push(docSnap.data() as Chapter);
      });
    }
    const cmsItems = await getCmsChapters();
    const combined = [...items, ...cmsItems];
    // Ensure uniqueness of chapters by ID
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  } catch (e) {
    handleFirestoreError(e, "Failed to fetch chapters from Firestore, returning local data");
    const cmsItems = await getCmsChapters().catch(() => []);
    const combined = [...localChapters, ...cmsItems];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }
}

/**
 * Retrieves all concepts, merging Firestore data with local fallbacks and dynamic CMS standard items.
 */
export async function getConcepts(): Promise<ConceptNode[]> {
  if (isDatabaseUnconfigured) {
    const cmsItems = await getCmsConcepts().catch(() => []);
    const combined = [...localConcepts, ...cmsItems];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }
  try {
    const snap = await db.collection('concepts').get();
    const items: ConceptNode[] = [];
    if (snap.empty) {
      items.push(...localConcepts);
    } else {
      snap.forEach(docSnap => {
        items.push(docSnap.data() as ConceptNode);
      });
    }
    const cmsItems = await getCmsConcepts();
    const combined = [...items, ...cmsItems];
    // Ensure uniqueness of concepts by ID
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  } catch (e) {
    handleFirestoreError(e, "Failed to fetch concepts from Firestore, returning local data");
    const cmsItems = await getCmsConcepts().catch(() => []);
    const combined = [...localConcepts, ...cmsItems];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }
}

/**
 * Retrieves all exercises, merging Firestore data with local fallbacks and dynamic CMS standard items.
 */
export async function getExercises(): Promise<Exercise[]> {
  if (isDatabaseUnconfigured) {
    const cmsItems = await getCmsExercises().catch(() => []);
    const combined = [...localExercises, ...cmsItems];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }
  try {
    const snap = await db.collection('exercises').get();
    const items: Exercise[] = [];
    if (snap.empty) {
      items.push(...localExercises);
    } else {
      snap.forEach(docSnap => {
        items.push(docSnap.data() as Exercise);
      });
    }
    const cmsItems = await getCmsExercises();
    const combined = [...items, ...cmsItems];
    // Ensure uniqueness of exercises by ID
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  } catch (e) {
    handleFirestoreError(e, "Failed to fetch exercises from Firestore, returning local data");
    const cmsItems = await getCmsExercises().catch(() => []);
    const combined = [...localExercises, ...cmsItems];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }
}

/**
 * Retrieves all syllabi (lessons), merging Firestore data with local fallbacks and dynamic CMS standard items.
 */
export async function getSyllabi(): Promise<Record<string, ChapterSyllabus>> {
  if (isDatabaseUnconfigured) {
    const cmsItems = await getCmsSyllabi().catch(() => ({}));
    return { ...mergedLocalSyllabi, ...cmsItems };
  }
  try {
    const snap = await db.collection('syllabus').get();
    const res: Record<string, ChapterSyllabus> = {};
    if (snap.empty) {
      Object.assign(res, mergedLocalSyllabi);
    } else {
      snap.forEach(docSnap => {
        res[docSnap.id] = docSnap.data() as ChapterSyllabus;
      });
    }
    const cmsItems = await getCmsSyllabi();
    return { ...res, ...cmsItems };
  } catch (e) {
    handleFirestoreError(e, "Failed to fetch syllabi from Firestore, returning local data");
    const cmsItems = await getCmsSyllabi().catch(() => ({}));
    return { ...mergedLocalSyllabi, ...cmsItems };
  }
}

/**
 * Retrieves all island questions, merging Firestore data with local fallbacks and dynamic CMS standard items.
 */
export async function getIslandQuestions(): Promise<Record<string, IslandQuestion[]>> {
  if (isDatabaseUnconfigured) {
    const res = { ...localIslandQuestions };
    const cmsItems = await getCmsIslandQuestions().catch(() => ({}));
    for (const [chId, qList] of Object.entries(cmsItems)) {
      if (!res[chId]) res[chId] = [];
      res[chId].push(...qList);
    }
    for (const chId in res) {
      const uniqueQs = Array.from(new Map(res[chId].map(q => [q.id || `${chId}_${q.islandId}_${q.question.substring(0, 5)}`, q])).values());
      uniqueQs.sort((a, b) => a.islandId - b.islandId);
      res[chId] = uniqueQs;
    }
    return res;
  }
  try {
    const snap = await db.collection('island_questions').get();
    const res: Record<string, IslandQuestion[]> = {};

    if (snap.empty) {
      Object.assign(res, localIslandQuestions);
    } else {
      snap.forEach(docSnap => {
        const data = docSnap.data() as IslandQuestion;
        let chId = "ch1";
        if (data.id && data.id.includes("_")) {
          chId = data.id.split("_")[0];
        }
        if (!res[chId]) {
          res[chId] = [];
        }
        res[chId].push(data);
      });
    }

    const cmsItems = await getCmsIslandQuestions();
    for (const [chId, qList] of Object.entries(cmsItems)) {
      if (!res[chId]) res[chId] = [];
      res[chId].push(...qList);
    }

    // Sort by islandId and guarantee uniqueness within each chapter!
    for (const chId in res) {
      const uniqueQs = Array.from(new Map(res[chId].map(q => [q.id || `${chId}_${q.islandId}_${q.question.substring(0, 5)}`, q])).values());
      uniqueQs.sort((a, b) => a.islandId - b.islandId);
      res[chId] = uniqueQs;
    }

    return res;
  } catch (e) {
    handleFirestoreError(e, "Failed to fetch island questions from Firestore, returning local data");
    const res = { ...localIslandQuestions };
    const cmsItems = await getCmsIslandQuestions().catch(() => ({}));
    for (const [chId, qList] of Object.entries(cmsItems)) {
      if (!res[chId]) res[chId] = [];
      res[chId].push(...qList);
    }
    // Sort by islandId and guarantee uniqueness within each chapter!
    for (const chId in res) {
      const uniqueQs = Array.from(new Map(res[chId].map(q => [q.id || `${chId}_${q.islandId}_${q.question.substring(0, 5)}`, q])).values());
      uniqueQs.sort((a, b) => a.islandId - b.islandId);
      res[chId] = uniqueQs;
    }
    return res;
  }
}

/**
 * Saves/Edits a Syllabus Chapter in Firestore.
 */
export async function saveSyllabusChapter(chapterId: string, data: ChapterSyllabus) {
  await db.collection('syllabus').doc(chapterId).set(data, { merge: true });
}

/**
 * Saves/Edits an Island Question in Firestore.
 */
export async function saveIslandQuestion(questionId: string, data: IslandQuestion) {
  await db.collection('island_questions').doc(questionId).set(data, { merge: true });
}

/**
 * Saves/Edits a Chapter in Firestore.
 */
export async function saveChapter(chapterId: string, data: Chapter) {
  await db.collection('chapters').doc(chapterId).set(data, { merge: true });
}

/**
 * Saves/Edits a Concept in Firestore.
 */
export async function saveConcept(conceptId: string, data: ConceptNode) {
  await db.collection('concepts').doc(conceptId).set(data, { merge: true });
}

/**
 * Saves/Edits an Exercise in Firestore.
 */
export async function saveExercise(exerciseId: string, data: Exercise) {
  await db.collection('exercises').doc(exerciseId).set(data, { merge: true });
}

/**
 * Saves/Edits a generic standard CMS Item in Firestore.
 */
export async function saveCmsItem(id: string, data: any) {
  await db.collection('cms_items').doc(id).set(data, { merge: true });
}
