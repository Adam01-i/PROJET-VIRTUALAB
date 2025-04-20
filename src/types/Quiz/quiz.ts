export type QuizQuestion = {
    id?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    image?: string;
  };
  
  export type Niveau = "Débutant" | "Intermédiaire" | "Avancé";

  export type Quiz = {
    id: string;
    titre: string;
    description: string;
    duree: string;
    niveau: Niveau;
    image: string;
    questions: QuizQuestion[];
  };
  
  export type QuizProgress = {
    currentQuestion: number;
    answers: number[];
    score: number;
    completed: boolean;
    showExplanation: boolean;
  };