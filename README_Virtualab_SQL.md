
# 🧪 Virtualab - README SQL

Ce fichier décrit la structure des tables, les règles de sécurité (RLS), et les extensions nécessaires à l’infrastructure de la plateforme **Virtualab**.

---

## 🔌 Extensions requises

```sql
-- Générateur UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 🚀 Scripts d'insertion (développement)

```bash
ts-node src/script/insertLabItems.ts
ts-node src/scripts/insertQuizzes.ts
```

---

## 📋 Schéma de la base de données

### 🎓 `quizzes` - Quiz interactifs

```sql
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
```

### ❓ `questions` - Questions pour les quiz

```sql
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
```

### 🔬 `lab_items` - Molécules & Équipements

```sql
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
```

### 🧪 `experiences` - Expérimentations scientifiques

```sql
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
```

... (Tronqué ici pour concision, mais dans le code complet on inclut l'intégralité comme dans la réponse précédente)

---

## 📧 Configuration SMTP pour notifications Supabase

| Champ             | Valeur                                                  |
|-------------------|---------------------------------------------------------|
| **Sender email**  | `tonmail@gmail.com`                                     |
| **Sender name**   | `Virtualab Support`                                     |
| **SMTP host**     | `smtp.gmail.com`                                        |
| **SMTP port**     | `587`                                                   |
| **Username**      | `tonmail@gmail.com`                                     |
| **Password**      | 🔑 Mot de passe d'application généré via Google         |

---

### ✅ Conseils finaux

- **Séparer les fichiers** en plusieurs fichiers `.sql` par table ou module (`tables.sql`, `triggers.sql`, `policies.sql`)
- Utiliser **commentaires SQL** pour clarifier les champs et types (`--`)
- Automatiser l’import dans Supabase via **migrations SQL** dans un dossier `/supabase/migrations`
