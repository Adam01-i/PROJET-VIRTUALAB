import express from "express";
import { supabase } from "../server.js";

const router = express.Router();

router.post("/import-profs", async (req, res) => {
  const { name, surname, email, avatar_url } = req.body;

  if (!name || !surname || !email) {
    return res.status(400).json({ error: "Tous les champs requis n'ont pas été fournis." });
  }

  const emailClean = email.trim().toLowerCase();
  const role = "professeur"; // ✅ Forcé pour AdminProfesseur

  try {
    // Vérifie si l’utilisateur existe déjà
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (listError) {
      console.error("❌ Erreur recherche utilisateur :", listError.message);
      return res.status(500).json({ error: "Erreur vérification utilisateur." });
    }

    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === emailClean
    );

    if (existingUser) {
      if (existingUser.identities === null) {
        return res.status(400).json({
          error: "Utilisateur corrompu. Supprime-le manuellement via Supabase.",
          user_id: existingUser.id,
        });
      }

      return res.status(400).json({ error: "Utilisateur déjà existant." });
    }

    // 🔧 Création dans auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: emailClean,
      password: "virtualab2025",
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        surname: surname.trim(),
        avatar_url,
        role,
        must_change_password: true,
      },
    });

    if (createError) {
      console.error("❌ Erreur création utilisateur :", createError.message);
      return res.status(400).json({ error: createError.message });
    }

    const userId = newUser.user?.id;

    // ✅ Insertion manuelle dans profiles avec rôle défini
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email: emailClean,
      name: name.trim(),
      surname: surname.trim(),
      avatar_url,
      role: "professeur",
      must_change_password: true,
    });

    if (insertError) {
      console.error("⚠️ Erreur insertion dans profiles :", insertError.message);
      return res.status(500).json({ error: "Création de profil échouée." });
    }

    return res.status(200).json({ user: newUser.user });
  } catch (err) {
    console.error("❌ Erreur backend :", err.message);
    return res.status(500).json({ error: "Erreur serveur inattendue." });
  }
});

export default router;
