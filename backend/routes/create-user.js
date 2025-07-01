// backend/routes/create-user.js
import express from "express";
import { supabase } from "../server.js";

const router = express.Router();

router.post("/create-user", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  try {
    // 🔍 Vérifier si l'utilisateur existe déjà
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (listError) {
      console.error("❌ Erreur recherche utilisateur :", listError.message);
      return res.status(500).json({ error: "Erreur lors de la vérification de l'utilisateur." });
    }

    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      if (existingUser.identities === null) {
        console.warn("⚠️ Utilisateur corrompu détecté :", existingUser.id);
        return res.status(400).json({
          error: "Utilisateur corrompu dans Supabase. Supprime-le manuellement via la console Supabase.",
          user_id: existingUser.id,
        });
      }

      return res.status(400).json({
        error: "Un utilisateur avec cet email existe déjà.",
      });
    }

    // 🛠️ Créer l'utilisateur
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("❌ Erreur création utilisateur :", createError.message);
      return res.status(400).json({ error: createError.message });
    }

    const userId = newUser.user?.id;

    // 🔄 Insérer dans `profiles` via RPC
    const { error: rpcError } = await supabase.rpc("create_profile_for_user", { uid: userId });

    if (rpcError) {
      console.warn("⚠️ Erreur RPC create_profile_for_user :", rpcError.message);
    }

    return res.status(200).json({ user: newUser.user, message: "Utilisateur créé avec succès." });

  } catch (err) {
    console.error("❌ Erreur serveur backend :", err.message);
    return res.status(500).json({ error: "Erreur serveur inattendue." });
  }
});

export default router;
