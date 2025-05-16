###### 📋 Schéma de la base de données 

###### `role_type` - enumeration de type role
create type role_type as enum ('eleve', 'professeur', 'admin');

###### 👤 `profiles` - Profils utilisateurs liés à auth.users 
create table public.profiles (
  id uuid not null,
  name text null,
  surname text null,
  email text null,
  role role_type null,
  created_at timestamp without time zone null default now(),
  must_change_password boolean null default true,
  avatar_url text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id),
  constraint profiles_email_unique unique (email)
);
Activer la sécurité RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

Créer la vue de contexte utilisateur
CREATE OR REPLACE VIEW current_user_context AS
SELECT id, role
FROM public.profiles
WHERE id = auth.uid();

Politiques RLS

-- a. Lire son propre profil
CREATE POLICY "Lire son propre profil"
ON public.profiles
TO public
USING (
  id = auth.uid()
);
-- b. Modifier son propre profil
CREATE POLICY "Modifier son propre profil"
ON public.profiles
TO public
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);
-- c. Admins lisent tous les profils
CREATE POLICY "Admins lisent tous les profils"
ON public.profiles
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);
-- d. Admins modifient tous les profils
CREATE POLICY "Admins modifient tous les profils"
ON public.profiles
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);





###### 🏫 `classes` - Groupes pédagogiques 
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  code_classe text NOT NULL UNIQUE, -- identifiant humain (ex: "2A", "3B", etc.)
  niveau text,
  professeur_principal_id uuid,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT classes_niveau_check CHECK (
    niveau = ANY (ARRAY['6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale'])
  ),
  CONSTRAINT classes_prof_principal_fk FOREIGN KEY (professeur_principal_id)
    REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- 2. Activer la sécurité RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Lecture classes par prof principal ou admin"
ON public.classes
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE
      (ctx.id = professeur_principal_id)
      OR ctx.role = 'admin'
  )
);

CREATE POLICY "Modification classes par prof principal ou admin"
ON public.classes
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE
      (ctx.id = professeur_principal_id)
      OR ctx.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE
      (ctx.id = professeur_principal_id)
      OR ctx.role = 'admin'
  )
);

CREATE OR REPLACE VIEW prof_classes AS
SELECT c.*
FROM public.classes c
JOIN public.profiles p ON p.id = c.professeur_principal_id
WHERE p.role = 'professeur';




###### `professeurs_classes` - Lien professeurs ↔️ classes 
CREATE TABLE public.professeurs_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professeur_id uuid NOT NULL,
  classe_id uuid NOT NULL,
  assigned_at timestamp DEFAULT now(),

  CONSTRAINT professeurs_classes_unique UNIQUE (professeur_id, classe_id),
  CONSTRAINT fk_professeur FOREIGN KEY (professeur_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT fk_classe FOREIGN KEY (classe_id) REFERENCES public.classes (id) ON DELETE CASCADE
);

-- Activer RLS
ALTER TABLE public.professeurs_classes ENABLE ROW LEVEL SECURITY;


-- Lire les associations où je suis professeur
CREATE POLICY "Lecture lien prof ↔ classe"
ON public.professeurs_classes
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.id = professeur_id
  )
);

-- Ajouter une association si je suis concerné
CREATE POLICY "Insertion par prof concerné"
ON public.professeurs_classes
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.id = professeur_id
  )
);

-- Admin peut tout lire
CREATE POLICY "Admin lit toutes les affectations profs"
ON public.professeurs_classes
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);

-- Admin peut modifier / insérer
CREATE POLICY "Admin insère/modifie professeurs_classes"
ON public.professeurs_classes
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);

-- Toutes les classes d'un professeur
CREATE OR REPLACE VIEW mes_classes AS
SELECT c.*
FROM public.classes c
JOIN public.professeurs_classes pc ON pc.classe_id = c.id
WHERE pc.professeur_id = auth.uid();





###### `eleves_classes` - Lien eleves ↔️ classes 
CREATE TABLE public.eleves_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL,
  classe_id uuid NOT NULL,
  assigned_at timestamp DEFAULT now(),

  CONSTRAINT eleves_classes_unique UNIQUE (eleve_id, classe_id),
  CONSTRAINT fk_eleve FOREIGN KEY (eleve_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT fk_classe FOREIGN KEY (classe_id) REFERENCES public.classes (id) ON DELETE CASCADE
);

-- Activer RLS
ALTER TABLE public.eleves_classes ENABLE ROW LEVEL SECURITY;


-- Lire ses propres classes
CREATE POLICY "Lecture lien élève ↔ classe"
ON public.eleves_classes
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.id = eleve_id
  )
);

-- Interdiction volontaire d’insertion pour élèves eux-mêmes (admin ou profs seulement)

CREATE POLICY "Admin lit toutes les affectations élèves"
ON public.eleves_classes
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);

CREATE POLICY "Admin insère/modifie eleves_classes"
ON public.eleves_classes
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);

-- Toutes les classes d’un élève
CREATE OR REPLACE VIEW classes_de_l_eleve AS
SELECT c.*
FROM public.classes c
JOIN public.eleves_classes ec ON ec.classe_id = c.id
WHERE ec.eleve_id = auth.uid();




