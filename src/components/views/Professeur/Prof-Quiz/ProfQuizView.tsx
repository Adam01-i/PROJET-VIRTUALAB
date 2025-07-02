"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import ProfQuizCard from "./ProfQuizCard"
import QuizFormModal from "./QuizFormModal"
import { useAutoRefresh } from "../../../../hooks/useAutoRefresh"
import { trackQuizCreate, trackQuizUpdate, trackQuizDelete } from "../../../../utils/profActivityTracker"

const DUREE_OPTIONS = ["15 min", "30 min", "45 min", "60 min"]

export default function ProfQuizView() {
  const [userId, setUserId] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [formData, setFormData] = useState<any | null>(null)
  const [, setIsEditing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [classes, setClasses] = useState<{ id: string; code_classe: string }[]>([])
  const [classeFilter, setClasseFilter] = useState<string>("all")
  const [, setUploading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchQuizzes = async () => {
    if (!userId) return

    let query = supabase
      .from("vue_quiz_details")
      .select("*")
      .eq("auteur_id", userId!)
      .order("created_at", { ascending: false })

    if (classeFilter !== "all") {
      query = query.contains("code_classe", [classeFilter])
    }

    const { data, error } = await query
    if (error) {
      console.error("Erreur chargement quiz:", error)
    } else {
      setQuizzes(data || [])
      setLastUpdate(new Date())
      console.log(`🔄 Quiz rechargés: ${data?.length || 0} éléments`)
    }
  }

  const { forceRefresh } = useAutoRefresh({
    onRefresh: fetchQuizzes,
    interval: 10000,
    enabled: !modalOpen,
  })

  const totalQuizzes = quizzes.length

  useEffect(() => {
    const fetchSession = async () => {
      const { data: session } = await supabase.auth.getSession()
      setUserId(session?.session?.user?.id ?? null)
    }

    const fetchClasses = async () => {
      const { data } = await supabase.from("mes_classes").select("id, code_classe")
      setClasses(data || [])
    }

    fetchSession()
    fetchClasses()
  }, [])

  useEffect(() => {
    if (userId) fetchQuizzes()
  }, [classeFilter, userId])

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.selectedClasseIds?.length) {
      toast.error("Titre, description et au moins une classe sont requis.")
      return
    }

    const isNew = !formData.id
    const allowedKeys = ["id", "titre", "description", "duree", "image", "auteur_id", "questions"]

    const cleanFormData = Object.fromEntries(Object.entries(formData).filter(([key]) => allowedKeys.includes(key)))

    if (isNew) {
      cleanFormData.id = uuidv4()
      cleanFormData.auteur_id = userId
    }

    await toast.promise(
      (async () => {
        if (isNew) {
          const { data: inserted, error } = await supabase.from("quizzes").insert([cleanFormData]).select()
          if (error || !inserted?.[0]) throw new Error("Erreur ajout.")

          // 🎯 Tracker la création
          await trackQuizCreate(inserted[0].id, formData.titre)

          await supabase.from("classes_quizzes").insert(
            formData.selectedClasseIds.map((classeId: string) => ({
              quiz_id: inserted[0].id,
              classe_id: classeId,
            })),
          )
        } else {
          await supabase.from("quizzes").update(cleanFormData).eq("id", formData.id)

          // 🎯 Tracker la modification
          await trackQuizUpdate(formData.id, formData.titre)

          await supabase.from("classes_quizzes").delete().eq("quiz_id", formData.id)
          await supabase.from("classes_quizzes").insert(
            formData.selectedClasseIds.map((classeId: string) => ({
              quiz_id: formData.id,
              classe_id: classeId,
            })),
          )
        }
      })(),
      {
        loading: "Enregistrement...",
        success: isNew ? "Quiz ajouté !" : "Quiz modifié !",
        error: "Échec de l'enregistrement.",
      },
    )

    // 🔄 Rafraîchir immédiatement
    await fetchQuizzes()
    resetForm()
  }

  const handleDelete = async (id: string) => {
    const quiz = quizzes.find((q) => q.id === id)
    if (!quiz) return

    if (!confirm("Supprimer ce quiz ?")) return

    const { error } = await supabase.from("quizzes").delete().eq("id", id)
    if (error) {
      toast.error("Erreur suppression")
    } else {
      // 🎯 Tracker la suppression
      await trackQuizDelete(id, quiz.titre)
      toast.success("Quiz supprimé")

      // 🔄 Rafraîchir immédiatement
      await fetchQuizzes()
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData(null)
    setIsEditing(false)
    setModalOpen(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `quiz-images/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("images-quiz").upload(path, file)
    if (error) toast.error("Échec upload image")
    else {
      const { data } = supabase.storage.from("images-quiz").getPublicUrl(path)
      setFormData((prev: any) => ({ ...prev, image: data.publicUrl }))
    }
    setUploading(false)
  }

  const handleQuestionChange = (questionIndex: number, field: string, value: any) => {
    const updatedQuestions = [...(formData.questions || [])]
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], [field]: value }
    setFormData({ ...formData, questions: updatedQuestions })
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...(formData.questions || [])]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setFormData({ ...formData, questions: updatedQuestions })
  }

  const addQuestion = () => {
    const newQuestion = {
      id: uuidv4(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    }
    setFormData({ ...formData, questions: [...(formData.questions || []), newQuestion] })
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = (formData.questions || []).filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, questions: updatedQuestions })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-800">Mes Quiz</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString("fr-FR")}
            <button onClick={forceRefresh} className="ml-2 text-indigo-600 hover:text-indigo-800 underline">
              🔄 Actualiser
            </button>
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              titre: "",
              description: "",
              duree: DUREE_OPTIONS[0],
              selectedClasseIds: [],
              image: "",
              questions: [],
            })
            setIsEditing(false)
            setModalOpen(true)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          ➕ Nouveau quiz
        </button>
      </div>

      <div>
        <label className="font-semibold text-gray-600 mr-2">Classe :</label>
        <select
          className="border px-3 py-1 rounded bg-white text-indigo-600 font-semibold"
          onChange={(e) => setClasseFilter(e.target.value)}
          value={classeFilter}
        >
          <option value="all">Toutes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.code_classe}>
              {c.code_classe}
            </option>
          ))}
        </select>
        <span className="ml-3 text-sm text-gray-500 font-normal">| Total : {totalQuizzes} Quiz</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {quizzes.length === 0 ? (
          <p className="text-gray-500 italic col-span-full">Aucun quiz trouvé.</p>
        ) : (
          quizzes.map((quiz) => (
            <ProfQuizCard
              key={quiz.id}
              quiz={quiz}
              classeNoms={quiz.code_classe || []}
              classeAffichage={quiz.code_classe_affichage}
              onEdit={async (quiz) => {
                const { data: classeLinks } = await supabase
                  .from("classes_quizzes")
                  .select("classe_id")
                  .eq("quiz_id", quiz.id)
                setFormData({
                  ...quiz,
                  selectedClasseIds: classeLinks?.map((l) => l.classe_id) || [],
                })
                setIsEditing(true)
                setModalOpen(true)
              }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <QuizFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onCancel={resetForm}
        classes={classes}
        handleImageUpload={handleImageUpload}
        handleQuestionChange={handleQuestionChange}
        handleOptionChange={handleOptionChange}
        addQuestion={addQuestion}
        removeQuestion={removeQuestion}
      />
    </div>
  )
}
