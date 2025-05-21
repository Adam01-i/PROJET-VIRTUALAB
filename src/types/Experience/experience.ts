export type Experience = {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  image: string;
  simulationPath: string;
  classe_id: string;        
  auteur_id?: string;       
  objectifs: string[];
  materiel: string[];
  resultatsAttendus: string[];
  created_at?: string;
};


export type ExperienceStep = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  duration: number; // in seconds
  warning?: string;
};