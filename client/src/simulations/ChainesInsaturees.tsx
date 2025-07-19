"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text } from "@react-three/drei"
import { ChevronDown, RotateCcw, BookOpen, Info, BeakerIcon, Calculator, Award, FileText, Eye, AlertTriangle, CheckCircle } from 'lucide-react'
import * as THREE from "three"

// ===================================
// TYPES ET INTERFACES
// ===================================

interface HydrocarbonType {
  id: string
  name: string
  color: string
  formula: string
  type: "alcène" | "alcyne" | "diène"
  colorHex: string
  molarMass: number
  density: number
  boilingPoint: number
  doubleBonds: number
  tripleBonds: number
}

interface ReagentType {
  id: string
  name: string
  color: string
  formula: string
  colorHex: string
  testType: "saturation" | "oxydation" | "identification"
  sensitivity: "élevée" | "modérée" | "faible"
}

interface ExperimentData {
  id: string
  timestamp: Date
  hydrocarbon: HydrocarbonType
  reagent: ReagentType
  results: {
    reactionTime: number
    colorChange: string
    product: string
    saturationDegree: number
    efficiency: number
  }
  observations: string
}

// ===================================
// DONNÉES DE LABORATOIRE
// ===================================

const hydrocarbons: HydrocarbonType[] = [
  {
    id: "ethene",
    name: "Éthène",
    color: "bg-green-50/80",
    formula: "C₂H₄",
    type: "alcène",
    colorHex: "#10b981",
    molarMass: 28.05,
    density: 0.568,
    boilingPoint: -103.8,
    doubleBonds: 1,
    tripleBonds: 0,
  },
  {
    id: "propene",
    name: "Propène",
    color: "bg-green-100/80",
    formula: "C₃H₆",
    type: "alcène",
    colorHex: "#059669",
    molarMass: 42.08,
    density: 0.61,
    boilingPoint: -47.6,
    doubleBonds: 1,
    tripleBonds: 0,
  },
  {
    id: "butene",
    name: "But-1-ène",
    color: "bg-green-200/80",
    formula: "C₄H₈",
    type: "alcène",
    colorHex: "#047857",
    molarMass: 56.11,
    density: 0.625,
    boilingPoint: -6.3,
    doubleBonds: 1,
    tripleBonds: 0,
  },
  {
    id: "ethyne",
    name: "Éthyne (Acétylène)",
    color: "bg-blue-100/80",
    formula: "C₂H₂",
    type: "alcyne",
    colorHex: "#3b82f6",
    molarMass: 26.04,
    density: 0.906,
    boilingPoint: -84.0,
    doubleBonds: 0,
    tripleBonds: 1,
  },
  {
    id: "butadiene",
    name: "Buta-1,3-diène",
    color: "bg-purple-100/80",
    formula: "C₄H₆",
    type: "diène",
    colorHex: "#8b5cf6",
    molarMass: 54.09,
    density: 0.621,
    boilingPoint: -4.4,
    doubleBonds: 2,
    tripleBonds: 0,
  },
]

const reagents: ReagentType[] = [
  {
    id: "bromine",
    name: "Eau de brome",
    color: "bg-orange-500/90",
    formula: "Br₂ + H₂O",
    colorHex: "#f97316",
    testType: "saturation",
    sensitivity: "élevée",
  },
  {
    id: "permanganate",
    name: "Permanganate KMnO₄",
    color: "bg-purple-500/90",
    formula: "KMnO₄",
    colorHex: "#a855f7",
    testType: "oxydation",
    sensitivity: "élevée",
  },
  {
    id: "iodine",
    name: "Solution d'iode",
    color: "bg-yellow-600/90",
    formula: "I₂",
    colorHex: "#d97706",
    testType: "saturation",
    sensitivity: "modérée",
  },
  {
    id: "silver_nitrate",
    name: "Nitrate d'argent",
    color: "bg-gray-300/90",
    formula: "AgNO₃",
    colorHex: "#9ca3af",
    testType: "identification",
    sensitivity: "élevée",
  },
]

// ===================================
// UTILITAIRES CHIMIQUES OPTIMISÉS
// ===================================

class UnsaturatedChemistryCalculator {
  static getSolutionColor(
    hydrocarbonAdded: boolean,
    reagentAdded: boolean,
    reactionComplete: boolean,
    selectedHydrocarbon: HydrocarbonType,
    selectedReagent: ReagentType,
  ): string {
    if (!hydrocarbonAdded && !reagentAdded) return "#ffffff"
    if (hydrocarbonAdded && !reagentAdded) return selectedHydrocarbon.colorHex
    if (hydrocarbonAdded && reagentAdded && !reactionComplete) {
      return selectedReagent.colorHex
    }
    if (reactionComplete) return this.getResultColor(selectedHydrocarbon, selectedReagent)
    return "#ffffff"
  }

  static getResultColor(selectedHydrocarbon: HydrocarbonType, selectedReagent: ReagentType): string {
    if (selectedReagent.id === "bromine") {
      // Décoloration complète pour les alcènes/alcynes
      return "#fef3c7"
    }
    if (selectedReagent.id === "permanganate") {
      // Décoloration du violet vers incolore/brun
      return "#a16207"
    }
    if (selectedReagent.id === "iodine") {
      return "#fef3c7" // Décoloration partielle
    }
    if (selectedReagent.id === "silver_nitrate") {
      // Précipité blanc pour les alcynes terminaux
      return selectedHydrocarbon.id === "ethyne" ? "#f1f5f9" : "#9ca3af"
    }
    return "#6b7280"
  }

  static getFillLevel(hydrocarbonAdded: boolean, reagentAdded: boolean): number {
    let level = 0
    if (hydrocarbonAdded) level += 0.3
    if (reagentAdded) level += 0.2
    return Math.min(level, 0.8)
  }

  static getChemicalEquation(selectedHydrocarbon: HydrocarbonType, selectedReagent: ReagentType): string {
    const equations: Record<string, Record<string, string>> = {
      ethene: {
        bromine: "C₂H₄ + Br₂ → C₂H₄Br₂ (1,2-dibromoéthane)",
        permanganate: "3C₂H₄ + 2KMnO₄ + 4H₂O → 3C₂H₄(OH)₂ + 2MnO₂ + 2KOH",
        iodine: "C₂H₄ + I₂ → C₂H₄I₂ (réaction lente)",
        silver_nitrate: "Pas de réaction (alcène non terminal)",
      },
      propene: {
        bromine: "C₃H₆ + Br₂ → C₃H₆Br₂ (1,2-dibromopropane)",
        permanganate: "3C₃H₆ + 2KMnO₄ + 4H₂O → 3C₃H₆(OH)₂ + 2MnO₂ + 2KOH",
        iodine: "C₃H₆ + I₂ → C₃H₆I₂ (réaction lente)",
        silver_nitrate: "Pas de réaction (alcène non terminal)",
      },
      ethyne: {
        bromine: "C₂H₂ + 2Br₂ → C₂H₂Br₄ (1,1,2,2-tétrabromoéthane)",
        permanganate: "C₂H₂ + 2KMnO₄ → 2CO₂ + K₂O + 2MnO₂ + H₂O",
        iodine: "C₂H₂ + 2I₂ → C₂H₂I₄ (tétraiodoéthane)",
        silver_nitrate: "C₂H₂ + 2AgNO₃ + 2NH₃ → Ag₂C₂ + 2NH₄NO₃ (précipité blanc)",
      },
      butadiene: {
        bromine: "C₄H₆ + 2Br₂ → C₄H₆Br₄ (addition sur les deux doubles liaisons)",
        permanganate: "C₄H₆ + 2KMnO₄ + 3H₂SO₄ → 4CO₂ + 2MnSO₄ + K₂SO₄ + 3H₂O",
        iodine: "C₄H₆ + 2I₂ → C₄H₆I₄ (addition lente)",
        silver_nitrate: "Pas de réaction (diène non terminal)",
      },
    }

    const hydrocarbonKey = selectedHydrocarbon.id === "butene" ? "propene" : selectedHydrocarbon.id

    return (
      equations[hydrocarbonKey]?.[selectedReagent.id] ||
      `${selectedHydrocarbon.formula} + ${selectedReagent.formula} → produits d'addition`
    )
  }

