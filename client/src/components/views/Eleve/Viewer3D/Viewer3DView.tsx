"use client"

import { useState, useEffect } from "react"
import { FlaskRoundIcon as Flask, PenToolIcon as Tool, ChevronLeft, ChevronRight } from "lucide-react"
import HeroSection from '../../../../components/ui/HeroSection'
import MoleculeCard from "./MoleculeCard"
import EquipmentCard from "./EquipmentCard"
import MoleculeDetails from "./MoleculeDetail"
import EquipmentDetails from "./EquipmentDetail"
import GLBViewer from "./GLBViewer"
import { supabase } from "../../../../lib/supabaseClient"
import type { lab_items } from "../../../../types/Viewer3D/lab_items"
import { trackObject3DView } from "../../../../utils/eleveActivityTracker"

type ViewMode = "molecules" | "equipment"

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>("molecules")
  const [moleculeList, setMoleculeList] = useState<lab_items[]>([])
  const [equipmentList, setEquipmentList] = useState<lab_items[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [prenom, setPrenom] = useState("")

  useEffect(() => {
    fetchItems()
  }, [viewMode])

  const logActivity = async (item: lab_items) => {
    await trackObject3DView(item.id, item.nom, item.category)
  }

  const fetchItems = async () => {
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const user = session?.session?.user
    const category = viewMode === "molecules" ? "molecule" : "equipment"

    if (!user) {
      const { data, error } = await supabase
        .from("vue_lab_items_details")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur de chargement (invité) :", error)
      } else {
        viewMode === "molecules" ? setMoleculeList(data || []) : setEquipmentList(data || [])
        setSelectedIndex(0)
      }

      setLoading(false)
      return
    }

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

    const classeData = await supabase.from("classes").select("code_classe").eq("id", classeId).single()

    const code_classe = classeData.data?.code_classe
    if (!code_classe) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("vue_lab_items_details")
      .select("*")
      .eq("category", category)
      .contains("code_classe", [code_classe])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur de chargement :", error)
    } else {
      viewMode === "molecules" ? setMoleculeList(data || []) : setEquipmentList(data || [])
      setSelectedIndex(0)

      if (data && data[0]) {
        await logActivity(data[0])
      }
    }

    setLoading(false)
  }

  const dataList = viewMode === "molecules" ? moleculeList : equipmentList
  const selectedItem = dataList[selectedIndex] || null

  const handleSelect = async (index: number) => {
    setSelectedIndex(index)
    const item = dataList[index]
    if (item) await logActivity(item)
  }

  const handleNext = () => {
    const nextIndex = (selectedIndex + 1) % dataList.length
    handleSelect(nextIndex)
  }

  const handlePrev = () => {
    const prevIndex = (selectedIndex - 1 + dataList.length) % dataList.length
    handleSelect(prevIndex)
  }

  return (
    <>
      <HeroSection images={["/assets/bg/3d1.png", "/assets/bg/3d2.png"]}>
      
      {/* Overlay sombre pour améliorer contraste */}
        <div className="absolute inset-0 bg-black/40 z-0" />

        <div className="text-center max-w-3xl mx-auto">
          <Tool size={48} className="text-purple-300 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold font-bold text-white mb-4 leading-tight drop-shadow-lg">
            Explorez en trois dimensions
          </h1>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed font-light drop-shadow-sm">
            Observez les molécules et le matériel de laboratoire en 3D pour mieux comprendre leurs structures et leurs usages.
          </p>
        </div>
      </HeroSection>

      <div className="max-w-[1280px] mx-auto px-0 md:px-26 py-6 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {prenom ? `Visualisation 3D disponibles` : "Visualisation 3D (mode invité)"}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("molecules")}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm border ${
                viewMode === "molecules"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Flask size={18} />
              <span>Molécules</span>
            </button>
            <button
              onClick={() => setViewMode("equipment")}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm border ${
                viewMode === "equipment"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Tool size={18} />
              <span>Matériel</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-6">
            {selectedItem &&
              (viewMode === "molecules" ? (
                <MoleculeDetails molecule={selectedItem as lab_items} />
              ) : (
                <EquipmentDetails equipment={selectedItem as lab_items} />
              ))}

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                {viewMode === "molecules" ? "Molécules disponibles" : "Matériel disponible"}
              </h3>

              {loading ? (
                <p className="text-sm text-gray-500">Chargement...</p>
              ) : dataList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Aucun élément disponible</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {dataList.map((item, index) =>
                    viewMode === "molecules" ? (
                      <MoleculeCard
                        key={item.id}
                        molecule={item}
                        isSelected={selectedIndex === index}
                        onSelect={() => handleSelect(index)}
                      />
                    ) : (
                      <EquipmentCard
                        key={item.id}
                        equipment={item}
                        isSelected={selectedIndex === index}
                        onSelect={() => handleSelect(index)}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative md:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
            {selectedItem?.structure?.endsWith(".glb") && (
              <GLBViewer
                key={`${viewMode}-${selectedItem.id}`}
                glbUrl={selectedItem.structure}
                moleculeName={selectedItem.nom}
                materielsName={selectedItem.nom}
              />
            )}

            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg"
              aria-label="Précédent"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg"
              aria-label="Suivant"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
