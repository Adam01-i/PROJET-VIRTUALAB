import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Charger variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Connexion Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Liste blanche des domaines autorisés
const allowedOrigins = [
  "http://localhost:5173",
  "https://virtualab2025.vercel.app"
];

// ✅ Middleware CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ CORS bloqué : " + origin));
    }
  },
  credentials: true,
}));

// ✅ Préparation JSON
app.use(express.json());

// ✅ Exemple de route protégée
app.post("/api/create-user", (req, res) => {
  res.status(200).json({ ok: true });
});

// ✅ Lancement
app.listen(PORT, () => {
  console.log(`🚀 Backend sur http://localhost:${PORT}`);
});