  static getDetailedResult(
    selectedHydrocarbon: HydrocarbonType,
    selectedReagent: ReagentType,
  ): {
    product: string
    mechanism: string
    observation: string
    interpretation: string
    saturationDegree: number
    efficiency: number
  } {
    const results: Record<string, Record<string, any>> = {
      ethene: {
        bromine: {
          product: "1,2-dibromoéthane (C₂H₄Br₂)",
          mechanism: "Addition électrophile sur la double liaison C=C",
          observation: "Décoloration rapide de l'eau de brome orange → incolore",
          interpretation: "Test positif confirmant la présence d'une insaturation",
          saturationDegree: 100,
          efficiency: 98 + Math.random() * 2,
        },
        permanganate: {
          product: "Éthane-1,2-diol (glycol) + MnO₂",
          mechanism: "Oxydation ménagée (dihydroxylation)",
          observation: "Décoloration du permanganate violet → brun",
          interpretation: "Formation d'un diol, test de Baeyer positif",
          saturationDegree: 85,
          efficiency: 88 + Math.random() * 8,
        },
        iodine: {
          product: "1,2-diiodoéthane (réaction lente)",
          mechanism: "Addition électrophile lente de I₂",
          observation: "Décoloration lente de la solution d'iode",
          interpretation: "Réaction moins favorable qu'avec Br₂",
          saturationDegree: 60,
          efficiency: 65 + Math.random() * 15,
        },
        silver_nitrate: {
          product: "Pas de réaction",
          mechanism: "Les alcènes ne réagissent pas avec AgNO₃",
          observation: "Aucun changement visible",
          interpretation: "Test négatif, distingue des alcynes terminaux",
          saturationDegree: 0,
          efficiency: 0,
        },
      },
      ethyne: {
        bromine: {
          product: "1,1,2,2-tétrabromoéthane (C₂H₂Br₄)",
          mechanism: "Double addition électrophile sur la triple liaison",
          observation: "Décoloration très rapide, consommation de 2 équivalents de Br₂",
          interpretation: "Réaction plus rapide qu'avec les alcènes",
          saturationDegree: 100,
          efficiency: 98 + Math.random() * 2,
        },
        permanganate: {
          product: "CO₂ + MnO₂ (oxydation totale)",
          mechanism: "Coupure oxydante de la triple liaison",
          observation: "Décoloration rapide avec dégagement gazeux",
          interpretation: "Oxydation énergique, rupture de la molécule",
          saturationDegree: 100,
          efficiency: 92 + Math.random() * 6,
        },
        iodine: {
          product: "Tétraiodoéthane (réaction difficile)",
          mechanism: "Addition électrophile sur triple liaison",
          observation: "Réaction très lente, décoloration partielle",
          interpretation: "I₂ moins réactif que Br₂ sur les alcynes",
          saturationDegree: 40,
          efficiency: 45 + Math.random() * 20,
        },
        silver_nitrate: {
          product: "Carbure d'argent Ag₂C₂ (précipité blanc)",
          mechanism: "Substitution des H terminaux par Ag⁺",
          observation: "Formation immédiate d'un précipité blanc jaunâtre",
          interpretation: "Test spécifique des alcynes terminaux",
          saturationDegree: 100,
          efficiency: 96 + Math.random() * 4,
        },
      },
      butadiene: {
        bromine: {
          product: "1,2,3,4-tétrabromobutane",
          mechanism: "Addition sur les deux doubles liaisons conjuguées",
          observation: "Décoloration rapide, consommation de 2 équivalents",
          interpretation: "Système conjugué très réactif",
          saturationDegree: 100,
          efficiency: 94 + Math.random() * 6,
        },
        permanganate: {
          product: "Fragments oxydés + CO₂",
          mechanism: "Coupure oxydante des doubles liaisons",
          observation: "Décoloration rapide avec formation de précipité brun",
          interpretation: "Oxydation énergique du système conjugué",
          saturationDegree: 100,
          efficiency: 90 + Math.random() * 8,
        },
        iodine: {
          product: "Produits d'addition multiples",
          mechanism: "Addition lente sur système conjugué",
          observation: "Décoloration lente et incomplète",
          interpretation: "Réaction défavorisée cinétiquement",
          saturationDegree: 50,
          efficiency: 55 + Math.random() * 20,
        },
        silver_nitrate: {
          product: "Pas de réaction",
          mechanism: "Pas d'hydrogène terminal",
          observation: "Aucun changement",
          interpretation: "Test négatif pour les diènes non terminaux",
          saturationDegree: 0,
          efficiency: 0,
        },
      },
    }

    const hydrocarbonKey = ["propene", "butene"].includes(selectedHydrocarbon.id) ? "ethene" : selectedHydrocarbon.id

    return (
      results[hydrocarbonKey]?.[selectedReagent.id] || {
        product: "Produit d'addition",
        mechanism: "Addition sur insaturation",
        observation: "Changement de couleur observé",
        interpretation: "Réaction d'addition réussie",
        saturationDegree: 70 + Math.random() * 20,
        efficiency: 75 + Math.random() * 15,
      }
    )
  }
}

// ===================================
// COMPOSANTS 3D OPTIMISÉS
// ===================================

