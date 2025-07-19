"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, PenTool } from "lucide-react"
import { supabase } from "../../../../lib/supabaseClient"
import HeroSection from '../../../../components/ui/HeroSection'
import type { QuizWithClasse, QuizQuestion } from "../../../../types/Quiz/quiz"
import QuizCard from "./QuizCard"
import QuizSession from "./QuizSession"
import { trackQuizStart } from "../../../../utils/eleveActivityTracker"
import { Chatbot } from '../../../../components/ui/Aichatbot'


const ITEMS_PER_PAGE = 3

export default function QuizView() {
  const [quizList, setQuizList] = useState<QuizWithClasse[]>([])
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [prenom, setPrenom] = useState("")
  const [resultsMap, setResultsMap] = useState<Map<string, { score: number; total: number; completed_at: string }>>(
    new Map(),
  )
  const [cumulativeScore, setCumulativeScore] = useState({ score: 0, total: 0, percentage: 0 })

  const refreshData = async () => {
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const user = session?.session?.user

    // 🎯 MODE INVITÉ
    if (!user) {
      const { data: allQuizzes, error } = await supabase
        .from("vue_quiz_details")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur chargement quiz publics :", error)
        setLoading(false)
        return
      }

      const quizIds = (allQuizzes || []).map((q) => q.quiz_id)

      const { data: publicQuestions, error: questionError } = await supabase
        .from("questions")
        .select("*")
        .in("quiz_id", quizIds)

      if (questionError) {
        console.error("Erreur chargement questions publics :", questionError)
      }

      const quizzesWithQuestions = (allQuizzes || []).map((quiz) => ({
        ...quiz,
        id: quiz.quiz_id,
        questions: (publicQuestions || []).filter((q) => q.quiz_id === quiz.quiz_id) as QuizQuestion[],
      }))

      setQuizList(quizzesWithQuestions)
      setLoading(false)
      return
    }

    // 👤 UTILISATEUR CONNECTÉ
    const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", user.id).single()

    if (profile?.role !== "eleve") {
      setLoading(false)
      return
    }

    setPrenom(profile.name || "")

    const { data: ec } = await supabase.from("eleves_classes").select("classe_id").eq("eleve_id", user.id).single()

    const classeId = ec?.classe_id
    if (!classeId) {
      setLoading(false)
      return
    }

    const { data: classe } = await supabase.from("classes").select("code_classe").eq("id", classeId).single()

    const code_classe = classe?.code_classe
    if (!code_classe) {
      setLoading(false)
      return
    }

    const { data: quizzes, error: quizError } = await supabase
      .from("vue_quiz_details")
      .select("*")
      .contains("code_classe", [code_classe])
      .order("created_at", { ascending: false })

    if (quizError) {
      console.error("Erreur chargement quiz:", quizError)
      setLoading(false)
      return
    }

    const quizIds = quizzes?.map((q) => q.quiz_id) || []

    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .in("quiz_id", quizIds)

    if (questionError) {
      console.error("Erreur chargement questions :", questionError)
    }

    const quizzesWithQuestions = (quizzes || []).map((quiz) => ({
      ...quiz,
      id: quiz.quiz_id,
      questions: (questions || []).filter((q) => q.quiz_id === quiz.quiz_id) as QuizQuestion[],
    }))

    setQuizList(quizzesWithQuestions)

    const { data: results } = await supabase.from("quiz_results").select("*").eq("eleve_id", user.id)

    const resultMap = new Map()
    let totalScore = 0
    let totalPossible = 0

    results?.forEach((result) => {
      resultMap.set(result.quiz_id, {
        score: result.score,
        total: result.total,
        completed_at: result.completed_at,
      })
      totalScore += result.score
      totalPossible += result.total
    })

    setResultsMap(resultMap)
    setCumulativeScore({
      score: totalScore,
      total: totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
    })

    setLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleStartQuiz = async (quizId: string) => {
    const quiz = quizList.find((q) => q.id === quizId)
    if (quiz) {
      await trackQuizStart(quiz.id, quiz.titre)
    }
    setActiveQuizId(quizId)
  }
  const handleCompleteQuiz = async () => {
    setActiveQuizId(null)
    await refreshData()
  }

  const currentQuiz = activeQuizId ? quizList.find((q) => q.id === activeQuizId) : null

  const filteredQuizList = quizList

  const totalPages = Math.ceil(filteredQuizList.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const currentPageData = filteredQuizList.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  if (currentQuiz) {
    return <QuizSession quiz={currentQuiz} onComplete={handleCompleteQuiz} onExit={() => setActiveQuizId(null)} />
  }

  return (
    <>
      <Chatbot />

      <HeroSection images={["/assets/bg/quiz1.png", "/assets/bg/quiz2.png", "/assets/bg/quiz3.png"]}>
        {/* Overlay sombre pour améliorer contraste */}
        <div className="absolute inset-0 bg-black/40 z-0" />

        <div className="text-center max-w-3xl mx-auto">
          <PenTool size={48} className="text-purple-300 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            Évaluez vos connaissances
          </h1>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed font-light drop-shadow-sm">
            Testez votre compréhension des notions abordées en classe à travers des quiz interactifs et adaptés à votre niveau.
          </p>
        </div>
      </HeroSection>

      <div className="max-w-[1280px] mx-auto px-0 md:px-26 py-12 space-y-10">

        <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-12 space-y-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {prenom ? `Mes Quiz disponibles` : "Quiz disponibles (mode invité)"}
          </h2>

          {prenom && (
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-md text-sm text-purple-800">
              Progression cumulée :{" "}
              <strong>
                {cumulativeScore.score} / {cumulativeScore.total}
              </strong>{" "}
              ({cumulativeScore.percentage}%)
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
                  <QuizCard key={quiz.id} quiz={quiz} onStart={handleStartQuiz} scoreInfo={resultsMap.get(quiz.id)} />
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
                  const pageNum = index + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${currentPage === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
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
      </div>
    </>
  )
}
