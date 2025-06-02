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
  image: string; 
  questions: QuizQuestion[];
  classe_id: string;
  auteur_id: string; 
  created_at?: string;
};

  export type QuizProgress = {
    currentQuestion: number;
    answers: number[];
    score: number;
    completed: boolean;
    showExplanation: boolean;
  };

export type QuizWithClasse = {
  quiz_id: string;
  titre: string;
  description: string;
  duree: string;
  image: string;
  auteur_id: string;
  created_at?: string;
  code_classe?: string[];
  code_classe_affichage?: string;
  questions: QuizQuestion[];
};
