"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text } from "@react-three/drei"
import {
  ChevronDown,
  RotateCcw,
  BookOpen,
  Info,
  BeakerIcon,
  Calculator,
  Award,
  FileText,
  Eye,
  AlertTriangle,
  CheckCircle,
  Play,
  Star,
  Target,
  Lightbulb,
  Timer,
  Trophy,
  Gift,
  Zap,
  Rocket,
  Brain,
} from "lucide-react"
import * as THREE from "three"

// ===================================
// TYPES ET INTERFACES
// ===================================

interface HydrocarbonType {
  id: string
  name: string
  simpleName: string // Nom simplifié pour les élèves
  color: string
  formula: string
  type: "alcène" | "alcyne" | "diène"
  colorHex: string
  molarMass: number
  density: number
  boilingPoint: number
  doubleBonds: number
  tripleBonds: number
  difficulty: 1 | 2 | 3 // Niveau de difficulté
  funFact: string // Fait amusant
}

interface ReagentType {
  id: string
  name: string
  simpleName: string // Nom simplifié
  color: string
  formula: string
  colorHex: string
  testType: "saturation" | "oxydation" | "identification"
  sensitivity: "élevée" | "modérée" | "faible"
  difficulty: 1 | 2 | 3
  explanation: string // Explication simple
}

interface Mission {
  id: string
  title: string
  description: string
  objective: string
  requiredHydrocarbon?: string
  requiredReagent?: string
  points: number
  badge: string
  difficulty: 1 | 2 | 3
  hint: string
}

interface PlayerProgress {
  totalPoints: number
  completedMissions: string[]
  badges: string[]
  level: number
  experimentsCount: number
  perfectTests: number
}

interface GameState {
  currentMission: Mission | null
  showTutorial: boolean
  tutorialStep: number
  showHint: boolean
  showCelebration: boolean
  celebrationMessage: string
  timeLeft: number
  challengeMode: boolean
}

// ===================================
// DONNÉES SIMPLIFIÉES POUR ÉLÈVES
// ===================================

const hydrocarbons: HydrocarbonType[] = [
  {
    id: "ethene",
    name: "Éthène",
    simpleName: "Molécule à double liaison",
    color: "bg-green-50/80",
    formula: "C₂H₄",
    type: "alcène",
    colorHex: "#10b981",
    molarMass: 28.05,
    density: 0.568,
    boilingPoint: -103.8,
    doubleBonds: 1,
    tripleBonds: 0,
    difficulty: 1,
    funFact: "🍅 L'éthène fait mûrir les tomates !",
  },
  {
    id: "propene",
    name: "Propène",
    simpleName: "Molécule plastique",
    color: "bg-green-100/80",
    formula: "C₃H₆",
    type: "alcène",
    colorHex: "#059669",
    molarMass: 42.08,
    density: 0.61,
    boilingPoint: -47.6,
    doubleBonds: 1,
    tripleBonds: 0,
    difficulty: 2,
    funFact: "🛍️ Utilisé pour fabriquer les sacs plastiques",
  },
  {
    id: "butene",
    name: "But-1-ène",
    simpleName: "Molécule carburant",
    color: "bg-green-200/80",
    formula: "C₄H₈",
    type: "alcène",
    colorHex: "#047857",
    molarMass: 56.11,
    density: 0.625,
    boilingPoint: -6.3,
    doubleBonds: 1,
    tripleBonds: 0,
    difficulty: 2,
    funFact: "⛽ Composant des carburants",
  },
  {
    id: "ethyne",
    name: "Éthyne (Acétylène)",
    simpleName: "Molécule soudure",
    color: "bg-blue-100/80",
    formula: "C₂H₂",
    type: "alcyne",
    colorHex: "#3b82f6",
    molarMass: 26.04,
    density: 0.906,
    boilingPoint: -84.0,
    doubleBonds: 0,
    tripleBonds: 1,
    difficulty: 3,
    funFact: "🔥 Flamme à 3000°C pour souder !",
  },
  {
    id: "butadiene",
    name: "Buta-1,3-diène",
    simpleName: "Molécule caoutchouc",
    color: "bg-purple-100/80",
    formula: "C₄H₆",
    type: "diène",
    colorHex: "#8b5cf6",
    molarMass: 54.09,
    density: 0.621,
    boilingPoint: -4.4,
    doubleBonds: 2,
    tripleBonds: 0,
    difficulty: 3,
    funFact: "🚗 Base du caoutchouc des pneus",
  },
]

