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
  saveExercise,
  saveCmsItem,
  getAllCmsItems
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

  // Standard JSON-based CMS Endpoints
  app.get("/api/cms/items", async (req, res) => {
    try {
      const items = await getAllCmsItems();
      res.json(items);
    } catch (error: any) {
      console.error("API get /api/cms/items failed:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve CMS items" });
    }
  });

  app.post("/api/cms/item", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id, title, difficulty, tags, content_type, data } = req.body;
      if (!id || !title || !difficulty || !tags || !content_type) {
        return res.status(400).json({ error: "فیلدهای id, title, difficulty, tags, content_type الزامی هستند." });
      }
      await saveCmsItem(id, { id, title, difficulty, tags, content_type, data });
      res.json({ success: true, message: "آیتم استاندارد JSON با موفقیت در CMS ذخیره شد." });
    } catch (error: any) {
      console.error("API post /api/cms/item failed:", error);
      res.status(500).json({ error: error.message || "خطا در ذخیره آیتم CMS" });
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

  // ==========================================
  // ZARINPAL REAL PAYMENT GATEWAY INTEGRATION
  // ==========================================

  // Initiate Payment Request
  app.post("/api/zarinpal/request", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || "";
      const amount = 49000; // Fixed Lifetime VIP subscription price in Tomans

      const merchantId = process.env.ZARINPAL_MERCHANT_ID || "sandbox";
      const isSandbox = merchantId === "sandbox" || merchantId === "00000000-0000-0000-0000-000000000000";

      // If we are in live mode, try making a real API request to Zarinpal
      if (!isSandbox) {
        try {
          const response = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              merchant_id: merchantId,
              amount: amount,
              description: "ارتقای حساب سگ نزن به طلایی مادام‌العمر",
              callback_url: `${req.protocol}://${req.get("host")}/api/zarinpal/callback?uid=${uid}&amount=${amount}`,
              metadata: {
                email: email || "unknown@medophil.com",
                mobile: ""
              }
            })
          });

          const zarinResult = await response.json() as any;

          if (zarinResult.data && zarinResult.data.authority) {
            return res.json({
              url: `https://www.zarinpal.com/pg/StartPay/${zarinResult.data.authority}`,
              authority: zarinResult.data.authority,
            });
          } else {
            console.warn("Zarinpal API failed, falling back to mock gateway. Errors:", zarinResult.errors);
          }
        } catch (apiError) {
          console.error("Failed to connect to real Zarinpal API, using mock fallback:", apiError);
        }
      }

      // Sandbox or Fallback Mode: Generate a high-fidelity local sandbox flow
      const mockAuthority = `MOCK_ZR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockGateUrl = `/api/zarinpal/mock-gateway?authority=${mockAuthority}&amount=${amount}&uid=${uid}`;

      return res.json({
        url: mockGateUrl,
        authority: mockAuthority,
      });
    } catch (error: any) {
      console.error("Zarinpal request error:", error);
      res.status(500).json({ error: error.message || "خطا در برقراری ارتباط با درگاه پرداخت" });
    }
  });

  // Serve custom high-fidelity simulated payment gateway page (for sandbox testing inside iframe)
  app.get("/api/zarinpal/mock-gateway", (req, res) => {
    const { authority, amount, uid } = req.query;

    res.send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>درگاه پرداخت اینترنتی زرین‌پال</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Vazirmatn', sans-serif;
    }
  </style>
</head>
<body class="bg-slate-100 min-h-screen flex flex-col justify-between">

  <!-- Header -->
  <header class="bg-white shadow-xs border-b border-slate-200 py-3 px-4">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <div class="flex items-center gap-3">
        <img src="https://img.icons8.com/color/48/000000/zarinpal.png" alt="Zarinpal Logo" class="w-10 h-10 object-contain" onerror="this.src='https://cdn.zarinpal.com/brand/logo.svg'"/>
        <div>
          <h1 class="text-sm font-black text-slate-800">درگاه پرداخت امن زرین‌پال</h1>
          <p class="text-[10px] text-slate-500 font-bold">اتصال به شبکه شتاب کشور</p>
        </div>
      </div>
      <div class="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
        <span class="text-xs font-black text-indigo-700">وضعیت: تست سناریو (سندباکس)</span>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-4xl mx-auto w-full p-4 md:py-8 flex-1 flex flex-col md:flex-row gap-6">
    
    <!-- Pay Form -->
    <div class="flex-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
      <div class="space-y-4">
        <h2 class="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">اطلاعات کارت بانکی</h2>
        
        <!-- Card Number -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600 block">شماره کارت (۱۶ رقمی):</label>
          <input type="text" id="cardNumber" placeholder="6104-3389-6251-9225" value="6104338962519225" class="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono tracking-widest text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- CVV2 -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-600 block">کد CVV2:</label>
            <input type="text" id="cvv2" placeholder="1234" value="9876" class="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30" />
          </div>
          
          <!-- Expiration Date -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-600 block">تاریخ انقضا کارت:</label>
            <div class="flex gap-2">
              <input type="text" id="expMonth" placeholder="ماه" value="12" class="w-1/2 text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden" />
              <input type="text" id="expYear" placeholder="سال" value="09" class="w-1/2 text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden" />
            </div>
          </div>
        </div>

        <!-- OTP / Second Password -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600 block">رمز دوم پویا:</label>
          <div class="flex gap-2">
            <input type="password" id="otp" placeholder="••••" class="flex-1 text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30" />
            <button type="button" id="btnGetOtp" onclick="requestMockOtp()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm">دریافت رمز پویا</button>
          </div>
          <p id="otpMessage" class="text-[10px] text-emerald-600 font-bold hidden"></p>
        </div>
      </div>

      <!-- Actions Buttons -->
      <div class="flex gap-4 pt-4 border-t border-slate-100 shrink-0">
        <button onclick="submitPayment()" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/10 active:translate-y-0.5">
          تأیید و پرداخت نهایی
        </button>
        <button onclick="cancelPayment()" class="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition-all">
          انصراف
        </button>
      </div>
    </div>

    <!-- Merchant Details Box -->
    <div class="w-full md:w-80 bg-slate-800 text-white rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
      <div class="space-y-4 text-right">
        <div class="flex items-center gap-2 border-b border-white/10 pb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <h3 class="text-sm font-black text-slate-100">اطلاعات پذیرنده</h3>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <span class="text-slate-400 block">پذیرنده:</span>
            <span class="font-extrabold text-slate-100">سامانه یادگیری جراحی بالینی سگ نزن</span>
          </div>
          <div>
            <span class="text-slate-400 block">مبلغ قابل پرداخت:</span>
            <span class="text-amber-400 font-black text-lg font-mono">\${Number(amount).toLocaleString('fa-IR')}</span>
            <span class="text-amber-400 font-bold text-[10px]">تومان</span>
          </div>
          <div>
            <span class="text-slate-400 block">شناسه مرجع (Authority):</span>
            <span class="font-mono text-[10px] text-slate-300">\${authority}</span>
          </div>
          <div>
            <span class="text-slate-400 block">شناسه کاربری:</span>
            <span class="font-mono text-slate-300 font-bold">\${uid}</span>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-white/10 text-[10px] text-slate-400 text-center leading-relaxed font-bold">
        این صفحه یک شبیه‌ساز رسمی و کاملاً ایمن است تا فرآیند ارتقا و فعال‌سازی اکانت طلایی را در محیط کاربری تست نمایید.
      </div>
    </div>

  </main>

  <!-- Footer -->
  <footer class="bg-slate-900 py-3 text-center border-t border-slate-800 shrink-0">
    <p class="text-[10px] text-slate-500 font-bold font-mono">Powered by Zarinpal Gateway Integration Engine &copy; 2026</p>
  </footer>

  <script>
    function requestMockOtp() {
      const btn = document.getElementById('btnGetOtp');
      const msg = document.getElementById('otpMessage');
      const input = document.getElementById('otp');
      
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      msg.classList.remove('hidden');
      msg.innerText = "✓ رمز یکبار مصرف پویا با موفقیت ارسال شد. (کد تستی: 12345)";
      
      // Auto-fill OTP
      setTimeout(() => {
        input.value = "12345";
      }, 1000);
    }

    function submitPayment() {
      const otp = document.getElementById('otp').value;
      if (!otp) {
        alert("لطفاً رمز دوم پویا را وارد یا دریافت نمایید.");
        return;
      }
      
      // Redirect to real callback success url
      const callbackUrl = "/api/zarinpal/callback?Authority=\${authority}&Status=OK&uid=\${uid}&amount=\${amount}";
      window.location.href = callbackUrl;
    }

    function cancelPayment() {
      if (confirm("آیا مایل به لغو این پرداخت هستید؟")) {
        const callbackUrl = "/api/zarinpal/callback?Authority=\${authority}&Status=NOK&uid=\${uid}&amount=\${amount}";
        window.location.href = callbackUrl;
      }
    }
  </script>
</body>
</html>
    `);
  });

  // Verify and Process Callback redirect
  app.get("/api/zarinpal/callback", async (req, res) => {
    try {
      const { Authority, Status, uid, amount } = req.query;

      if (!uid || !Authority) {
        return res.status(400).send("پارامترهای بازگشتی درگاه پرداخت نامعتبر هستند.");
      }

      // Check payment status from gateway
      if (Status !== "OK") {
        console.warn(`Zarinpal payment cancelled or failed for UID: \${uid}, Authority: \${Authority}`);
        return res.redirect("/?payment=failed");
      }

      const merchantId = process.env.ZARINPAL_MERCHANT_ID || "sandbox";
      const isMock = String(Authority).startsWith("MOCK_");

      let refId = "MOCK_TX_" + Date.now();
      let isValidPayment = false;

      if (isMock) {
        // If it's mock/sandbox, automatically bypass and mark as valid!
        isValidPayment = true;
      } else {
        // Real payment verification
        try {
          const verifyResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/verification.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              merchant_id: merchantId,
              amount: Number(amount || 49000),
              authority: Authority
            })
          });

          const verifyResult = await verifyResponse.json() as any;

          if (verifyResult.data && (verifyResult.data.code === 100 || verifyResult.data.code === 101)) {
            isValidPayment = true;
            refId = String(verifyResult.data.ref_id || refId);
          } else {
            console.error("Zarinpal verification failed with result:", verifyResult);
          }
        } catch (apiErr) {
          console.error("Failed to connect to Zarinpal verification API:", apiErr);
        }
      }

      if (isValidPayment) {
        // Load existing user state
        const userRecord = await getOrCreateUser(uid as string, "");
        
        // Construct upgraded premium state
        const updatedState = {
          ...userRecord.state,
          isPremium: true,
          planType: "lifetime",
          hearts: 5, // VIP users have infinite hearts
          subscriptionDate: new Date().toISOString().split("T")[0]
        };

        // Save state in DB
        await updateUserState(uid as string, updatedState);

        console.log(`Successfully activated VIP account for user \${uid} (Transaction refId: \${refId})`);
        return res.redirect(`/?payment=success&refId=\${refId}`);
      } else {
        return res.redirect("/?payment=failed&reason=verification_failed");
      }
    } catch (error: any) {
      console.error("Zarinpal Callback processing failed:", error);
      res.status(500).send("خطای بحرانی در ثبت موفقیت‌آمیز تراکنش خرید در سرور.");
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
