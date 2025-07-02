"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"

type ActivityLog = {
  id: string
  user_id: string
  activity_type: string
  action: string
  duration_seconds: number | null
  score: number | null
  total_score: number | null
  created_at: string
  metadata: any
  profiles: {
    name: string
    surname: string
    role: string
  } | null
}

export default function AllActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filtered, setFiltered] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres
  const [filterRole, setFilterRole] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterAction, setFilterAction] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getActionInFrench = (action: string) => {
    const translations: Record<string, string> = {
      login: "Connexion",
      start: "Démarrer",
      complete: "Terminer",
      view: "Visualiser",
      create: "Créer",
      update: "Modifier",
      delete: "Supprimer",
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

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)

      console.log("🔍 Récupération de toutes les activités...")

      // Récupérer TOUTES les activités avec les colonnes exactes de la table
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id,
          user_id,
          activity_type,
          action,
          duration_seconds,
          score,
          total_score,
          metadata,
          created_at,
          profiles!inner ( name, surname, role )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur Supabase:", error)
      } else {
        console.log("✅ Données récupérées:", data?.length, "activités")
        const mappedData = (data || []).map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
        }))
        setActivities(mappedData)
        setFiltered(mappedData)
      }

      setLoading(false)
    }

    fetchActivities()
  }, [])

  useEffect(() => {
    let result = [...activities]

    if (filterRole) {
      result = result.filter((a) => a.profiles?.role === filterRole)
    }
    if (filterType) {
      result = result.filter((a) => a.activity_type === filterType)
    }
    if (filterAction) {
      result = result.filter((a) => a.action === filterAction)
    }
    if (filterDate) {
      result = result.filter((a) => new Date(a.created_at).toISOString().startsWith(filterDate))
    }
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.profiles?.name?.toLowerCase().includes(query) ||
          a.profiles?.surname?.toLowerCase().includes(query) ||
          `${a.profiles?.name} ${a.profiles?.surname}`.toLowerCase().includes(query),
      )
    }

    setFiltered(result)
    setCurrentPage(1)
  }, [filterRole, filterType, filterAction, filterDate, searchQuery, activities])

  return (
    <div className="mt-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        📋 Historique des Activités (Tous utilisateurs) - {filtered.length} activités
      </h2>

      {/* 🔍 Filtres */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <select
          onChange={(e) => setFilterRole(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          value={filterRole}
        >
          <option value="">Tous les rôles</option>
          <option value="eleve">Élève</option>
          <option value="professeur">Professeur</option>
          <option value="admin">Admin</option>
        </select>

        <select
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          value={filterType}
        >
          <option value="">Tous les types</option>
          <option value="connexion">Connexion</option>
          <option value="simulation">Simulation</option>
          <option value="quiz">Quiz</option>
          <option value="objet3d">Objet 3D</option>
        </select>

        <select
          onChange={(e) => setFilterAction(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          value={filterAction}
        >
          <option value="">Toutes les actions</option>
          <option value="login">Connexion</option>
          <option value="start">Démarrer</option>
          <option value="complete">Terminer</option>
          <option value="view">Visualiser</option>
          <option value="create">Créer</option>
          <option value="update">Modifier</option>
          <option value="delete">Supprimer</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Rechercher un nom"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <button
          onClick={() => {
            setFilterRole("")
            setFilterType("")
            setFilterAction("")
            setFilterDate("")
            setSearchQuery("")
          }}
          className="border rounded px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200"
        >
          🔄 Reset
        </button>
      </div>

      {/* 📊 Table des activités */}
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
                  <th className="px-4 py-3 text-gray-700 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Rôle</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Type</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Action</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Détails</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-indigo-700 font-medium">
                      {activity.profiles?.surname || ""} {activity.profiles?.name || "Inconnu"} 
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.profiles?.role === "eleve"
                            ? "bg-green-100 text-green-800"
                            : activity.profiles?.role === "professeur"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {activity.profiles?.role || "Inconnu"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {getTypeInFrench(activity.activity_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          activity.action === "create"
                            ? "bg-green-100 text-green-700"
                            : activity.action === "update"
                              ? "bg-yellow-100 text-yellow-700"
                              : activity.action === "delete"
                                ? "bg-red-100 text-red-700"
                                : activity.action === "complete"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getActionInFrench(activity.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {activity.metadata?.titre && <div>📝 {activity.metadata.titre}</div>}
                      {activity.metadata?.nom && <div>🏷️ {activity.metadata.nom}</div>}
                      {activity.score !== null && activity.total_score !== null && (
                        <div>
                          📊 {activity.score}/{activity.total_score}
                        </div>
                      )}
                      {activity.duration_seconds && <div>⏱️ {Math.round(activity.duration_seconds / 60)}min</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📄 Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ⬅ Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages} ({filtered.length} résultats)
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
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