const reagents: ReagentType[] = [
  {
    id: "bromine",
    name: "Eau de brome",
    simpleName: "Liquide détecteur orange",
    color: "bg-orange-500/90",
    formula: "Br₂ + H₂O",
    colorHex: "#f97316",
    testType: "saturation",
    sensitivity: "élevée",
    difficulty: 1,
    explanation: "Change de couleur quand il trouve une double liaison !",
  },
  {
    id: "permanganate",
    name: "Permanganate KMnO₄",
    simpleName: "Liquide détecteur violet",
    color: "bg-purple-500/90",
    formula: "KMnO₄",
    colorHex: "#a855f7",
    testType: "oxydation",
    sensitivity: "élevée",
    difficulty: 2,
    explanation: "Casse les liaisons doubles et change de couleur",
  },
  {
    id: "iodine",
    name: "Solution d'iode",
    simpleName: "Liquide détecteur jaune",
    color: "bg-yellow-600/90",
    formula: "I₂",
    colorHex: "#d97706",
    testType: "saturation",
    sensitivity: "modérée",
    difficulty: 2,
    explanation: "Réaction plus lente mais visible",
  },
  {
    id: "silver_nitrate",
    name: "Nitrate d'argent",
    simpleName: "Détecteur spécial argent",
    color: "bg-gray-300/90",
    formula: "AgNO₃",
    colorHex: "#9ca3af",
    testType: "identification",
    sensitivity: "élevée",
    difficulty: 3,
    explanation: "Ne fonctionne qu'avec les triples liaisons !",
  },
]

const missions: Mission[] = [
  {
    id: "first_test",
    title: "🧪 Premier Test",
    description: "Découvre comment détecter une double liaison",
    objective: "Utilise l'eau de brome avec l'éthène",
    requiredHydrocarbon: "ethene",
    requiredReagent: "bromine",
    points: 100,
    badge: "🥇 Détective Débutant",
    difficulty: 1,
    hint: "L'eau de brome est orange et va devenir transparente !",
  },
  {
    id: "color_master",
    title: "🌈 Maître des Couleurs",
    description: "Observe 3 changements de couleur différents",
    objective: "Teste 3 réactifs différents",
    points: 200,
    badge: "🎨 Expert Couleurs",
    difficulty: 2,
    hint: "Chaque réactif a sa couleur unique !",
  },
  {
    id: "speed_test",
    title: "⚡ Test Éclair",
    description: "Réalise 5 tests en moins de 2 minutes",
    objective: "Sois rapide et efficace",
    points: 300,
    badge: "🚀 Chimiste Rapide",
    difficulty: 2,
    hint: "Utilise le bouton reset après chaque test !",
  },
  {
    id: "triple_bond",
    title: "🔷 Triple Liaison",
    description: "Découvre la molécule spéciale à triple liaison",
    objective: "Teste l'éthyne avec le nitrate d'argent",
    requiredHydrocarbon: "ethyne",
    requiredReagent: "silver_nitrate",
    points: 400,
    badge: "💎 Expert Triples",
    difficulty: 3,
    hint: "Seul l'éthyne réagit avec le nitrate d'argent !",
  },
  {
    id: "perfect_score",
    title: "🎯 Perfection",
    description: "Obtiens 100% d'efficacité",
    objective: "Réalise un test parfait",
    points: 500,
    badge: "🏆 Perfectionniste",
    difficulty: 3,
    hint: "Certaines combinaisons donnent de meilleurs résultats !",
  },
]

// ===================================
// CALCULS CHIMIQUES SIMPLIFIÉS
// ===================================

class SimpleChemistryCalculator {
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
      return "#fef3c7" // Décoloration pour test positif
    }
    if (selectedReagent.id === "permanganate") {
      return "#a16207" // Brun pour test positif
    }
    if (selectedReagent.id === "iodine") {
      return "#fef3c7" // Décoloration partielle
    }
    if (selectedReagent.id === "silver_nitrate") {
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

  static getSimpleResult(
    selectedHydrocarbon: HydrocarbonType,
    selectedReagent: ReagentType,
  ): {
    result: "positif" | "négatif" | "excellent"
    message: string
    score: number
    efficiency: number
    explanation: string
  } {
    // Combinaisons excellentes
    const excellentCombos = [
      { h: "ethene", r: "bromine" },
      { h: "ethyne", r: "silver_nitrate" },
      { h: "butadiene", r: "permanganate" },
    ]

    const isExcellent = excellentCombos.some(
      combo => combo.h === selectedHydrocarbon.id && combo.r === selectedReagent.id
    )

    // Test négatif (pas de réaction)
    if (selectedReagent.id === "silver_nitrate" && selectedHydrocarbon.id !== "ethyne") {
      return {
        result: "négatif",
        message: "❌ Pas de réaction visible",
        score: 50,
        efficiency: 0,
        explanation: "Le nitrate d'argent ne réagit qu'avec les triples liaisons !"
      }
    }

    // Test excellent
    if (isExcellent) {
      return {
        result: "excellent",
        message: "🌟 Réaction parfaite ! Changement spectaculaire !",
        score: 100,
        efficiency: 98 + Math.random() * 2,
        explanation: "Cette combinaison donne les meilleurs résultats visuels !"
      }
    }

    // Test positif normal
    return {
      result: "positif",
      message: "✅ Test réussi ! Changement de couleur observé",
      score: 75 + Math.random() * 20,
      efficiency: 80 + Math.random() * 15,
      explanation: "La réaction montre la présence d'insaturations"
    }
  }

  static getSimpleEquation(selectedHydrocarbon: HydrocarbonType, selectedReagent: ReagentType): string {
    const simple = {
      ethene: {
        bromine: "Éthène + Brome → Molécule saturée (incolore)",
        permanganate: "Éthène + Permanganate → Produits oxydés (brun)",
        iodine: "Éthène + Iode → Addition lente (décoloration)",
        silver_nitrate: "Pas de réaction (test négatif)",
      },
      ethyne: {
        bromine: "Éthyne + Brome → Addition complète (décoloration)",
        permanganate: "Éthyne + Permanganate → Oxydation totale",
        iodine: "Éthyne + Iode → Réaction difficile",
        silver_nitrate: "Éthyne + Argent → Précipité blanc ✨",
      },
    }

    const key = ["propene", "butene", "butadiene"].includes(selectedHydrocarbon.id) ? "ethene" : selectedHydrocarbon.id
    return simple[key as keyof typeof simple]?.[selectedReagent.id] || 
           `${selectedHydrocarbon.simpleName} + ${selectedReagent.simpleName} → Réaction visible`
  }
}

