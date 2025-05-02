# Project-Labo-Virtuel
Projet de laboratoire Virtuel de Chimie pour la classe de 1er, concue pour aider des apprenants a s'exercer sur des notions vues en classe en manipulant des object virtuels  mettant en pratique les connaissances theoriques acquis en classes.
# 🧪 Laboratoire Virtuel de Chimie

Bienvenue dans le Laboratoire Virtuel de Chimie, une plateforme interactive destinée aux élèves de 1ère pour explorer les expériences de chimie, manipuler des molécules en 3D, réaliser des simulations d'Experiences et répondre à des quiz pédagogiques.

## 🌐 Technologies utilisées

### Frontend
- **React** (TypeScript) – Framework principal de l’application.
- **Tailwind CSS** – Styling rapide, responsive et moderne.
- **React Router** – Navigation entre les différentes vues.
- **React Three Fiber** – Affichage d’objets 3D (matériel de laboratoire, molécules).
- **3Dmol.js** – Visualisation de structures moléculaires à partir de fichiers `.pdb`.
- **Framer Motion** – Animations fluides et dynamiques.
- **Lucide Icons** – Icônes vectorielles modernes.
- **GLTFLoader** – Chargement de modèles `.glb` dans la scène 3D.

### Backend
- **Supabase** – Backend-as-a-Service avec :
  - **PostgreSQL** – Base de données relationnelle.
  - **Auth** – Authentification pour élèves et professeurs.
  - **Storage** – Stockage de fichiers (modèles 3D, images).
  - **API REST** – Requêtes CRUD simples avec le client Supabase.

## 📁 Structure du projet

```bash
.
├── public/
│   └── moleculs/                     # Modèles 3D .glb pour les molécules
│   └── materiels/                    # Modèles 3D .glb pour les matériels de laboratoire
├── src/
│   ├── components/                   # Composants réutilisables
│   │   └── layouts/                  # Layouts pour chaque type d’utilisateur
│   │       ├── EleveLayouts.tsx              # Layout spécifique pour l'élève
│   │       └── ProfesseurLayouts.tsx         # Layout spécifique pour le professeur
│   │   └── ui/                       # Composants d'interface utilisateur (UI)
│   │       ├── toast.tsx                    # Configuration d'une alerte toast
│   │       └── toaster.tsx                  # Composant affichant les toasts
│   │   └── views/                    # Vues principales selon le profil utilisateur
│   │       ├── Eleve/                      # Interface élève (expériences, quiz, visualisation)
│   │       └── Professeur/                 # Interface professeur (dashboard, gestion des quiz, gestions de la 3D, suivi-eleve)
│   ├── data/                         # Données statiques ou chargées à l'init
│   │   └── Experience/                  # Données des expériences
│   │       ├── experiencesData.ts            # Liste des expériences interactives
│   │   └── Quiz/                          # Données des quiz
│   │       ├── quizData.ts                   # Quiz avec questions, réponses et explications
│   │   └── Viewer3D/                      # Données pour la visualisation 3D
│   │       ├── labEquipmentData.ts           # Référencement des équipements 3D
│   │       ├── moleculeData.ts               # Référencement des molécules en 3D
│   ├── hooks/                        # Hooks personnalisés
│   │   └── use-toast.ts                  # Hook pour afficher des toasts
│   ├── lib/                          # Fichiers de configuration partagés
│   │   └── supabaseClient.ts             # Configuration et initialisation du client Supabase
│   ├── script/                       # Scripts de population ou de setup
│   │   └── insert-quizzes.ts              # Script pour insérer les quiz dans Supabase
│   │   └── insertLabItems.ts              # Script pour insérer les matériels de laboratoire
│   ├── simulations/                  # Composants d’expériences interactives
│   │   └── TitrageAcidoBasique.tsx        # Simulation du titrage acido-basique
│   ├── types/                        # Typage global de l'application
│   │   └── Experiences/                   # Types liés aux expériences
│   │       ├── experiences.ts                 # Définition des objets expériences
│   │   └── Quiz/                     # Types pour les quiz
│   │       ├── quiz.ts               # Structure des objets quiz
│   │   └── Viewer3D/                 # Types pour la visualisation 3D
│   │       ├── moleculeEquipments.ts          # Définition des équipements moléculaires
│   └── App.tsx                       # Point d’entrée principal de l’application
│   └── index.css                     # Fichier de styles global (base Tailwind)
│   └── main.tsx                      # Fichier d’initialisation React
