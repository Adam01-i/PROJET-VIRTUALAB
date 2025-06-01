export type Experience = {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  image: string;
  simulationPath: string;
  objectifs: string[];
  materiel: string[];
  resultatsAttendus: string[];
  created_at?: string;
  classe_id: string;
  auteur_id?: string;

  code_classe?: string[]; // ✅ tableau de noms de classes
  code_classe_affichage?: string; // ✅ nom de la classe pour affichage
  is_public?: boolean; 
};



export type ExperienceStep = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  duration: number; // in seconds
  warning?: string;
};