// ===================================
// COMPOSANTS 3D AMÉLIORÉS
// ===================================

const AnimatedParticles = ({ active }: { active: boolean }) => {
  const particlesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!particlesRef.current || !active) return
    
    particlesRef.current.children.forEach((particle, i) => {
      particle.position.y += 0.02
      particle.position.x += Math.sin(state.clock.elapsedTime * 2 + i) * 0.005
      particle.rotation.z += 0.1
      
      if (particle.position.y > 3) {
        particle.position.y = -1
        particle.position.x = (Math.random() - 0.5) * 2
        particle.position.z = (Math.random() - 0.5) * 2
      }
    })
  })

  if (!active) return null

  return (
    <group ref={particlesRef}>
      {Array.from({ length: 20 }, (_, i) => (
        <Sphere
          key={i}
          args={[0.02 + Math.random() * 0.02]}
          position={[(Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2]}
        >
          <meshStandardMaterial
            color={`hsl(${Math.random() * 360}, 70%, 60%)`}
            emissive={`hsl(${Math.random() * 360}, 50%, 30%)`}
            emissiveIntensity={0.5}
          />
        </Sphere>
      ))}
    </group>
  )
}

// ... existing code ...

const Beaker = ({
  position,
  color,
  fillLevel = 0.7,
  onClick,
  isPouring = false,
  label,
  hydrocarbon,
  reagent,
  isGlowing = false,
}: {
  position: [number, number, number]
  color: string
  fillLevel?: number
  onClick?: () => void
  isPouring?: boolean
  label: string
  hydrocarbon?: HydrocarbonType
  reagent?: ReagentType
  isGlowing?: boolean
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const liquidRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!meshRef.current) return

    // Animation de versement améliorée
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

    // Effet de brillance pour attirer l'attention
    if (isGlowing && meshRef.current) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.02
    }
  })

  const isLeft = position[0] < 0
  const spoutX = isLeft ? 0.5 : -0.5
  const spoutRotationZ = isLeft ? Math.PI / 2 : -Math.PI / 2
  const jetDirection = isLeft ? 1 : -1

  return (
    <group position={position} onClick={onClick && !isPouring ? onClick : undefined}>
      <group ref={meshRef}>
        {/* Halo lumineux si en surbrillance */}
        {isGlowing && (
          <Sphere args={[0.8]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#ffeb3b" transparent opacity={0.1} />
          </Sphere>
        )}
        
        {/* Bécher */}
        <Cylinder args={[0.5, 0.45, 1.5, 22]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial 
            color={isGlowing ? "#e3f2fd" : "#f8fafc"} 
            transparent 
            opacity={0.2} 
            roughness={0.05} 
            metalness={0.1} 
          />
        </Cylinder>
        <Cylinder args={[0.52, 0.5, 0.08, 32]} position={[0, 0.71, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </Cylinder>

        {/* Liquide avec animation */}
        <group ref={liquidRef}>
          <Cylinder args={[0.45, 0.4, fillLevel * 1.4]} position={[0, -0.75 + fillLevel * 0.7, 0]}>
            <meshStandardMaterial 
              color={color} 
              transparent 
              opacity={0.9} 
              roughness={0.1}
              emissive={isGlowing ? color : "#000000"}
              emissiveIntensity={isGlowing ? 0.2 : 0}
            />
          </Cylinder>
          <Cylinder args={[0.45, 0.45, 0.02]} position={[0, -0.05 + fillLevel * 0.7, 0]}>
            <meshStandardMaterial color={color} transparent opacity={0.95} roughness={0.0} metalness={0.1} />
          </Cylinder>
        </group>

        {/* Bec verseur */}
        <Cylinder args={[0.08, 0.12, 0.3, 16]} position={[spoutX, 0.5, 0]} rotation={[0, 0, spoutRotationZ]}>
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.3} roughness={0.1} />
        </Cylinder>

        {/* Jet amélioré */}
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
            <meshStandardMaterial 
              color={color} 
              transparent 
              opacity={0.85} 
              emissive={color} 
              emissiveIntensity={0.25} 
            />
          </mesh>
        )}
      </group>

      {/* ÉTIQUETTES SIMPLIFIÉES */}
      <group position={[0, 1.8, 0]}>
        <Text position={[0, 0.2, 0]} fontSize={0.12} color="#374151" anchorX="center" anchorY="middle">
          {hydrocarbon?.simpleName || reagent?.simpleName || label}
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.08} color="#6b7280" anchorX="center" anchorY="middle">
          {hydrocarbon?.formula || reagent?.formula}
        </Text>
        {(hydrocarbon?.funFact || reagent?.explanation) && (
          <Text position={[0, -0.15, 0]} fontSize={0.06} color="#9ca3af" anchorX="center" anchorY="middle">
            {hydrocarbon?.funFact || reagent?.explanation}
          </Text>
        )}
        {(hydrocarbon?.difficulty === 3 || reagent?.difficulty === 3) && (
          <Sphere args={[0.04]} position={[0.25, 0.1, 0]}>
            <meshBasicMaterial color="#dc2626" />
          </Sphere>
        )}
      </group>
    </group>
  )
}

