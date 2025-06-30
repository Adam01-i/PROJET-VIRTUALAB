// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import chatRoutes from "./routes/chat.js";
import userRoutes from "./routes/create-user.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🔐 Supabase client admin
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ⚙️ Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// 🧑‍🎓 Routes utilisateur : création, import
app.use("/api", userRoutes);

// 🧠 Chatbot
app.use("/api", chatRoutes);

// 🛡️ Gestion d’erreurs globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur est survenue",
  });
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express démarré sur http://localhost:${PORT}`);
});
