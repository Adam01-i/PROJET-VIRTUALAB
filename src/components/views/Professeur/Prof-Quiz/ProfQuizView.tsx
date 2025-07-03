"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import ProfQuizCard from "./ProfQuizCard"
import QuizFormModal from "./QuizFormModal"
import type { QuizQuestion, QuizWithClasse } from "../../../../types/Quiz/quiz"
import { trackQuizCreate, trackQuizUpdate, trackQuizDelete } from "../../../../utils/profActivityTracker"

const DUREE_OPTIONS = ["10 min", "20 min", "30 min", "45 min"]

export default function ProfQuizView() {
  const [quizzes, setQuizzes] = useState<QuizWithClasse[]>([])
  const [formData, setFormData] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [classes, setClasses] = useState<{ id: string; code_classe: string }[]>([])
  const [classeFilter, setClasseFilter] = useState<string>("all")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchInit = async () => {
      const { data: session } = await supabase.auth.getSession()
      setUserId(session?.session?.user?.id ?? null)

      const { data: classesData } = await supabase.from("mes_classes").select("id, code_classe")
      if (classesData) setClasses(classesData)
    }

    fetchInit()
  }, [])

  useEffect(() => {
    if (userId) fetchQuizzes()
  }, [classeFilter, userId])

  const fetchQuizzes = async () => {
    if (!userId) return

    let query = supabase
      .from("vue_quiz_details")
      .select("*")
      .eq("auteur_id", userId)
      .order("created_at", { ascending: false })

    if (classeFilter !== "all") {
      query = query.contains("classe_ids", [classeFilter])
    }

    const { data, error } = await query

    if (error || !data) {
      toast.error("Erreur chargement quiz")
      return
    }

    const quizIds = data.map((q) => q.quiz_id)
    const { data: questionsData } = await supabase.from("questions").select("*").in("quiz_id", quizIds)

    const groupedQuestions = (questionsData || []).reduce(
      (acc, q) => {
        acc[q.quiz_id] = acc[q.quiz_id] || []
        acc[q.quiz_id].push(q)
        return acc
      },
      {} as Record<string, QuizQuestion[]>,
    )

    const normalized = data.map((q) => ({
      ...q,
      id: q.quiz_id,
      questions: groupedQuestions[q.quiz_id] ?? [],
    }))

    setQuizzes(normalized)
  }

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.selectedClasseIds?.length) {
      toast.error("Titre, description et au moins une classe sont requis.")
      return
    }

    const isNew = !formData.id
    const quizPayload = {
      titre: formData.titre,
      description: formData.description,
      duree: formData.duree,
      image: formData.image,
      auteur_id: userId,
    }

    await toast.promise(
      async () => {
        let quizId = formData.id

        if (isNew) {
          const { data: inserted, error } = await supabase
            .from("quizzes")
            .insert([{ id: uuidv4(), ...quizPayload }])
            .select()

          if (error || !inserted?.[0]) throw new Error("Erreur création quiz")
          quizId = inserted[0].id

          // 🎯 Tracker la création
          await trackQuizCreate(quizId, formData.titre)
        } else {
          await supabase.from("quizzes").update(quizPayload).eq("id", quizId)
          await supabase.from("questions").delete().eq("quiz_id", quizId)

          // 🎯 Tracker la modification
          await trackQuizUpdate(quizId, formData.titre)
        }

        await supabase.from("classes_quizzes").delete().eq("quiz_id", quizId)
        await supabase.from("classes_quizzes").insert(
          formData.selectedClasseIds.map((classeId: string) => ({
            quiz_id: quizId,
            classe_id: classeId,
          })),
        )

        for (const question of formData.questions || []) {
          if (!question.question?.trim() || question.options?.length < 2) continue

          await supabase.from("questions").insert({
            ...question,
            id: question.id || uuidv4(),
            quiz_id: quizId,
          })
        }
      },
      {
        loading: "Enregistrement...",
        success: isNew ? "Quiz ajouté !" : "Quiz mis à jour !",
        error: "Erreur lors de la sauvegarde",
      },
    )

    fetchQuizzes()
    setFormData(null)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    const quiz = quizzes.find((q) => q.id === id)
    if (!confirm("Supprimer ce quiz ?")) return

    const { error } = await supabase.from("quizzes").delete().eq("id", id)
    if (!error) {
      // 🎯 Tracker la suppression
      if (quiz) {
        await trackQuizDelete(id, quiz.titre)
      }
      toast.success("Quiz supprimé")
      fetchQuizzes()
    } else {
      toast.error("Erreur suppression")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const path = `quiz-images/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("images-sim").upload(path, file)

    if (!error) {
      const { data } = supabase.storage.from("images-sim").getPublicUrl(path)
      setFormData({ ...formData, image: data.publicUrl })
    } else {
      toast.error("Erreur upload image")
    }
  }

  const createEmptyQuestion = (): QuizQuestion => ({
    id: uuidv4(),
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    image: "",
  })

  const addQuestion = () => {
    if (!formData) return
    setFormData({
      ...formData,
      questions: [...(formData.questions || []), createEmptyQuestion()],
    })
  }

  const removeQuestion = (idx: number) => {
    if (!formData) return
    const updated = [...formData.questions]
    updated.splice(idx, 1)
    setFormData({ ...formData, questions: updated })
  }

  const handleQuestionChange = (idx: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...formData.questions]
    updated[idx] = { ...updated[idx], [field]: value }
    setFormData({ ...formData, questions: updated })
  }

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...formData.questions]
    updated[qIdx].options[optIdx] = value
    setFormData({ ...formData, questions: updated })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-800">Mes Quiz</h1>
        <button
          onClick={() => {
            setFormData({
              id: "",
              titre: "",
              description: "",
              duree: DUREE_OPTIONS[0],
              image: "",
              questions: [],
              selectedClasseIds: [],
            })
            setIsModalOpen(true)
          }}
          className="bg-indigo-600 hover:bg-indigo-800 text-white px-4 py-2 rounded text-sm"
        >
          ➕ Ajouter un nouveau quiz
        </button>
      </div>

      <QuizFormModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onCancel={() => {
          setFormData(null)
          setIsModalOpen(false)
        }}
        classes={classes}
        handleImageUpload={handleImageUpload}
        handleQuestionChange={handleQuestionChange}
        handleOptionChange={handleOptionChange}
        addQuestion={addQuestion}
        removeQuestion={removeQuestion}
      />

      <div>
        <label className="font-semibold text-gray-600 mr-2">Classe :</label>
        <select
          className="border px-3 py-1 rounded text-sm bg-white text-indigo-600"
          onChange={(e) => setClasseFilter(e.target.value)}
          value={classeFilter}
        >
          <option value="all">Toutes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code_classe}
            </option>
          ))}
        </select>
        <span className="ml-3 text-sm text-gray-500 font-normal">
          | Total : {quizzes.length} quiz | {quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0)} questions
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {quizzes.length === 0 ? (
          <p className="text-gray-500 italic">Aucun quiz trouvé.</p>
        ) : (
          quizzes.map((quiz) => (
            <ProfQuizCard
              key={quiz.id}
              quiz={quiz}
              classeNoms={quiz.code_classe || []}
              classeAffichage={quiz.code_classe_affichage}
              onEdit={async (quiz) => {
                const { data: links } = await supabase
                  .from("classes_quizzes")
                  .select("classe_id")
                  .eq("quiz_id", quiz.id)

                setFormData({
                  ...quiz,
                  selectedClasseIds: links?.map((l) => l.classe_id) || [],
                })
                setIsModalOpen(true)
              }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