const TestTube = ({
  solutionColor,
  fillLevel = 0,
  showReaction = false,
}: {
  position: [number, number, number]
  solutionColor: string
  fillLevel: number
  showReaction?: boolean
}) => {
  const tubeRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (tubeRef.current && showReaction) {
      tubeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.05
    }
  })

  return (
    <group position={[0, 0.8, 0]} ref={tubeRef}>
      {/* Tube à essai avec effet de réaction */}
      <group>
        <Cylinder args={[0.25, 0.2, 3.5, 32]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial 
            color="#f8fafc" 
            transparent 
            opacity={0.15} 
            roughness={0.02} 
            metalness={0.1}
            emissive={showReaction ? "#ffffff" : "#000000"}
            emissiveIntensity={showReaction ? 0.1 : 0}
          />
        </Cylinder>
        <Sphere args={[0.2, 16, 16]} position={[0, -1.75, 0]}>
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.15} roughness={0.02} metalness={0.1} />
        </Sphere>

        {fillLevel > 0 && (
          <group>
            <Cylinder args={[0.22, 0.18, fillLevel * 3.2]} position={[0, -1.75 + fillLevel * 1.6, 0]}>
              <meshStandardMaterial 
                color={solutionColor} 
                transparent 
                opacity={0.9} 
                roughness={0.2} 
                metalness={0.0}
                emissive={showReaction ? solutionColor : "#000000"}
                emissiveIntensity={showReaction ? 0.3 : 0}
              />
            </Cylinder>
            <Cylinder args={[0.22, 0.22, 0.02]} position={[0, -1.75 + fillLevel * 3.2, 0]}>
              <meshStandardMaterial color={solutionColor} transparent opacity={0.95} roughness={0.0} metalness={0.1} />
            </Cylinder>
          </group>
        )}

        {/* Particules de réaction */}
        <AnimatedParticles active={showReaction} />
      </group>

      {/* ÉTIQUETTE SIMPLIFIÉE */}
      <group position={[0, 2.5, 0]}>
        <Text position={[0, 0.1, 0]} fontSize={0.1} color="#374151" anchorX="center" anchorY="middle">
          Zone de réaction
        </Text>
        <Text position={[0, -0.1, 0]} fontSize={0.07} color="#6b7280" anchorX="center" anchorY="middle">
          {fillLevel > 0 ? "🧪 Mélange en cours" : "⭕ Vide"}
        </Text>
      </group>
    </group>
  )
}

// ... existing code ...

// ===================================
// HOOK PRINCIPAL SIMPLIFIÉ AVEC GAMIFICATION
// ===================================

