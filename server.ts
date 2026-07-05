import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, updateUserState, getAllUsersForLeaderboard } from "./src/db/users.ts";
import { GoogleGenAI } from "@google/genai";
import { 
  seedContentIfEmpty,
  getChapters,
  getConcepts,
  getExercises,
  getSyllabi,
  getIslandQuestions,
  saveSyllabusChapter,
  saveIslandQuestion,
  saveChapter,
  saveConcept,
  saveExercise
} from "./src/db/content.ts";

// Helper function to build a comprehensive dynamic RAG syllabus context for Gemini
async function getSyllabusContextDynamic(): Promise<string> {
  let context = "دستورالعمل‌های سیستم (System Instructions):\n";
  context += "شما جراح مینو (Minoo AI) - دستیار هوشمند و فوق‌تخصص جراحی عمومی مبتنی بر آنتی‌گراویتی هستید. وظیفه شما پاسخ به سوالات علمی، درسی، تشخیصی و کاربردی پزشکان و دانشجویان جراحی عمومی با استناد دقیق به محتوای درسی (Syllabus) زیر است.\n";
  context += "بسیار مهم: شما باید طوری رفتار کنید که گویی تمام اطلاعات زیر را کاملاً حفظ هستید و با تسلط کامل بر رفرنس‌ها پاسخ می‌دهید.\n";
  context += "لحن شما باید علمی، دقیق، دلسوزانه، سرشار از انگیزه و تماماً به زبان فارسی باشد. در پاسخ‌های خود از واژگان تخصصی پزشکی (Medical Jargon) با نگارش فارسی و انگلیسی استفاده کنید.\n\n";
  context += "محتوای علمی و فصل‌های مرجع جراحی عمومی:\n";

  try {
    const dynamicSyllabi = await getSyllabi();
    for (const [key, ch] of Object.entries(dynamicSyllabi)) {
      context += `\n--- [فصل: ${ch.overview}] ---\n`;
      context += `شناسه فصل در سیستم: ${ch.chapterId}\n`;
      
      context += "مباحث کلیدی فصل:\n";
      ch.sections.forEach((sec, idx) => {
        context += `${idx + 1}. ${sec.title}:\n${sec.content}\n\n`;
      });

      context += "⚠️ تله‌های بالینی بسیار خطرناک (Clinical Pitfalls) - که نادیده گرفتن آنها باعث مرگ حتمی بیمار می‌شود:\n";
      ch.pitfalls.forEach((pit, idx) => {
        context += `- تله شماره ${idx + 1}: ${pit.title}\n  توضیح پاتولوژی: ${pit.description}\n  عواقب مرگبار بالینی: ${pit.consequence}\n\n`;
      });

      context += "💎 مرواریدهای جراحی و نکات طلایی گرانبها (Combined Pearls):\n";
      ch.combinedPearls.forEach((pearl, idx) => {
        context += `- ${pearl.title}: ${pearl.content}\n\n`;
      });
    }
  } catch (err) {
    console.error("Failed to build dynamic RAG context:", err);
  }

  context += "\nقوانین پاسخگویی جراح مینو:\n";
  context += "۱. همیشه پاسخ خود را بر مبنای محتوای علمی بالا قرار دهید. اگر کاربر سؤالی بپرسد که مستقیماً در جزوه است، ارجاع دقیق بدهید (مثلا ذکر نام مبحث یا فصل مربوطه).\n";
  context += "۲. اگر کاربر سوالی خارج از این ۹ فصل بپرسد، پاسخ او را با دانش پزشکی معتبر بدهید اما با مهربانی یادآور شوید که این سوال فراتر از سرفصل‌های آموزشی فعلی Medophil است و پیشنهاد دهید به سرفصل‌های مرتبط مراجعه کند.\n";
  context += "۳. برای تله‌های بالینی، دوزهای حساس داروها (مثلا لیدوکائین ساده ۴.۵mg/kg و با اپی‌نفرین ۷mg/kg)، سه‌گانه مرگ تروما (هایپوترمی، اسیدوز، کواگولوپاتی)، دمیلیناسیون پل مغز (CPM) و درمان تامپوناد یا پنوموتوراکس حتماً از آیکون‌های هشدار ⚠️ و استیکرهای جذاب استفاده کنید.\n";
  context += "۴. به طنز و تعلیق آنتی‌گراویتی (Floating) که به عنوان تم پلتفرم است، اشاره‌های کوچک و جذابی داشته باشید (مثلاً ملق معلق شدن در علم جراحی!).\n";

  return context;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Bootstrap/Seed Firestore on startup
  try {
    await seedContentIfEmpty();
  } catch (err) {
    console.error("Failed during server startup seeding:", err);
  }

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get users leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const list = await getAllUsersForLeaderboard();
      res.json(list);
    } catch (error: any) {
      console.error("API get /api/leaderboard failed:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve leaderboard" });
    }
  });

  // Dynamic Unified Content Endpoint
  app.get("/api/content", async (req, res) => {
    try {
      const [chapters, concepts, exercises, syllabi, islandQuestions] = await Promise.all([
        getChapters(),
        getConcepts(),
        getExercises(),
        getSyllabi(),
        getIslandQuestions()
      ]);
      res.json({
        chapters,
        concepts,
        exercises,
        syllabi,
        islandQuestions
      });
    } catch (error: any) {
      console.error("API get /api/content failed:", error);
      res.status(500).json({ error: error.message || "Failed to load dynamic content" });
    }
  });

  // Content Administration/Management Endpoints
  app.post("/api/content/chapter", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      await saveChapter(id, data);
      res.json({ success: true, message: "Chapter saved successfully" });
    } catch (error: any) {
      console.error("API post /api/content/chapter failed:", error);
      res.status(500).json({ error: error.message || "Failed to save chapter" });
    }
  });

  app.post("/api/content/syllabus", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { chapterId, data } = req.body;
      if (!chapterId || !data) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      await saveSyllabusChapter(chapterId, data);
      res.json({ success: true, message: "Syllabus saved successfully" });
    } catch (error: any) {
      console.error("API post /api/content/syllabus failed:", error);
      res.status(500).json({ error: error.message || "Failed to save syllabus" });
    }
  });

  app.post("/api/content/question", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      await saveIslandQuestion(id, data);
      res.json({ success: true, message: "Island question saved successfully" });
    } catch (error: any) {
      console.error("API post /api/content/question failed:", error);
      res.status(500).json({ error: error.message || "Failed to save island question" });
    }
  });

  app.post("/api/content/concept", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      await saveConcept(id, data);
      res.json({ success: true, message: "Concept saved successfully" });
    } catch (error: any) {
      console.error("API post /api/content/concept failed:", error);
      res.status(500).json({ error: error.message || "Failed to save concept" });
    }
  });

  app.post("/api/content/exercise", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      await saveExercise(id, data);
      res.json({ success: true, message: "Exercise saved successfully" });
    } catch (error: any) {
      console.error("API post /api/content/exercise failed:", error);
      res.status(500).json({ error: error.message || "Failed to save exercise" });
    }
  });

  // Get user profile and state
  app.get("/api/user-state", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || "";
      const name = req.user!.name || "";
      
      const userRecord = await getOrCreateUser(uid, email, name);
      res.json({
        email: userRecord.email,
        fullName: userRecord.fullName,
        state: userRecord.state,
      });
    } catch (error: any) {
      console.error("API get /api/user-state failed:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve user state" });
    }
  });

  // Update user state
  app.post("/api/user-state", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: "Missing state in request body" });
      }

      const userRecord = await updateUserState(uid, state);
      res.json({
        email: userRecord.email,
        fullName: userRecord.fullName,
        state: userRecord.state,
      });
    } catch (error: any) {
      console.error("API post /api/user-state failed:", error);
      res.status(500).json({ error: error.message || "Failed to update user state" });
    }
  });

  // Secure RAG-enabled Surgical Chat Endpoint powered by Gemini 3.5 Flash
  app.post("/api/chat", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "لیست پیام‌ها الزامی است" });
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({ error: "کلید دسترسی به هوش مصنوعی (GEMINI_API_KEY) در سرور پیکربندی نشده است." });
      }

      // Instantiate GoogleGenAI client (with named parameter as required!)
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Retrieve full RAG contextualized system instruction compiled dynamically from the database
      const systemInstruction = await getSyllabusContextDynamic();

      // Format messages strictly according to the GoogleGenAI contents schema
      const formattedContents = messages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content || "" }]
      }));

      // Generate context-aware response using Gemini 3.5 Flash (for general scientific RAG Q&A)
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "متاسفانه جراح مینو قادر به پاسخگویی در این لحظه نبود.";
      res.json({ reply });
    } catch (error: any) {
      console.error("API post /api/chat failed:", error);
      res.status(500).json({ error: error.message || "خطایی در سیستم جراحی مینو رخ داد." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
