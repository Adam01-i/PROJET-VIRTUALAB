import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post('/api/import-professeurs', async (req, res) => {
  const { name, surname, email } = req.body;

  if (!email || !name || !surname) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'virtualab2025',
      email_confirm: true,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const { error: dbError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      surname,
      email,
      role: 'professeur',
      must_change_password: true,
    });

    if (dbError) return res.status(400).json({ error: dbError.message });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ API en ligne : http://localhost:${PORT}/api/import-professeurs`));
