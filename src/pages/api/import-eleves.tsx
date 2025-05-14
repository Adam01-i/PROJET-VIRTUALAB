import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  
    const { name, surname, email } = req.body;
  
    if (!email || !name || !surname) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
  
    try {
      const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'virtualab2025',
        email_confirm: true,
      });
  
      if (authError) {
        console.error('Erreur Auth:', authError.message); // 👈 LOG ici
        return res.status(400).json({ error: authError.message });
      }
  
      const user = data.user;
  
      const { error: dbError } = await supabaseAdmin.from('profiles').insert({
        id: user.id,
        name,
        surname,
        email,
        role: 'professeur',
        must_change_password: true,
      });
  
      if (dbError) {
        console.error('Erreur DB:', dbError.message); // 👈 LOG ici
        return res.status(400).json({ error: dbError.message });
      }
  
      return res.status(200).json({ success: true, email });
    } catch (err: any) {
      console.error('Erreur Serveur:', err); // 👈 LOG ici
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  