const LabTable = () => (
  <group>
    <Box args={[8, 0.2, 4]} position={[0, -1, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#059669" roughness={0.3} metalness={0.1} />
    </Box>
    {[
      [-3.5, -2, -1.5],
      [3.5, -2, -1.5],
      [-3.5, -2, 1.5],
      [3.5, -2, 1.5],
    ].map((pos, i) => (
      <Cylinder key={i} args={[0.1, 0.1, 2]} position={pos as [number, number, number]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
      </Cylinder>
    ))}
  </group>
)

// Nouveau composant pour l'environnement de laboratoire
const LabEnvironment = () => (
  <group>
    {/* Murs du laboratoire */}
    <Box args={[20, 8, 0.2]} position={[0, 2, -8]} receiveShadow>
      <meshStandardMaterial color="#e0f2fe" roughness={0.8} />
    </Box>
    <Box args={[0.2, 8, 16]} position={[-10, 2, 0]} receiveShadow>
      <meshStandardMaterial color="#e0f2fe" roughness={0.8} />
    </Box>
    <Box args={[0.2, 8, 16]} position={[10, 2, 0]} receiveShadow>
      <meshStandardMaterial color="#e0f2fe" roughness={0.8} />
    </Box>

    {/* Sol du laboratoire */}
    <Box args={[20, 0.1, 16]} position={[0, -2.1, 0]} receiveShadow>
      <meshStandardMaterial color="#f0fdf4" roughness={0.9} />
    </Box>

    {/* Étagères murales */}
    {[-6, -2, 2, 6].map((x, i) => (
      <group key={i} position={[x, 0, -7.8]}>
        <Box args={[1.5, 0.05, 0.3]} position={[0, 2, 0]} castShadow>
          <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.2} />
        </Box>
        <Box args={[1.5, 0.05, 0.3]} position={[0, 3, 0]} castShadow>
          <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.2} />
        </Box>
        <Box args={[1.5, 0.05, 0.3]} position={[0, 4, 0]} castShadow>
          <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.2} />
        </Box>
      </group>
    ))}

    {/* Flacons et équipements sur les étagères */}
    {[-6, -2, 2, 6].map((x, i) => (
      <group key={`bottles-${i}`} position={[x, 0, -7.6]}>
        {/* Flacons */}
        <Cylinder args={[0.08, 0.08, 0.3]} position={[-0.4, 2.15, 0]} castShadow>
          <meshStandardMaterial color="#dc2626" transparent opacity={0.8} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 0.25]} position={[0, 2.125, 0]} castShadow>
          <meshStandardMaterial color="#2563eb" transparent opacity={0.8} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 0.35]} position={[0.4, 2.175, 0]} castShadow>
          <meshStandardMaterial color="#16a34a" transparent opacity={0.8} />
        </Cylinder>

        {/* Équipements */}
        <Box args={[0.2, 0.15, 0.15]} position={[-0.3, 3.075, 0]} castShadow>
          <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.8} />
        </Box>
        <Cylinder args={[0.06, 0.06, 0.2]} position={[0.3, 3.1, 0]} castShadow>
          <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.9} />
        </Cylinder>
      </group>
    ))}

    {/* Armoires de laboratoire */}
    <Box args={[2, 4, 1]} position={[-8, 0, -7]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.6} />
    </Box>
    <Box args={[2, 4, 1]} position={[8, 0, -7]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.6} />
    </Box>

    {/* Poignées des armoires */}
    <Cylinder args={[0.02, 0.02, 0.1]} position={[-7.3, 0.5, -6.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.9} />
    </Cylinder>
    <Cylinder args={[0.02, 0.02, 0.1]} position={[7.3, 0.5, -6.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.9} />
    </Cylinder>

    {/* Évier de laboratoire */}
    <Box args={[1.5, 0.8, 0.8]} position={[-8, -1.2, 2]} castShadow>
      <meshStandardMaterial color="#e5e7eb" roughness={0.3} />
    </Box>
    <Box args={[1.2, 0.2, 0.6]} position={[-8, -0.7, 2]} castShadow>
      <meshStandardMaterial color="#f8fafc" roughness={0.1} />
    </Box>

    {/* Robinet */}
    <Cylinder args={[0.03, 0.03, 0.2]} position={[-8, -0.5, 1.5]} castShadow>
      <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.9} />
    </Cylinder>

    {/* Hotte aspirante */}
    <Box args={[3, 2, 1.5]} position={[8, 1, 2]} castShadow>
      <meshStandardMaterial color="#f3f4f6" roughness={0.4} />
    </Box>
    <Box args={[2.8, 0.1, 1.3]} position={[8, 0.1, 2]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.3} />
    </Box>

    {/* Fenêtres */}
    <Box args={[2, 2, 0.05]} position={[-5, 3, -7.95]} castShadow>
      <meshStandardMaterial color="#dbeafe" transparent opacity={0.7} />
    </Box>
    <Box args={[2, 2, 0.05]} position={[5, 3, -7.95]} castShadow>
      <meshStandardMaterial color="#dbeafe" transparent opacity={0.7} />
    </Box>

    {/* Cadres de fenêtres */}
    <Box args={[2.2, 2.2, 0.1]} position={[-5, 3, -7.9]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.4} />
    </Box>
    <Box args={[2.2, 2.2, 0.1]} position={[5, 3, -7.9]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.4} />
    </Box>

    {/* Éclairage de laboratoire */}
    <Box args={[1, 0.1, 0.3]} position={[0, 5.5, 0]} castShadow>
      <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.2} />
    </Box>
    <Box args={[1, 0.1, 0.3]} position={[-4, 5.5, -2]} castShadow>
      <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.2} />
    </Box>
    <Box args={[1, 0.1, 0.3]} position={[4, 5.5, -2]} castShadow>
      <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.2} />
    </Box>
  </group>
)

const Beaker = ({
  position,
  color,
  fillLevel = 0.7,
  onClick,
  isPouring = false,
  label,
  hydrocarbon,
  reagent,
}: {
  position: [number, number, number]
  color: string
  fillLevel?: number
  onClick?: () => void
  isPouring?: boolean
  label: string
  hydrocarbon?: HydrocarbonType
  reagent?: ReagentType
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const liquidRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!meshRef.current) return

    if (isPouring) {
      const targetY = 4
      const targetRotation = position[0] < 0 ? -0.85 : 0.85
      const targetX = position[0] < 0 ? position[1] + 0.3 : position[1] - 0.3

      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05)
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05)
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotation, 0.05)

      if (liquidRef.current) {
        liquidRef.current.rotation.z = meshRef.current.rotation.z * 0.3
      }
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.03)
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, position[0], 0.03)
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.03)
      if (liquidRef.current) {
        liquidRef.current.rotation.z = THREE.MathUtils.lerp(liquidRef.current.rotation.z, 0, 0.03)
      }
    }
  })

  const isLeft = position[0] < 0
  const spoutX = isLeft ? 0.5 : -0.5
  const spoutRotationZ = isLeft ? Math.PI / 2 : -Math.PI / 2
  const jetDirection = isLeft ? 1 : -1

  return (
    <group position={position} onClick={onClick && !isPouring ? onClick : undefined}>
      <group ref={meshRef}>
        {/* Bécher */}
        <Cylinder args={[0.5, 0.45, 1.5, 22]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.2} roughness={0.05} metalness={0.1} />
        </Cylinder>
        <Cylinder args={[0.52, 0.5, 0.08, 32]} position={[0, 0.71, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </Cylinder>

        {/* Liquide */}
        <group ref={liquidRef}>
          <Cylinder args={[0.45, 0.4, fillLevel * 1.4]} position={[0, -0.75 + fillLevel * 0.7, 0]}>
            <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.1} />
          </Cylinder>
          <Cylinder args={[0.45, 0.45, 0.02]} position={[0, -0.05 + fillLevel * 0.7, 0]}>
            <meshStandardMaterial color={color} transparent opacity={0.95} roughness={0.0} metalness={0.1} />
          </Cylinder>
        </group>

        {/* Bec verseur */}
        <Cylinder args={[0.08, 0.12, 0.3, 16]} position={[spoutX, 0.5, 0]} rotation={[0, 0, spoutRotationZ]}>
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.3} roughness={0.1} />
        </Cylinder>

        {/* Marques de niveau */}
        {[0.2, 0.4, 0.6].map((height, i) => (
          <Cylinder key={i} args={[0.51, 0.51, 0.01, 32]} position={[0, -0.5 + height, 0]}>
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} />
          </Cylinder>
        ))}

        {/* Jet */}
        {isPouring && (
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(spoutX, 0.5, 0),
                  new THREE.Vector3(spoutX + 0.3 * jetDirection, 0.2, 0),
                ]),
                64,
                0.05,
                8,
                false,
              ]}
            />
            <meshStandardMaterial color={color} transparent opacity={0.85} emissive={color} emissiveIntensity={0.25} />
          </mesh>
        )}
      </group>

      {/* ÉTIQUETTES */}
      <group position={[0, 1.8, 0]}>
        <Text position={[0, 0.2, 0]} fontSize={0.12} color="#374151" anchorX="center" anchorY="middle">
          {label}
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.08} color="#6b7280" anchorX="center" anchorY="middle">
          {hydrocarbon?.formula || reagent?.formula}
        </Text>
        <Text position={[0, -0.15, 0]} fontSize={0.06} color="#9ca3af" anchorX="center" anchorY="middle">
          {hydrocarbon
            ? `${hydrocarbon.type} • ${hydrocarbon.doubleBonds + hydrocarbon.tripleBonds} insaturation(s)`
            : reagent
              ? `Test: ${reagent.testType}`
              : ""}
        </Text>
        {(hydrocarbon?.type === "alcyne" || reagent?.sensitivity === "élevée") && (
          <Sphere args={[0.04]} position={[0.25, 0.1, 0]}>
            <meshBasicMaterial color={hydrocarbon?.type === "alcyne" ? "#3b82f6" : "#dc2626"} />
          </Sphere>
        )}
      </group>
    </group>
  )
}

