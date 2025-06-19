// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ⚙️ Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// 🔐 Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📦 Route pour importer les utilisateurs (professeurs / élèves)
app.post("/api/import-users", async (req, res) => {
  const { name, surname, email, role } = req.body;

  if (!email || !name || !surname || !role) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  try {
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "virtualab2025",
      email_confirm: true,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const { error: dbError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      surname,
      email,
      role,
      must_change_password: true,
    });

    if (dbError) return res.status(400).json({ error: dbError.message });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🤖 Route chatbot (modulaire)
app.use("/api", chatRoutes);

// 🛡️ Middleware d'erreurs global
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

// 🚀 Démarrage serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}`);
});
