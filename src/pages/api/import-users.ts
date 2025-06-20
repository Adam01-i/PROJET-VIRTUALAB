// pages/api/import-users.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { name, surname, email, avatar_url, role } = req.body;

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof surname !== 'string' || !surname.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof role !== 'string' || !role.trim()
  ) {
    return res.status(400).json({ error: 'Champs requis manquants ou invalides' });
  }

  // Vérifie si l'utilisateur existe déjà (Supabase Auth)
  const { data: existingUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

  if (fetchError) {
    return res.status(500).json({ error: 'Erreur lors de la vérification des utilisateurs existants.' });
  }

  const userExists = existingUsers?.users?.some((user: any) => user.email === email.trim());

  if (userExists) {
    return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: 'virtualab2025',
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        surname: surname.trim(),
        avatar_url,
        role: role.trim(),
        must_change_password: true,
      },
    });

    if (error) {
      console.error("❌ Supabase Auth Error:", error);
      return res.status(400).json({
        error: error.message,
        details: error,
      });
    }

    return res.status(200).json({ user: data.user });
  } catch (err: any) {
    console.error('Erreur Serveur:', err);
    return res.status(500).json({ error: err?.message ?? 'Erreur serveur inconnue' });
  }
}
