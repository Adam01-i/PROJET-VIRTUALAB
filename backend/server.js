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

  // Supabase admin client
  export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

const allowedOrigins = [
  "http://localhost:5173",
  "https://virtualab2025.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

  // Body parser
  app.use(express.json());

  // Routes
  app.use("/api", userRoutes);
  app.use("/api", chatRoutes);
  app.use("/api", importProfsRoutes);
  app.use("/api", importElevesRoutes);

  // Gestion des erreurs
  app.use((err, req, res, next) => {
    console.error("💥 Erreur serveur :", err.stack);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Une erreur est survenue",
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend lancé sur http://localhost:${PORT}`);
  });
