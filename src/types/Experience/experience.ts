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

  // Champs ajoutés par la vue
  code_classe?: string; // ⚠️ Optionnel car pas toujours présent
  is_public?: boolean;  // facultatif car lors de création, il peut ne pas être défini encore
};



export type ExperienceStep = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  duration: number; // in seconds
  warning?: string;
};