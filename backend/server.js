import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import chatRoutes from "./routes/chat.js";
import userRoutes from "./routes/create-user.js";
import importProfsRoutes from "./routes/import-profs.js";
import importElevesRoutes from "./routes/import-eleves.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS bien configuré
const allowedOrigins = [
  "http://localhost:5173",
  "https://virtualab2025.vercel.app"
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});


app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // important

// ✅ Body parser après CORS
app.use(express.json());

// 🔐 Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Tes routes
app.use("/api", userRoutes);
app.use("/api", chatRoutes);
app.use("/api", importProfsRoutes);
app.use("/api", importElevesRoutes);

// ✅ Gestion d'erreurs
app.use((err, req, res, next) => {
  console.error("💥 Erreur serveur :", err.stack);
  res.status(500).json({ error: "Erreur serveur", message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend lancé sur http://localhost:${PORT}`);
});
