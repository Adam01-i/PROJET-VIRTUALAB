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

/**
 * ⚠️ Adapté depuis la vue `vue_quiz_details` :
 * - `quiz_id` est renommé dynamiquement en `id`
 * - inclut aussi les `questions`
 * - `code_classe` est un tableau de strings
 */
export type QuizWithClasse = {
  id: string; // ← IMPORTANT pour compatibilité avec composants
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
