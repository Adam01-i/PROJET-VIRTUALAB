import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import type { Quiz } from '../../../../types/Quiz/quiz';
import QuizCard from './QuizCard';
import QuizSession from './QuizSession';

const ITEMS_PER_PAGE = 3;

export default function QuizView() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(quizList.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageData = quizList.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
    <div className="max-w-[1280px] mx-auto px-20 py-20 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Quiz disponibles</h2>

      {loading ? (
        <p className="text-gray-700">Chargement en cours...</p>
      ) : quizList.length === 0 ? (
        <p className="text-gray-700">Aucun quiz disponible pour le moment.</p>
      ) : (
        <>
          {/* Cartes paginées */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPageData.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStart={handleStartQuiz}
              />
            ))}
          </div>

          {/* Pagination numérotée */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
