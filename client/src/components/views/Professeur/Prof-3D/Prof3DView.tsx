"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { FlaskRoundIcon as Flask, PenToolIcon as Tool, Trash2, Pencil, Box } from "lucide-react"
import { supabase } from "../../../../lib/supabaseClient"
import { toast } from "sonner"
import Prof3DFormModal from "./Prof3DFormModal"
import Prof3DPreviewModal from "./Prof3DPreviewModal"
import { ChemicalFormula } from "../../../ui/ChemicalFormula"
import type { lab_items } from "../../../../types/Viewer3D/lab_items"
import {
  trackObject3DCreate,
  trackObject3DUpdate,
  trackObject3DDelete,
} from "../../../../utils/profActivityTracker"

type ViewMode = "molecule" | "equipment"

type LabItemWithClasse = lab_items & {
  code_classe?: string[]
  code_classe_affichage?: string
  selectedClasseIds?: string[]
}

export default function Prof3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>("molecule")
  const [moleculeList, setMoleculeList] = useState<LabItemWithClasse[]>([])
  const [equipmentList, setEquipmentList] = useState<LabItemWithClasse[]>([])
  const [classesList, setClassesList] = useState<{ id: string; code_classe: string }[]>([])
  const [classeFilter, setClasseFilter] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<LabItemWithClasse> | null>(null)
  const [previewItem, setPreviewItem] = useState<LabItemWithClasse | null>(null)
  const cacheRef = useRef<{ [key: string]: LabItemWithClasse[] }>({})

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [viewMode, classeFilter])

  const displayedItems = useMemo(() => {
    return viewMode === "molecule" ? moleculeList : equipmentList
  }, [viewMode, moleculeList, equipmentList])

  const fetchClasses = async () => {
    const { data, error } = await supabase.from("mes_classes").select("id, code_classe")
    if (!error) setClassesList(data || [])
    else toast.error("Erreur de chargement des classes du professeur")
  }

  const fetchItems = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (!userId) {
      toast.error("Utilisateur non connecté")
      return
    }

    const cacheKey = `${viewMode}_${classeFilter || "all"}`
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey]
      if (viewMode === "molecule") setMoleculeList(cached)
      else setEquipmentList(cached)
      return
    }

    let query = supabase
      .from("vue_lab_items_details")
      .select(
        "id, nom, description, structure, code_classe, created_at, category, formule, importance, usage, precautions",
      )
      .eq("category", viewMode)
      .eq("auteur_id", userId)
      .order("created_at", { ascending: false })
      .range(0, 19) // pagination

    if (classeFilter) query = query.contains("code_classe", [classeFilter])

    const { data, error } = await query
    if (error) return toast.error("Erreur de chargement des éléments.")

    if (data) {
      const typedData: LabItemWithClasse[] = data.map((item: any) => ({
        ...item,
        category: item.category ?? viewMode,
      }))

      cacheRef.current[cacheKey] = typedData
      if (viewMode === "molecule") setMoleculeList(typedData)
      else setEquipmentList(typedData)
    }
  }

  const handleSubmit = async () => {
    const isEdit = !!formData?.id
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return toast.error("Utilisateur non connecté")

    const itemData = {
      nom: formData?.nom,
      description: formData?.description,
      structure: formData?.structure,
      category: viewMode,
      formule: formData?.formule,
      importance: formData?.importance,
      usage: formData?.usage,
      precautions: formData?.precautions,
      auteur_id: userId,
    }

    toast.promise(
      async () => {
        let itemId = formData?.id

        if (isEdit) {
          const { error } = await supabase.from("lab_items").update(itemData).eq("id", itemId).eq("auteur_id", userId)
          if (error) throw error

          // 🎯 Tracker la modification
          await trackObject3DUpdate(itemId!, formData?.nom || "")

          await supabase.from("classes_labitems").delete().eq("labitem_id", itemId)
        } else {
          const { data: inserted, error } = await supabase.from("lab_items").insert([itemData]).select()
          if (error || !inserted?.[0]) throw error || new Error("Erreur ajout")
          itemId = inserted[0].id

          // 🎯 Tracker la création
          if (!itemId || !formData?.nom) {
            throw new Error("ID ou nom manquant pour le tracking de création.")
          }

          await trackObject3DCreate(itemId, formData.nom)

        }

        const associations = (formData?.selectedClasseIds || []).map((classeId) => ({
          labitem_id: itemId,
          classe_id: classeId,
        }))

        const { error: relError } = await supabase.from("classes_labitems").insert(associations)
        if (relError) throw relError

        setIsEditing(false)
        setFormData(null)

        // Vider le cache pour forcer le rechargement
        cacheRef.current = {}
        fetchItems()
      },
      {
        loading: isEdit ? "Mise à jour..." : "Ajout...",
        success: "✅ Sauvegardé",
        error: "❌ Erreur enregistrement",
      }
    )
  }

  const handleDelete = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return toast.error("Utilisateur non connecté")

    const item = displayedItems.find((item) => item.id === id)
    if (!confirm("Supprimer cet élément ?")) return

    await toast.promise(
      async () => {
        const { error } = await supabase.from("lab_items").delete().eq("id", id).eq("auteur_id", userId)
        if (error) throw error

        // 🎯 Tracker la suppression
        if (item) {
          await trackObject3DDelete(id, item.nom)
        }

        // Vider le cache pour forcer le rechargement
        cacheRef.current = {}
        fetchItems()
      },
      {
        loading: "Suppression...",
        success: "✅ Supprimé",
        error: "❌ Échec de suppression",
      },
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".glb")) {
      return toast.error("❌ Seuls les fichiers .glb sont acceptés.")
    }

    const folder = viewMode === "molecule" ? "molecules" : "equipments"
    const filename = `${folder}/${Date.now()}_${file.name}`

    const { error } = await supabase.storage
      .from("structures")
      .upload(filename, file, {
        contentType: "model/gltf-binary",
        upsert: true,
      })

    if (error) {
      console.error("Erreur Supabase upload:", error)
      return toast.error("❌ Upload échoué : " + error.message)
    }

    const { data } = supabase.storage.from("structures").getPublicUrl(filename)
    if (data?.publicUrl) {
      setFormData((prev) => ({ ...prev, structure: data.publicUrl }))
      toast.success("✅ Fichier .glb uploadé !")
    }
  }

  const handleEdit = async (item: LabItemWithClasse) => {
    // Charger les classes liées
    const { data: classeLinks } = await supabase.from("classes_labitems").select("classe_id").eq("labitem_id", item.id)

    setFormData({
      ...item,
      selectedClasseIds: classeLinks?.map((l) => l.classe_id) || [],
    })
    setIsEditing(true)
  }

  const handlePreview = (item: LabItemWithClasse) => {
    // Vérifier que l'item a une structure valide avant d'ouvrir le modal
    if (!item.structure || typeof item.structure !== "string") {
      toast.error("Aucun modèle 3D disponible pour cet élément")
      return
    }
    setPreviewItem(item)
  }

  return (
    <div className="p-6 text-base text-gray-800 pt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-800">Mes Objets 3D</h1>
        <button
          onClick={() => {
            setIsEditing(true)
            setFormData({
              id: "",
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
          }}
          className="bg-indigo-800 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouveau {viewMode === "molecule" ? "Molécule" : "Matériel"}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setViewMode("molecule")}
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === "molecule" ? "bg-purple-600 text-white" : "bg-gray-100 text-purple-600 hover:bg-gray-200"
            }`}
        >
          <Flask size={16} /> Molécules ({moleculeList.length})
        </button>
        <button
          onClick={() => setViewMode("equipment")}
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === "equipment" ? "bg-purple-600 text-white" : "bg-gray-100 text-purple-600 hover:bg-gray-200"
            }`}
        >
          <Tool size={16} /> Matériel ({equipmentList.length})
        </button>
        <select
          className="border px-2 py-1 rounded text-sm bg-white text-indigo-600"
          value={classeFilter || ""}
          onChange={(e) => setClasseFilter(e.target.value || null)}
        >
          <option value="">Toutes les classes</option>
          {classesList.map((cl) => (
            <option key={cl.id} value={cl.code_classe}>
              {cl.code_classe}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedItems.map((item) => (
          <div key={item.id} className="p-4 bg-white border rounded-md shadow hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800">{item.nom}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>

                {/* Affichage des classes */}
                <div className="text-xs text-gray-500 flex gap-1 mt-2 flex-wrap">
                  {item.code_classe?.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      📘 {c}
                    </span>
                  ))}
                </div>

                {/* Informations spécifiques */}
                {viewMode === "molecule" && item.formule && (
                  <ChemicalFormula formula={item.formule} className="text-xs text-green-600 mt-1" />
                )}
              </div>

              <div className="flex gap-2 items-center ml-2">
                <div
                  className={`cursor-pointer hover:scale-110 transition ${item.structure ? "text-indigo-500" : "text-gray-400 cursor-not-allowed"
                    }`}
                  onClick={() => handlePreview(item)}
                  aria-label="Visualiser en 3D"
                >
                  <Box size={18} />
                </div>
                <div
                  className="cursor-pointer hover:scale-110 transition"
                  onClick={() => handleEdit(item)}
                  aria-label="Modifier"
                >
                  <Pencil size={16} className="text-blue-500" />
                </div>
                <div
                  className="cursor-pointer hover:scale-110 transition"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} className="text-red-500" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayedItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📦</div>
          <p>Aucun {viewMode === "molecule" ? "molécule" : "matériel"} trouvé</p>
          <p className="text-sm">Commencez par ajouter votre premier élément !</p>
        </div>
      )}

      <Prof3DFormModal
        open={isEditing}
        setOpen={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsEditing(false)
          setFormData(null)
        }}
        classes={classesList}
        viewMode={viewMode}
        handleFileUpload={handleFileUpload}
      />

      {previewItem && previewItem.structure && (
        <Prof3DPreviewModal
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
          glbUrl={previewItem.structure}
          nom={previewItem.nom}
        />
      )}
    </div>
  )
}