const useImprovedLabSimulation = () => {
  const [selectedHydrocarbon, setSelectedHydrocarbon] = useState(hydrocarbons[0])
  const [selectedReagent, setSelectedReagent] = useState(reagents[0])
  const [hydrocarbonAdded, setHydrocarbonAdded] = useState(false)
  const [reagentAdded, setReagentAdded] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [pouringLeft, setPouringLeft] = useState(false)
  const [pouringRight, setPouringRight] = useState(false)
  const [hydrocarbonMenu, setHydrocarbonMenu] = useState(false)
  const [reagentMenu, setReagentMenu] = useState(false)
  
  // États de gamification
  const [progress, setProgress] = useState<PlayerProgress>({
    totalPoints: 0,
    completedMissions: [],
    badges: [],
    level: 1,
    experimentsCount: 0,
    perfectTests: 0,
  })
  
  const [gameState, setGameState] = useState<GameState>({
    currentMission: missions[0],
    showTutorial: true,
    tutorialStep: 0,
    showHint: false,
    showCelebration: false,
    celebrationMessage: "",
    timeLeft: 0,
    challengeMode: false,
  })

  const [lastResult, setLastResult] = useState<any>(null)

  // Réaction automatique simplifiée
  useEffect(() => {
    if (hydrocarbonAdded && reagentAdded && !reactionComplete && !pouringLeft && !pouringRight) {
      const timer = setTimeout(() => {
        setReactionComplete(true)
        const result = SimpleChemistryCalculator.getSimpleResult(selectedHydrocarbon, selectedReagent)
        setLastResult(result)
        
        // Mise à jour des points et progression
        setProgress(prev => ({
          ...prev,
          experimentsCount: prev.experimentsCount + 1,
          totalPoints: prev.totalPoints + result.score,
          perfectTests: result.efficiency > 95 ? prev.perfectTests + 1 : prev.perfectTests,
          level: Math.floor((prev.totalPoints + result.score) / 500) + 1,
        }))
        
        // Vérification des missions
        checkMissionCompletion(result)
        
      }, 1500) // Réaction plus rapide

      return () => clearTimeout(timer)
    }
  }, [hydrocarbonAdded, reagentAdded, reactionComplete, pouringLeft, pouringRight, selectedHydrocarbon, selectedReagent])

  const checkMissionCompletion = (result: any) => {
    if (!gameState.currentMission) return
    
    const mission = gameState.currentMission
    let completed = false
    
    // Vérification selon le type de mission
    if (mission.requiredHydrocarbon && mission.requiredReagent) {
      completed = selectedHydrocarbon.id === mission.requiredHydrocarbon && 
                 selectedReagent.id === mission.requiredReagent
    } else if (mission.id === "perfect_score") {
      completed = result.efficiency > 95
    } else if (mission.id === "color_master") {
      completed = progress.experimentsCount >= 2 // Simplifié
    }
    
    if (completed && !progress.completedMissions.includes(mission.id)) {
      setProgress(prev => ({
        ...prev,
        completedMissions: [...prev.completedMissions, mission.id],
        badges: [...prev.badges, mission.badge],
        totalPoints: prev.totalPoints + mission.points,
      }))
      
      setGameState(prev => ({
        ...prev,
        showCelebration: true,
        celebrationMessage: `🎉 Mission accomplie ! ${mission.badge}`,
        currentMission: missions.find(m => !progress.completedMissions.includes(m.id)) || null,
      }))
      
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showCelebration: false }))
      }, 3000)
    }
  }

  const pourHydrocarbon = useCallback(() => {
    if (hydrocarbonAdded || pouringLeft || reactionComplete) return
    setPouringLeft(true)
    setTimeout(() => {
      setHydrocarbonAdded(true)
      setPouringLeft(false)
    }, 1000) // Plus rapide
  }, [hydrocarbonAdded, pouringLeft, reactionComplete])

  const pourReagent = useCallback(() => {
    if (reagentAdded || pouringRight || reactionComplete) return
    setPouringRight(true)
    setTimeout(() => {
      setReagentAdded(true)
      setPouringRight(false)
    }, 1000) // Plus rapide
  }, [reagentAdded, pouringRight, reactionComplete])

  const handleReset = useCallback(() => {
    setReactionComplete(false)
    setHydrocarbonAdded(false)
    setReagentAdded(false)
    setPouringLeft(false)
    setPouringRight(false)
    setLastResult(null)
    setHydrocarbonMenu(false)
    setReagentMenu(false)
  }, [])

  const getStatusMessage = useCallback(() => {
    if (pouringLeft || pouringRight) return "⏳ Versement en cours..."
    if (!hydrocarbonAdded && !reagentAdded)
      return "🧪 Clique sur les béchers lumineux pour commencer !"
    if (hydrocarbonAdded && !reagentAdded) return "✅ Molécule ajoutée ! Ajoute maintenant le détecteur"
    if (!hydrocarbonAdded && reagentAdded) return "✅ Détecteur ajouté ! Ajoute maintenant la molécule"
    if (hydrocarbonAdded && reagentAdded && !reactionComplete)
      return "⏳ Réaction en cours... Regarde bien !"
    if (reactionComplete && lastResult) return lastResult.message
    return ""
  }, [hydrocarbonAdded, reagentAdded, reactionComplete, pouringLeft, pouringRight, lastResult])

  const nextTutorialStep = () => {
    setGameState(prev => ({ ...prev, tutorialStep: prev.tutorialStep + 1 }))
  }

  const skipTutorial = () => {
    setGameState(prev => ({ ...prev, showTutorial: false }))
  }

  const showHint = () => {
    setGameState(prev => ({ ...prev, showHint: true }))
    setTimeout(() => {
      setGameState(prev => ({ ...prev, showHint: false }))
    }, 5000)
  }

  return {
    // États existants
    selectedHydrocarbon,
    selectedReagent,
    hydrocarbonAdded,
    reagentAdded,
    reactionComplete,
    pouringLeft,
    pouringRight,
    hydrocarbonMenu,
    reagentMenu,
    lastResult,
    
    // États de gamification
    progress,
    gameState,
    
    // Actions
    setSelectedHydrocarbon,
    setSelectedReagent,
    setHydrocarbonMenu,
    setReagentMenu,
    pourHydrocarbon,
    pourReagent,
    handleReset,
    getStatusMessage,
    nextTutorialStep,
    skipTutorial,
    showHint,
    
    // Utilitaires
    getSimpleEquation: () => SimpleChemistryCalculator.getSimpleEquation(selectedHydrocarbon, selectedReagent),
  }
}

