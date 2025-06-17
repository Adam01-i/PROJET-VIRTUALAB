"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text } from "@react-three/drei"
import {
  Flame,
  ChevronDown,
  RotateCcw,
  BookOpen,
  Info,
  BeakerIcon,
  Pause,
  Calculator,
  Award,
  FileText,
  Eye,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import * as THREE from "three"

// ===================================
// TYPES ET INTERFACES
// ===================================

interface AlcoholType {
  id: string
  name: string
  color: string
  formula: string
  type: string
  colorHex: string
  molarMass: number
  density: number
  boilingPoint: number
}

interface OxidantType {
  id: string
  name: string
  color: string
  formula: string
  colorHex: string
  strength: "fort" | "modéré" | "faible"
  hazardLevel: "low" | "medium" | "high"
}

interface ExperimentData {
  id: string
  timestamp: Date
  alcohol: AlcoholType
  oxidant: OxidantType
  results: {
    reactionTime: number
    colorChange: string
    product: string
    yield: number
    efficiency: number
  }
  observations: string
}

// ===================================
// DONNÉES DE LABORATOIRE
// ===================================

const alcohols: AlcoholType[] = [
  {
    id: "ethanol",
    name: "Éthanol",
    color: "bg-blue-50/80",
    formula: "CH₃CH₂OH",
    type: "primaire",
    colorHex: "#3b82f6",
    molarMass: 46.07,
    density: 0.789,
    boilingPoint: 78.4,
  },
  {
    id: "methanol",
    name: "Méthanol",
    color: "bg-blue-100/80",
    formula: "CH₃OH",
    type: "primaire",
    colorHex: "#2563eb",
    molarMass: 32.04,
    density: 0.792,
    boilingPoint: 64.7,
  },
  {
    id: "propanol",
    name: "Propanol",
    color: "bg-blue-200/80",
    formula: "CH₃CH₂CH₂OH",
    type: "primaire",
    colorHex: "#1d4ed8",
    molarMass: 60.1,
    density: 0.804,
    boilingPoint: 97.2,
  },
  {
    id: "isopropanol",
    name: "Isopropanol",
    color: "bg-blue-300/80",
    formula: "(CH₃)₂CHOH",
    type: "secondaire",
    colorHex: "#1e40af",
    molarMass: 60.1,
    density: 0.786,
    boilingPoint: 82.6,
  },
  {
    id: "butanol",
    name: "Butanol",
    color: "bg-blue-400/80",
    formula: "CH₃(CH₂)₃OH",
    type: "primaire",
    colorHex: "#1e3a8a",
    molarMass: 74.12,
    density: 0.81,
    boilingPoint: 117.7,
  },
]

const oxidants: OxidantType[] = [
  {
    id: "dichromate",
    name: "Dichromate K₂Cr₂O₇",
    color: "bg-orange-500/90",
    formula: "K₂Cr₂O₇ + H₂SO₄",
    colorHex: "#f97316",
    strength: "fort",
    hazardLevel: "high",
  },
  {
    id: "permanganate",
    name: "Permanganate KMnO₄",
    color: "bg-purple-500/90",
    formula: "KMnO₄",
    colorHex: "#a855f7",
    strength: "fort",
    hazardLevel: "high",
  },
  {
    id: "fehling",
    name: "Liqueur de Fehling",
    color: "bg-blue-500/90",
    formula: "Cu²⁺ + tartrate",
    colorHex: "#3b82f6",
    strength: "modéré",
    hazardLevel: "medium",
  },
  {
    id: "tollens",
    name: "Réactif de Tollens",
    color: "bg-gray-300/90",
    formula: "Ag(NH₃)₂⁺",
    colorHex: "#9ca3af",
    strength: "faible",
    hazardLevel: "low",
  },
]

// ===================================
// UTILITAIRES CHIMIQUES OPTIMISÉS
// ===================================

class ChemistryCalculator {
  static getSolutionColor(
    alcoholAdded: boolean,
    oxidantAdded: boolean,
    heating: boolean,
    reactionComplete: boolean,
    selectedAlcohol: AlcoholType,
    selectedOxidant: OxidantType,
  ): string {
    if (!alcoholAdded && !oxidantAdded) return "#ffffff"
    if (alcoholAdded && !oxidantAdded) return selectedAlcohol.colorHex
    if (alcoholAdded && oxidantAdded && !reactionComplete) {
      return heating ? this.getTransitionColor(selectedOxidant) : selectedOxidant.colorHex
    }
    if (reactionComplete) return this.getResultColor(selectedAlcohol, selectedOxidant)
    return "#ffffff"
  }

  static getTransitionColor(selectedOxidant: OxidantType): string {
    const transitions: Record<string, string> = {
      dichromate: "#16a34a",
      permanganate: "#f9a8d4",
      fehling: "#ef4444",
      tollens: "#4b5563",
    }
    return transitions[selectedOxidant.id] || selectedOxidant.colorHex
  }

  static getResultColor(selectedAlcohol: AlcoholType, selectedOxidant: OxidantType): string {
    if (selectedOxidant.id === "dichromate") return "#16a34a"
    if (selectedOxidant.id === "permanganate") return "#f9a8d4"
    if (selectedOxidant.id === "fehling") {
      return selectedAlcohol.type === "primaire" ? "#ef4444" : "#3b82f6"
    }
    if (selectedOxidant.id === "tollens") {
      return selectedAlcohol.type === "primaire" ? "#1f2937" : "#9ca3af"
    }
    return "#6b7280"
  }

  static getFillLevel(alcoholAdded: boolean, oxidantAdded: boolean): number {
    let level = 0
    if (alcoholAdded) level += 0.3
    if (oxidantAdded) level += 0.2
    return Math.min(level, 0.8)
  }

  static getChemicalEquation(selectedAlcohol: AlcoholType, selectedOxidant: OxidantType): string {
    const equations: Record<string, Record<string, string>> = {
      ethanol: {
        dichromate: "CH₃CH₂OH + Cr₂O₇²⁻ + 8H⁺ → CH₃CHO + 2Cr³⁺ + 7H₂O",
        permanganate: "5CH₃CH₂OH + 4MnO₄⁻ + 12H⁺ → 5CH₃CHO + 4Mn²⁺ + 11H₂O",
        fehling: "CH₃CH₂OH + 2Cu²⁺ + 5OH⁻ → CH₃CHO + Cu₂O + 3H₂O",
        tollens: "CH₃CH₂OH + 2Ag(NH₃)₂⁺ + 3OH⁻ → CH₃CHO + 2Ag + 4NH₃ + 2H₂O",
      },
      methanol: {
        dichromate: "CH₃OH + Cr₂O₇²⁻ + 8H⁺ → HCHO + 2Cr³⁺ + 7H₂O",
        permanganate: "5CH₃OH + 4MnO₄⁻ + 12H⁺ → 5HCHO + 4Mn²⁺ + 11H₂O",
        fehling: "CH₃OH + 2Cu²⁺ + 5OH⁻ → HCHO + Cu₂O + 3H₂O",
        tollens: "CH₃OH + 2Ag(NH₃)₂⁺ + 3OH⁻ → HCHO + 2Ag + 4NH₃ + 2H₂O",
      },
      isopropanol: {
        dichromate: "(CH₃)₂CHOH + Cr₂O₇²⁻ + 8H⁺ → (CH₃)₂CO + 2Cr³⁺ + 7H₂O",
        permanganate: "5(CH₃)₂CHOH + 2MnO₄⁻ + 6H⁺ → 5(CH₃)₂CO + 2Mn²⁺ + 8H₂O",
        fehling: "(CH₃)₂CHOH + Cu²⁺ → (CH₃)₂CO + Cu⁺ + H⁺",
        tollens: "(CH₃)₂CHOH + Ag⁺ → (CH₃)₂CO + Ag + H⁺",
      },
    }

    return (
      equations[selectedAlcohol.id]?.[selectedOxidant.id] ||
      `${selectedAlcohol.formula} + ${selectedOxidant.formula} → produits oxydés`
    )
  }

  static getDetailedResult(
    selectedAlcohol: AlcoholType,
    selectedOxidant: OxidantType,
  ): {
    product: string
    mechanism: string
    observation: string
    interpretation: string
    yield: number
    efficiency: number
  } {
    const results: Record<string, Record<string, any>> = {
      ethanol: {
        dichromate: {
          product: "Acétaldéhyde (CH₃CHO) puis acide acétique (CH₃COOH)",
          mechanism: "Oxydation en deux étapes : alcool → aldéhyde → acide carboxylique",
          observation: "Changement de couleur orange → vert, dégagement de chaleur",
          interpretation: "Le dichromate (Cr⁶⁺) orange est réduit en Cr³⁺ vert",
          yield: 85 + Math.random() * 10,
          efficiency: 88 + Math.random() * 8,
        },
        permanganate: {
          product: "Acétaldéhyde (CH₃CHO) puis acide acétique (CH₃COOH)",
          mechanism: "Oxydation par transfert d'électrons via MnO₄⁻",
          observation: "Décoloration du permanganate violet → incolore/rose pâle",
          interpretation: "MnO₄⁻ (Mn⁷⁺) est réduit en Mn²⁺ incolore",
          yield: 82 + Math.random() * 12,
          efficiency: 85 + Math.random() * 10,
        },
        fehling: {
          product: "Acétaldéhyde (CH₃CHO) + précipité rouge Cu₂O",
          mechanism: "Test spécifique aux alcools primaires",
          observation: "Formation d'un précipité rouge brique",
          interpretation: "Cu²⁺ bleu est réduit en Cu₂O rouge, confirmant l'alcool primaire",
          yield: 78 + Math.random() * 15,
          efficiency: 80 + Math.random() * 12,
        },
        tollens: {
          product: "Acétaldéhyde (CH₃CHO) + miroir d'argent",
          mechanism: "Réduction des ions Ag⁺ en argent métallique",
          observation: "Formation d'un miroir d'argent sur les parois",
          interpretation: "Test positif confirmant la présence d'un alcool primaire",
          yield: 75 + Math.random() * 18,
          efficiency: 77 + Math.random() * 15,
        },
      },
      isopropanol: {
        dichromate: {
          product: "Acétone (CH₃COCH₃)",
          mechanism: "Oxydation de l'alcool secondaire en cétone",
          observation: "Changement de couleur orange → vert",
          interpretation: "L'alcool secondaire s'oxyde uniquement en cétone (pas d'acide)",
          yield: 90 + Math.random() * 8,
          efficiency: 92 + Math.random() * 6,
        },
        permanganate: {
          product: "Acétone (CH₃COCH₃)",
          mechanism: "Oxydation ménagée de l'alcool secondaire",
          observation: "Décoloration du permanganate",
          interpretation: "Formation d'une cétone, réaction moins vigoureuse qu'avec un alcool primaire",
          yield: 87 + Math.random() * 10,
          efficiency: 89 + Math.random() * 8,
        },
        fehling: {
          product: "Pas de réaction",
          mechanism: "Les alcools secondaires ne réagissent pas avec Fehling",
          observation: "Pas de changement, solution reste bleue",
          interpretation: "Test négatif confirmant que ce n'est pas un alcool primaire",
          yield: 0,
          efficiency: 0,
        },
        tollens: {
          product: "Pas de réaction",
          mechanism: "Les alcools secondaires ne réduisent pas Ag⁺",
          observation: "Pas de formation de miroir d'argent",
          interpretation: "Test négatif, distingue les alcools secondaires des primaires",
          yield: 0,
          efficiency: 0,
        },
      },
    }

    const alcoholKey =
      selectedAlcohol.id === "methanol" || selectedAlcohol.id === "propanol" || selectedAlcohol.id === "butanol"
        ? "ethanol"
        : selectedAlcohol.id

    return (
      results[alcoholKey]?.[selectedOxidant.id] || {
        product: "Produit d'oxydation",
        mechanism: "Mécanisme d'oxydation standard",
        observation: "Changement de couleur observé",
        interpretation: "Réaction d'oxydation réussie",
        yield: 70 + Math.random() * 20,
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
      <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.1} />
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

const Beaker = ({
  position,
  color,
  fillLevel = 0.7,
  onClick,
  isPouring = false,
  label,
  alcohol,
  oxidant,
}: {
  position: [number, number, number]
  color: string
  fillLevel?: number
  onClick?: () => void
  isPouring?: boolean
  label: string
  alcohol?: AlcoholType
  oxidant?: OxidantType
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

        {/* Jet plus courbé et dans le bon sens */}
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

      {/* ÉTIQUETTES FIXES AMÉLIORÉES */}
      <group position={[0, 1.8, 0]}>
        <Text position={[0, 0.2, 0]} fontSize={0.12} color="#374151" anchorX="center" anchorY="middle">
          {label}
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.08} color="#6b7280" anchorX="center" anchorY="middle">
          {alcohol?.formula || oxidant?.formula}
        </Text>
        <Text position={[0, -0.15, 0]} fontSize={0.06} color="#9ca3af" anchorX="center" anchorY="middle">
          {alcohol
            ? `${alcohol.density} g/mL • ${alcohol.boilingPoint}°C`
            : oxidant
              ? `Force: ${oxidant.strength}`
              : ""}
        </Text>
        {(alcohol?.type === "primaire" || oxidant?.hazardLevel === "high") && (
          <Sphere args={[0.04]} position={[0.25, 0.1, 0]}>
            <meshBasicMaterial color={alcohol?.type === "primaire" ? "#10b981" : "#dc2626"} />
          </Sphere>
        )}
      </group>
    </group>
  )
}

const TestTube = ({
  position,
  solutionColor,
  fillLevel = 0,
  isHeating = false,
  showBubbles = false,
}: {
  position: [number, number, number]
  solutionColor: string
  fillLevel: number
  isHeating?: boolean
  showBubbles?: boolean
}) => {
  const bubblesRef = useRef<THREE.Group>(null)
  const tubeRef = useRef<THREE.Group>(null)

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

    if (tubeRef.current && isHeating) {
      tubeRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 8) * 0.005
      tubeRef.current.position.z = position[2] + Math.cos(state.clock.elapsedTime * 6) * 0.005
    }
  })

  return (
    <group position={position}>
      <group position={[0, -0.9, 0]}>
        <Box args={[0.8, 0.1, 0.4]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
        </Box>
        <Cylinder args={[0.02, 0.02, 1.8]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial color="#4b5563" roughness={0.3} metalness={0.8} />
        </Cylinder>
        <Cylinder args={[0.015, 0.015, 0.6]} position={[0.3, 1.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <meshStandardMaterial color="#4b5563" roughness={0.3} metalness={0.8} />
        </Cylinder>
        <group position={[0.6, 1.7, 0]}>
          <Cylinder args={[0.3, 0.3, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.02, 0.02, 0.1]} position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.8} />
          </Cylinder>
        </group>
      </group>

      <group ref={tubeRef} position={[0, 1.4, 0]}>
        <Cylinder args={[0.25, 0.2, 3.5, 32]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.15} roughness={0.02} metalness={0.1} />
        </Cylinder>
        <Sphere args={[0.2, 16, 16]} position={[0, -1.75, 0]}>
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

      {/* ÉTIQUETTE FIXE POUR LE TUBE À ESSAI */}
      <group position={[0, 3.2, 0]}>
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

const BunsenBurner = ({
  position,
  isHeating = false,
  onClick,
}: {
  position: [number, number, number]
  isHeating: boolean
  onClick?: () => void
}) => {
  const flameRef = useRef<THREE.Group>(null)
  const innerFlameRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (flameRef.current && isHeating) {
      const time = state.clock.elapsedTime
      flameRef.current.scale.setScalar(1 + Math.sin(time * 6) * 0.15 + Math.sin(time * 4) * 0.1)
      flameRef.current.rotation.z = Math.sin(time * 3) * 0.1

      if (innerFlameRef.current) {
        innerFlameRef.current.scale.setScalar(1 + Math.sin(time * 8) * 0.2)
      }
    }
  })

  return (
    <group position={position} onClick={onClick}>
      <Cylinder args={[0.3, 0.3, 0.2]} position={[0, -0.8, 0]} castShadow>
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.32, 0.32, 0.04]} position={[0, -0.75, 0]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.9} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.9]} position={[0, -0.35, 0]} castShadow>
        <meshStandardMaterial color="#4b5563" roughness={0.2} metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.05]} position={[0, -0.55, 0]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.9} />
      </Cylinder>

      {Array.from({ length: 4 }, (_, i) => (
        <Box
          key={i}
          args={[0.015, 0.04, 0.12]}
          position={[Math.cos((i * Math.PI) / 2) * 0.07, -0.55, Math.sin((i * Math.PI) / 2) * 0.07]}
        >
          <meshStandardMaterial color="#1f2937" />
        </Box>
      ))}

      <Cylinder args={[0.04, 0.06, 0.08]} position={[0, 0.12, 0]} castShadow>
        <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.7} />
      </Cylinder>

      {isHeating && (
        <group ref={flameRef} position={[0, 0.3, 0]}>
          <Cylinder args={[0.1, 0.04, 0.6]} position={[0, 0.3, 0]}>
            <meshStandardMaterial
              color="#f97316"
              transparent
              opacity={0.8}
              emissive="#f97316"
              emissiveIntensity={0.6}
            />
          </Cylinder>
          <Cylinder ref={innerFlameRef} args={[0.06, 0.02, 0.45]} position={[0, 0.225, 0]}>
            <meshStandardMaterial
              color="#3b82f6"
              transparent
              opacity={0.7}
              emissive="#3b82f6"
              emissiveIntensity={0.8}
            />
          </Cylinder>
          <Cylinder args={[0.03, 0.01, 0.2]} position={[0, 0.1, 0]}>
            <meshStandardMaterial
              color="#1e40af"
              transparent
              opacity={0.5}
              emissive="#1e40af"
              emissiveIntensity={0.3}
            />
          </Cylinder>
          {Array.from({ length: 4 }, (_, i) => (
            <Sphere
              key={i}
              args={[0.005]}
              position={[(Math.random() - 0.5) * 0.15, 0.6 + Math.random() * 0.3, (Math.random() - 0.5) * 0.15]}
            >
              <meshStandardMaterial
                color="#fbbf24"
                transparent
                opacity={0.6}
                emissive="#fbbf24"
                emissiveIntensity={0.8}
              />
            </Sphere>
          ))}
        </group>
      )}

      <group position={[0.35, -0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Cylinder args={[0.025, 0.025, 0.15]} castShadow>
          <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.8} />
        </Cylinder>
        <Cylinder args={[0.04, 0.04, 0.025]} position={[0.1, 0, 0]} castShadow>
          <meshStandardMaterial color="#4b5563" roughness={0.2} metalness={0.9} />
        </Cylinder>
      </group>

      <Cylinder args={[0.015, 0.015, 0.5]} position={[0.25, -1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </Cylinder>

      {/* ÉTIQUETTE FIXE POUR LE BEC BUNSEN */}
      <group position={[0, -1.5, 0]}>
        <Text position={[0, 0.1, 0]} fontSize={0.1} color="#374151" anchorX="center" anchorY="middle">
          Bec Bunsen
        </Text>
        <Text position={[0, -0.1, 0]} fontSize={0.07} color="#6b7280" anchorX="center" anchorY="middle">
          {isHeating ? "Allumé" : "Éteint"}
        </Text>
      </group>
    </group>
  )
}

const LabLighting = () => (
  <>
    <ambientLight intensity={0.4} color="#e0e7ff" />
    <directionalLight
      position={[10, 10, 5]}
      intensity={1.0}
      color="#ffffff"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
    />
    <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#c7d2fe" />
    <pointLight position={[0, 3, 0]} intensity={0.4} color="#ffffff" distance={8} decay={2} />
    <pointLight position={[-3, 2, 2]} intensity={0.2} color="#a5b4fc" distance={6} decay={2} />
    <pointLight position={[3, 2, 2]} intensity={0.2} color="#a5b4fc" distance={6} decay={2} />
  </>
)

// ===================================
// SCÈNE PRINCIPALE OPTIMISÉE
// ===================================

const LabScene = ({
  selectedAlcohol,
  selectedOxidant,
  alcoholAdded,
  oxidantAdded,
  heating,
  reactionComplete,
  pouringLeft,
  pouringRight,
  onPourAlcohol,
  onPourOxidant,
  onToggleHeating,
}: {
  selectedAlcohol: AlcoholType
  selectedOxidant: OxidantType
  alcoholAdded: boolean
  oxidantAdded: boolean
  heating: boolean
  reactionComplete: boolean
  pouringLeft: boolean
  pouringRight: boolean
  onPourAlcohol: () => void
  onPourOxidant: () => void
  onToggleHeating: () => void
}) => {
  const solutionColor = useMemo(
    () =>
      ChemistryCalculator.getSolutionColor(
        alcoholAdded,
        oxidantAdded,
        heating,
        reactionComplete,
        selectedAlcohol,
        selectedOxidant,
      ),
    [alcoholAdded, oxidantAdded, heating, reactionComplete, selectedAlcohol, selectedOxidant],
  )

  const fillLevel = useMemo(
    () => ChemistryCalculator.getFillLevel(alcoholAdded, oxidantAdded),
    [alcoholAdded, oxidantAdded],
  )

  return (
    <>
      <color attach="background" args={["#312e81"]} />
      <LabLighting />
      <LabTable />
      <Beaker
        position={[-1, -0.15, 0]}
        color={selectedAlcohol.colorHex}
        fillLevel={alcoholAdded ? 0.4 : 0.7}
        onClick={onPourAlcohol}
        isPouring={pouringLeft}
        label={selectedAlcohol.name}
        alcohol={selectedAlcohol}
      />
      <Beaker
        position={[1, -0.15, 0]}
        color={selectedOxidant.colorHex}
        fillLevel={oxidantAdded ? 0.4 : 0.7}
        onClick={onPourOxidant}
        isPouring={pouringRight}
        label={selectedOxidant.name}
        oxidant={selectedOxidant}
      />
      <TestTube
        position={[0, 0, 0]}
        solutionColor={solutionColor}
        fillLevel={fillLevel}
        isHeating={heating}
        showBubbles={heating}
      />
      <BunsenBurner position={[0, -0.9, 0]} isHeating={heating} onClick={onToggleHeating} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ===================================
// HOOK OPTIMISÉ AVEC CHAUFFAGE MANUEL CORRIGÉ
// ===================================

const useLabSimulation = () => {
  const [selectedAlcohol, setSelectedAlcohol] = useState(alcohols[0])
  const [selectedOxidant, setSelectedOxidant] = useState(oxidants[0])
  const [alcoholAdded, setAlcoholAdded] = useState(false)
  const [oxidantAdded, setOxidantAdded] = useState(false)
  const [heating, setHeating] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [pouringLeft, setPouringLeft] = useState(false)
  const [pouringRight, setPouringRight] = useState(false)
  const [alcoholMenu, setAlcoholMenu] = useState(false)
  const [oxidantMenu, setOxidantMenu] = useState(false)
  const [experiments, setExperiments] = useState<ExperimentData[]>([])
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentData | null>(null)

  // Reset automatique optimisé
  useEffect(() => {
    const resetState = () => {
      setAlcoholAdded(false)
      setOxidantAdded(false)
      setHeating(false)
      setReactionComplete(false)
      setShowResult(false)
      setShowFormula(false)
      setPouringLeft(false)
      setPouringRight(false)
      setCurrentExperiment(null)
    }
    resetState()
  }, [selectedAlcohol.id, selectedOxidant.id])

  // DÉMARRAGE AUTOMATIQUE DE LA RÉACTION APRÈS LE DEUXIÈME VERSEMENT
  useEffect(() => {
    if (alcoholAdded && oxidantAdded && !heating && !reactionComplete && !pouringLeft && !pouringRight) {
      // Démarrage automatique après 1 seconde
      const timer = setTimeout(() => {
        if (alcoholAdded && oxidantAdded && !heating && !reactionComplete) {
          setHeating(true)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [alcoholAdded, oxidantAdded, heating, reactionComplete, pouringLeft, pouringRight])

  // Gestion automatique de la réaction optimisée
  useEffect(() => {
    if (!heating || !alcoholAdded || !oxidantAdded) return

    const timer = setTimeout(() => {
      setHeating(false)
      setShowFormula(true)

      // Créer l'expérience
      const detailedResult = ChemistryCalculator.getDetailedResult(selectedAlcohol, selectedOxidant)
      const experiment: ExperimentData = {
        id: Date.now().toString(),
        timestamp: new Date(),
        alcohol: selectedAlcohol,
        oxidant: selectedOxidant,
        results: {
          reactionTime: 4.0,
          colorChange: `${selectedOxidant.colorHex} → ${ChemistryCalculator.getResultColor(selectedAlcohol, selectedOxidant)}`,
          product: detailedResult.product,
          yield: detailedResult.yield,
          efficiency: detailedResult.efficiency,
        },
        observations: detailedResult.observation,
      }

      setCurrentExperiment(experiment)
      setExperiments((prev) => [experiment, ...prev.slice(0, 9)])

      setTimeout(() => {
        setReactionComplete(true)
      }, 1000)
    }, 4000)

    return () => clearTimeout(timer)
  }, [heating, alcoholAdded, oxidantAdded, selectedAlcohol, selectedOxidant])

  const pourAlcohol = useCallback(() => {
    if (alcoholAdded || pouringLeft || heating || reactionComplete) return
    setPouringLeft(true)
    setTimeout(() => {
      setAlcoholAdded(true)
      setPouringLeft(false)
    }, 1500)
  }, [alcoholAdded, pouringLeft, heating, reactionComplete])

  const pourOxidant = useCallback(() => {
    if (oxidantAdded || pouringRight || heating || reactionComplete) return
    setPouringRight(true)
    setTimeout(() => {
      setOxidantAdded(true)
      setPouringRight(false)
    }, 1500)
  }, [oxidantAdded, pouringRight, heating, reactionComplete])

  const handleReset = useCallback(() => {
    // Arrêter tous les timers en cours
    setHeating(false)
    setReactionComplete(false)
    setShowFormula(false)
    setShowResult(false)
    setAlcoholAdded(false)
    setOxidantAdded(false)
    setPouringLeft(false)
    setPouringRight(false)
    setCurrentExperiment(null)

    // Fermer les menus ouverts
    setAlcoholMenu(false)
    setOxidantMenu(false)
  }, [])

  // CORRECTION DU CHAUFFAGE MANUEL
  const toggleHeating = useCallback(() => {
    // Permettre le chauffage manuel seulement si les deux solutions sont ajoutées
    if (alcoholAdded && oxidantAdded && !reactionComplete && !pouringLeft && !pouringRight) {
      if (!heating) {
        // Démarrer le chauffage manuel
        setHeating(true)
      } else {
        // Arrêter le chauffage manuel
        setHeating(false)
      }
    }
  }, [alcoholAdded, oxidantAdded, heating, reactionComplete, pouringLeft, pouringRight])

  const getStatusMessage = useCallback(() => {
    if (pouringLeft || pouringRight) return "⏳ Versement en cours... Patientez."
    if (!alcoholAdded && !oxidantAdded)
      return "🧪 Cliquez sur les béchers pour verser les solutions dans le tube à essai."
    if (alcoholAdded && !oxidantAdded) return "✅ Alcool ajouté. Ajoutez maintenant l'oxydant."
    if (!alcoholAdded && oxidantAdded) return "✅ Oxydant ajouté. Ajoutez maintenant l'alcool."
    if (alcoholAdded && oxidantAdded && !heating && !reactionComplete)
      return "⏳ Solutions mélangées. Démarrage automatique du chauffage dans 1 seconde..."
    if (heating) return "🔥 Chauffage en cours... Observez les changements de couleur."
    if (reactionComplete) return "📊 Réaction terminée! Cliquez sur 'Analyser résultats' pour voir l'analyse détaillée."
    return ""
  }, [alcoholAdded, oxidantAdded, heating, reactionComplete, pouringLeft, pouringRight])

  const getChemicalEquation = useCallback(
    () => ChemistryCalculator.getChemicalEquation(selectedAlcohol, selectedOxidant),
    [selectedAlcohol, selectedOxidant],
  )

  const getDetailedResult = useCallback(
    () => (reactionComplete ? ChemistryCalculator.getDetailedResult(selectedAlcohol, selectedOxidant) : null),
    [reactionComplete, selectedAlcohol, selectedOxidant],
  )

  const exportResults = useCallback(() => {
    if (!currentExperiment) return

    const data = {
      experiment: currentExperiment,
      detailedResults: getDetailedResult(),
      chemicalEquation: getChemicalEquation(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `oxydation_${currentExperiment.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentExperiment, getDetailedResult, getChemicalEquation])

  return {
    selectedAlcohol,
    selectedOxidant,
    alcoholAdded,
    oxidantAdded,
    heating,
    reactionComplete,
    showFormula,
    showResult,
    pouringLeft,
    pouringRight,
    alcoholMenu,
    oxidantMenu,
    experiments,
    currentExperiment,
    setSelectedAlcohol,
    setSelectedOxidant,
    setShowFormula,
    setAlcoholMenu,
    setOxidantMenu,
    pourAlcohol,
    pourOxidant,
    handleReset,
    toggleHeating,
    getStatusMessage,
    getChemicalEquation,
    getDetailedResult,
    exportResults,
    setShowResult,
  }
}

// ===================================
// COMPOSANTS UI OPTIMISÉS
// ===================================

const UIControls = ({
  selectedAlcohol,
  selectedOxidant,
  alcoholMenu,
  oxidantMenu,
  alcoholAdded,
  oxidantAdded,
  heating,
  setSelectedAlcohol,
  setSelectedOxidant,
  setAlcoholMenu,
  setOxidantMenu,
  toggleHeating,
  handleReset,
  setShowFormula,
  showFormula,
  setShowResult,
  reactionComplete,
}: any) => (
  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 w-80 border border-gray-200 shadow-xl">
    <h3 className="text-gray-800 font-semibold mb-3 flex items-center">
      <BeakerIcon className="mr-2 text-indigo-600" size={18} />
      Contrôles de l'Expérience
    </h3>

    <div className="space-y-3 mb-4">
      <div className="relative">
        <label className="text-xs text-gray-600 mb-1 block font-medium">Alcool sélectionné:</label>
        <button
          onClick={() => setAlcoholMenu(!alcoholMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">{selectedAlcohol.name}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {alcoholMenu && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-40 overflow-y-auto">
            {alcohols.map((alcohol) => (
              <button
                key={alcohol.id}
                onClick={() => {
                  setSelectedAlcohol(alcohol)
                  setAlcoholMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{alcohol.name}</div>
                <div className="text-xs text-gray-500">
                  ({alcohol.type}) - {alcohol.formula}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <label className="text-xs text-gray-600 mb-1 block font-medium">Oxydant sélectionné:</label>
        <button
          onClick={() => setOxidantMenu(!oxidantMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">{selectedOxidant.name}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {oxidantMenu && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-40 overflow-y-auto">
            {oxidants.map((oxidant) => (
              <button
                key={oxidant.id}
                onClick={() => {
                  setSelectedOxidant(oxidant)
                  setOxidantMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{oxidant.name}</div>
                <div className="text-xs text-gray-500">{oxidant.formula}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <button
        onClick={toggleHeating}
        disabled={!(alcoholAdded && oxidantAdded)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          alcoholAdded && oxidantAdded
            ? heating
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {heating ? <Pause size={16} /> : <Flame size={16} />}
        {heating ? "Arrêter le chauffage" : "Chauffage manuel"}
      </button>

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
        <button
          onClick={() => setShowResult(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors mt-2"
        >
          <Calculator size={16} />
          Analyser résultats
        </button>
      )}
    </div>

    {/* INFORMATIONS DÉTAILLÉES ET COMPACTES */}
    <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded border border-indigo-200">
      <p className="font-medium text-indigo-800 text-xs mb-1">Réaction prévue:</p>
      <p className="text-indigo-700 text-xs">
        {selectedAlcohol.type} + {selectedOxidant.strength}
      </p>

      <div className="flex items-center gap-2 mt-1">
        {selectedAlcohol.type === "primaire" && (
          <span className="flex items-center text-xs text-green-600">
            <CheckCircle size={10} className="mr-1" />
            Primaire
          </span>
        )}
        {selectedOxidant.hazardLevel === "high" && (
          <span className="flex items-center text-xs text-red-600">
            <AlertTriangle size={10} className="mr-1" />
            Danger
          </span>
        )}
      </div>
    </div>
  </div>
)

const UIResults = ({
  alcoholAdded,
  oxidantAdded,
  heating,
  reactionComplete,
  getStatusMessage,
  getDetailedResult,
}: any) => {
  const detailedResult = getDetailedResult()

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-72 border border-gray-200 shadow-xl">
      <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
        <Eye className="mr-2 text-indigo-600" size={16} />
        Observations
      </h3>

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
            <h4 className="font-semibold text-orange-800 text-xs mb-1">📊 Rendement:</h4>
            <p className="text-xs text-orange-700">
              {detailedResult.yield.toFixed(1)}% (Efficacité: {detailedResult.efficiency.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h4 className="font-semibold text-gray-700 text-xs">État:</h4>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Alcool", value: alcoholAdded, icon: "🍶" },
            { label: "Oxydant", value: oxidantAdded, icon: "⚗️" },
            { label: "Chauffage", value: heating, special: "heating", icon: "🔥" },
            { label: "Réaction", value: reactionComplete, special: "reaction", icon: "✨" },
          ].map(({ label, value, special, icon }) => (
            <div key={label} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
              <span className="text-gray-600 flex items-center gap-1">
                <span className="text-xs">{icon}</span>
                {label}
              </span>
              <span
                className={`font-medium text-xs ${
                  special === "heating"
                    ? value
                      ? "text-orange-600"
                      : "text-gray-500"
                    : special === "reaction"
                      ? value
                        ? "text-green-600"
                        : "text-gray-500"
                      : value
                        ? "text-green-600"
                        : "text-gray-500"
                }`}
              >
                {value ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// RAPPORT D'ANALYSE ADAPTÉ POUR L'OXYDATION
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
            Rapport d'Analyse - Oxydation des Alcools
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
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold mb-3 text-blue-800 flex items-center">
              <BeakerIcon className="mr-2" size={18} />
              Données Expérimentales
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-blue-700 text-xs">Alcool:</div>
                  <div className="text-blue-600 font-medium">{currentExperiment.alcohol.name}</div>
                  <div className="text-xs text-blue-500">
                    {currentExperiment.alcohol.formula} ({currentExperiment.alcohol.type})
                  </div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-blue-700 text-xs">Oxydant:</div>
                  <div className="text-blue-600 font-medium">{currentExperiment.oxidant.name}</div>
                  <div className="text-xs text-blue-500">{currentExperiment.oxidant.formula}</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Masse molaire:</span>
                    <span className="font-mono text-gray-900">
                      {currentExperiment.alcohol.molarMass.toFixed(2)} g/mol
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Densité:</span>
                    <span className="font-mono text-gray-900">{currentExperiment.alcohol.density.toFixed(3)} g/mL</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Point d'ébullition:</span>
                    <span className="font-mono text-gray-900">
                      {currentExperiment.alcohol.boilingPoint.toFixed(1)} °C
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Force oxydant:</span>
                    <span className="font-mono text-gray-900">{currentExperiment.oxidant.strength}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Temps de réaction:</span>
                    <span className="font-mono text-orange-600 font-bold">
                      {currentExperiment.results.reactionTime.toFixed(1)} s
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Changement couleur:</span>
                    <span className="font-mono text-purple-600">Observé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats de la réaction */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 className="text-lg font-bold mb-3 text-green-800 flex items-center">
              <Calculator className="mr-2" size={18} />
              Résultats de la Réaction
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Produit principal:</span>
                    <span className="font-mono text-green-700 font-bold text-xs">{detailedResult.product}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Rendement:</span>
                    <span className="font-mono text-green-600">{currentExperiment.results.yield.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Efficacité:</span>
                    <span className="font-mono text-green-600">{currentExperiment.results.efficiency.toFixed(1)}%</span>
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
              Évaluation
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-purple-700">Rendement:</span>
                  <span className="font-bold text-purple-800 text-lg">
                    {currentExperiment.results.yield.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, currentExperiment.results.yield)}%` }}
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
                  {currentExperiment.results.yield > 90
                    ? "🏆 Excellent rendement !"
                    : currentExperiment.results.yield > 80
                      ? "🥈 Bon rendement"
                      : currentExperiment.results.yield > 70
                        ? "🥉 Rendement correct"
                        : currentExperiment.results.yield > 0
                          ? "⚠️ Rendement faible"
                          : "❌ Pas de réaction"}
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
                <div className="font-semibold text-yellow-700 mb-2">Type de réaction:</div>
                <ul className="text-yellow-600 text-sm space-y-1">
                  <li>• Oxydation de l'alcool {currentExperiment.alcohol.type}</li>
                  <li>• Utilisation d'un oxydant {currentExperiment.oxidant.strength}</li>
                  <li>• Formation de {currentExperiment.alcohol.type === "primaire" ? "aldéhyde/acide" : "cétone"}</li>
                  <li>• Réaction {currentExperiment.results.yield > 0 ? "positive" : "négative"}</li>
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
              Historique ({experiments.length} expériences)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {experiments.slice(0, 6).map((exp: ExperimentData, i: number) => (
                <div key={exp.id} className="bg-white p-2 rounded border text-xs">
                  <div className="font-semibold text-gray-700 mb-1">#{experiments.length - i}</div>
                  <div className="text-gray-600 space-y-1">
                    <div className="font-mono">
                      {exp.alcohol.formula} + {exp.oxidant.name}
                    </div>
                    <div>Rendement: {exp.results.yield.toFixed(1)}%</div>
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
            Rapport généré le {new Date().toLocaleString()} • Laboratoire d'Oxydation Virtuel
          </p>
        </div>
      </div>
    </div>
  )
}

// ===================================
// COMPOSANT PRINCIPAL OPTIMISÉ
// ===================================

export default function ComposesOxygenes3D() {
  const {
    selectedAlcohol,
    selectedOxidant,
    alcoholAdded,
    oxidantAdded,
    heating,
    reactionComplete,
    showFormula,
    showResult,
    pouringLeft,
    pouringRight,
    alcoholMenu,
    oxidantMenu,
    experiments,
    currentExperiment,
    setSelectedAlcohol,
    setSelectedOxidant,
    setShowFormula,
    setAlcoholMenu,
    setOxidantMenu,
    pourAlcohol,
    pourOxidant,
    handleReset,
    toggleHeating,
    getStatusMessage,
    getChemicalEquation,
    getDetailedResult,
    setShowResult,
  } = useLabSimulation()

  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 relative">
      <Canvas
        camera={{ position: [4, 4, 8], fov: 50, near: 0.1, far: 100 }}
        shadows={{ enabled: true }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <LabScene
            selectedAlcohol={selectedAlcohol}
            selectedOxidant={selectedOxidant}
            alcoholAdded={alcoholAdded}
            oxidantAdded={oxidantAdded}
            heating={heating}
            reactionComplete={reactionComplete}
            pouringLeft={pouringLeft}
            pouringRight={pouringRight}
            onPourAlcohol={pourAlcohol}
            onPourOxidant={pourOxidant}
            onToggleHeating={toggleHeating}
          />
        </Suspense>
      </Canvas>

      <UIControls
        selectedAlcohol={selectedAlcohol}
        selectedOxidant={selectedOxidant}
        alcoholMenu={alcoholMenu}
        oxidantMenu={oxidantMenu}
        alcoholAdded={alcoholAdded}
        oxidantAdded={oxidantAdded}
        heating={heating}
        setSelectedAlcohol={setSelectedAlcohol}
        setSelectedOxidant={setSelectedOxidant}
        setAlcoholMenu={setAlcoholMenu}
        setOxidantMenu={setOxidantMenu}
        toggleHeating={toggleHeating}
        handleReset={handleReset}
        setShowFormula={setShowFormula}
        showFormula={showFormula}
        setShowResult={setShowResult}
        reactionComplete={reactionComplete}
      />

      <UIResults
        showResult={showResult}
        alcoholAdded={alcoholAdded}
        oxidantAdded={oxidantAdded}
        heating={heating}
        reactionComplete={reactionComplete}
        getStatusMessage={getStatusMessage}
        getDetailedResult={getDetailedResult}
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
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-xl">
          <h4 className="text-gray-800 font-semibold mb-2 flex items-center">
            <BookOpen className="mr-2 text-indigo-600" size={16} />
            Équation chimique équilibrée:
          </h4>
          <div className="bg-gray-50 p-3 rounded-md font-mono text-sm text-gray-800 border border-gray-200">
            {getChemicalEquation()}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-sm">
        <div className="flex items-center mb-2">
          <Info className="mr-2 text-indigo-600" size={14} />
          <span className="font-medium text-gray-700 text-sm">Guide</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            🖱️ <strong>Navigation:</strong> Glissez pour tourner, molette pour zoomer
          </p>
          <p>
            🧪 <strong>Interaction:</strong> Cliquez sur les béchers
          </p>
          <p>
            🔥 <strong>Chauffage:</strong> Automatique après mélange
          </p>
          <p>
            📊 <strong>Analyse:</strong> Rapports détaillés
          </p>
        </div>
      </div>
    </div>
  )
}