const TestTube = ({
  solutionColor,
  fillLevel = 0,
  showBubbles = false,
}: {
  position: [number, number, number]
  solutionColor: string
  fillLevel: number
  showBubbles?: boolean
}) => {
  const bubblesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (bubblesRef.current && showBubbles) {
      bubblesRef.current.children.forEach((bubble, i) => {
        const speed = 0.02 + Math.random() * 0.01
        bubble.position.y += speed
        bubble.position.x += Math.sin(state.clock.elapsedTime * 2 + i) * 0.002
        bubble.position.z += Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.002

        if (bubble.position.y > 2) {
          bubble.position.y = -1.5 + Math.random() * 0.5
          bubble.position.x = (Math.random() - 0.5) * 0.4
          bubble.position.z = (Math.random() - 0.5) * 0.4
        }
      })
    }
  })

  return (
    <group position={[0, 0.8, 0]}>
      {/* Tube à essai posé sur la table à la même hauteur que les béchers */}
      <group>
        <Cylinder args={[0.25, 0.2, 3.5, 32]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.15} roughness={0.02} metalness={0.1} />
        </Cylinder>
        <Sphere args={[0.2, 16, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.15} roughness={0.02} metalness={0.1} />
        </Sphere>
        <Cylinder args={[0.26, 0.25, 0.1]} position={[0, 1.75, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </Cylinder>

        {fillLevel > 0 && (
          <group>
            <Cylinder args={[0.22, 0.18, fillLevel * 3.2]} position={[0, -1.75 + fillLevel * 1.6, 0]}>
              <meshStandardMaterial color={solutionColor} transparent opacity={0.9} roughness={0.2} metalness={0.0} />
            </Cylinder>
            <Cylinder args={[0.22, 0.22, 0.02]} position={[0, -1.75 + fillLevel * 3.2, 0]}>
              <meshStandardMaterial color={solutionColor} transparent opacity={0.95} roughness={0.0} metalness={0.1} />
            </Cylinder>
          </group>
        )}

        {showBubbles && (
          <group ref={bubblesRef}>
            {Array.from({ length: 15 }, (_, i) => (
              <Sphere
                key={i}
                args={[0.015 + Math.random() * 0.02]}
                position={[(Math.random() - 0.5) * 0.4, -1.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.7}
                  emissive="#ffffff"
                  emissiveIntensity={0.1}
                />
              </Sphere>
            ))}
          </group>
        )}

        <Cylinder args={[0.05, 0.03, 3]} position={[-0.15, 0, 0]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} emissive="#ffffff" emissiveIntensity={0.1} />
        </Cylinder>

        {[0.5, 1.0, 1.5, 2.0, 2.5].map((height, i) => (
          <Cylinder key={i} args={[0.26, 0.26, 0.005]} position={[0, -1.5 + height, 0]}>
            <meshStandardMaterial color="#64748b" transparent opacity={0.4} />
          </Cylinder>
        ))}
      </group>

      {/* ÉTIQUETTE TUBE À ESSAI */}
      <group position={[0, 2.5, 0]}>
        <Text position={[0, 0.1, 0]} fontSize={0.1} color="#374151" anchorX="center" anchorY="middle">
          Tube à essai
        </Text>
        <Text position={[0, -0.1, 0]} fontSize={0.07} color="#6b7280" anchorX="center" anchorY="middle">
          {Math.round(fillLevel * 25)}mL
        </Text>
      </group>
    </group>
  )
}

const LabLighting = () => (
  <>
    <ambientLight intensity={0.6} color="#f8fafc" />
    <directionalLight
      position={[10, 10, 5]}
      intensity={1.2}
      color="#ffffff"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={50}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={15}
      shadow-camera-bottom={-15}
    />
    <directionalLight position={[-5, 8, -5]} intensity={0.4} color="#e0e7ff" />
    <pointLight position={[0, 5.5, 0]} intensity={0.8} color="#ffffff" distance={12} decay={2} />
    <pointLight position={[-4, 5.5, -2]} intensity={0.6} color="#f8fafc" distance={10} decay={2} />
    <pointLight position={[4, 5.5, -2]} intensity={0.6} color="#f8fafc" distance={10} decay={2} />
    <spotLight
      position={[0, 6, 2]}
      angle={Math.PI / 6}
      penumbra={0.3}
      intensity={0.5}
      color="#ffffff"
      target-position={[0, -1, 0]}
      castShadow
    />
  </>
)

// ===================================
// SCÈNE PRINCIPALE
// ===================================

const LabScene = ({
  selectedHydrocarbon,
  selectedReagent,
  hydrocarbonAdded,
  reagentAdded,
  reactionComplete,
  pouringLeft,
  pouringRight,
  onPourHydrocarbon,
  onPourReagent,
}: {
  selectedHydrocarbon: HydrocarbonType
  selectedReagent: ReagentType
  hydrocarbonAdded: boolean
  reagentAdded: boolean
  reactionComplete: boolean
  pouringLeft: boolean
  pouringRight: boolean
  onPourHydrocarbon: () => void
  onPourReagent: () => void
}) => {
  const solutionColor = useMemo(
    () =>
      UnsaturatedChemistryCalculator.getSolutionColor(
        hydrocarbonAdded,
        reagentAdded,
        reactionComplete,
        selectedHydrocarbon,
        selectedReagent,
      ),
    [hydrocarbonAdded, reagentAdded, reactionComplete, selectedHydrocarbon, selectedReagent],
  )

  const fillLevel = useMemo(
    () => UnsaturatedChemistryCalculator.getFillLevel(hydrocarbonAdded, reagentAdded),
    [hydrocarbonAdded, reagentAdded],
  )

  return (
    <>
      <color attach="background" args={["#f1f5f9"]} />
      <LabLighting />
      <LabEnvironment />
      <LabTable />
      <Beaker
        position={[-1, -0.15, 0]}
        color={selectedHydrocarbon.colorHex}
        fillLevel={hydrocarbonAdded ? 0.4 : 0.7}
        onClick={onPourHydrocarbon}
        isPouring={pouringLeft}
        label={selectedHydrocarbon.name}
        hydrocarbon={selectedHydrocarbon}
      />
      <Beaker
        position={[1, -0.15, 0]}
        color={selectedReagent.colorHex}
        fillLevel={reagentAdded ? 0.4 : 0.7}
        onClick={onPourReagent}
        isPouring={pouringRight}
        label={selectedReagent.name}
        reagent={selectedReagent}
      />
      <TestTube
        position={[0, 0, 0]}
        solutionColor={solutionColor}
        fillLevel={fillLevel}
        showBubbles={reactionComplete}
      />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
        target={[0, -1, 0]}
        maxAzimuthAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 2}
      />
    </>
  )
}

// ===================================
// HOOK PRINCIPAL (simplifié sans chauffage)
// ===================================

const useUnsaturatedLabSimulation = () => {
  const [selectedHydrocarbon, setSelectedHydrocarbon] = useState(hydrocarbons[0])
  const [selectedReagent, setSelectedReagent] = useState(reagents[0])
  const [hydrocarbonAdded, setHydrocarbonAdded] = useState(false)
  const [reagentAdded, setReagentAdded] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [pouringLeft, setPouringLeft] = useState(false)
  const [pouringRight, setPouringRight] = useState(false)
  const [hydrocarbonMenu, setHydrocarbonMenu] = useState(false)
  const [reagentMenu, setReagentMenu] = useState(false)
  const [experiments, setExperiments] = useState<ExperimentData[]>([])
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentData | null>(null)
  const [sectionVisibility, setSectionVisibility] = useState({
    controls: true,
    results: true,
    guide: true,
    formula: true
  })
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)

  const toggleSectionVisibility = useCallback((section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  const handleQuizAnswer = useCallback((answer: string) => {
    setSelectedAnswer(answer)
    setShowExplanation(true)
    
    const questions = [
      {
        id: 'q1',
        question: "Que signifie la décoloration de l'eau de brome lors du test ?",
        options: [
          { id: 'saturation', text: 'Le composé est saturé' },
          { id: 'insaturation', text: 'Le composé contient des insaturations' },
          { id: 'acidite', text: 'Le composé est acide' },
          { id: 'basicite', text: 'Le composé est basique' }
        ],
        correct: 'insaturation',
        explanation: "La décoloration de l'eau de brome indique la présence d'insaturations (doubles ou triples liaisons) car le brome s'additionne sur ces liaisons, consommant ainsi le réactif coloré."
      },
      {
        id: 'q2',
        question: "Quel type de mécanisme se produit entre un alcène et le dibrome ?",
        options: [
          { id: 'substitution', text: 'Substitution radicalaire' },
          { id: 'addition', text: 'Addition électrophile' },
          { id: 'elimination', text: 'Élimination' },
          { id: 'oxydation', text: 'Oxydation-réduction' }
        ],
        correct: 'addition',
        explanation: "L'addition électrophile est le mécanisme principal : le dibrome, électrophile, attaque la double liaison riche en électrons de l'alcène pour former un produit d'addition."
      }
    ]
    
    if (answer === questions[currentQuestionIndex].correct) {
      setCorrectAnswers(prev => prev + 1)
    }
  }, [currentQuestionIndex, correctAnswers])

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizCompleted(true)
    }
  }, [currentQuestionIndex])

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizCompleted(false)
    setCorrectAnswers(0)
    setShowQuiz(false)
  }, [])

  // Reset automatique
  useEffect(() => {
    const resetState = () => {
      setHydrocarbonAdded(false)
      setReagentAdded(false)
      setReactionComplete(false)
      setShowResult(false)
      setShowFormula(false)
      setPouringLeft(false)
      setPouringRight(false)
      setCurrentExperiment(null)
    }
    resetState()
  }, [selectedHydrocarbon.id, selectedReagent.id])

  // Démarrage automatique de la réaction (sans chauffage)
  useEffect(() => {
    if (hydrocarbonAdded && reagentAdded && !reactionComplete && !pouringLeft && !pouringRight) {
      const timer = setTimeout(() => {
        setShowFormula(true)

        const detailedResult = UnsaturatedChemistryCalculator.getDetailedResult(selectedHydrocarbon, selectedReagent)
        const experiment: ExperimentData = {
          id: Date.now().toString(),
          timestamp: new Date(),
          hydrocarbon: selectedHydrocarbon,
          reagent: selectedReagent,
          results: {
            reactionTime: 2.0,
            colorChange: `${selectedReagent.colorHex} → ${UnsaturatedChemistryCalculator.getResultColor(selectedHydrocarbon, selectedReagent)}`,
            product: detailedResult.product,
            saturationDegree: detailedResult.saturationDegree,
            efficiency: detailedResult.efficiency,
          },
          observations: detailedResult.observation,
        }

        setCurrentExperiment(experiment)
        setExperiments((prev) => [experiment, ...prev.slice(0, 9)])

        setTimeout(() => {
          setReactionComplete(true)
        }, 1000)
        setTimeout(() => {
          setShowQuiz(true)
        }, 2000)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [
    hydrocarbonAdded,
    reagentAdded,
    reactionComplete,
    pouringLeft,
    pouringRight,
    selectedHydrocarbon,
    selectedReagent,
  ])

  const pourHydrocarbon = useCallback(() => {
    if (hydrocarbonAdded || pouringLeft || reactionComplete) return
    setPouringLeft(true)
    setTimeout(() => {
      setHydrocarbonAdded(true)
      setPouringLeft(false)
    }, 1500)
  }, [hydrocarbonAdded, pouringLeft, reactionComplete])

  const pourReagent = useCallback(() => {
    if (reagentAdded || pouringRight || reactionComplete) return
    setPouringRight(true)
    setTimeout(() => {
      setReagentAdded(true)
      setPouringRight(false)
    }, 1500)
  }, [reagentAdded, pouringRight, reactionComplete])

  const handleReset = useCallback(() => {
    setReactionComplete(false)
    setShowFormula(false)
    setShowResult(false)
    setHydrocarbonAdded(false)
    setReagentAdded(false)
    setPouringLeft(false)
    setPouringRight(false)
    setCurrentExperiment(null)
    setHydrocarbonMenu(false)
    setReagentMenu(false)
  }, [])

  const getStatusMessage = useCallback(() => {
    if (pouringLeft || pouringRight) return "⏳ Versement en cours... Patientez."
    if (!hydrocarbonAdded && !reagentAdded)
      return "🧪 Cliquez sur les béchers pour verser les solutions dans le tube à essai."
    if (hydrocarbonAdded && !reagentAdded) return "✅ Hydrocarbure ajouté. Ajoutez maintenant le réactif."
    if (!hydrocarbonAdded && reagentAdded) return "✅ Réactif ajouté. Ajoutez maintenant l'hydrocarbure."
    if (hydrocarbonAdded && reagentAdded && !reactionComplete)
      return "⏳ Solutions mélangées. Réaction en cours... Observez la décoloration."
    if (reactionComplete) return "📊 Test terminé! Cliquez sur 'Analyser résultats' pour voir l'analyse détaillée."
    return ""
  }, [hydrocarbonAdded, reagentAdded, reactionComplete, pouringLeft, pouringRight])

  const getChemicalEquation = useCallback(
    () => UnsaturatedChemistryCalculator.getChemicalEquation(selectedHydrocarbon, selectedReagent),
    [selectedHydrocarbon, selectedReagent],
  )

  const getDetailedResult = useCallback(
    () =>
      reactionComplete ? UnsaturatedChemistryCalculator.getDetailedResult(selectedHydrocarbon, selectedReagent) : null,
    [reactionComplete, selectedHydrocarbon, selectedReagent],
  )

  return {
    selectedHydrocarbon,
    selectedReagent,
    hydrocarbonAdded,
    reagentAdded,
    reactionComplete,
    showFormula,
    showResult,
    pouringLeft,
    pouringRight,
    hydrocarbonMenu,
    reagentMenu,
    experiments,
    currentExperiment,
    setSelectedHydrocarbon,
    setSelectedReagent,
    setShowFormula,
    setHydrocarbonMenu,
    setReagentMenu,
    pourHydrocarbon,
    pourReagent,
    handleReset,
    getStatusMessage,
    getChemicalEquation,
    getDetailedResult,
    setShowResult,
    showQuiz,
    setShowQuiz,
    currentQuestionIndex,
    selectedAnswer,
    showExplanation,
    quizCompleted,
    correctAnswers,
    sectionVisibility,
    toggleSectionVisibility,
    handleQuizAnswer,
    nextQuestion,
    resetQuiz,
  }
}

// Boutons de démasquage flottants
const FloatingToggleButtons = ({ sectionVisibility, toggleSectionVisibility, showFormula }: any) => (
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
    {!sectionVisibility.controls && (
      <button
        onClick={() => toggleSectionVisibility('controls')}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher les contrôles"
      >
        <BeakerIcon size={16} />
      </button>
    )}
    {!sectionVisibility.results && (
      <button
        onClick={() => toggleSectionVisibility('results')}
        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher les observations"
      >
        <Eye size={16} />
      </button>
    )}
    {!sectionVisibility.guide && (
      <button
        onClick={() => toggleSectionVisibility('guide')}
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher le guide"
      >
        <Info size={16} />
      </button>
    )}
    {!sectionVisibility.formula && showFormula && (
      <button
        onClick={() => toggleSectionVisibility('formula')}
        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher la formule"
      >
        <BookOpen size={16} />
      </button>
    )}
  </div>
)

// ===================================
// COMPOSANTS UI (simplifiés sans chauffage)
// ===================================

const UIControls = ({
  selectedHydrocarbon,
  selectedReagent,
  hydrocarbonMenu,
  reagentMenu,
  setSelectedHydrocarbon,
  setSelectedReagent,
  setHydrocarbonMenu,
  setReagentMenu,
  handleReset,
  setShowFormula,
  showFormula,
  setShowResult,
  reactionComplete,
  toggleSectionVisibility,
  sectionVisibility,
}: any) => (
  <div className={`absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 w-80 border border-gray-200 shadow-xl ${sectionVisibility.controls ? '' : 'hidden'}`}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-gray-800 font-semibold flex items-center">
        <BeakerIcon className="mr-2 text-indigo-600" size={18} />
        Test des Chaînes Insaturées
      </h3>
      <button
        onClick={() => toggleSectionVisibility('controls')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Masquer/Afficher les contrôles"
      >
        <Eye size={14} className="text-gray-500" />
      </button>
    </div>

    <div className="space-y-3 mb-4">
      <div className="relative">
        <label className="text-xs text-gray-600 mb-1 block font-medium">Hydrocarbure sélectionné:</label>
        <button
          onClick={() => setHydrocarbonMenu(!hydrocarbonMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">{selectedHydrocarbon.name}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {hydrocarbonMenu && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-40 overflow-y-auto">
            {hydrocarbons.map((hydrocarbon) => (
              <button
                key={hydrocarbon.id}
                onClick={() => {
                  setSelectedHydrocarbon(hydrocarbon)
                  setHydrocarbonMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{hydrocarbon.name}</div>
                <div className="text-xs text-gray-500">
                  ({hydrocarbon.type}) - {hydrocarbon.formula}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <label className="text-xs text-gray-600 mb-1 block font-medium">Réactif sélectionné:</label>
        <button
          onClick={() => setReagentMenu(!reagentMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">{selectedReagent.name}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {reagentMenu && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-40 overflow-y-auto">
            {reagents.map((reagent) => (
              <button
                key={reagent.id}
                onClick={() => {
                  setSelectedReagent(reagent)
                  setReagentMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{reagent.name}</div>
                <div className="text-xs text-gray-500">{reagent.formula}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
        >
          <RotateCcw size={14} />
          Réinitialiser
        </button>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
        >
          <BookOpen size={14} />
          Équation
        </button>
      </div>

      {reactionComplete && (
        <div className="space-y-2">
          <button
            onClick={() => setShowResult(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            <Calculator size={16} />
            Analyser résultats
          </button>
        </div>
      )}
    </div>

    {/* INFORMATIONS DÉTAILLÉES */}
    <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
      <p className="font-medium text-green-800 text-xs mb-1">Test prévu:</p>
      <p className="text-green-700 text-xs">
        {selectedHydrocarbon.type} + {selectedReagent.testType}
      </p>

      <div className="flex items-center gap-2 mt-1">
        {selectedHydrocarbon.type === "alcyne" && (
          <span className="flex items-center text-xs text-blue-600">
            <CheckCircle size={10} className="mr-1" />
            Triple liaison
          </span>
        )}
        {selectedReagent.sensitivity === "élevée" && (
          <span className="flex items-center text-xs text-red-600">
            <AlertTriangle size={10} className="mr-1" />
            Très réactif
          </span>
        )}
      </div>
    </div>
  </div>
)

const UIResults = ({ hydrocarbonAdded, reagentAdded, reactionComplete, getStatusMessage, getDetailedResult, toggleSectionVisibility, sectionVisibility }: any) => {
  const detailedResult = getDetailedResult()

  return (
    <div className={`absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-72 border border-gray-200 shadow-xl ${sectionVisibility.results ? '' : 'hidden'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-800 font-semibold flex items-center text-sm">
          <Eye className="mr-2 text-indigo-600" size={16} />
          Observations
        </h3>
        <button
          onClick={() => toggleSectionVisibility('results')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Masquer/Afficher les observations"
        >
          <Eye size={14} className="text-gray-500" />
        </button>
      </div>

      <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-800 font-medium">{getStatusMessage()}</p>
      </div>

      {detailedResult && (
        <div className="space-y-2 mb-3">
          <div className="p-2 bg-green-50 rounded border border-green-200">
            <h4 className="font-semibold text-green-800 text-xs mb-1">🧪 Produit:</h4>
            <p className="text-xs text-green-700">{detailedResult.product}</p>
          </div>

          <div className="p-2 bg-purple-50 rounded border border-purple-200">
            <h4 className="font-semibold text-purple-800 text-xs mb-1">👁️ Observation:</h4>
            <p className="text-xs text-purple-700">{detailedResult.observation}</p>
          </div>

          <div className="p-2 bg-orange-50 rounded border border-orange-200">
            <h4 className="font-semibold text-orange-800 text-xs mb-1">📊 Saturation:</h4>
            <p className="text-xs text-orange-700">
              {detailedResult.saturationDegree.toFixed(1)}% (Efficacité: {detailedResult.efficiency.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h4 className="font-semibold text-gray-700 text-xs">État:</h4>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Hydrocarbure", value: hydrocarbonAdded, icon: "⛽" },
            { label: "Réactif", value: reagentAdded, icon: "🧪" },
            { label: "Mélange", value: hydrocarbonAdded && reagentAdded, icon: "🔄" },
            { label: "Test", value: reactionComplete, icon: "✨" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
              <span className="text-gray-600 flex items-center gap-1">
                <span className="text-xs">{icon}</span>
                {label}
              </span>
              <span className={`font-medium text-xs ${value ? "text-green-600" : "text-gray-500"}`}>
                {value ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ResultsModal = ({
  showResult,
  setShowResult,
  currentExperiment,
  getDetailedResult,
  getChemicalEquation,
  experiments,
}: any) => {
  const detailedResult = getDetailedResult()

  if (!showResult || !detailedResult || !currentExperiment) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/98 backdrop-blur-sm rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Award className="mr-2 text-yellow-500" size={24} />
            Rapport d'Analyse - Test des Chaînes Insaturées
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResult(false)}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Données expérimentales */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 className="text-lg font-bold mb-3 text-green-800 flex items-center">
              <BeakerIcon className="mr-2" size={18} />
              Données Expérimentales
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-green-700 text-xs">Hydrocarbure:</div>
                  <div className="text-green-600 font-medium">{currentExperiment.hydrocarbon.name}</div>
                  <div className="text-xs text-green-500">
                    {currentExperiment.hydrocarbon.formula} ({currentExperiment.hydrocarbon.type})
                  </div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-green-700 text-xs">Réactif:</div>
                  <div className="text-green-600 font-medium">{currentExperiment.reagent.name}</div>
                  <div className="text-xs text-green-500">{currentExperiment.reagent.formula}</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Masse molaire:</span>
                    <span className="font-mono text-gray-900">
                      {currentExperiment.hydrocarbon.molarMass.toFixed(2)} g/mol
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Densité:</span>
                    <span className="font-mono text-gray-900">
                      {currentExperiment.hydrocarbon.density.toFixed(3)} g/mL
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Point d'ébullition:</span>
                    <span className="font-mono text-gray-900">
                      {currentExperiment.hydrocarbon.boilingPoint.toFixed(1)} °C
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Type de test:</span>
                    <span className="font-mono text-gray-900">{currentExperiment.reagent.testType}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Temps de réaction:</span>
                    <span className="font-mono text-orange-600 font-bold">
                      {currentExperiment.results.reactionTime.toFixed(1)} s
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Insaturations:</span>
                    <span className="font-mono text-purple-600">
                      {currentExperiment.hydrocarbon.doubleBonds + currentExperiment.hydrocarbon.tripleBonds}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats du test */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold mb-3 text-blue-800 flex items-center">
              <Calculator className="mr-2" size={18} />
              Résultats du Test
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Produit principal:</span>
                    <span className="font-mono text-blue-700 font-bold text-xs">{detailedResult.product}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Degré de saturation:</span>
                    <span className="font-mono text-blue-600">
                      {currentExperiment.results.saturationDegree.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Efficacité:</span>
                    <span className="font-mono text-blue-600">{currentExperiment.results.efficiency.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Mécanisme:</span>
                    <p className="text-gray-600 text-xs mt-1">{detailedResult.mechanism}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Interprétation:</span>
                    <p className="text-gray-600 text-xs mt-1">{detailedResult.interpretation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Évaluation de performance */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <h3 className="text-lg font-bold mb-3 text-purple-800 flex items-center">
              <Award className="mr-2" size={18} />
              Évaluation du Test
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-purple-700">Saturation:</span>
                  <span className="font-bold text-purple-800 text-lg">
                    {currentExperiment.results.saturationDegree.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, currentExperiment.results.saturationDegree)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-purple-700">Efficacité:</span>
                  <span className="font-bold text-purple-800 text-lg">
                    {currentExperiment.results.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, currentExperiment.results.efficiency)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-2 rounded border">
                <div className="font-semibold text-purple-800 mb-1 text-sm">Évaluation:</div>
                <div className="text-purple-700 text-sm">
                  {currentExperiment.results.saturationDegree > 90
                    ? "🏆 Test très positif !"
                    : currentExperiment.results.saturationDegree > 70
                      ? "🥈 Test positif"
                      : currentExperiment.results.saturationDegree > 50
                        ? "🥉 Test modérément positif"
                        : currentExperiment.results.saturationDegree > 0
                          ? "⚠️ Test faiblement positif"
                          : "❌ Test négatif"}
                </div>
              </div>
            </div>
          </div>

          {/* Équation et mécanisme */}
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <h3 className="text-lg font-bold mb-3 text-yellow-800 flex items-center">
              <FileText className="mr-2" size={18} />
              Réaction Chimique
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-yellow-700 mb-2">Équation bilan:</div>
                <div className="bg-yellow-100 p-2 rounded font-mono text-sm text-yellow-800 break-words">
                  {getChemicalEquation()}
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-yellow-700 mb-2">Observations expérimentales:</div>
                <p className="text-yellow-600 text-sm">{currentExperiment.observations}</p>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-yellow-700 mb-2">Type de test:</div>
                <ul className="text-yellow-600 text-sm space-y-1">
                  <li>• Test d'insaturation sur {currentExperiment.hydrocarbon.type}</li>
                  <li>• Utilisation de {currentExperiment.reagent.name}</li>
                  <li>
                    •{" "}
                    {currentExperiment.reagent.testType === "saturation"
                      ? "Addition sur liaison multiple"
                      : "Oxydation de l'insaturation"}
                  </li>
                  <li>• Test {currentExperiment.results.saturationDegree > 0 ? "positif" : "négatif"}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Historique compact */}
        {experiments.length > 1 && (
          <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
              <Info className="mr-2" size={18} />
              Historique ({experiments.length} tests)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {experiments.slice(0, 6).map((exp: ExperimentData, i: number) => (
                <div key={exp.id} className="bg-white p-2 rounded border text-xs">
                  <div className="font-semibold text-gray-700 mb-1">#{experiments.length - i}</div>
                  <div className="text-gray-600 space-y-1">
                    <div className="font-mono">
                      {exp.hydrocarbon.formula} + {exp.reagent.name}
                    </div>
                    <div>Saturation: {exp.results.saturationDegree.toFixed(1)}%</div>
                    <div>Produit: {exp.results.product.split(" ")[0]}</div>
                    <div className="text-gray-500">{exp.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Rapport généré le {new Date().toLocaleString()} • Laboratoire de Chimie Organique Virtuel
          </p>
        </div>
      </div>
    </div>
  )
}

const QuizModal = ({ 
  showQuiz, 
  setShowQuiz, 
  currentQuestionIndex, 
  selectedAnswer, 
  showExplanation, 
  quizCompleted, 
  correctAnswers,
  handleQuizAnswer, 
  nextQuestion, 
  resetQuiz 
}: any) => {
  if (!showQuiz) return null

  const questions = [
    {
      id: 'q1',
      question: "Que signifie la décoloration de l'eau de brome lors du test ?",
      options: [
        { id: 'saturation', text: 'Le composé est saturé' },
        { id: 'insaturation', text: 'Le composé contient des insaturations' },
        { id: 'acidite', text: 'Le composé est acide' },
        { id: 'basicite', text: 'Le composé est basique' }
      ],
      correct: 'insaturation',
      explanation: "La décoloration de l'eau de brome indique la présence d'insaturations (doubles ou triples liaisons) car le brome s'additionne sur ces liaisons, consommant ainsi le réactif coloré."
    },
    {
      id: 'q2',
      question: "Quel type de mécanisme se produit entre un alcène et le dibrome ?",
      options: [
        { id: 'substitution', text: 'Substitution radicalaire' },
        { id: 'addition', text: 'Addition électrophile' },
        { id: 'elimination', text: 'Élimination' },
        { id: 'oxydation', text: 'Oxydation-réduction' }
      ],
      correct: 'addition',
      explanation: "L'addition électrophile est le mécanisme principal : le dibrome, électrophile, attaque la double liaison riche en électrons de l'alcène pour former un produit d'addition."
    }
  ]

  const currentQuestion = questions[currentQuestionIndex]

  if (quizCompleted) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md">
          <div className="text-center">
            <Award className="mx-auto mb-4 text-yellow-500" size={48} />
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz Terminé !</h2>
            <div className="mb-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {correctAnswers}/2
              </div>
              <div className="text-gray-600">
                {correctAnswers === 2 ? "🏆 Parfait ! Vous maîtrisez les tests d'insaturation !" :
                 correctAnswers === 1 ? "👍 Bien ! Continuez à étudier les mécanismes !" :
                 "📚 Révisez les tests de caractérisation des insaturations !"}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetQuiz}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Recommencer
              </button>
              <button
                onClick={() => setShowQuiz(false)}
                className="flex-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors px-4 py-2"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Award className="mr-2 text-blue-500" size={24} />
            Quiz - Question {currentQuestionIndex + 1}/2
          </h2>
          <button
            onClick={() => setShowQuiz(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => !showExplanation && handleQuizAnswer(option.id)}
                disabled={showExplanation}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  showExplanation
                    ? option.id === currentQuestion.correct
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : option.id === selectedAnswer && option.id !== currentQuestion.correct
                      ? 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                    : selectedAnswer === option.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {showExplanation && option.id === currentQuestion.correct && (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                  {showExplanation && option.id === selectedAnswer && option.id !== currentQuestion.correct && (
                    <AlertTriangle className="text-red-600" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {showExplanation && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              {selectedAnswer === currentQuestion.correct ? "✅ Correct !" : "❌ Incorrect"}
            </h4>
            <p className="text-blue-700 text-sm">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {showExplanation && (
          <div className="flex justify-end">
            <button
              onClick={nextQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {currentQuestionIndex < 1 ? 'Question suivante' : 'Voir les résultats'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===================================
// COMPOSANT PRINCIPAL
// ===================================

export default function ChainesInsaturees3D() {
  const {
    selectedHydrocarbon,
    selectedReagent,
    hydrocarbonAdded,
    reagentAdded,
    reactionComplete,
    showFormula,
    showResult,
    pouringLeft,
    pouringRight,
    hydrocarbonMenu,
    reagentMenu,
    experiments,
    currentExperiment,
    setSelectedHydrocarbon,
    setSelectedReagent,
    setShowFormula,
    setHydrocarbonMenu,
    setReagentMenu,
    pourHydrocarbon,
    pourReagent,
    handleReset,
    getStatusMessage,
    getChemicalEquation,
    getDetailedResult,
    setShowResult,
    showQuiz,
    setShowQuiz,
    currentQuestionIndex,
    selectedAnswer,
    showExplanation,
    quizCompleted,
    correctAnswers,
    sectionVisibility,
    toggleSectionVisibility,
    handleQuizAnswer,
    nextQuestion,
    resetQuiz,
  } = useUnsaturatedLabSimulation()

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 relative overflow-hidden">
      <Canvas
        camera={{ position: [4, 4, 8], fov: 50, near: 0.1, far: 100 }}
        shadows={{ enabled: true }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <LabScene
            selectedHydrocarbon={selectedHydrocarbon}
            selectedReagent={selectedReagent}
            hydrocarbonAdded={hydrocarbonAdded}
            reagentAdded={reagentAdded}
            reactionComplete={reactionComplete}
            pouringLeft={pouringLeft}
            pouringRight={pouringRight}
            onPourHydrocarbon={pourHydrocarbon}
            onPourReagent={pourReagent}
          />
        </Suspense>
      </Canvas>

      <FloatingToggleButtons 
        sectionVisibility={sectionVisibility}
        toggleSectionVisibility={toggleSectionVisibility}
        showFormula={showFormula}
      />

      <UIControls
        selectedHydrocarbon={selectedHydrocarbon}
        selectedReagent={selectedReagent}
        hydrocarbonMenu={hydrocarbonMenu}
        reagentMenu={reagentMenu}
        setSelectedHydrocarbon={setSelectedHydrocarbon}
        setSelectedReagent={setSelectedReagent}
        setHydrocarbonMenu={setHydrocarbonMenu}
        setReagentMenu={setReagentMenu}
        handleReset={handleReset}
        setShowFormula={setShowFormula}
        showFormula={showFormula}
        setShowResult={setShowResult}
        reactionComplete={reactionComplete}
        toggleSectionVisibility={toggleSectionVisibility}
        sectionVisibility={sectionVisibility}
      />

      <UIResults
        hydrocarbonAdded={hydrocarbonAdded}
        reagentAdded={reagentAdded}
        reactionComplete={reactionComplete}
        getStatusMessage={getStatusMessage}
        getDetailedResult={getDetailedResult}
        toggleSectionVisibility={toggleSectionVisibility}
        sectionVisibility={sectionVisibility}
      />

      <ResultsModal
        showResult={showResult}
        setShowResult={setShowResult}
        currentExperiment={currentExperiment}
        getDetailedResult={getDetailedResult}
        getChemicalEquation={getChemicalEquation}
        experiments={experiments}
      />

      {showFormula && (
        <div className={`absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-xl ${sectionVisibility.formula ? '' : 'hidden'}`}>
          <h4 className="text-gray-800 font-semibold mb-2 flex items-center">
            <BookOpen className="mr-2 text-indigo-600" size={16} />
            Équation chimique équilibrée:
          </h4>
          <div className="bg-gray-50 p-3 rounded-md font-mono text-sm text-gray-800 border border-gray-200">
            {getChemicalEquation()}
          </div>
        </div>
      )}

      <div className={`absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-sm ${sectionVisibility.guide ? '' : 'hidden'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Info className="mr-2 text-indigo-600" size={14} />
            <span className="font-medium text-gray-700 text-sm">Guide</span>
          </div>
          <button
            onClick={() => toggleSectionVisibility('guide')}
            className="p-1 hover:bg-gray-100 rounded"
            title="Masquer/Afficher le guide"
          >
            <Eye size={14} className="text-gray-500" />
          </button>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            🖱️ <strong>Navigation:</strong> Glissez pour tourner, molette pour zoomer
          </p>
          <p>
            🧪 <strong>Interaction:</strong> Cliquez sur les béchers
          </p>
          <p>
            🟠 <strong>Test au brome:</strong> Décoloration = insaturation
          </p>
          <p>
            📊 <strong>Analyse:</strong> Rapports détaillés des tests
          </p>
        </div>
      </div>

      <QuizModal
        showQuiz={showQuiz}
        setShowQuiz={setShowQuiz}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswer={selectedAnswer}
        showExplanation={showExplanation}
        quizCompleted={quizCompleted}
        correctAnswers={correctAnswers}
        handleQuizAnswer={handleQuizAnswer}
        nextQuestion={nextQuestion}
        resetQuiz={resetQuiz}
      />
    </div>
  )
}