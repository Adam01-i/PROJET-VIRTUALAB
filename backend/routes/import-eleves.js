import express from "express";
import { supabase } from "../server.js";

const router = express.Router();

router.post("/import-eleves", async (req, res) => {
  const { name, surname, email, avatar_url } = req.body;

  if (!name || !surname || !email) {
    return res.status(400).json({ error: "Tous les champs requis n'ont pas été fournis." });
  }

  const emailClean = email.trim().toLowerCase();
  const role = "eleve"; // 🔒 Forcé ici pour AdminÉlève

  try {
    // 🔍 Vérifie existence
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (listError) {
      console.error("❌ Erreur recherche utilisateur :", listError.message);
      return res.status(500).json({ error: "Erreur lors de la vérification des utilisateurs." });
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

      return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
    }

    // 🛠️ Création dans auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: emailClean,
      password: "virtualab2025",
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        surname: surname.trim(),
        avatar_url:
          avatar_url ||
          "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1748565991828.jpg",
        role,
        must_change_password: true,
      },
    });

    if (createError) {
      console.error("❌ Erreur création utilisateur :", createError.message);
      return res.status(400).json({ error: createError.message });
    }

    const userId = newUser.user?.id;

    // ✅ Insertion manuelle dans `profiles`
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email: emailClean,
      name: name.trim(),
      surname: surname.trim(),
      avatar_url:
        avatar_url ||
        "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1748565991828.jpg",
      role: "eleve",
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