// ===================================
// COMPOSANTS UI GAMIFIÉS
// ===================================

const GameHeader = ({ progress, gameState }: { progress: PlayerProgress; gameState: GameState }) => (
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-xl">
    <div className="flex items-center gap-6">
      {/* Niveau et points */}
      <div className="flex items-center gap-2">
        <Star className="text-yellow-500" size={20} />
        <span className="font-bold text-lg text-gray-800">Niveau {progress.level}</span>
        <span className="text-sm text-gray-600">({progress.totalPoints} pts)</span>
      </div>
      
      {/* Mission actuelle */}
      {gameState.currentMission && (
        <div className="flex items-center gap-2">
          <Target className="text-blue-500" size={18} />
          <span className="text-sm font-medium text-gray-700">{gameState.currentMission.title}</span>
        </div>
      )}
      
      {/* Badges */}
      <div className="flex items-center gap-1">
        <Trophy className="text-purple-500" size={16} />
        <span className="text-sm text-gray-600">{progress.badges.length} badges</span>
      </div>
    </div>
    
    {/* Barre de progression */}
    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
        style={{ width: `${(progress.totalPoints % 500) / 5}%` }}
      />
    </div>
  </div>
)

const TutorialOverlay = ({ gameState, nextTutorialStep, skipTutorial }: any) => {
  if (!gameState.showTutorial) return null
  
  const tutorialSteps = [
    {
      title: "🎉 Bienvenue dans le Labo !",
      content: "Tu vas découvrir comment détecter les liaisons doubles et triples dans les molécules. C'est parti !",
      position: "center"
    },
    {
      title: "🧪 Choisis tes outils",
      content: "À gauche : les molécules à tester\nÀ droite : les détecteurs colorés",
      position: "center"
    },
    {
      title: "✨ Clique pour verser !",
      content: "Clique sur les béchers lumineux pour les verser dans le tube central",
      position: "center"
    },
    {
      title: "🌈 Observe les couleurs !",
      content: "Regarde bien : les changements de couleur révèlent les secrets des molécules !",
      position: "center"
    }
  ]
  
  const currentStep = tutorialSteps[gameState.tutorialStep] || tutorialSteps[0]
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{currentStep.title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{currentStep.content}</p>
        <div className="flex gap-3">
          <button
            onClick={nextTutorialStep}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            {gameState.tutorialStep < tutorialSteps.length - 1 ? "Suivant" : "Commencer !"}
          </button>
          <button
            onClick={skipTutorial}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  )
}

const CelebrationModal = ({ gameState }: { gameState: GameState }) => {
  if (!gameState.showCelebration) return null
  
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl animate-bounce">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Félicitations !</h3>
          <p className="text-gray-600">{gameState.celebrationMessage}</p>
        </div>
      </div>
    </div>
  )
}

