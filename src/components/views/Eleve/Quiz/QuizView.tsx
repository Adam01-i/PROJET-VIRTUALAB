import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import type { Quiz } from '../../../../types/Quiz/quiz';
import QuizCard from './QuizCard';
import QuizSession from './QuizSession';

export default function QuizView() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour charger la liste des quizzes depuis la base de données
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Erreur chargement quiz :", error);
    } else {
      setQuizList(data || []);
    }

    setLoading(false);
  };

  // Chargement des quizzes au chargement du composant
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Fonction pour démarrer un quiz
  const handleStartQuiz = (quizId: string) => setActiveQuiz(quizId);
  
  // Fonction pour gérer la fin du quiz
  const handleCompleteQuiz = (score: number) => console.log(`Score : ${score}`);

  // Récupérer le quiz actif
  const currentQuiz = activeQuiz ? quizList.find(q => q.id === activeQuiz) : null;

  // Si un quiz est actif, afficher la session du quiz
  if (currentQuiz) {
    return (
      <QuizSession
        quiz={currentQuiz}
        onComplete={handleCompleteQuiz}
        onExit={() => setActiveQuiz(null)}
      />
    );
  }

  // Affichage de la liste des quizzes
  return (
    <div className="max-w-[1280px] mx-auto py-10 space-y-3">
      <h2 className="text-2xl font-bold text-black my-5">Quiz disponibles</h2>

      {loading ? (
        <p className="text-black">Chargement en cours...</p>
      ) : quizList.length === 0 ? (
        <p className="text-black">Aucun quiz disponible pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {quizList.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStart={handleStartQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
