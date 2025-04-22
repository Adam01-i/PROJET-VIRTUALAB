import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import type { Quiz } from '../../../../types/Quiz/quiz';
import QuizCard from './QuizCard';
import QuizSession from './QuizSession';

export default function QuizView() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les quiz depuis Supabase
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

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quizId: string) => {
    setActiveQuiz(quizId);
  };

  const handleCompleteQuiz = (score: number) => {
    console.log(`Quiz terminé avec un score de : ${score}`);
  };

  const currentQuiz = activeQuiz ? quizList.find(q => q.id === activeQuiz) : null;

  if (currentQuiz) {
    return (
      <QuizSession
        quiz={currentQuiz}
        onComplete={handleCompleteQuiz}
        onExit={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-white">Quiz disponibles</h2>

      {loading ? (
        <p className="text-purple-200">Chargement en cours...</p>
      ) : quizList.length === 0 ? (
        <p className="text-purple-200">Aucun quiz disponible pour le moment.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