const SimpleControls = ({
  selectedHydrocarbon,
  selectedReagent,
  hydrocarbonMenu,
  reagentMenu,
  setSelectedHydrocarbon,
  setSelectedReagent,
  setHydrocarbonMenu,
  setReagentMenu,
  handleReset,
  gameState,
  showHint,
}: any) => (
  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 w-80 border border-gray-200 shadow-xl">
    <h3 className="text-gray-800 font-semibold mb-3 flex items-center">
      <BeakerIcon className="mr-2 text-indigo-600" size={18} />
      Labo des Molécules
    </h3>

    {/* Mission actuelle */}
    {gameState.currentMission && (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Target className="text-blue-600" size={16} />
          <span className="font-bold text-blue-800 text-sm">{gameState.currentMission.title}</span>
        </div>
        <p className="text-blue-700 text-xs mb-2">{gameState.currentMission.objective}</p>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 text-xs">💎 {gameState.currentMission.points} points</span>
          <button
            onClick={showHint}
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
          >
            <Lightbulb size={12} />
            Aide
          </button>
        </div>
      </div>
    )}

    {/* Aide contextuelle */}
    {gameState.showHint && gameState.currentMission && (
      <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 animate-pulse">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="text-yellow-600" size={14} />
          <span className="font-bold text-yellow-800 text-sm">Indice :</span>
        </div>
        <p className="text-yellow-700 text-xs">{gameState.currentMission.hint}</p>
      </div>
    )}

    <div className="space-y-3 mb-4">
      {/* Sélection molécule */}
      <div className="relative">
        <label className="text-xs text-gray-600 mb-1 block font-medium">🧬 Molécule à tester:</label>
        <button
          onClick={() => setHydrocarbonMenu(!hydrocarbonMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">{selectedHydrocarbon.simpleName}</span>
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
                <div className="font-medium">{hydrocarbon.simpleName}</div>
                <div className="text-xs text-gray-500">{hydrocarbon.funFact}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sélection détecteur */}
      <div className="relative">
        <label className="text-xs text-gray-600 mb-1 block font-medium">🌈 Détecteur coloré:</label>
        <button
          onClick={() => setReagentMenu(!reagentMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">{selectedReagent.simpleName}</span>
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
                <div className="font-medium">{reagent.simpleName}</div>
                <div className="text-xs text-gray-500">{reagent.explanation}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    <button
      onClick={handleReset}
      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
    >
      <RotateCcw size={14} />
      Nouveau test
    </button>
  </div>
)

const SimpleResults = ({ 
  hydrocarbonAdded, 
  reagentAdded, 
  reactionComplete, 
  getStatusMessage, 
  lastResult,
  progress 
}: any) => (
  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-72 border border-gray-200 shadow-xl">
    <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
      <Eye className="mr-2 text-indigo-600" size={16} />
      Observations
    </h3>

    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
      <p className="text-xs text-blue-800 font-medium">{getStatusMessage()}</p>
    </div>

    {/* Résultat détaillé */}
    {lastResult && (
      <div className="space-y-2 mb-3">
        <div className={`p-2 rounded border ${
          lastResult.result === 'excellent' ? 'bg-green-50 border-green-200' :
          lastResult.result === 'positif' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <h4 className={`font-semibold text-xs mb-1 ${
            lastResult.result === 'excellent' ? 'text-green-800' :
            lastResult.result === 'positif' ? 'text-yellow-800' :
            'text-red-800'
          }`}>
            {lastResult.result === 'excellent' ? '🌟 Résultat:' :
             lastResult.result === 'positif' ? '✅ Résultat:' :
             '❌ Résultat:'}
          </h4>
          <p className={`text-xs ${
            lastResult.result === 'excellent' ? 'text-green-700' :
            lastResult.result === 'positif' ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            {lastResult.explanation}
          </p>
          <div className="flex justify-between mt-2">
            <span className="text-xs font-bold">🎯 Score: {lastResult.score}</span>
            <span className="text-xs">⚡ {lastResult.efficiency.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    )}

    {/* Statistiques du joueur */}
    <div className="p-2 bg-purple-50 rounded border border-purple-200">
      <h4 className="font-semibold text-purple-800 text-xs mb-1">📊 Tes performances:</h4>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="flex justify-between">
          <span>Tests:</span>
          <span className="font-bold">{progress.experimentsCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Parfaits:</span>
          <span className="font-bold text-green-600">{progress.perfectTests}</span>
        </div>
        <div className="flex justify-between">
          <span>Points:</span>
          <span className="font-bold text-blue-600">{progress.totalPoints}</span>
        </div>
        <div className="flex justify-between">
          <span>Niveau:</span>
          <span className="font-bold text-purple-600">{progress.level}</span>
        </div>
      </div>
    </div>
  </div>
)

// ===================================
// SCÈNE PRINCIPALE AMÉLIORÉE
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
      SimpleChemistryCalculator.getSolutionColor(
        hydrocarbonAdded,
        reagentAdded,
        reactionComplete,
        selectedHydrocarbon,
        selectedReagent,
      ),
    [hydrocarbonAdded, reagentAdded, reactionComplete, selectedHydrocarbon, selectedReagent],
  )

  const fillLevel = useMemo(
    () => SimpleChemistryCalculator.getFillLevel(hydrocarbonAdded, reagentAdded),
    [hydrocarbonAdded, reagentAdded],
  )

  return (
    <>
      <color attach="background" args={["#f0f8ff"]} />
      {/* Éclairage amélioré */}
      <ambientLight intensity={0.7} color="#f8fafc" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 5, 0]} intensity={1} color="#ffffff" distance={15} decay={2} />
      
      {/* Table de laboratoire simplifiée */}
      <Box args={[6, 0.2, 3]} position={[0, -1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.1} />
      </Box>
      
      {/* Béchers avec effets lumineux */}
      <Beaker
        position={[-1.5, -0.15, 0]}
        color={selectedHydrocarbon.colorHex}
        fillLevel={hydrocarbonAdded ? 0.4 : 0.7}
        onClick={onPourHydrocarbon}
        isPouring={pouringLeft}
        label={selectedHydrocarbon.simpleName}
        hydrocarbon={selectedHydrocarbon}
        isGlowing={!hydrocarbonAdded && !pouringLeft}
      />
      <Beaker
        position={[1.5, -0.15, 0]}
        color={selectedReagent.colorHex}
        fillLevel={reagentAdded ? 0.4 : 0.7}
        onClick={onPourReagent}
        isPouring={pouringRight}
        label={selectedReagent.simpleName}
        reagent={selectedReagent}
        isGlowing={!reagentAdded && !pouringRight && hydrocarbonAdded}
      />
      
      {/* Tube à essai avec réaction visuelle */}
      <TestTube
        position={[0, 0, 0]}
        solutionColor={solutionColor}
        fillLevel={fillLevel}
        showReaction={reactionComplete}
      />
      
      {/* Contrôles de caméra simplifiés */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 8}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.3}
        zoomSpeed={0.6}
        target={[0, -0.5, 0]}
      />
    </>
  )
}

// ===================================
// COMPOSANT PRINCIPAL SIMPLIFIÉ
// ===================================

export default function ChainesInsaturees3D() {
  const {
    selectedHydrocarbon,
    selectedReagent,
    hydrocarbonAdded,
    reagentAdded,
    reactionComplete,
    pouringLeft,
    pouringRight,
    hydrocarbonMenu,
    reagentMenu,
    lastResult,
    progress,
    gameState,
    setSelectedHydrocarbon,
    setSelectedReagent,
    setHydrocarbonMenu,
    setReagentMenu,
    pourHydrocarbon,
    pourReagent,
    handleReset,
    getStatusMessage,
    nextTutorialStep,
    skipTutorial,
    showHint,
    getSimpleEquation,
  } = useImprovedLabSimulation()

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* En-tête de jeu */}
      <GameHeader progress={progress} gameState={gameState} />
      
      {/* Scène 3D */}
      <Canvas
        camera={{ position: [3, 3, 6], fov: 60, near: 0.1, far: 100 }}
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

      {/* Interface utilisateur simplifiée */}
      <SimpleControls
        selectedHydrocarbon={selectedHydrocarbon}
        selectedReagent={selectedReagent}
        hydrocarbonMenu={hydrocarbonMenu}
        reagentMenu={reagentMenu}
        setSelectedHydrocarbon={setSelectedHydrocarbon}
        setSelectedReagent={setSelectedReagent}
        setHydrocarbonMenu={setHydrocarbonMenu}
        setReagentMenu={setReagentMenu}
        handleReset={handleReset}
        gameState={gameState}
        showHint={showHint}
      />

      <SimpleResults
        hydrocarbonAdded={hydrocarbonAdded}
        reagentAdded={reagentAdded}
        reactionComplete={reactionComplete}
        getStatusMessage={getStatusMessage}
        lastResult={lastResult}
        progress={progress}
      />

      {/* Équation chimique simplifiée */}
      {reactionComplete && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-xl">
          <h4 className="text-gray-800 font-semibold mb-2 flex items-center">
            <BookOpen className="mr-2 text-indigo-600" size={16} />
            Ce qui se passe:
          </h4>
          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 border border-gray-200">
            {getSimpleEquation()}
          </div>
        </div>
      )}

      {/* Guide simplifié */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-sm">
        <div className="flex items-center mb-2">
          <Rocket className="mr-2 text-indigo-600" size={14} />
          <span className="font-medium text-gray-700 text-sm">Guide Express</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>🖱️ <strong>Navigation:</strong> Glisse et zoome librement</p>
          <p>✨ <strong>Test:</strong> Clique sur les béchers qui brillent</p>
          <p>🎯 <strong>Mission:</strong> Suis les objectifs en haut</p>
          <p>🏆 <strong>Score:</strong> Gagne des points et des badges !</p>
        </div>
      </div>

      {/* Overlays de gamification */}
      <TutorialOverlay 
        gameState={gameState} 
        nextTutorialStep={nextTutorialStep} 
        skipTutorial={skipTutorial} 
      />
      <CelebrationModal gameState={gameState} />
    </div>
  )
}