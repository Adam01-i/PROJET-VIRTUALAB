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
  const [prenom, setPrenom] = useState('');

  const fetchQuizzesForEleve = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) return;

    // ✅ Récupérer l’élève
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'eleve') {
      setLoading(false);
      return;
    }

    setPrenom(profile.name || '');

    // ✅ Récupérer la classe de l’élève
    const { data: ec } = await supabase
      .from('eleves_classes')
      .select('classe_id')
      .eq('eleve_id', user.id)
      .single();

    const classeId = ec?.classe_id;

    if (!classeId) {
      setLoading(false);
      return;
    }

    // ✅ Charger les quiz de cette classe
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .eq('classe_id', classeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement quiz :', error);
    } else {
      setQuizList(quizzes || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzesForEleve();
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
    <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-20 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Bienvenue {prenom} 👋 – Quiz disponibles</h2>

      {loading ? (
        <p className="text-gray-700">Chargement en cours...</p>
      ) : quizList.length === 0 ? (
        <p className="text-gray-700">Aucun quiz disponible pour ta classe pour le moment.</p>
      ) : (
        <>
          {/* ✅ Cartes paginées */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPageData.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} onStart={handleStartQuiz} />
            ))}
          </div>

          {/* ✅ Pagination */}
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
