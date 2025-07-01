import express from "express";
import { supabase } from "../server.js";

const router = express.Router();

router.post("/create-user", async (req, res) => {
  const { email, password, name, surname, avatar_url, role } = req.body;

  if (!email || !password || !name || !surname || !role) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  try {
    // Vérifier si l'utilisateur existe
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (listError) {
      console.error("Erreur vérification utilisateur:", listError.message);
      return res.status(500).json({ error: "Erreur lors de la vérification." });
    }

    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      if (existingUser.identities === null) {
        return res.status(400).json({
          error: "Utilisateur corrompu dans Supabase. Supprime-le manuellement.",
          user_id: existingUser.id,
        });
      }

      return res.status(400).json({
        error: "Un utilisateur avec cet email existe déjà.",
      });
    }

    // Création dans Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        surname,
        avatar_url,
        role,
        must_change_password: true,
      },
    });

    if (createError) {
      console.error("Erreur création utilisateur:", createError.message);
      return res.status(400).json({ error: createError.message });
    }

    const userId = newUser.user?.id;

    // Insertion directe dans profiles
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      surname,
      avatar_url,
      role,
      must_change_password: true,
    });

    if (insertError) {
      console.warn("Erreur insertion profile:", insertError.message);
    }

    return res.status(200).json({ user: newUser.user, message: "Utilisateur et profil créés." });

  } catch (err) {
    console.error("Erreur backend:", err.message);
    return res.status(500).json({ error: "Erreur serveur inattendue." });
  }
});


export default router;
