import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, updateUserState } from "./src/db/users.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
