'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import QuizCard from './QuizCard';
import QuizSession from './QuizSession';
import type { QuizQuestion, QuizWithClasse } from '../../../../types/Quiz/quiz';

const ITEMS_PER_PAGE = 3;

export default function QuizView() {
  const [quizList, setQuizList] = useState<QuizWithClasse[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Map<string, QuizQuestion[]>>(new Map());
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [prenom, setPrenom] = useState('');
  const [resultsMap, setResultsMap] = useState<Map<string, { score: number, total: number, completed_at: string }>>(new Map());
  const [cumulativeScore, setCumulativeScore] = useState({ score: 0, total: 0, percentage: 0 });
  const [showOnlyUncompleted, setShowOnlyUncompleted] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    // 🎓 Mode invité
    if (!user) {
      const { data: publicQuizzes, error } = await supabase
        .from('vue_quiz_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return console.error("Erreur quiz public :", error);

      setQuizList(publicQuizzes || []);
      await fetchQuestions(publicQuizzes || []);
      setLoading(false);
      return;
    }

    // 👤 Profil
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

    const { data: ec } = await supabase
      .from('eleves_classes')
      .select('classe_id')
      .eq('eleve_id', user.id)
      .single();

    const classeId = ec?.classe_id;
    if (!classeId) return setLoading(false);

    const { data: classe } = await supabase
      .from('classes')
      .select('code_classe')
      .eq('id', classeId)
      .single();

    const code_classe = classe?.code_classe;
    if (!code_classe) return setLoading(false);

    const { data: quizzes, error } = await supabase
      .from('vue_quiz_details')
      .select('*')
      .contains('code_classe', [code_classe])
      .order('created_at', { ascending: false });

    if (error) return console.error("Erreur quiz élève :", error);

    setQuizList(quizzes || []);
    await fetchQuestions(quizzes || []);

    // Résultats élève
    const { data: results } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('eleve_id', user.id);

    const resultMap = new Map();
    let totalScore = 0;
    let totalPossible = 0;

    results?.forEach(result => {
      resultMap.set(result.quiz_id, {
        score: result.score,
        total: result.total,
        completed_at: result.completed_at,
      });
      totalScore += result.score;
      totalPossible += result.total;
    });

    setResultsMap(resultMap);
    setCumulativeScore({
      score: totalScore,
      total: totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
    });

    setLoading(false);
  };

  const fetchQuestions = async (quizzes: QuizWithClasse[]) => {
    const quizIds = quizzes.map(q => q.id);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .in('quiz_id', quizIds);

    if (error) return console.error("Erreur chargement questions :", error);

    const grouped = new Map<string, QuizQuestion[]>();
    for (const q of data || []) {
      if (!grouped.has(q.quiz_id)) grouped.set(q.quiz_id, []);
      grouped.get(q.quiz_id)?.push(q);
    }

    setQuestionsMap(grouped);
  };

  const handleStartQuiz = (quizId: string) => setActiveQuizId(quizId);

  const handleCompleteQuiz = async () => {
    setActiveQuizId(null);
    await refreshData();
  };

  const currentQuiz = activeQuizId
    ? {
        ...(quizList.find(q => q.id === activeQuizId)!),
        questions: questionsMap.get(activeQuizId) || [],
      }
    : null;

  const filteredQuizList = showOnlyUncompleted
    ? quizList.filter((quiz) => !resultsMap.has(quiz.id))
    : quizList;

  const totalPages = Math.ceil(filteredQuizList.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageData = filteredQuizList.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (currentQuiz) {
    return (
      <QuizSession
        quiz={currentQuiz}
        onComplete={handleCompleteQuiz}
        onExit={() => setActiveQuizId(null)}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-24 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">
        {prenom ? `Bienvenue ${prenom} 👋 – Quiz disponibles` : 'Quiz disponibles (mode invité)'}
      </h2>

      {prenom && (
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-md text-sm text-purple-800">
          Progression cumulée : <strong>{cumulativeScore.score} / {cumulativeScore.total}</strong> 
          ({cumulativeScore.percentage}%)
        </div>
      )}

      {prenom && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOnlyUncompleted(prev => !prev)}
            className="text-sm text-indigo-600 underline hover:text-indigo-800"
          >
            {showOnlyUncompleted ? '🔁 Voir tous les quiz' : '⏳ Voir uniquement les quiz non faits'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-700">Chargement en cours...</p>
      ) : filteredQuizList.length === 0 ? (
        <p className="text-gray-700">Aucun quiz trouvé avec les filtres sélectionnés.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPageData.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={{ ...quiz, questions: questionsMap.get(quiz.id) || [] }}
                onStart={handleStartQuiz}
                scoreInfo={resultsMap.get(quiz.id)}
              />
            ))}
          </div>

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