###### 🧪 `experiences` - Expérimentations scientifiques 
CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  duree text,
  niveau text,
  image text,
  "simulationPath" text,
  objectifs jsonb,
  materiel jsonb,
  "resultatsAttendus" jsonb,
  created_at timestamp with time zone DEFAULT now(),
  classe_id uuid,

  CONSTRAINT fk_experience_classe FOREIGN KEY (classe_id) REFERENCES public.classes (id) ON DELETE SET NULL
);

-- Activer RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Index GIN pour les champs JSONB
CREATE INDEX idx_experiences_objectifs_gin ON public.experiences USING GIN (objectifs);
CREATE INDEX idx_experiences_materiel_gin ON public.experiences USING GIN (materiel);
CREATE INDEX idx_experiences_resultats_gin ON public.experiences USING GIN ("resultatsAttendus");

-- Professeur principal ou prof affecté ou admin peut lire une expérience
CREATE POLICY "Lecture expériences"
ON public.experiences
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
       OR ctx.id IN (
         SELECT professeur_id
         FROM public.professeurs_classes pc
         WHERE pc.classe_id = experiences.classe_id
       )
  )
);

-- Création ou modif si lié à la classe (prof ou admin)
CREATE POLICY "Modification expériences"
ON public.experiences
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
       OR ctx.id IN (
         SELECT professeur_id
         FROM public.professeurs_classes pc
         WHERE pc.classe_id = experiences.classe_id
       )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
       OR ctx.id IN (
         SELECT professeur_id
         FROM public.professeurs_classes pc
         WHERE pc.classe_id = experiences.classe_id
       )
  )
);




###### 🧭 `activity_logs` - Journal des activités utilisateurs 
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text,
  duree integer,
  meta jsonb,
  created_at timestamp without time zone DEFAULT now(),

  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT chk_activity_type CHECK (type = ANY (ARRAY['simulation', 'quiz']))
);

-- Activer RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Index combiné pour analyse temporelle
CREATE INDEX idx_activity_user_time ON public.activity_logs (user_id, created_at);

-- Lire ses propres activités
CREATE POLICY "Lecture logs personnels"
ON public.activity_logs
TO public
USING (
  user_id = auth.uid()
);

-- Insérer son propre log
CREATE POLICY "Ajout log personnel"
ON public.activity_logs
TO public
WITH CHECK (
  user_id = auth.uid()
);

-- Lecture totale pour admin
CREATE POLICY "Lecture logs admin"
ON public.activity_logs
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.role = 'admin'
  )
);




######  🎓 `quizzes` - Quiz interactifs 
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  duree text,
  niveau text CHECK (niveau = ANY (ARRAY['Débutant', 'Intermédiaire', 'Avancé'])),
  image text,
  created_at timestamp with time zone DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Politique de lecture ouverte
CREATE POLICY "Lecture quizzes simple"
ON public.quizzes
TO public
USING (true);

-- Politique d'insertion ouverte (à restreindre si besoin)
CREATE POLICY "Création quiz simple"
ON public.quizzes
TO public
WITH CHECK (true);

-- Politique de modification ouverte (à restreindre si besoin)
CREATE POLICY "Modification quiz simple"
ON public.quizzes
TO public
USING (true)
WITH CHECK (true);


###### ❓ `questions` - Questions pour les quiz 
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question text NOT NULL,
  options text[] NOT NULL,
  "correctAnswer" integer NOT NULL,
  explanation text,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT fk_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes (id) ON DELETE CASCADE
);

-- Activer RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture ouverte
CREATE POLICY "Lecture questions simple"
ON public.questions
TO public
USING (true);

-- Politique d'insertion ouverte (à restreindre si besoin)
CREATE POLICY "Insertion questions simple"
ON public.questions
TO public
WITH CHECK (true);

-- Politique de modification ouverte (à restreindre si besoin)
CREATE POLICY "Modification questions simple"
ON public.questions
TO public
USING (true)
WITH CHECK (true);





###### 🔬 `lab_items` - Molécules & Équipements 
CREATE TABLE public.lab_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text NOT NULL,
  structure text NOT NULL,
  category text NOT NULL CHECK (
    category = ANY (ARRAY['molecule', 'equipment'])
  ),
  niveau text CHECK (
    niveau IS NULL OR niveau = ANY (ARRAY['6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale'])
  ),
  formule text,
  importance text,
  usage text,
  precautions text,
  auteur_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_labitem_auteur FOREIGN KEY (auteur_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_lab_items_category ON public.lab_items USING btree (category);

ALTER TABLE public.lab_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture lab_items"
ON public.lab_items
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE
      ctx.id = auteur_id
      OR ctx.role = 'admin'
  )
);

CREATE POLICY "Insertion lab_item par auteur"
ON public.lab_items
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.id = auteur_id OR ctx.role = 'admin'
  )
);
CREATE POLICY "Modification lab_item auteur/admin"
ON public.lab_items
TO public
USING (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.id = auteur_id OR ctx.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM current_user_context ctx
    WHERE ctx.id = auteur_id OR ctx.role = 'admin'
  )
);
CREATE OR REPLACE VIEW mes_lab_items AS
SELECT *
FROM public.lab_items
WHERE auteur_id = auth.uid();
CREATE OR REPLACE VIEW lab_items_disponibles AS
SELECT li.*
FROM public.lab_items li
JOIN current_user_context ctx ON true
WHERE li.auteur_id = ctx.id OR ctx.role = 'admin';