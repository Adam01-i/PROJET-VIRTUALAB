// backend/routes/create-user.js
import express from "express";
import { supabase } from "../server.js";

const router = express.Router();

// 📌 POST /api/create-user
router.post("/create-user", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Erreur création utilisateur :", error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ user: data.user });
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// 📌 POST /api/import-users
router.post("/create-user", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Erreur Supabase:", error); // ✅ LOG complet
      return res.status(400).json({ error: error.message || "Erreur inconnue" });
    }

    return res.status(200).json({ user: data.user });
  } catch (err) {
    console.error("Erreur serveur backend:", err.message);
    return res.status(500).json({ error: err.message });
  }
});


export default router;
