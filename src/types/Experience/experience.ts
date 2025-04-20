export type Experience = {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  image: string;
  objectifs: string[];
  materiel: string[];
  resultatsAttendus: string[];
};

export type ExperienceStep = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  duration: number; // in seconds
  warning?: string;
};