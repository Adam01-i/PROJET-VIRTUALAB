# 🧪 Laboratoire Virtuel de Chimie

Bienvenue dans le Laboratoire Virtuel de Chimie, une plateforme interactive destinée aux élèves de 1ère pour explorer les expériences de chimie, manipuler des molécules en 3D, réaliser des simulations d'expériences et répondre à des quiz pédagogiques.

---

## 🌐 Technologies utilisées

### Frontend
- **React (Vite + TypeScript)** – Framework principal de l’application.
- **Tailwind CSS** – Styling rapide, responsive et moderne.
- **React Router** – Navigation entre les différentes vues.
- **React Three Fiber** – Affichage d’objets 3D (matériel de laboratoire, molécules).
- **3Dmol.js** – Visualisation de structures moléculaires à partir de fichiers `.pdb`.
- **Framer Motion** – Animations fluides et dynamiques.
- **Lucide Icons** – Icônes vectorielles modernes.
- **GLTFLoader** – Chargement de modèles `.glb` dans la scène 3D.

### Backend
- **Express.js** – Serveur API léger pour gérer les imports d’utilisateurs.
- **Supabase** – Backend-as-a-Service avec :
  - **PostgreSQL** – Base de données relationnelle.
  - **Auth** – Authentification pour élèves et professeurs.
  - **Storage** – Stockage de fichiers (modèles 3D, images, expériences).
  - **Admin API** – Création sécurisée des comptes utilisateurs.

---

## 📁 Structure du projet

```bash
.
├── backend/                         # Serveur Node.js Express pour l'import de professeurs
│   ├── server.js                   # API POST /api/import-professeurs
│   └── .env                        # Variables d'environnement (URL Supabase, clé Service Role)
├── public/
│   └── assets/                     # Images pour la bannière
│   └── materiels/                  # Modèles 3D .glb pour les matériels de laboratoire
│   └── moleculs/                   # Modèles 3D .glb pour les molécules
├── src/
│   ├── components/
│   │   └── layouts/                # Layouts utilisateur (élève / professeur)
│   │   └── ui/                     # Composants d'interface utilisateur
│   │   └── views/                 # Vues principales par rôle
│   ├── data/                       # Données statiques (expériences, quiz)
│   ├── hooks/                      # Hooks personnalisés
│   ├── lib/                        # Configuration Supabase et utilitaires
│   ├── pages/                      # fichiers d'importation import-users pour l'API
│   ├── scripts/                     # Scripts d’initialisation
│   ├── simulations/                # Composants de simulations interactives
│   ├── types/                      # Typage global de l'application
│   ├── App.tsx                     # Point d’entrée React
│   ├── index.css                   # Styles globaux (Tailwind)
│   └── main.tsx                    # Initialisation React/Vite
├── vite.config.ts                  # Configuration Vite (proxy vers API backend)
└── README.md                       # Ce fichier

ts-node src/script/insert-experiences.ts
ts-node src/script/insert-quizzes.ts
ts-node src/scripts/insertLabItems.ts




