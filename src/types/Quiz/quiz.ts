export type QuizQuestion = {
    id: string;
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
    niveau: 'Débutant' | 'Intermédiaire' | 'Avancé';
    duree: string;
    questions: QuizQuestion[];
    image: string;
  };
  
  export type QuizProgress = {
    currentQuestion: number;
    answers: number[];
    score: number;
    completed: boolean;
    showExplanation: boolean;
  };