"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import ProfExpCard from "./ProfExpCard"
import ExperienceFormModal from "./ExperienceFormModal"
import {
  trackExperienceCreate,
  trackExperienceUpdate,
  trackExperienceDelete,
} from "../../../../utils/profActivityTracker"
import { Chatbot } from '../../../../components/ui/Aichatbot'

const DUREE_OPTIONS = ["15 min", "30 min", "45 min", "60 min"]
const NIVEAU_OPTIONS = ["Débutant", "Intermédiaire", "Avancé"]

export default function ProfExpView() {
  const [userId, setUserId] = useState<string | null>(null)
  const [classes, setClasses] = useState<{ id: string; code_classe: string }[]>([])
  const [classeFilter, setClasseFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any | null>(null)
  const [experiences, setExperiences] = useState<any[]>([])
  const [,setLoading] = useState(false)

  const totalExperiences = experiences.length

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
    if (userId) fetchExperiences()
  }, [classeFilter, userId])

  const fetchExperiences = async () => {
    if (!userId) return

    let query = supabase
      .from("vue_experience_details")
      .select("*")
      .eq("auteur_id", userId!)
      .order("created_at", { ascending: false })

    if (classeFilter !== "all") {
      query = query.contains("code_classe", [classeFilter])
    }

    const { data, error } = await query
    if (error) {
      console.error("Erreur chargement expériences:", error)
    } else {
      setExperiences(data || [])
    }
  }

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.selectedClasseIds?.length) {
      toast.error("Titre, description et au moins une classe sont requis.")
      return
    }

    const isNew = !formData.id
    const allowedKeys = [
      "id",
      "titre",
      "description",
      "duree",
      "niveau",
      "image",
      "simulationPath",
      "objectifs",
      "materiel",
      "resultatsAttendus",
      "auteur_id",
      "is_public",
    ]

    const cleanFormData = Object.fromEntries(Object.entries(formData).filter(([key]) => allowedKeys.includes(key)))

    if (isNew) {
      cleanFormData.id = uuidv4()
      cleanFormData.auteur_id = userId
    }

    await toast.promise(
      (async () => {
        if (isNew) {
          const { data: inserted, error } = await supabase.from("experiences").insert([cleanFormData]).select()
          if (error || !inserted?.[0]) throw new Error("Erreur ajout.")

          await trackExperienceCreate(inserted[0].id, formData.titre)

          await supabase.from("classes_experiences").insert(
            formData.selectedClasseIds.map((classeId: string) => ({
              experience_id: inserted[0].id,
              classe_id: classeId,
            })),
          )
        } else {
          await supabase.from("experiences").update(cleanFormData).eq("id", formData.id)
          await trackExperienceUpdate(formData.id, formData.titre)

          await supabase.from("classes_experiences").delete().eq("experience_id", formData.id)
          await supabase.from("classes_experiences").insert(
            formData.selectedClasseIds.map((classeId: string) => ({
              experience_id: formData.id,
              classe_id: classeId,
            })),
          )
        }
      })(),
      {
        loading: "Enregistrement...",
        success: isNew ? "Ajoutée !" : "Modifiée !",
        error: "Échec de l'enregistrement.",
      },
    )

    await fetchExperiences()
    resetForm()
  }

  const handleDelete = async (id: string) => {
    const experience = experiences.find((exp) => exp.id === id)
    if (!experience) return

    if (!confirm("Supprimer cette expérience ?")) return

    const { error } = await supabase.from("experiences").delete().eq("id", id)
    if (error) {
      toast.error("Erreur suppression")
    } else {
      await trackExperienceDelete(id, experience.titre)
      toast.success("Expérience supprimée")
      await fetchExperiences()
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData(null)
    setIsEditing(false)
    setModalOpen(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const path = `simulations/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("simulations").upload(path, file)
    if (error) toast.error("Échec upload simulation")
    else {
      const { data } = supabase.storage.from("simulations").getPublicUrl(path)
      setFormData((prev: any) => ({ ...prev, simulationPath: data.publicUrl }))
    }
    setLoading(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const path = `${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("images-sim").upload(path, file)
    if (error) toast.error("Échec upload image")
    else {
      const { data } = supabase.storage.from("images-sim").getPublicUrl(path)
      setFormData((prev: any) => ({ ...prev, image: data.publicUrl }))
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Chatbot />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-800">Mes Simulations</h1>
        <button
          onClick={() => {
            setFormData({
              titre: "",
              description: "",
              duree: DUREE_OPTIONS[0],
              niveau: NIVEAU_OPTIONS[0],
              objectifs: [],
              materiel: [],
              resultatsAttendus: [],
              selectedClasseIds: [],
              image: "",
              simulationPath: "",
            })
            setIsEditing(false)
            setModalOpen(true)
          }}
          className="bg-indigo-800 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouvelle expérience
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
        <span className="ml-3 text-sm text-gray-500 font-normal">| Total : {totalExperiences} Simulations</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {experiences.length === 0 ? (
          <p className="text-gray-500 italic col-span-full">Aucune simulation trouvée.</p>
        ) : (
          experiences.map((exp) => (
            <ProfExpCard
              key={exp.id}
              experience={exp}
              classeNoms={exp.code_classe || []}
              classeAffichage={exp.code_classe_affichage}
              onEdit={async (exp) => {
                const { data: classeLinks } = await supabase
                  .from("classes_experiences")
                  .select("classe_id")
                  .eq("experience_id", exp.id)
                setFormData({
                  ...exp,
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

      <ExperienceFormModal
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        onSave={handleSave}
        onCancel={resetForm}
        classes={classes}
        DUREE_OPTIONS={DUREE_OPTIONS}
        NIVEAU_OPTIONS={NIVEAU_OPTIONS}
        handleFileUpload={handleFileUpload}
        handleImageUpload={handleImageUpload}
      />
    </div>
  )
}
