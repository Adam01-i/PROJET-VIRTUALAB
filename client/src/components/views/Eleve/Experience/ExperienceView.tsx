"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react"
import ExperienceCard from "./ExperienceCard"
import HeroSection from '../../../../components/ui/HeroSection'
import ExperienceDetailView from "./ExperienceDetailView"
import { supabase } from "../../../../lib/supabaseClient"
import { experienceData } from "../../../../data/Experience/experienceData"
import { trackSimulationStart } from "../../../../utils/eleveActivityTracker"

const ITEMS_PER_PAGE = 3

const localSimulationModules = import.meta.glob("../../../../simulations/*.tsx")

const getLocalSimulations = async (): Promise<any[]> => {
  return Object.keys(localSimulationModules).map((path, index) => {
    const fileName = path.split("/").pop()?.replace(".tsx", "") || `local-${index}`
    return {
      id: `local-${fileName}`,
      titre: `Simulation locale : ${fileName}`,
      description: "Simulation ajoutée localement.",
      objectifs: ["Observer, comprendre, expérimenter"],
      materiel: ["Ordinateur", "Navigateur"],
      resultatsAttendus: ["Observation des résultats", "Compréhension du phénomène"],
      duree: "5-10 min",
      niveau: "Tous niveaux",
      simulationPath: fileName,
      image: "/images/simulation-default.jpg",
      created_at: new Date().toISOString(),
    }
  })
}

const enrichLocalSimulations = (simulations: any[]) => {
  return simulations.map((sim) => {
    const detailed = experienceData.find((d) => sim.simulationPath === d.simulationPath)
    return detailed
      ? { ...sim, ...detailed, id: sim.id }
      : sim
  })
}

export default function ExperienceView() {
  const [activeExperience, setActiveExperience] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<any[]>([])
  const [localIds, setLocalIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [prenom, setPrenom] = useState("")
  const [filtre, setFiltre] = useState<"all" | "supabase" | "local">("all")

  const handleStartExperience = async (experienceId: string) => {
    const experience = experiences.find((e) => e.id === experienceId)
    if (experience) {
      await trackSimulationStart(experience.id, experience.titre)
    }
    setActiveExperience(experienceId)
  }

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true)

      const { data: session } = await supabase.auth.getSession()
      const user = session?.session?.user

      const rawLocalSimulations = await getLocalSimulations()
      const enrichedLocalSimulations = enrichLocalSimulations(rawLocalSimulations)
      const localIdSet = new Set(enrichedLocalSimulations.map((sim) => sim.id))
      setLocalIds(localIdSet)

      if (!user) {
        const { data: allExperiences } = await supabase
          .from("vue_experience_details")
          .select("*")
          .order("created_at", { ascending: false })

        setExperiences([...(allExperiences || []), ...enrichedLocalSimulations])
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", user.id).single()

      if (!profile || profile.role !== "eleve") {
        setLoading(false)
        return
      }

      setPrenom(profile.name || "")

      const { data: classeExperiences } = await supabase
        .from("vue_experience_eleve")
        .select("*")
        .order("created_at", { ascending: false })

      setExperiences(classeExperiences || [])
      setLoading(false)
    }

    fetchExperiences()
  }, [])

  const filteredExperiences = experiences.filter((exp) => {
    if (filtre === "supabase") return !localIds.has(exp.id)
    if (filtre === "local") return localIds.has(exp.id)
    return true
  })

  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const currentData = filteredExperiences.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  const currentExperience = activeExperience ? experiences.find((e) => e.id === activeExperience) : null

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Chargement des expériences...</div>
  }

  if (currentExperience) {
    return <ExperienceDetailView experience={currentExperience} onBack={() => setActiveExperience(null)} />
  }

  return (
    <>
      {/* ✅ Hero plein écran, largeur totale */}
      <HeroSection images={[
        "/assets/bg/exp1.png",
        "/assets/bg/exp2.png",
        "/assets/bg/exp3.png",
        "/assets/bg/exp4.png",
        "/assets/bg/exp5.png"
      ]}>
        {/* Overlay sombre pour améliorer contraste */}
        <div className="absolute inset-0 bg-black/40 z-0" />
        
        <div className="text-center max-w-3xl mx-auto">
          <FlaskConical size={48} className="text-purple-300 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            Simulez, observez, apprenez
          </h1>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed font-light drop-shadow-sm">
            Manipulez virtuellement le matériel de chimie, testez vos hypothèses, et découvrez les réactions en toute sécurité.
          </p>
        </div>
      </HeroSection>

      <div className="max-w-[1280px] mx-auto md:px-26  space-y-10">

      {/* ✅ Contenu centré */}
        <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-12 space-y-10">
        <h2 className="text-2xl font-bold text-gray-800">
          {prenom ? `Mes Expériences disponibles` : "Expériences disponibles (mode invité)"}
        </h2>

        {!prenom && (
          <div className="flex gap-3 flex-wrap">
            {["all", "supabase", "local"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltre(f as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${filtre === f
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {f === "all" ? "Toutes" : f === "supabase" ? "Supabase" : "Locales"}
              </button>
            ))}
          </div>
        )}

        {filteredExperiences.length === 0 ? (
          <div className="text-gray-500 text-center py-12">Aucune expérience disponible pour le moment.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentData.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onStart={handleStartExperience}
                  isLocal={localIds.has(experience.id)}
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
