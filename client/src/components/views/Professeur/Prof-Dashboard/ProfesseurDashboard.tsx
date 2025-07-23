"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import CardStat from "../../../ui/CardStat"
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon } from "@heroicons/react/24/outline"
import GraphActivityByClasse from "./GraphActivityByClasse"
import GraphActivityParEleve from "./GraphActivityParEleve"
import AllActivity from "./AllActivity"

type Classe = { id: string; code_classe: string }

type EleveActivite = {
  id: string
  name: string
  classe: string
  quiz: number
  simulation: number
  objet3d: number
  total_score: number
  created_at?: string
}

type ActiviteClasse = {
  classe: string
  quiz: number
  simulation: number
  objet3d: number
  created_at: string
}

export default function ProfesseurDashboard() {
  const [period] = useState<"7j" | "30j">("7j")
  const [classes, setClasses] = useState<Classe[]>([])
  const [selectedClasseEleve, setSelectedClasseEleve] = useState<string | "all">("all")
  const [parClasse, setParClasse] = useState<ActiviteClasse[]>([])
  const [parEleve, setParEleve] = useState<EleveActivite[]>([])
  const [totalActivities, setTotalActivities] = useState(0)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    const since = new Date()
    since.setDate(since.getDate() - (period === "7j" ? 7 : 30))

    const [{ data: mesClasses }, { data: elevesClasses }] = await Promise.all([
      supabase.from("mes_classes").select("*"),
      supabase.from("eleves_classes").select("eleve_id, classe_id"),
    ])

    if (!mesClasses || !elevesClasses) return
    setClasses(mesClasses)

    const classeMap: Record<string, string> = {}
    const eleveIds: string[] = []

    elevesClasses.forEach(({ eleve_id, classe_id }) => {
      const cl = mesClasses.find((c) => c.id === classe_id)
      if (cl) {
        classeMap[eleve_id] = cl.code_classe
        eleveIds.push(eleve_id)
      }
    })

    const [{ data: profils }, { data: logs }] = await Promise.all([
      supabase.from("profiles").select("id, name, surname").in("id", eleveIds),
      supabase
        .from("activity_logs")
        .select("user_id, created_at, activity_type")
        .in("user_id", eleveIds)
        .gte("created_at", since.toISOString()),
    ])

    if (!profils || !logs) return
    setTotalActivities(logs.length)

    // === 🔍 1. Activité par élève
    const eleveMap: Record<string, EleveActivite> = {}
    profils.forEach((e) => {
      eleveMap[e.id] = {
        id: e.id,
        name: `${e.name ?? ""} ${e.surname ?? ""}`.trim(),
        classe: classeMap[e.id] || "Inconnue",
        quiz: 0,
        simulation: 0,
        objet3d: 0,
        total_score: 0,
        created_at: undefined,
      }
    })

    logs.forEach(({ user_id, activity_type, created_at }) => {
      const el = eleveMap[user_id]
      if (!el) return

      if (!el.created_at || new Date(created_at) > new Date(el.created_at)) {
        el.created_at = created_at
      }

      if (activity_type === "quiz") el.quiz++
      if (activity_type === "simulation") el.simulation++
      if (activity_type === "objet3d") el.objet3d++
      el.total_score++
    })

    setParEleve(Object.values(eleveMap))

    // === 🔍 2. Activité par classe
    const classeAgg: Record<string, ActiviteClasse> = {}

    logs.forEach(({ user_id, activity_type, created_at }) => {
      const classe = classeMap[user_id]
      if (!classe) return

      if (!classeAgg[classe]) {
        classeAgg[classe] = {
          classe,
          quiz: 0,
          simulation: 0,
          objet3d: 0,
          created_at,
        }
      }

      if (activity_type === "quiz") classeAgg[classe].quiz++
      if (activity_type === "simulation") classeAgg[classe].simulation++
      if (activity_type === "objet3d") classeAgg[classe].objet3d++
    })

    setParClasse(Object.values(classeAgg))
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto">
      {/* Titre principal */}
      <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-6">
        Tableau de bord Professeur
      </h1>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <CardStat
          label="Mes classes"
          count={classes.length}
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
        <CardStat
          label="Élèves suivis"
          count={parEleve.length}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <CardStat
          label="Activités élèves"
          count={totalActivities}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
      </div>

      {/* Graphique Activité par Classe */}
      <div className="mb-10">
        <GraphActivityByClasse data={parClasse} classes={classes} />
      </div>

      {/* Graphique Activité par Élève */}
      <div className="mb-10">
        <GraphActivityParEleve
          data={parEleve.map((e) => ({
            ...e,
            created_at: e.created_at ?? "",
          }))}
          classes={classes}
          selectedClasse={selectedClasseEleve}
          onClasseChange={setSelectedClasseEleve}
        />
      </div>

      {/* Activité complète */}
      <div className="mb-10">
        <AllActivity />
      </div>
    </div>
  )
}