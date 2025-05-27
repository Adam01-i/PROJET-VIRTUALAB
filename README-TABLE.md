###### 📋 Schéma de la base de données 

###### `role_type` - enumeration de type role
create type role_type as enum ('eleve', 'professeur', 'admin');

###### 👤 `profiles` - Profils utilisateurs liés à auth.users 

### -- 1. Creation de la table
create table public.profiles (
  id uuid not null,
  email text null,
  name text null,
  surname text null,
  avatar_url text null,
  role public.role_type null,
  created_at timestamp without time zone null default now(),
  must_change_password boolean null default true,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

alter policy "Admins lisent tous les profils"
on "public"."profiles"
to public
using (
  (EXISTS ( SELECT 1
   FROM current_user_context ctx
  WHERE (ctx.role = 'admin'::role_type)))
);

alter policy "Prof lit profils élèves de ses classes"
on "public"."profiles"
to authenticated
using (
  (EXISTS ( SELECT 1
   FROM (eleves_classes ec
     JOIN professeurs_classes pc ON ((ec.classe_id = pc.classe_id)))
  WHERE ((ec.eleve_id = profiles.id) AND (pc.professeur_id = auth.uid()))))
);

alter policy "Update own profile"
on "public"."profiles"
to public
using (
  (id = auth.uid())
with check (
(id = auth.uid())
);

alter policy "Utilisateur peut lire son propre profil"
on "public"."profiles"
to public
using (
  (id = auth.uid())
);

###### 🏫 `classes` - Groupes pédagogiques 

### -- 1. Creation de la table
create table public.classes (
  id uuid not null default gen_random_uuid (),
  niveau text not null,
  created_at timestamp with time zone null default now(),
  lettre text not null,
  code_classe text GENERATED ALWAYS as (((niveau || ' '::text) || lettre)) STORED not null,
  updated_at timestamp with time zone null default now(),
  modified_by uuid null,
  constraint classes_pkey primary key (id),
  constraint classes_code_classe_key unique (code_classe),
  constraint classes_lettre_check check (
    (
      lettre = any (
        array[
          'A'::text,
          'B'::text,
          'C'::text,
          'D'::text,
          'E'::text
        ]
      )
    )
  ),
  constraint classes_niveau_check check (
    (
      niveau = any (
        array[
          '6e'::text,
          '5e'::text,
          '4e'::text,
          '3e'::text,
          '2ndeS'::text,
          '2ndeL'::text,
          '1èreS2'::text,
          '1èreL2'::text,
          'TLeS2'::text,
          'TLeL2'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trg_set_updated_at BEFORE
update on classes for EACH row
execute FUNCTION set_updated_at ();

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

alter policy "Allow all inserts"
on "public"."classes"
to public
with check (
  true
);

alter policy "Allow delete to all"
on "public"."classes"
to public
using (
  true
);

alter policy "Allow insert to all"
on "public"."classes"
to public
with check (
  true
);

alter policy "Allow read to all"
on "public"."classes"
to public
using (
  true
);

alter policy "Allow update to all"
on "public"."classes"
to public
using (
  true
);

alter policy "Professeurs peuvent voir leurs classes"
on "public"."classes"
to public
using (
  (EXISTS ( SELECT 1
   FROM professeurs_classes
  WHERE ((professeurs_classes.classe_id = classes.id) AND (professeurs_classes.professeur_id = auth.uid()))))
);

alter policy "Tout le monde peut voir les classes"
on "public"."classes"
to authenticated
using (
  true
);

###### `professeurs_classes` - Lien professeurs ↔️ classes 

### -- 1. Creation de la table
create table public.professeurs_classes (
  id uuid not null default gen_random_uuid (),
  professeur_id uuid not null,
  classe_id uuid not null,
  assigned_at timestamp without time zone null default now(),
  is_principal boolean null default false,
  constraint professeurs_classes_pkey primary key (id),
  constraint professeurs_classes_unique unique (professeur_id, classe_id),
  constraint fk_classe foreign KEY (classe_id) references classes (id) on delete CASCADE,
  constraint fk_professeur foreign KEY (professeur_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_professeurs_classes_professeur_id on public.professeurs_classes using btree (professeur_id) TABLESPACE pg_default;

create index IF not exists idx_professeurs_classes_classe_id on public.professeurs_classes using btree (classe_id) TABLESPACE pg_default;

create index IF not exists idx_professeurs_classes_is_principal on public.professeurs_classes using btree (classe_id, is_principal) TABLESPACE pg_default
where
  (is_principal = true);

create unique INDEX IF not exists unique_principal_per_classe on public.professeurs_classes using btree (classe_id) TABLESPACE pg_default
where
  (is_principal = true);

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.professeurs_classes ENABLE ROW LEVEL SECURITY;

alter policy "read profs"
on "public"."professeurs_classes"
to public
using (
  true
);

###### `eleves_classes` - Lien eleves ↔️ classes 

### -- 1. Creation de la table
create table public.eleves_classes (
  id uuid not null default gen_random_uuid (),
  eleve_id uuid not null,
  classe_id uuid not null,
  assigned_at timestamp without time zone null default now(),
  constraint eleves_classes_pkey primary key (id),
  constraint one_class_per_student unique (eleve_id),
  constraint fk_classe foreign KEY (classe_id) references classes (id) on delete CASCADE,
  constraint fk_eleve foreign KEY (eleve_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_eleves_classes_eleve_id on public.eleves_classes using btree (eleve_id) TABLESPACE pg_default;

create index IF not exists idx_eleves_classes_classe_id on public.eleves_classes using btree (classe_id) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.eleves_classes ENABLE ROW LEVEL SECURITY;

alter policy "Prof lit eleves_classes de ses classes"
on "public"."eleves_classes"
to authenticated
using (
  (EXISTS ( SELECT 1
   FROM professeurs_classes pc
  WHERE ((pc.classe_id = eleves_classes.classe_id) AND (pc.professeur_id = auth.uid()))))
);

alter policy "read élèves"
on "public"."eleves_classes"
to public
using (
  true
);

###### 🧪 `experiences` - Expérimentations scientifiques 

### -- 1. Creation de la table
create table public.experiences (
  id uuid not null default gen_random_uuid (),
  titre text not null,
  description text null,
  duree text null,
  niveau text null,
  image text null,
  "simulationPath" text null,
  objectifs jsonb null,
  materiel jsonb null,
  "resultatsAttendus" jsonb null,
  created_at timestamp with time zone null default now(),
  classe_id uuid null,
  auteur_id uuid null,
  is_public boolean not null default false,
  constraint experiences_pkey primary key (id),
  constraint experiences_auteur_id_fkey foreign KEY (auteur_id) references profiles (id) on delete set null,
  constraint fk_experience_classe foreign KEY (classe_id) references classes (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_experiences_objectifs_gin on public.experiences using gin (objectifs) TABLESPACE pg_default;

create index IF not exists idx_experiences_materiel_gin on public.experiences using gin (materiel) TABLESPACE pg_default;

create index IF not exists idx_experiences_resultats_gin on public.experiences using gin ("resultatsAttendus") TABLESPACE pg_default;

create index IF not exists idx_experiences_auteur_id on public.experiences using btree (auteur_id) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

alter policy "Allow insert on experiences"
on "public"."experiences"
to public
with check (
  true
);

alter policy "Lecture expériences par élèves"
on "public"."experiences"
to public
using (
  ((auth.role() = 'eleve'::text) AND (EXISTS ( SELECT 1
   FROM eleves_classes ec
  WHERE ((ec.classe_id = experiences.classe_id) AND (ec.eleve_id = auth.uid())))))
);

###### 🧪 `lab_items` - Les obejts en 3D

### -- 1. Creation de la table
create table public.lab_items (
  id uuid not null default gen_random_uuid (),
  nom text not null,
  description text not null,
  structure text not null,
  category text not null,
  formule text null,
  importance text null,
  usage text null,
  precautions text null,
  auteur_id uuid null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  classe_id uuid null,
  constraint lab_items_pkey primary key (id),
  constraint fk_labitem_classe foreign KEY (classe_id) references classes (id) on delete set null,
  constraint lab_items_auteur_id_fkey foreign KEY (auteur_id) references profiles (id) on delete set null,
  constraint lab_items_category_check check (
    (
      category = any (array['molecule'::text, 'equipment'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_lab_items_category on public.lab_items using btree (category) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.lab_items ENABLE ROW LEVEL SECURITY;

alter policy "Allow insert for service role"
on "public"."lab_items"
to public
with check (
  true
);

alter policy "Allow insert on lab_items"
on "public"."lab_items"
to public
with check (
  true
);

alter policy "Lecture lab_items par élèves"
on "public"."lab_items"
to public
using (
  ((auth.role() = 'eleve'::text) AND (EXISTS ( SELECT 1
   FROM eleves_classes ec
  WHERE ((ec.classe_id = lab_items.classe_id) AND (ec.eleve_id = auth.uid())))))
);

###### 🧪 `quizzes` - Les Quiz

### -- 1. Creation de la table
create table public.quizzes (
  id uuid not null default gen_random_uuid (),
  titre text not null,
  description text null,
  duree text null,
  image text null,
  created_at timestamp with time zone null default now(),
  auteur_id uuid null,
  classe_id uuid null,
  constraint quizzes_pkey primary key (id),
  constraint quizzes_auteur_id_fkey foreign KEY (auteur_id) references profiles (id) on delete set null,
  constraint quizzes_classe_id_fkey foreign KEY (classe_id) references classes (id) on delete set null
) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

alter policy "Allow insert on quizzes"
on "public"."quizzes"
to public
with check (
  true
);

alter policy "Lecture libre des quiz"
on "public"."quizzes"
to public
using (
  true
);

alter policy "Lecture quiz par élèves"
on "public"."quizzes"
to public
using (
  ((auth.role() = 'eleve'::text) AND (EXISTS ( SELECT 1
   FROM eleves_classes ec
  WHERE ((ec.classe_id = quizzes.classe_id) AND (ec.eleve_id = auth.uid())))))
);

alter policy "Lecture quizzes simple"
on "public"."quizzes"
to public
using (
  true
);

alter policy "Professeurs peuvent lire les quiz"
on "public"."quizzes"
to public
using (
  (EXISTS ( SELECT 1
   FROM professeurs_classes pc
  WHERE ((pc.professeur_id = auth.uid()) AND (pc.classe_id = quizzes.classe_id))))
);

###### 🧭 `questions` - Questions des quizzes

### -- 1. Creation de la table
create table public.questions (
  id uuid not null default gen_random_uuid (),
  quiz_id uuid not null,
  question text not null,
  options text[] not null,
  "correctAnswer" integer not null,
  explanation text null,
  created_at timestamp with time zone null default now(),
  constraint questions_pkey primary key (id),
  constraint fk_quiz foreign KEY (quiz_id) references quizzes (id) on delete CASCADE
) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

alter policy "Allow insert on questions"
on "public"."questions"
to public
with check (
  true
);

alter policy "Lecture questions simple"
on "public"."questions"
to public
using (
  true
);

###### 🧭 `quiz_results` - Resultats des quizzes realiser par les eleves

### -- 1. Creation de la table
create table public.quiz_results (
  id uuid not null default gen_random_uuid (),
  eleve_id uuid not null,
  quiz_id uuid not null,
  score integer not null,
  total integer not null,
  completed_at timestamp without time zone null default now(),
  constraint quiz_results_pkey primary key (id),
  constraint quiz_results_quiz_id_fkey foreign KEY (quiz_id) references quizzes (id) on delete CASCADE
) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

alter policy "Insertion scores par élève"
on "public"."quiz_results"
to public
with check (
  (eleve_id = auth.uid())
);

alter policy "Lecture scores par élève"
on "public"."quiz_results"
to public
using (
  (eleve_id = auth.uid())
);

alter policy "Professeurs peuvent lire les résultats de leurs élèves"
on "public"."quiz_results"
to public
using (
  (EXISTS ( SELECT 1
   FROM (eleves_classes ec
     JOIN professeurs_classes pc ON ((ec.classe_id = pc.classe_id)))
  WHERE ((ec.eleve_id = quiz_results.eleve_id) AND (pc.professeur_id = auth.uid()))))
);

###### 🧭 `activity_logs` - Journal des activités utilisateurs 

### -- 1. Creation de la table
create table public.activity_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  type text null,
  duree integer null,
  meta jsonb null,
  created_at timestamp without time zone null default now(),
  constraint activity_logs_pkey primary key (id),
  constraint fk_activity_user foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint chk_activity_type check (
    (
      type = any (array['simulation'::text, 'quiz'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_activity_user_time on public.activity_logs using btree (user_id, created_at) TABLESPACE pg_default;

### -- 2. Activer la sécurité RLS et les Politiques RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

alter policy "Ajout log personnel"
on "public"."activity_logs"
to public
using (
with check (
(user_id = auth.uid())
);

alter policy "Lecture logs personnels"
on "public"."activity_logs"
to public
using (
  (user_id = auth.uid())
);

alter policy "Prof lit logs des élèves de ses classes"
on "public"."activity_logs"
to authenticated
using (
  (EXISTS ( SELECT 1
   FROM (eleves_classes ec
     JOIN professeurs_classes pc ON ((ec.classe_id = pc.classe_id)))
  WHERE ((ec.eleve_id = activity_logs.user_id) AND (pc.professeur_id = auth.uid()))))
);

create policy "Admin lit tout"
on "public"."activity_logs"
to authenticated
using (true);










###### Les vues ###############################################

create view public.current_user_context as
select
  profiles.id,
  profiles.role
from
  profiles
where
  profiles.id = auth.uid ();

###### 
  create view public.mes_classes as
select
  c.id,
  c.niveau,
  c.created_at,
  c.lettre,
  c.code_classe,
  c.updated_at,
  c.modified_by
from
  classes c
  join professeurs_classes pc on pc.classe_id = c.id
where
  pc.professeur_id = auth.uid ();

######
create view public.mes_experiences as
select
  experiences.id,
  experiences.titre,
  experiences.description,
  experiences.duree,
  experiences.niveau,
  experiences.image,
  experiences."simulationPath",
  experiences.objectifs,
  experiences.materiel,
  experiences."resultatsAttendus",
  experiences.created_at,
  experiences.classe_id,
  experiences.auteur_id
from
  experiences
where
  experiences.auteur_id = auth.uid ();

######
create view public.mes_experiences_eleve as
select
  e.id,
  e.titre,
  e.description,
  e.duree,
  e.niveau,
  e.image,
  e."simulationPath",
  e.objectifs,
  e.materiel,
  e."resultatsAttendus",
  e.created_at,
  e.classe_id,
  e.auteur_id
from
  experiences e
  join eleves_classes ec on ec.classe_id = e.classe_id
where
  ec.eleve_id = auth.uid ();

######
create view public.mes_lab_items as
select
  li.id,
  li.nom,
  li.description,
  li.structure,
  li.category,
  li.formule,
  li.importance,
  li.usage,
  li.precautions,
  li.auteur_id,
  li.created_at,
  cl.code_classe
from
  lab_items li
  left join classes cl on li.classe_id = cl.id
where
  li.auteur_id = auth.uid ();

######
create view public.mes_resultats_quiz as
select
  r.id,
  r.eleve_id,
  r.quiz_id,
  r.score as correct_answers,
  r.total as total_questions,
  r.completed_at as date_completed,
  q.titre as quiz_title
from
  quiz_results r
  join quizzes q on q.id = r.quiz_id;

######
create view public.vue_classes_completes as
select
  c.id,
  c.code_classe,
  c.created_at,
  c.niveau,
  c.lettre,
  c.updated_at,
  c.modified_by,
  (
    select
      count(*) as count
    from
      eleves_classes ec
    where
      ec.classe_id = c.id
  ) as students_count,
  (
    select
      count(*) as count
    from
      professeurs_classes pc
    where
      pc.classe_id = c.id
  ) as teachers_count,
  (
    select
      pc.professeur_id
    from
      professeurs_classes pc
    where
      pc.classe_id = c.id
      and COALESCE(pc.is_principal, false) = true
    limit
      1
  ) as professeur_principal_id
from
  classes c;

######
create view public.vue_experience_details as
select
  e.id,
  e.titre,
  e.description,
  e.duree,
  e.niveau,
  e.image,
  e."simulationPath",
  e.objectifs,
  e.materiel,
  e."resultatsAttendus",
  e.created_at,
  e.classe_id,
  e.auteur_id,
  e.is_public,
  c.code_classe
from
  experiences e
  left join classes c on e.classe_id = c.id;

######
create view public.vue_lab_items_details as
select
  li.id,
  li.nom,
  li.description,
  li.structure,
  li.category,
  li.formule,
  li.importance,
  li.usage,
  li.precautions,
  li.auteur_id,
  li.created_at,
  li.classe_id,
  c.code_classe
from
  lab_items li
  left join classes c on li.classe_id = c.id;

######
create view public.vue_quiz_details as
select
  q.id,
  q.titre,
  q.description,
  q.duree,
  q.image,
  q.created_at,
  q.auteur_id,
  q.classe_id,
  c.code_classe,
  c.niveau
from
  quizzes q
  left join classes c on q.classe_id = c.id;

######
create view public.vue_activity_logs_with_roles as
select 
  al.id,
  al.user_id,
  al.type,
  al.duree,
  al.meta,
  al.created_at,
  p.role
from activity_logs al
left join profiles p on al.user_id = p.id;
