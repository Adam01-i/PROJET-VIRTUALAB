# 🧪 VirtuaLaB — Laboratoire Virtuel de Chimie

**VirtuaLaB** est une plateforme web interactive permettant de simuler des expériences de chimie de manière immersive, accessible et pédagogique, conçue spécifiquement pour les élèves de **classe de Première scientifique** au Sénégal.

Le projet répond à un problème concret : l'insuffisance d'équipements de laboratoire, les coûts élevés du matériel scientifique et les difficultés logistiques qui empêchent de nombreux lycées sénégalais d'offrir des travaux pratiques réguliers à leurs élèves.

> 📖 Projet de mémoire de Licence Professionnelle — Développement et Administration d'Applications (D2A), Université Alioune Diop de Bambey (2023-2024). Réalisé par **Serigne Moustapha MBACKÉ** et **Adama SECK**, sous l'encadrement de **Dr. Fatoumata BALDÉ**.

🔗 **Dépôt GitHub** : [github.com/Adam01-i/PROJET-VIRTUALAB](https://github.com/Adam01-i/PROJET-VIRTUALAB)
🌐 **Démo en ligne** : [virtualab2025.vercel.app](https://virtualab2025.vercel.app)

---

## 📌 Contexte et problématique

L'enseignement de la chimie repose largement sur l'expérimentation. Or, dans de nombreux établissements scolaires sénégalais — en particulier en zones rurales ou défavorisées — l'absence de laboratoires physiques réduit l'enseignement à une approche purement théorique, déconnectée de la pratique.

**VirtuaLaB** propose une alternative numérique interactive : simuler des expériences, manipuler virtuellement du matériel scientifique et visualiser des structures moléculaires en 3D, le tout accessible depuis un simple navigateur — ordinateur, tablette ou smartphone.

---

## ✨ Fonctionnalités principales

### 🎓 Espace Élève
- **Simulations 3D interactives** : titrage acido-basique (HCl / NaOH), réaction redox (fer et sels métalliques), test des chaînes carbonées insaturées à l'eau de brome.
- **Visualisation 3D** de molécules et de matériel de laboratoire (zoom, rotation, manipulation).
- **Quiz interactifs auto-corrigés** (QCM, vrai/faux) avec score immédiat.
- **Assistant IA pédagogique** : chatbot spécialisé en chimie niveau Première, qui répond exclusivement aux questions du programme scolaire et refuse automatiquement les questions hors sujet.

### 👨‍🏫 Espace Professeur
- Tableau de bord avec vue d'ensemble des classes, des élèves et de leur activité.
- Création et affectation de simulations, quiz et objets 3D à une ou plusieurs classes.
- Suivi des scores et des performances individuelles par élève.

### 🛠️ Espace Administrateur
- Tableau de bord global de l'activité de la plateforme.
- **Import/export d'utilisateurs par fichier Excel** : création automatique des comptes (élèves, professeurs) avec attribution d'un mot de passe par défaut.
- Gestion des classes et affectation des professeurs.

### 🔐 Authentification
- Comptes créés en amont par l'administrateur (pas d'auto-inscription).
- Mot de passe par défaut attribué à la création, avec **changement obligatoire à la première connexion**.
- Récupération de mot de passe par email.

---

## 🛠️ Technologies utilisées

### Frontend
- **React** + **TypeScript** — robustesse et maintenabilité du code
- **Tailwind CSS** — design responsive
- **React Router** — navigation par rôle (élève / professeur / admin)
- **React Three Fiber** — visualisation et simulations 3D interactives

### Backend
- **Supabase** — backend-as-a-service open source : base de données PostgreSQL, API REST auto-générée, authentification, Row Level Security, stockage de fichiers (modèles `.glb`), temps réel
- **Node.js / Express.js** — API personnalisées pour les besoins que Supabase seul ne couvre pas (import Excel en masse, chatbot IA)

### Base de données
- **PostgreSQL** (via Supabase), sécurisée par des politiques **RLS (Row Level Security)** garantissant que chaque utilisateur n'accède qu'aux données qui le concernent.

### Déploiement
- **Vercel** — hébergement du frontend, déploiement continu à chaque push sur `main`
- **Railway** — hébergement du backend Node.js/Express

### Modélisation
- **UML** — diagrammes de cas d'utilisation, diagrammes de séquence, diagramme de classes

---

## 🏗️ Architecture

VirtuaLaB repose sur une architecture en couches avec séparation claire des responsabilités :

```
Frontend (React + TypeScript)
        │
        │ API RESTful
        ▼
┌───────────────────┬─────────────────────────┐
│      Supabase      │   Backend Node.js/Express │
│  (données, auth,    │   (import Excel, chatbot   │
│   stockage, RLS)    │   IA, routes personnalisées)│
└───────────────────┴─────────────────────────┘
```

### Modèle de données (extrait)

| Entité | Rôle |
|---|---|
| `user` | Utilisateurs (élève / professeur / admin), rôle, statut de changement de mot de passe |
| `Classe` | Classes pédagogiques (niveau, lettre, code) |
| `Expérience` | Catalogue des simulations de chimie disponibles |
| `ObjetLabo` | Objets 3D (molécules, équipements) |
| `Quiz` / `Question` / `ResultatQuiz` | Système de quiz et de scores |
| `JournalActivité` | Journal des activités des utilisateurs |

Chaque entité est protégée par des politiques **RLS** garantissant l'accès restreint aux seules données pertinentes pour l'utilisateur connecté.

---

## 🚀 Déploiement

Le projet est déployé selon une architecture à deux services :

| Composant | Plateforme | Rôle |
|---|---|---|
| Frontend React | **Vercel** | Interface utilisateur, routage, composants 3D |
| Backend Node.js | **Railway** | Routes API personnalisées, logique métier, accès à Supabase |
| Base de données | **Supabase** | Authentification, stockage, données |

### Variables d'environnement

**Frontend (`.env.production`)**
```env
VITE_BACKEND_URL=https://virtualab-backend-production.up.railway.app
```

**Backend (Railway → Settings)**
```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3001
```

### ⚠️ Problème rencontré et résolu : CORS

Lors de la mise en production, les requêtes du frontend (Vercel) vers le backend (Railway) étaient bloquées :

```
Access to fetch at '...' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**Solution** : mise en place d'une politique CORS explicite côté serveur Express, associée à l'activation manuelle du bon domaine Railway — résolvant définitivement le problème.

---

## 🧪 Tests utilisateurs

VirtuaLaB a été testé en conditions réelles auprès de :
- **10 élèves** de classe de Première scientifique
- **3 enseignants** de chimie du secondaire
- **1 encadrant technique**

### Résultats
- **85 %** des élèves ont trouvé l'interface intuitive sur ordinateur.
- Les enseignants ont salué l'intérêt pédagogique des simulations et la clarté du tableau de bord.
- Le chatbot pédagogique a été utilisé spontanément, avec des retours positifs sur la pertinence des réponses.

### Limites identifiées
- Le mode plein écran des simulations 3D (React Three Fiber) ne s'active pas correctement sur **Safari iOS**.
- Certaines simulations sont tronquées ou difficiles à manipuler sur les **petits écrans Android**.
- Ralentissements possibles en zone de faible couverture réseau.

Ces retours ont directement alimenté les perspectives d'amélioration du projet (voir ci-dessous).

---

## 📈 Perspectives d'évolution

- 📱 Amélioration de la compatibilité mobile (correction du plein écran iOS, responsive avancé pour petits écrans).
- 🏅 Système de progression (badges, niveaux) pour renforcer la motivation des élèves.
- 🧬 Extension du catalogue d'expériences (chimie organique, physique-chimie).
- 🤖 Enrichissement du chatbot pédagogique (mode conversation guidée, rappels intelligents).
- 🌐 Déploiement à grande échelle avec gestion multi-établissements.
- 📴 Version hors-ligne (PWA) pour les établissements sans connexion internet stable.
- 🔬 Étude d'impact contrôlée (pré-test / post-test) pour mesurer l'effet pédagogique réel.

---

## 🌍 Positionnement

VirtuaLaB se distingue des solutions existantes (PhET, Labster, PraxiLabs, MEL Science, Sunudaara) par une approche contextualisée au programme scolaire sénégalais, combinant simulations 3D, chatbot pédagogique spécialisé, interface professeur complète et suivi des apprentissages — des fonctionnalités rarement réunies dans une seule plateforme adaptée au niveau lycée.

---

## 🖼️ Captures d'écran

> Cette section permet de présenter visuellement l'application sur GitHub.

### 🎓 Espace Élève
![Accueil](screenshots/img_accueil.png)
![Assistant IA Pédagogique](screenshots/img_chatbot.png)
![Simulation — Réaction Redox](screenshots/img_simulation_redox.png)
![Simulation — Titrage Acido-Basique](screenshots/img_simulation_titrage.png)
![Simulation — Chaînes carbonées insaturées](screenshots/img_simulation_chaines.png)
![Quiz interactifs](screenshots/img_quiz.png)
![Visualisation 3D](screenshots/img_visualisation_3d.png)

### 👨‍🏫 Espace Professeur
![Tableau de bord Professeur](screenshots/img_dashboard_prof.png)
![Gestion des classes](screenshots/img_gestion_classes_prof.png)
![Gestion des simulations](screenshots/img_gestion_simulations.png)
![Gestion des quiz](screenshots/img_gestion_quiz.png)
![Gestion des objets 3D](screenshots/img_gestion_3d.png)

### 🛠️ Espace Administrateur
![Tableau de bord Administrateur](screenshots/img_dashboard_admin.png)
![Gestion des utilisateurs](screenshots/img_gestion_utilisateurs.png)
![Gestion des classes (admin)](screenshots/img_gestion_classes_admin.png)

> 📁 Les fichiers complets sont à placer dans le dossier `screenshots/` à la racine du dépôt.

---

## 👥 Contribution

**Serigne Moustapha MBACKÉ** & **Adama SECK**
Licence Professionnelle, Développement et Administration d'Applications
Université Alioune Diop de Bambey — Sénégal

**Encadrante** : Dr. Fatoumata BALDÉ

**Répartition du travail** :
- **Adama SECK** : conception et développement de l'ensemble des interfaces et fonctionnalités des 3 espaces (élève, professeur, administrateur) — authentification, tableaux de bord, gestion des classes/quiz/objets 3D, import/export Excel, chatbot IA — ainsi que le déploiement (Vercel + Railway) et les tests utilisateurs, du début à la fin du projet.
- **Serigne Moustapha MBACKÉ** : conception et développement des simulations 3D interactives (titrage, réactions redox, chaînes carbonées).

---

## 📄 Licence

Projet académique — Mémoire de Licence Professionnelle, année académique 2023-2024.
