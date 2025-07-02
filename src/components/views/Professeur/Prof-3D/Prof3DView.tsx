"use client"


import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import Prof3DCard from "./prof3DCard"
import Prof3DFormModal from "./Prof3DFormModal"
import { useAutoRefresh } from "../../../../hooks/useAutoRefresh"
import {
  trackObject3DCreate,
  trackObject3DUpdate,
  trackObject3DDelete,
} from "../../../../utils/profActivityTracker"

export default function Prof3DView() {
  const [userId, setUserId] = useState<string | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [formData, setFormData] = useState<any | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [classes, setClasses] = useState<{ id: string; code_classe: string }[]>([])
  const [classeFilter, setClasseFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"molecule" | "equipment">("molecule")
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const totalObjects = objects.length

  // Déclarer fetchObjects AVANT useAutoRefresh
  const fetchObjects = async () => {
    if (!userId) return

    let query = supabase
      .from("vue_lab_items_details")
      .select("*")
      .eq("auteur_id", userId!)
      .order("created_at", { ascending: false })

    if (classeFilter !== "all") {
      query = query.contains("code_classe", [classeFilter])
    }

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error("Erreur chargement objets 3D:", error)
    } else {
      setObjects(data || [])
      setLastUpdate(new Date())
      console.log(`🔄 Objets 3D rechargés: ${data?.length || 0} éléments`)
    }
  }

  // 🔄 Rafraîchissement automatique
  const { forceRefresh } = useAutoRefresh({
    onRefresh: fetchObjects,
    interval: 10000,
    enabled: !modalOpen,
  })

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
    if (userId) fetchObjects()
  }, [classeFilter, categoryFilter, userId])

  const handleSave = async () => {
    if (!formData?.nom || !formData.description || !formData.selectedClasseIds?.length) {
      toast.error("Nom, description et au moins une classe sont requis.")
      return
    }

    const isNew = !formData.id
    const allowedKeys = [
      "id",
      "nom",
      "description",
      "structure",
      "category",
      "formule",
      "importance",
      "usage",
      "precautions",
      "auteur_id",
    ]

    const cleanFormData = Object.fromEntries(Object.entries(formData).filter(([key]) => allowedKeys.includes(key)))

    if (isNew) {
      cleanFormData.id = uuidv4()
      cleanFormData.auteur_id = userId
      cleanFormData.category = viewMode
    }

    await toast.promise(
      (async () => {
        if (isNew) {
          const { data: inserted, error } = await supabase.from("lab_items").insert([cleanFormData]).select()
          if (error || !inserted?.[0]) throw new Error("Erreur ajout.")

          // 🎯 Tracker la création
          await trackObject3DCreate(inserted[0].id, formData.nom)

          await supabase.from("classes_labitems").insert(
            formData.selectedClasseIds.map((classeId: string) => ({
              labitem_id: inserted[0].id,
              classe_id: classeId,
            })),
          )
        } else {
          await supabase.from("lab_items").update(cleanFormData).eq("id", formData.id)

          // 🎯 Tracker la modification
          await trackObject3DUpdate(formData.id, formData.nom)

          await supabase.from("classes_labitems").delete().eq("labitem_id", formData.id)
          await supabase.from("classes_labitems").insert(
            formData.selectedClasseIds.map((classeId: string) => ({
              labitem_id: formData.id,
              classe_id: classeId,
            })),
          )
        }
      })(),
      {
        loading: "Enregistrement...",
        success: isNew ? "Objet 3D ajouté !" : "Objet 3D modifié !",
        error: "Échec de l'enregistrement.",
      },
    )

    // 🔄 Rafraîchir immédiatement
    await fetchObjects()
    resetForm()
  }

  const handleDelete = async (id: string) => {
    const object = objects.find((obj) => obj.id === id)
    if (!object) return

    if (!confirm("Supprimer cet objet 3D ?")) return

    const { error } = await supabase.from("lab_items").delete().eq("id", id)
    if (error) {
      toast.error("Erreur suppression")
    } else {
      // 🎯 Tracker la suppression
      await trackObject3DDelete(id, object.nom)
      toast.success("Objet 3D supprimé")

      // 🔄 Rafraîchir immédiatement
      await fetchObjects()
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

    const path = `3d-models/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("3d-models").upload(path, file)
    if (error) toast.error("Échec upload fichier 3D")
    else {
      const { data } = supabase.storage.from("3d-models").getPublicUrl(path)
      setFormData((prev: any) => ({ ...prev, structure: data.publicUrl }))
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-800">Mes Objets 3D</h1>
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
              nom: "",
              description: "",
              structure: "",
              category: viewMode,
              formule: "",
              importance: "",
              usage: "",
              precautions: "",
              selectedClasseIds: [],
            })
            setIsEditing(false)
            setModalOpen(true)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          ➕ Nouvel objet 3D
        </button>
      </div>

      <div className="flex gap-4">
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
        </div>

        <div>
          <label className="font-semibold text-gray-600 mr-2">Catégorie :</label>
          <select
            className="border px-3 py-1 rounded bg-white text-indigo-600 font-semibold"
            onChange={(e) => setCategoryFilter(e.target.value)}
            value={categoryFilter}
          >
            <option value="all">Toutes</option>
            <option value="molecule">Molécules</option>
            <option value="equipment">Matériel</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-gray-600 mr-2">Mode création :</label>
          <select
            className="border px-3 py-1 rounded bg-white text-purple-600 font-semibold"
            onChange={(e) => setViewMode(e.target.value as "molecule" | "equipment")}
            value={viewMode}
          >
            <option value="molecule">Molécule</option>
            <option value="equipment">Matériel</option>
          </select>
        </div>

        <span className="ml-3 text-sm text-gray-500 font-normal self-end">| Total : {totalObjects} Objets</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {objects.length === 0 ? (
          <p className="text-gray-500 italic col-span-full">Aucun objet 3D trouvé.</p>
        ) : (
          objects.map((obj) => (
            <Prof3DCard
              key={obj.id}
              object={obj}
              classeNoms={obj.code_classe || []}
              classeAffichage={obj.code_classe_affichage}
              onEdit={async (obj) => {
                const { data: classeLinks } = await supabase
                  .from("classes_labitems")
                  .select("classe_id")
                  .eq("labitem_id", obj.id)
                setFormData({
                  ...obj,
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

      <Prof3DFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSubmit={handleSave}
        onCancel={resetForm}
        classes={classes}
        viewMode={viewMode}
        handleFileUpload={handleFileUpload}
      />
    </div>
  )
}
