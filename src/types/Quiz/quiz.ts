export type QuizQuestion = {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image?: string;
};

export type Quiz = {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  image: string; // 👈 DOIT ÊTRE string (pas string | undefined)
  questions: QuizQuestion[];
  classe_id: string;
  auteur_id: string; // 👈 DOIT ÊTRE string (pas string | undefined)
  created_at?: string;
};

  export type QuizProgress = {
    currentQuestion: number;
    answers: number[];
    score: number;
    completed: boolean;
    showExplanation: boolean;
  };