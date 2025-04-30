import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import type { Quiz } from '../../../../types/Quiz/quiz';
import QuizCard from './QuizCard';
import QuizSession from './QuizSession';

export default function QuizView() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleStartQuiz = (quizId: string) => setActiveQuiz(quizId);
  const handleCompleteQuiz = (score: number) => console.log(`Score : ${score}`);

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
    <div className="max-w-[1280px] mx-auto px-4 py-10 space-y-3">
      <h2 className="text-2xl font-semibold text-white">Quiz disponibles</h2>

      {loading ? (
        <p className="text-purple-200 text-sm">Chargement en cours...</p>
      ) : quizList.length === 0 ? (
        <p className="text-purple-200 text-sm">Aucun quiz disponible pour le moment.</p>
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
