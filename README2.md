🧪 Virtualab - README SQL
Ce fichier décrit la structure des tables, les règles de sécurité (RLS), et les extensions nécessaires à l’infrastructure de la plateforme Virtualab.

🔌 Extensions requises
sql
Copier
Modifier
-- Générateur UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
🚀 Scripts d'insertion (développement)
bash
Copier
Modifier
ts-node src/script/insertLabItems.ts
ts-node src/scripts/insertQuizzes.ts
📋 Schéma de la base de données
🎓 quizzes - Quiz interactifs
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  description TEXT,
  duree TEXT,
  niveau TEXT CHECK (niveau IN ('Débutant', 'Intermédiaire', 'Avancé')),
  image TEXT,
  classe_id UUID REFERENCES public.classes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
❓ questions - Questions pour les quiz
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optionnel : renommer si besoin pour correspondre au code TypeScript
ALTER TABLE public.questions RENAME COLUMN correct_answer TO "correctAnswer";
🔬 lab_items - Molécules & Équipements
sql
Copier
Modifier
CREATE TABLE lab_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT NOT NULL,
  structure TEXT NOT NULL, -- chemin .glb
  category TEXT NOT NULL CHECK (category IN ('molecule', 'equipment')),
  niveau TEXT,
  formule TEXT,
  importance TEXT,
  usage TEXT,
  precautions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_items_category ON lab_items(category);
🧪 experiences - Expérimentations scientifiques
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  duree TEXT,
  niveau TEXT,
  image TEXT,
  simulationPath TEXT,
  classe_id UUID REFERENCES public.classes(id),
  objectifs JSONB,
  materiel JSONB,
  resultatsAttendus JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
👤 profiles - Profils utilisateurs liés à auth.users
sql
Copier
Modifier
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  surname TEXT,
  email TEXT,
  avatar_url TEXT,
  must_change_password BOOLEAN DEFAULT TRUE,
  role TEXT CHECK (role IN ('eleve', 'professeur', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);
🧭 activity_logs - Journal des activités utilisateurs
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('simulation', 'quiz')),
  duree INTEGER,
  created_at TIMESTAMP DEFAULT now()
);
🏫 Gestion des classes
classes - Groupes pédagogiques
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  niveau TEXT CHECK (niveau IN ('6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
professeurs_classes - Lien professeurs ↔️ classes
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS public.professeurs_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professeur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  UNIQUE(professeur_id, classe_id)
);
eleves_classes - Lien élèves ↔️ classes
sql
Copier
Modifier
CREATE TABLE IF NOT EXISTS public.eleves_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  UNIQUE(eleve_id, classe_id)
);
⚙️ Automatisation : création de profil à l'inscription
sql
Copier
Modifier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, 'Utilisateur', 'eleve');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();
🔁 Trigger de mise à jour automatique du niveau selon classe_id
sql
Copier
Modifier
CREATE OR REPLACE FUNCTION set_niveau_from_classe()
RETURNS TRIGGER AS $$
DECLARE
  classe_niveau TEXT;
BEGIN
  SELECT niveau INTO classe_niveau FROM public.classes WHERE id = NEW.classe_id;
  NEW.niveau := classe_niveau;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quiz_niveau
BEFORE INSERT OR UPDATE ON public.quizzes
FOR EACH ROW WHEN (NEW.classe_id IS NOT NULL)
EXECUTE PROCEDURE set_niveau_from_classe();

CREATE TRIGGER set_experience_niveau
BEFORE INSERT OR UPDATE ON public.experiences
FOR EACH ROW WHEN (NEW.classe_id IS NOT NULL)
EXECUTE PROCEDURE set_niveau_from_classe();
🔐 Politiques de sécurité (RLS)
Chaque table est sécurisée via Row-Level Security, et les rôles eleve, professeur, admin ont des permissions spécifiques.

Les politiques sont structurées pour :

restreindre l’accès à ses propres données (activity_logs, profiles)

autoriser lecture publique sur certains contenus (quizzes, lab_items)

autoriser des rôles spécifiques pour insertion/modification (ex. : professeurs pour les quizzes)

📄 Pour plus de détails, se référer au bloc SQL original ou demander une section dédiée par table.

📤 Stockage Supabase - Règles des Buckets
sql
Copier
Modifier
-- Bucket : structures
CREATE POLICY "Public upload to structures"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'structures');

-- Bucket : images-sim
CREATE POLICY "Allow public upload to images-sim"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'images-sim');
📧 Configuration SMTP pour notifications Supabase
Champ	Valeur
Sender email	tonmail@gmail.com
Sender name	Virtualab Support
SMTP host	smtp.gmail.com
SMTP port	587
Username	tonmail@gmail.com
Password	🔑 Mot de passe d'application généré via Google