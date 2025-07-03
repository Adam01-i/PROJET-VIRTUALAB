"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"

type ActivityLog = {
  id: string
  user_id: string
  activity_type: string
  action: string
  duration_seconds: number
  created_at: string
  metadata: any
  profiles: {
    name: string
    surname: string
    role: string
  } | null
}

type Classe = {
  id: string
  code_classe: string
}

export default function AllActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filtered, setFiltered] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<Classe[]>([])
  const [classeMap, setClasseMap] = useState<Record<string, string>>({})

  // Filtres
  const [selectedClasse, setSelectedClasse] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedAction, setSelectedAction] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    filterResults()
  }, [activities, selectedClasse, selectedType, selectedAction, filterDate, searchQuery])

  function resetPage() {
    setCurrentPage(1)
  }

  async function fetchActivities() {
    setLoading(true)

    const [{ data: mesClasses }, { data: elevesClasses }] = await Promise.all([
      supabase.from("mes_classes").select("id, code_classe"),
      supabase.from("eleves_classes").select("eleve_id, classe_id"),
    ])

    if (!mesClasses || !elevesClasses) return

    setClasses(mesClasses)

    const eleveIds = elevesClasses.map((e) => e.eleve_id)
    const map: Record<string, string> = {}
    elevesClasses.forEach(({ eleve_id, classe_id }) => {
      const found = mesClasses.find((c) => c.id === classe_id)
      if (found) map[eleve_id] = found.code_classe
    })
    setClasseMap(map)

    // Récupérer les activités des élèves uniquement
    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        id,
        user_id,
        activity_type,
        action,
        duration_seconds,
        created_at,
        metadata,
        profiles!inner (name, surname, role)
      `)
      .in("user_id", eleveIds)
      .eq("profiles.role", "eleve")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur chargement:", error.message)
    } else {
      console.log("Activités élèves récupérées:", data?.length)
      setActivities(
        (data || []).map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : (item.profiles ?? null),
        })),
      )
    }

    setLoading(false)
  }

  const getActionInFrench = (action: string) => {
    const translations: Record<string, string> = {
      login: "Connexion",
      start: "Démarrer",
      complete: "Terminer",
      view: "Visualiser",
      create: "Créer",
      update: "Modifier",
      delete: "Supprimer",
      upload: "Télécharger",
    }
    return translations[action] || action
  }

  const getTypeInFrench = (type: string) => {
    const translations: Record<string, string> = {
      connexion: "Connexion",
      simulation: "Simulation",
      quiz: "Quiz",
      objet3d: "Objet 3D",
    }
    return translations[type] || type
  }

  function filterResults() {
    let result = [...activities]

    if (selectedClasse) {
      result = result.filter((a) => classeMap[a.user_id] === selectedClasse)
    }

    if (selectedType) {
      result = result.filter((a) => a.activity_type === selectedType)
    }

    if (selectedAction) {
      result = result.filter((a) => a.action === selectedAction)
    }

    if (filterDate) {
      result = result.filter((a) => new Date(a.created_at).toISOString().startsWith(filterDate))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a) => {
        const fullName = `${a.profiles?.name ?? ""} ${a.profiles?.surname ?? ""}`.toLowerCase()
        return fullName.includes(q)
      })
    }

    setFiltered(result)
    resetPage()
  }

  return (
    <div className="mt-40">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Activités des élèves</h2>

      {/* Filtres */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <select
          value={selectedClasse}
          onChange={(e) => setSelectedClasse(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.code_classe}>
              {c.code_classe}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="connexion">Connexion</option>
          <option value="simulation">Simulation</option>
          <option value="quiz">Quiz</option>
          <option value="objet3d">Objet 3D</option>
        </select>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Toutes les actions</option>
          <option value="login">Connexion</option>
          <option value="start">Démarrer</option>
          <option value="complete">Terminer</option>
          <option value="view">Visualiser</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Rechercher un élève"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <button
          onClick={() => {
            setSelectedClasse("")
            setSelectedType("")
            setSelectedAction("")
            setFilterDate("")
            setSearchQuery("")
          }}
          className="border rounded px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200"
        >
          🔄 Reset
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <p className="text-gray-600">Chargement...</p>
      ) : currentItems.length === 0 ? (
        <p className="text-gray-600">Aucune activité trouvée avec ces filtres.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Élève</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Classe</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Type</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Action</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Détails</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-indigo-700 font-medium">
                      {`${a.profiles?.name ?? ""} ${a.profiles?.surname ?? ""}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {classeMap[a.user_id] ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {getTypeInFrench(a.activity_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          a.action === "complete"
                            ? "bg-green-100 text-green-700"
                            : a.action === "start"
                              ? "bg-blue-100 text-blue-700"
                              : a.action === "view"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getActionInFrench(a.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {a.metadata?.titre && <div>📝 {a.metadata.titre}</div>}
                      {a.metadata?.nom && <div>🏷️ {a.metadata.nom}</div>}
                      {a.duration_seconds && <div>⏱️ {Math.round(a.duration_seconds / 60)}min</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(a.created_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ⬅ Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages} ({filtered.length} résultats)
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant ➡
            </button>
          </div>
        </>
      )}
    </div>
  )
}
