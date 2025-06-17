"use client"

import * as React from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, ContactShadows, Text, OrbitControls } from "@react-three/drei"
import { useState, useRef, useCallback, useMemo } from "react"
import { useSpring, animated, config } from "@react-spring/three"
import * as THREE from "three"
import {
  RotateCcw,
  Thermometer,
  Timer,
  Zap,
  Settings,
  FlaskConical,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  XCircle,
  Eye,
  Calculator,
  Award,
  Info,
  TrendingUp,
  Camera,
} from "lucide-react"

// Types optimisés
type ExperimentStep = "initial" | "pouring" | "poured" | "inserting" | "reacting" | "complete" | "incomplete"
type ReactantType = "CuSO4" | "AgNO3" | "ZnSO4"
type ReactionType = "complete" | "incomplete" | "none"

interface ExperimentData {
  id: string
  timestamp: Date
  reactant: ReactantType
  reactionType: ReactionType
  results: {
    reactionTime: number
    conversion: number
    massDeposited: number
    efficiency: number
    finalConcentration: number
    temperature: number
    pH: number
  }
  observations: string
}

// Configuration des réactifs optimisée
const REACTANTS = {
  CuSO4: {
    name: "Sulfate de Cuivre",
    formula: "CuSO₄",
    color: "#3b82f6",
    finalColor: "#22c55e",
    incompleteColor: "#f59e0b",
    depositColor: "#b45309",
    equation: "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)",
    incompleteEquation: "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s) (partielle)",
    canReact: true,
    reactionProbability: 0.85,
    molarMass: 159.6,
    density: 1.12,
    explanation: {
      complete:
        "Réaction redox complète : Le fer métallique a complètement réduit les ions Cu²⁺ en cuivre métallique. Le dépôt rouge-brun sur la barre de fer confirme la formation de cuivre pur.",
      incomplete:
        "Réaction redox incomplète : Conditions défavorables (température, concentration, surface de contact). Seule une partie des ions Cu²⁺ ont été réduits.",
      none: "Pas de réaction possible selon la série électrochimique.",
    },
  },
  AgNO3: {
    name: "Nitrate d'Argent",
    formula: "AgNO₃",
    color: "#8b5cf6",
    finalColor: "#f59e0b",
    incompleteColor: "#ef4444",
    depositColor: "#9ca3af",
    equation: "Fe(s) + 2AgNO₃(aq) → Fe(NO₃)₂(aq) + 2Ag(s)",
    incompleteEquation: "Fe(s) + AgNO₃(aq) → Fe(NO₃)₂(aq) + Ag(s) (partielle)",
    canReact: true,
    reactionProbability: 0.75,
    molarMass: 169.9,
    density: 1.18,
    explanation: {
      complete:
        "Réaction redox complète : Le fer a réduit les ions Ag⁺ en argent métallique. Le dépôt gris argenté sur la barre confirme la précipitation d'argent pur.",
      incomplete:
        "Réaction redox incomplète : Formation partielle d'argent métallique. La surface de contact limitée a réduit l'efficacité de la réaction.",
      none: "Pas de réaction possible.",
    },
  },
  ZnSO4: {
    name: "Sulfate de Zinc",
    formula: "ZnSO₄",
    color: "#06b6d4",
    finalColor: "#ef4444",
    incompleteColor: "#06b6d4",
    depositColor: "#71717a",
    equation: "Fe(s) + ZnSO₄(aq) → Pas de réaction",
    incompleteEquation: "Fe(s) + ZnSO₄(aq) → Pas de réaction",
    canReact: false,
    reactionProbability: 0,
    molarMass: 161.4,
    density: 1.06,
    explanation: {
      complete:
        "Aucune réaction observée : Le fer ne peut pas réduire les ions Zn²⁺ car le zinc est plus réactif que le fer dans la série électrochimique.",
      incomplete:
        "Aucune réaction observée : Le fer ne peut pas réduire les ions Zn²⁺ car le zinc est plus réactif que le fer dans la série électrochimique.",
      none: "Aucune réaction observée : Le fer ne peut pas réduire les ions Zn²⁺ car le zinc est plus réactif que le fer dans la série électrochimique.",
    },
  },
} as const

// Configuration optimisée
const EXPERIMENT_CONFIG = {
  REACTION_DURATION: 8000,
  POUR_DURATION: 2000,
  INSERT_DURATION: 1500,
  SOLUTION_VOLUME: 250,
  INITIAL_CONCENTRATION: 0.1,
  INCOMPLETE_THRESHOLD: 0.6,
} as const

// Composant Table 3D
const LabTable = React.memo(() => {
  return (
    <group>
      <mesh position={[0, -2, 0]} receiveShadow>
        <boxGeometry args={[6, 0.2, 3]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.6} metalness={0.1} />
      </mesh>
      {[
        [-2.5, -3, -1],
        [2.5, -3, -1],
        [-2.5, -3, 1],
        [2.5, -3, 1],
      ].map((pos, index) => (
        <mesh key={index} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2, 16]} />
          <meshStandardMaterial color="#3730a3" />
        </mesh>
      ))}
    </group>
  )
})

// Composant Robinet 3D amélioré
function AlignedFaucet3D({
  position,
  isOpen,
  onClick,
  reactantType,
  disabled = false,
}: {
  position: [number, number, number]
  isOpen: boolean
  onClick: () => void
  reactantType: ReactantType
  disabled?: boolean
}) {
  const { rotation } = useSpring({
    rotation: isOpen ? Math.PI / 2 : 0,
    config: config.wobbly,
  })

  const reactant = REACTANTS[reactantType]

  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation()
      if (!disabled) {
        onClick()
      }
    },
    [onClick, disabled],
  )

  return (
    <group position={position}>
      {/* Tige verticale */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Réservoir avec solution colorée */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.55, 16]} />
        <meshStandardMaterial color={reactant.color} transparent opacity={0.8} />
      </mesh>

      {/* Corps du robinet */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bec verseur */}
      <mesh position={[0, -0.15, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.3, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Poignée rotative */}
      <animated.group rotation-y={rotation}>
        <mesh
          position={[0.2, 0.08, 0]}
          onClick={handleClick}
          onPointerOver={() => !disabled && (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "default")}
          castShadow
        >
          <boxGeometry args={[0.25, 0.05, 0.05]} />
          <meshStandardMaterial color={disabled ? "#999999" : "#ef4444"} metalness={0.6} roughness={0.3} />
        </mesh>
      </animated.group>

      {/* Étiquettes */}
      <Text position={[0, 1.6, 0]} fontSize={0.08} color="#374151" anchorX="center" anchorY="middle">
        {reactant.name}
      </Text>
      <Text position={[0, 1.45, 0]} fontSize={0.06} color="#6b7280" anchorX="center" anchorY="middle">
        {reactant.formula}
      </Text>
      <Text position={[0, 1.3, 0]} fontSize={0.05} color="#9ca3af" anchorX="center" anchorY="middle">
        {reactant.molarMass}g/mol • {reactant.density}g/mL
      </Text>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.06}
        color={disabled ? "#999999" : isOpen ? "#10b981" : "#ef4444"}
        anchorX="center"
        anchorY="middle"
      >
        {disabled ? "BLOQUÉ" : isOpen ? "OUVERT" : "FERMÉ"}
      </Text>
    </group>
  )
}

// Composant Bécher 3D amélioré
const ImprovedBeaker3D = React.memo(
  ({
    position,
    solutionLevel,
    solutionColor,
  }: {
    position: [number, number, number]
    solutionLevel: number
    solutionColor: string
  }) => {
    const solutionRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
      if (solutionRef.current && solutionLevel > 0) {
        solutionRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
      }
    })

    return (
      <group position={position}>
        {/* Corps en verre */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1, 0.8, 2, 32]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.85}
            thickness={0.05}
          />
        </mesh>

        {/* Bec verseur */}
        <mesh position={[1.05, 0.8, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} transmission={0.85} />
        </mesh>

        {/* Solution avec animation */}
        {solutionLevel > 0 && (
          <>
            <mesh position={[0, -1 + solutionLevel * 0.9, 0]}>
              <cylinderGeometry args={[0.8 + (1 - 0.8) * solutionLevel, 0.8, solutionLevel * 1.8, 32]} />
              <meshStandardMaterial color={solutionColor} transparent opacity={0.8} />
            </mesh>
            <mesh ref={solutionRef} position={[0, -1 + solutionLevel * 0.9 + (solutionLevel * 1.8) / 2, 0]}>
              <cylinderGeometry args={[0.8 + (1 - 0.8) * solutionLevel, 0.8 + (1 - 0.8) * solutionLevel, 0.02, 32]} />
              <meshStandardMaterial color={solutionColor} transparent opacity={0.9} />
            </mesh>
          </>
        )}

        {/* Graduations */}
        {[0.25, 0.5, 0.75, 1].map((height, index) => (
          <group key={index}>
            <mesh position={[1.1, -1 + height * 1.8, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <Text
              position={[1.3, -1 + height * 1.8, 0]}
              fontSize={0.06}
              color="#374151"
              anchorX="left"
              anchorY="middle"
            >
              {(index + 1) * 50}mL
            </Text>
          </group>
        ))}

        <Text position={[0, -1.3, 1.1]} fontSize={0.08} color="#374151" anchorX="center" anchorY="middle">
          Bécher 250mL
        </Text>
      </group>
    )
  },
)

// Composant Barre de Fer amélioré
function IronBar2D({
  position,
  copperDeposit,
  disabled,
  reactantType,
  reactionType,
  onClick,
  isAnimating,
}: {
  position: [number, number, number]
  copperDeposit: number
  disabled: boolean
  reactantType: ReactantType
  reactionType: ReactionType
  onClick: () => void
  isAnimating: boolean
}) {
  const meshRef = useRef<THREE.Group>(null)
  const reactant = REACTANTS[reactantType]

  const { scale, rotationZ } = useSpring({
    scale: isAnimating ? 1.1 : 1,
    rotationZ: isAnimating ? 0.05 : 0,
    config: config.wobbly,
  })

  const depositColor = useMemo(() => {
    if (reactionType === "incomplete") {
      return THREE.Color.NAMES.orange
    }
    return reactant.depositColor
  }, [reactionType, reactant.depositColor])

  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation()
      if (!disabled && !isAnimating) {
        onClick()
      }
    },
    [onClick, disabled, isAnimating],
  )

  return (
    <animated.group
      ref={meshRef}
      position={position}
      scale={scale}
      rotation-z={rotationZ}
      onClick={handleClick}
      onPointerOver={() => !disabled && !isAnimating && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "default")}
    >
      {/* Barre de fer principale */}
      <mesh>
        <planeGeometry args={[0.08, 1.5]} />
        <meshStandardMaterial color="#4a5568" side={THREE.DoubleSide} />
      </mesh>

      {/* Dépôt métallique */}
      {copperDeposit > 0 && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.1, 1.5 * copperDeposit]} />
          <meshStandardMaterial
            color={depositColor}
            side={THREE.DoubleSide}
            transparent={reactionType === "incomplete"}
            opacity={reactionType === "incomplete" ? 0.7 : 1}
          />
        </mesh>
      )}

      {/* Étiquettes */}
      <Text position={[0, 0.9, 0.01]} fontSize={0.1} color="#374151" anchorX="center" anchorY="middle">
        Barre de Fer
      </Text>
      <Text position={[0, 0.7, 0.01]} fontSize={0.06} color="#6b7280" anchorX="center" anchorY="middle">
        Fe (s) - 55.8 g/mol
      </Text>

      {!disabled && !isAnimating && (
        <Text position={[0, -0.9, 0.01]} fontSize={0.04} color="#6366f1" anchorX="center" anchorY="middle">
          Cliquez pour insérer !
        </Text>
      )}

      {isAnimating && (
        <Text position={[0, -0.9, 0.01]} fontSize={0.04} color="#f59e0b" anchorX="center" anchorY="middle">
          Insertion en cours...
        </Text>
      )}
    </animated.group>
  )
}

// Composant Flux de Liquide 3D
function LiquidStream3D({ active, reactantColor }: { active: boolean; reactantColor: string }) {
  const streamRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (streamRef.current && active) {
      streamRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05
      streamRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1
    }
  })

  if (!active) return null

  return (
    <mesh ref={streamRef} position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.02, 0.04, 1.5, 8]} />
      <meshStandardMaterial color={reactantColor} transparent opacity={0.8} />
    </mesh>
  )
}

// Composant Bulles 3D
function ReactionBubbles3D({ active, position }: { active: boolean; position: [number, number, number] }) {
  const bubblesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (bubblesRef.current && active) {
      bubblesRef.current.children.forEach((bubble, index) => {
        bubble.position.y += 0.008 + Math.sin(state.clock.elapsedTime + index) * 0.003
        bubble.position.x += Math.sin(state.clock.elapsedTime * 2 + index) * 0.002
        if (bubble.position.y > 1.5) {
          bubble.position.y = -0.5
          bubble.position.x = (Math.random() - 0.5) * 1.5
        }
      })
    }
  })

  if (!active) return null

  return (
    <group ref={bubblesRef} position={position}>
      {Array.from({ length: 8 }).map((_, index) => (
        <mesh
          key={index}
          position={[(Math.random() - 0.5) * 1.5, Math.random() * 1 - 0.5, (Math.random() - 0.5) * 0.5]}
        >
          <sphereGeometry args={[0.01 + Math.random() * 0.02, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// Composant Scène principale
function Scene({
  experimentState,
  onFaucetClick,
  onIronClick,
  reactantType,
}: {
  experimentState: any
  onFaucetClick: () => void
  onIronClick: () => void
  reactantType: ReactantType
}) {
  const reactant = REACTANTS[reactantType]

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-3, 3, 2]} intensity={0.6} color="#f0f8ff" />
      <spotLight position={[0, 4, 3]} angle={Math.PI / 4} penumbra={0.3} intensity={1} castShadow />

      <Environment preset="apartment" />

      <LabTable />

      <AlignedFaucet3D
        position={[0, 1.5, 0]}
        isOpen={experimentState.faucetOpen}
        onClick={onFaucetClick}
        reactantType={reactantType}
        disabled={experimentState.currentStep !== "initial"}
      />

      <ImprovedBeaker3D
        position={[0, -0.8, 0]}
        solutionLevel={experimentState.solutionLevel}
        solutionColor={experimentState.solutionColor}
      />

      <IronBar2D
        position={experimentState.ironPosition}
        copperDeposit={experimentState.copperDeposit}
        disabled={experimentState.currentStep === "reacting" || experimentState.currentStep === "inserting"}
        reactantType={reactantType}
        reactionType={experimentState.reactionType}
        onClick={onIronClick}
        isAnimating={experimentState.currentStep === "inserting"}
      />

      <LiquidStream3D active={experimentState.isPouring} reactantColor={reactant.color} />

      <ReactionBubbles3D active={experimentState.currentStep === "reacting"} position={[0, 0, 0]} />

      <ContactShadows position={[0, -2.1, 0]} opacity={0.3} scale={8} blur={1.5} far={4} />
    </>
  )
}

// Composant principal optimisé
export default function RedoxReaction() {
  // États principaux
  const [currentStep, setCurrentStep] = useState<ExperimentStep>("initial")
  const [solutionLevel, setSolutionLevel] = useState(0)
  const [solutionColor, setSolutionColor] = useState("#3b82f6")
  const [ironPosition, setIronPosition] = useState<[number, number, number]>([2.5, 0, 0])
  const [copperDeposit, setCopperDeposit] = useState(0)
  const [reactionProgress, setReactionProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPouring, setIsPouring] = useState(false)
  const [faucetOpen, setFaucetOpen] = useState(false)
  const [reactionType, setReactionType] = useState<ReactionType>("complete")
  const [reactantType, setReactantType] = useState<ReactantType>("CuSO4")
  const [showResult, setShowResult] = useState(false)
  const [experiments, setExperiments] = useState<ExperimentData[]>([])
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentData | null>(null)

  const controlsRef = useRef<any>(null)

  // Réactif sélectionné
  const selectedReactant = REACTANTS[reactantType]

  // Données calculées avec mémoisation
  const calculatedData = useMemo(() => {
    const baseTemp = 22.5
    const tempIncrease = currentStep === "reacting" ? reactionProgress * 3 : reactionProgress * 2
    const currentTemp = baseTemp + tempIncrease + Math.sin(Date.now() * 0.001) * 0.2

    const basePH = 7.0
    const pHChange = selectedReactant.canReact ? reactionProgress * 1.5 : 0
    const currentPH = basePH + pHChange

    const currentConcentration = EXPERIMENT_CONFIG.INITIAL_CONCENTRATION * (1 - reactionProgress * 0.8)
    const currentEfficiency = reactionType === "incomplete" ? reactionProgress * 60 : reactionProgress * 100
    const currentMassDeposited = copperDeposit * 0.635 * (selectedReactant.molarMass / 100)

    return {
      temperature: currentTemp,
      pH: currentPH,
      concentration: currentConcentration,
      efficiency: currentEfficiency,
      massDeposited: currentMassDeposited,
    }
  }, [reactionProgress, reactionType, copperDeposit, selectedReactant, currentStep])

  // Références pour les timers
  const pourTimerRef = useRef<NodeJS.Timeout>()
  const reactionTimerRef = useRef<NodeJS.Timeout>()
  const insertTimerRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(0)

  // Fonction de reset complète et corrigée
  const handleReset = useCallback(() => {
    console.log("🔄 Reset de l'expérience...")

    // Nettoyer TOUS les timers
    if (pourTimerRef.current) {
      clearInterval(pourTimerRef.current)
      pourTimerRef.current = undefined
    }
    if (reactionTimerRef.current) {
      clearInterval(reactionTimerRef.current)
      reactionTimerRef.current = undefined
    }
    if (insertTimerRef.current) {
      clearInterval(insertTimerRef.current)
      insertTimerRef.current = undefined
    }

    // Reset COMPLET de tous les états
    setCurrentStep("initial")
    setSolutionLevel(0)
    setSolutionColor(selectedReactant.color)
    setIronPosition([2.5, 0, 0])
    setCopperDeposit(0)
    setReactionProgress(0)
    setElapsedTime(0)
    setIsPouring(false)
    setFaucetOpen(false)
    setReactionType("complete")
    setCurrentExperiment(null)
    setShowResult(false)
    startTimeRef.current = 0

    console.log("✅ Reset terminé")
  }, [selectedReactant.color])

  // Gestion du robinet
  const handleFaucetClick = useCallback(() => {
    if (currentStep !== "initial") return

    console.log("🚰 Démarrage du versement")
    setFaucetOpen(true)
    setCurrentStep("pouring")
    setIsPouring(true)

    pourTimerRef.current = setInterval(() => {
      setSolutionLevel((prev) => {
        const increment = 0.03
        const newLevel = prev + increment

        if (newLevel >= 1) {
          clearInterval(pourTimerRef.current!)
          pourTimerRef.current = undefined
          setCurrentStep("poured")
          setIsPouring(false)
          setFaucetOpen(false)
          console.log("✅ Versement terminé")
          return 1
        }
        return newLevel
      })
    }, 100)
  }, [currentStep])

  // Gestion du clic sur le fer
  const handleIronClick = useCallback(() => {
    if (currentStep !== "poured" || solutionLevel < 0.5) return

    console.log("🔧 Insertion automatique du fer")
    setCurrentStep("inserting")

    // Animation d'insertion automatique
    let progress = 0
    insertTimerRef.current = setInterval(() => {
      progress += 0.02

      // Position interpolée vers le centre du bécher
      const startPos: [number, number, number] = [2.5, 0, 0]
      const endPos: [number, number, number] = [0, -0.5, 0]

      const newPosition: [number, number, number] = [
        startPos[0] + (endPos[0] - startPos[0]) * progress,
        startPos[1] + (endPos[1] - startPos[1]) * progress,
        startPos[2] + (endPos[2] - startPos[2]) * progress,
      ]

      setIronPosition(newPosition)

      if (progress >= 1) {
        clearInterval(insertTimerRef.current!)
        insertTimerRef.current = undefined
        setIronPosition(endPos)

        // Démarrer la réaction
        if (selectedReactant.canReact) {
          const isIncomplete = Math.random() > selectedReactant.reactionProbability
          const newReactionType: ReactionType = isIncomplete ? "incomplete" : "complete"

          console.log("⚗️ Démarrage de la réaction:", newReactionType)
          setReactionType(newReactionType)
          setCurrentStep("reacting")
          startTimeRef.current = Date.now()
          startReaction(newReactionType)
        } else {
          console.log("❌ Aucune réaction possible")
          setCurrentStep("complete")
          setReactionType("none")
          createExperiment("none")
        }
      }
    }, 30)
  }, [currentStep, solutionLevel, selectedReactant])

  // Démarrer la réaction
  const startReaction = useCallback(
    (reactionTypeParam: ReactionType) => {
      const maxProgress = reactionTypeParam === "incomplete" ? EXPERIMENT_CONFIG.INCOMPLETE_THRESHOLD : 1
      const duration =
        reactionTypeParam === "incomplete"
          ? EXPERIMENT_CONFIG.REACTION_DURATION * 0.7
          : EXPERIMENT_CONFIG.REACTION_DURATION

      reactionTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setElapsedTime(elapsed / 1000)

        const progress = Math.min(elapsed / duration, maxProgress)
        setReactionProgress(progress)

        const factor = progress / maxProgress
        const r = Math.floor(99 + factor * (34 - 99))
        const g = Math.floor(102 + factor * (197 - 102))
        const b = Math.floor(241 + factor * (94 - 241))
        setSolutionColor(`rgb(${r}, ${g}, ${b})`)

        setCopperDeposit(progress)

        if (progress >= maxProgress) {
          clearInterval(reactionTimerRef.current!)
          reactionTimerRef.current = undefined
          const finalStep = reactionTypeParam === "incomplete" ? "incomplete" : "complete"
          setCurrentStep(finalStep)
          setElapsedTime(duration / 1000)
          console.log("✅ Réaction terminée:", finalStep)
          createExperiment(reactionTypeParam)
        }
      }, 50)
    },
    [selectedReactant],
  )

  // Créer une expérience
  const createExperiment = useCallback(
    (finalReactionType: ReactionType) => {
      // Calculer les données finales au moment de la création
      const finalTemperature = 22.5 + reactionProgress * 2 + (Math.random() - 0.5) * 0.5
      const finalPH = 7.0 + reactionProgress * 1.2 + (Math.random() - 0.5) * 0.2
      const finalConcentration = EXPERIMENT_CONFIG.INITIAL_CONCENTRATION * (1 - reactionProgress)
      const finalEfficiency = finalReactionType === "incomplete" ? reactionProgress * 60 : reactionProgress * 100
      const finalMassDeposited = copperDeposit * 0.635 * (selectedReactant.molarMass / 100)

      const experiment: ExperimentData = {
        id: Date.now().toString(),
        timestamp: new Date(),
        reactant: reactantType,
        reactionType: finalReactionType,
        results: {
          reactionTime: elapsedTime,
          conversion: reactionProgress * 100,
          massDeposited: finalMassDeposited,
          efficiency: finalEfficiency,
          finalConcentration: finalConcentration,
          temperature: finalTemperature,
          pH: finalPH,
        },
        observations: selectedReactant.explanation[finalReactionType],
      }

      console.log("📊 Expérience créée:", experiment)
      setCurrentExperiment(experiment)
      setExperiments((prev) => [experiment, ...prev.slice(0, 9)])
    },
    [reactantType, elapsedTime, reactionProgress, copperDeposit, selectedReactant],
  )

  // Changement de réactif avec reset automatique
  const handleReactantChange = useCallback(
    (newReactant: ReactantType) => {
      console.log("🧪 Changement de réactif:", newReactant)
      handleReset()
      setReactantType(newReactant)
      setSolutionColor(REACTANTS[newReactant].color)
    },
    [handleReset],
  )

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [])

  // État de l'expérience pour la scène
  const experimentState = useMemo(
    () => ({
      currentStep,
      solutionLevel,
      solutionColor,
      ironPosition,
      copperDeposit,
      isPouring,
      faucetOpen,
      reactionType,
    }),
    [currentStep, solutionLevel, solutionColor, ironPosition, copperDeposit, isPouring, faucetOpen, reactionType],
  )

  const getStatusMessage = useCallback(() => {
    switch (currentStep) {
      case "initial":
        return "🚰 Cliquez sur la poignée rouge du robinet pour verser la solution"
      case "pouring":
        return "⏳ Versement en cours... Patientez."
      case "poured":
        return "🔧 Solution prête. Cliquez sur la barre de fer pour l'insérer automatiquement"
      case "inserting":
        return "⏳ Insertion automatique de la barre de fer en cours..."
      case "reacting":
        return "⚗️ Réaction redox en cours. Observez les changements de couleur et le dépôt"
      case "complete":
        return "✅ Réaction terminée ! Analysez les résultats obtenus"
      case "incomplete":
        return "⚠️ Réaction incomplète. Conditions expérimentales défavorables"
      default:
        return ""
    }
  }, [currentStep])

  const progressPercent = Math.min((reactionProgress / 1) * 100, 100)

  const getPhaseInfo = () => {
    if (currentStep === "initial" || currentStep === "pouring") {
      return { phase: "Préparation", color: "blue", description: "Mise en place de l'expérience" }
    }
    if (currentStep === "poured" || currentStep === "inserting") {
      return { phase: "Insertion", color: "purple", description: "Introduction de la barre de fer" }
    }
    if (currentStep === "reacting") {
      return { phase: "Réaction", color: "orange", description: "Réaction redox en cours" }
    }
    if (currentStep === "complete") {
      return { phase: "Terminé", color: "green", description: "Réaction complète" }
    }
    if (currentStep === "incomplete") {
      return { phase: "Incomplète", color: "yellow", description: "Réaction partielle" }
    }
    return { phase: "Attente", color: "gray", description: "En attente" }
  }

  const phaseInfo = getPhaseInfo()

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900">
      {/* Configuration de l'Expérience - GAUCHE */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl w-80 border border-gray-200">
        <h2 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Configuration de l'Expérience
        </h2>

        <div className="space-y-3">
          {/* Sélection du réactif */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Réactif en Solution
            </h4>
            <div className="space-y-2">
              <select
                value={reactantType}
                onChange={(e) => handleReactantChange(e.target.value as ReactantType)}
                disabled={currentStep !== "initial"}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="CuSO4">Sulfate de Cuivre (CuSO₄)</option>
                <option value="AgNO3">Nitrate d'Argent (AgNO₃)</option>
                <option value="ZnSO4">Sulfate de Zinc (ZnSO₄)</option>
              </select>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Masse molaire: {selectedReactant.molarMass} g/mol</div>
                <div>• Densité: {selectedReactant.density} g/mL</div>
                <div>• Concentration: {EXPERIMENT_CONFIG.INITIAL_CONCENTRATION} M</div>
                <div>• Volume: {EXPERIMENT_CONFIG.SOLUTION_VOLUME} mL</div>
              </div>
            </div>
          </div>

          {/* Métal réducteur */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              Métal Réducteur
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Fer métallique (Fe)</div>
              <div>• Masse molaire: 55.8 g/mol</div>
              <div>• Densité: 7.87 g/cm³</div>
              <div>• Potentiel standard: -0.44 V</div>
            </div>
          </div>

          {/* Prédiction théorique */}
          <div
            className={`p-3 rounded-lg border ${selectedReactant.canReact ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
              {selectedReactant.canReact ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <XCircle className="w-3 h-3 text-red-600" />
              )}
              Prédiction Théorique
            </h4>
            <div className="text-xs text-gray-600">
              {selectedReactant.canReact
                ? `Réaction possible (probabilité: ${(selectedReactant.reactionProbability * 100).toFixed(0)}%)`
                : "Aucune réaction prévue selon la série électrochimique"}
            </div>
          </div>
        </div>
      </div>

      {/* Observations en Temps Réel - DROITE */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-80 border border-gray-200 shadow-xl">
        <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
          <Eye className="mr-2 text-indigo-600" size={16} />
          Observations en Temps Réel
        </h3>

        <div className="space-y-3">
          {/* État actuel */}
          <div className="p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-gray-800 font-medium">
              {currentStep === "complete" || currentStep === "incomplete" ? (
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-600" />
                  Expérience terminée!
                </span>
              ) : currentStep === "reacting" ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Réaction en cours...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  {getStatusMessage()}
                </span>
              )}
            </div>
          </div>

          {/* Données en temps réel */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-red-50 p-2 rounded border">
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                <Thermometer size={10} />
                Température
              </div>
              <div className="text-lg font-mono text-gray-900">{calculatedData.temperature.toFixed(1)}°C</div>
            </div>
            <div className="bg-blue-50 p-2 rounded border">
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                <Zap size={10} />
                pH
              </div>
              <div className="text-lg font-mono text-gray-900">{calculatedData.pH.toFixed(1)}</div>
            </div>
            <div className="bg-purple-50 p-2 rounded border">
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                <FlaskConical size={10} />
                Volume
              </div>
              <div className="text-sm font-mono text-gray-900">{(solutionLevel * 250).toFixed(0)} mL</div>
            </div>
            <div className="bg-green-50 p-2 rounded border">
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                <Timer size={10} />
                Temps
              </div>
              <div className="text-sm font-mono text-gray-900">{elapsedTime.toFixed(1)}s</div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">Progression de la réaction</span>
              <span className="text-xs font-mono text-gray-800">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Phase actuelle */}
          <div
            className={`p-2 rounded border text-xs ${phaseInfo.phase === "Terminé"
                ? "bg-green-50 border-green-200 text-gray-800"
                : phaseInfo.phase === "Réaction"
                  ? "bg-orange-50 border-orange-200 text-gray-800"
                  : phaseInfo.phase === "Incomplète"
                    ? "bg-yellow-50 border-yellow-200 text-gray-800"
                    : "bg-blue-50 border-blue-200 text-gray-800"
              }`}
          >
            <div className="font-semibold">{phaseInfo.phase}</div>
            <div className="text-gray-600">{phaseInfo.description}</div>
          </div>

          {/* Données de réaction */}
          {reactionProgress > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Conversion</div>
                <div className="font-mono text-gray-900">{(reactionProgress * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Dépôt</div>
                <div className="font-mono text-gray-900">{calculatedData.massDeposited.toFixed(3)}g</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Efficacité</div>
                <div className="font-mono text-gray-900">{(calculatedData.efficiency * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Concentration</div>
                <div className="font-mono text-gray-900">{calculatedData.concentration.toFixed(3)}M</div>
              </div>
            </div>
          )}

          {/* Boutons de contrôle */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={resetCamera}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Caméra
            </button>
          </div>

          {(currentStep === "complete" || currentStep === "incomplete") && (
            <button
              onClick={() => setShowResult(true)}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              Analyser résultats
            </button>
          )}
        </div>
      </div>

      {/* Équation Chimique - BAS GAUCHE */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-xl max-w-md">
        <h4 className="text-gray-800 font-semibold mb-2 flex items-center">
          <BookOpen className="mr-2 text-indigo-600" size={16} />
          Équation Chimique
        </h4>
        <div className="bg-gray-50 p-3 rounded-md font-mono text-sm text-gray-800 border border-gray-200 mb-2">
          {reactionType === "incomplete" ? selectedReactant.incompleteEquation : selectedReactant.equation}
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Type de réaction:</div>
          <div>{selectedReactant.canReact ? "Réaction redox possible" : "Aucune réaction prévue"}</div>
        </div>
      </div>

      {/* Instructions et Guide - BAS DROITE */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-sm">
        <div className="flex items-center mb-2">
          <Info className="mr-2 text-indigo-600" size={14} />
          <span className="font-medium text-gray-700 text-sm">Guide d'Utilisation</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <strong>🖱️ Navigation:</strong> Glissez pour tourner, molette pour zoomer
          </p>
          <p>
            <strong>🧪 Étapes:</strong> 1) Robinet → 2) Barre de fer → 3) Observer
          </p>
          <p>
            <strong>📊 Analyse:</strong> Bouton "Analyser résultats" après réaction
          </p>
          <p>
            <strong>🔄 Reset:</strong> Recommencer une nouvelle expérience
          </p>
        </div>
        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-blue-800 font-medium">{getStatusMessage()}</div>
        </div>
      </div>

      {/* Rapport d'Analyse Détaillé */}
      {showResult && currentExperiment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white/98 backdrop-blur-sm rounded-2xl p-6 max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Award className="mr-2 text-yellow-500" size={24} />
                Rapport d'Analyse - Réaction Redox
              </h2>
              <button
                onClick={() => setShowResult(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Section 1: Données expérimentales */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                  <FlaskConical className="mr-2" size={18} />
                  Données Expérimentales
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold text-gray-700 text-sm">Réactif:</div>
                      <div className="text-gray-800 font-medium">{selectedReactant.name}</div>
                      <div className="text-xs text-gray-600">{selectedReactant.formula}</div>
                      <div className="text-xs text-gray-500">
                        {selectedReactant.molarMass}g/mol • {selectedReactant.density}g/mL
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold text-gray-700 text-sm">Métal:</div>
                      <div className="text-gray-800 font-medium">Fer métallique</div>
                      <div className="text-xs text-gray-600">Fe (s)</div>
                      <div className="text-xs text-gray-500">55.8g/mol • E° = -0.44V</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 text-sm mb-2">Conditions initiales:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Volume de solution: {EXPERIMENT_CONFIG.SOLUTION_VOLUME} mL</div>
                      <div>• Concentration: {EXPERIMENT_CONFIG.INITIAL_CONCENTRATION} M</div>
                      <div>• Température initiale: 22.5°C</div>
                      <div>• pH initial: 7.0</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 text-sm mb-2">Conditions finales:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Température finale: {currentExperiment.results.temperature.toFixed(1)}°C</div>
                      <div>• pH final: {currentExperiment.results.pH.toFixed(1)}</div>
                      <div>• Concentration finale: {currentExperiment.results.finalConcentration.toFixed(3)} M</div>
                      <div>• Temps de réaction: {currentExperiment.results.reactionTime.toFixed(1)} s</div>
                      <div>• Masse déposée: {currentExperiment.results.massDeposited.toFixed(3)} g</div>
                      <div>• Conversion: {currentExperiment.results.conversion.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Résultats de la réaction */}
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                  <Calculator className="mr-2" size={18} />
                  Résultats de la Réaction
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-2 rounded border">
                      <div className="font-semibold text-gray-700">Type de réaction:</div>
                      <div className="text-lg font-medium text-gray-900 capitalize">
                        {currentExperiment.reactionType === "none" ? "Aucune" : currentExperiment.reactionType}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="font-semibold text-gray-700">Conversion:</div>
                      <div className="text-lg font-mono text-gray-900">
                        {currentExperiment.results.conversion.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="font-semibold text-gray-700">Masse déposée:</div>
                      <div className="text-lg font-mono text-gray-900">
                        {currentExperiment.results.massDeposited.toFixed(3)} g
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="font-semibold text-gray-700">Efficacité:</div>
                      <div className="text-lg font-mono text-gray-900">
                        {currentExperiment.results.efficiency.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Évaluation de la réaction:</div>
                    <div className="flex items-center gap-2">
                      {currentExperiment.reactionType === "complete" ? (
                        <>
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-gray-800 font-medium">
                            Réaction complète ({currentExperiment.results.conversion.toFixed(1)}%)
                          </span>
                        </>
                      ) : currentExperiment.reactionType === "incomplete" ? (
                        <>
                          <AlertTriangle className="text-orange-600" size={16} />
                          <span className="text-gray-800 font-medium">
                            Réaction incomplète ({currentExperiment.results.conversion.toFixed(1)}%)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="text-red-600" size={16} />
                          <span className="text-gray-800 font-medium">Aucune réaction observée</span>
                        </>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${currentExperiment.reactionType === "complete"
                            ? "bg-green-600"
                            : currentExperiment.reactionType === "incomplete"
                              ? "bg-orange-600"
                              : "bg-red-600"
                          }`}
                        style={{ width: `${Math.max(5, currentExperiment.results.efficiency)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Performance globale:</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {currentExperiment.results.efficiency.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${currentExperiment.results.efficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Analyse théorique */}
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                  <BookOpen className="mr-2" size={18} />
                  Analyse Théorique
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Équation de la réaction:</div>
                    <div className="bg-yellow-100 p-2 rounded font-mono text-sm text-gray-800">
                      {currentExperiment.reactionType === "incomplete"
                        ? selectedReactant.incompleteEquation
                        : selectedReactant.equation}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Mécanisme redox:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {selectedReactant.canReact ? (
                        <>
                          <div>• Oxydation: Fe(s) → Fe²⁺ + 2e⁻</div>
                          <div>
                            • Réduction:{" "}
                            {reactantType === "CuSO4"
                              ? "Cu²⁺ + 2e⁻ → Cu(s)"
                              : reactantType === "AgNO3"
                                ? "Ag⁺ + e⁻ → Ag(s)"
                                : "Zn²⁺ + 2e⁻ → Zn(s)"}
                          </div>
                          <div>• Transfert d'électrons du fer vers les ions métalliques</div>
                        </>
                      ) : (
                        <>
                          <div>• Le fer ne peut pas réduire les ions Zn²⁺</div>
                          <div>• E°(Zn²⁺/Zn) = -0.76V &lt; E°(Fe²⁺/Fe) = -0.44V</div>
                          <div>• Réaction thermodynamiquement défavorable</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Série électrochimique:</div>
                    <div className="text-xs text-gray-600">
                      {reactantType === "ZnSO4"
                        ? "Zn < Fe < Cu < Ag : Le fer ne peut pas réduire le zinc (plus réactif)"
                        : reactantType === "CuSO4"
                          ? "Zn < Fe < Cu < Ag : Le fer peut réduire le cuivre (moins réactif)"
                          : "Zn < Fe < Cu < Ag : Le fer peut réduire l'argent (moins réactif)"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Facteurs influençant la réaction:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Surface de contact métal/solution</div>
                      <div>• Concentration des ions métalliques</div>
                      <div>• Température du milieu réactionnel</div>
                      <div>• Agitation et homogénéisation</div>
                      <div>• Présence d'impuretés ou d'inhibiteurs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Recommandations et Améliorations */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                  <TrendingUp className="mr-2" size={18} />
                  Recommandations et Améliorations
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Qualité de l'expérience:</div>
                    <div className="space-y-2">
                      {currentExperiment.results.efficiency > 80 ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={14} />
                          <span>Excellente efficacité obtenue</span>
                        </div>
                      ) : currentExperiment.results.efficiency > 50 ? (
                        <div className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle size={14} />
                          <span>Efficacité modérée</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle size={14} />
                          <span>Efficacité faible ou nulle</span>
                        </div>
                      )}

                      {currentExperiment.results.conversion > 90 ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={14} />
                          <span>Conversion excellente ({currentExperiment.results.conversion.toFixed(1)}%)</span>
                        </div>
                      ) : currentExperiment.results.conversion > 50 ? (
                        <div className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle size={14} />
                          <span>Conversion partielle ({currentExperiment.results.conversion.toFixed(1)}%)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle size={14} />
                          <span>Conversion faible ({currentExperiment.results.conversion.toFixed(1)}%)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Suggestions d'amélioration:</div>
                    <div className="text-gray-600 text-xs space-y-1">
                      {currentExperiment.reactionType === "incomplete" && (
                        <>
                          <div>• Augmenter la surface de contact (décapage, agitation)</div>
                          <div>• Optimiser la concentration de la solution</div>
                          <div>• Contrôler la température du milieu</div>
                        </>
                      )}
                      {currentExperiment.reactionType === "none" && (
                        <>
                          <div>• Choisir un métal plus réactif (zinc, magnésium)</div>
                          <div>• Utiliser un oxydant plus fort</div>
                          <div>• Vérifier la série électrochimique</div>
                        </>
                      )}
                      <div>• Effectuer plusieurs essais pour la reproductibilité</div>
                      <div>• Mesurer précisément les masses et volumes</div>
                      <div>• Analyser quantitativement les produits formés</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Analyse comparative:</div>
                    <div className="text-gray-600 text-xs">
                      {experiments.length > 1 ? (
                        <div>
                          <div>Nombre d'expériences: {experiments.length}</div>
                          <div>
                            Efficacité moyenne:{" "}
                            {(
                              experiments.reduce((sum, exp) => sum + exp.results.efficiency, 0) / experiments.length
                            ).toFixed(1)}
                            %
                          </div>
                          <div>
                            Conversion moyenne:{" "}
                            {(
                              experiments.reduce((sum, exp) => sum + exp.results.conversion, 0) / experiments.length
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      ) : (
                        <div>Première expérience - Effectuez d'autres tests pour comparaison</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Applications pratiques:</div>
                    <div className="text-gray-600 text-xs space-y-1">
                      <div>• Métallurgie extractive et purification</div>
                      <div>• Galvanoplastie et protection cathodique</div>
                      <div>• Recyclage des métaux précieux</div>
                      <div>• Traitement des effluents industriels</div>
                      <div>• Synthèse de nanomatériaux métalliques</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique compact */}
              {experiments.length > 1 && (
                <div className="lg:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Info className="mr-2" size={18} />
                    Historique des Expériences ({experiments.length} tests)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {experiments.slice(0, 6).map((exp, i) => (
                      <div key={exp.id} className="bg-white p-2 rounded border text-xs">
                        <div className="font-semibold text-gray-700 mb-1">#{experiments.length - i}</div>
                        <div className="text-gray-600 space-y-1">
                          <div className="font-mono">Fe + {REACTANTS[exp.reactant].formula}</div>
                          <div>Type: {exp.reactionType === "none" ? "Aucune" : exp.reactionType}</div>
                          <div>Conversion: {exp.results.conversion.toFixed(1)}%</div>
                          <div>Efficacité: {exp.results.efficiency.toFixed(1)}%</div>
                          <div>Temps: {exp.results.reactionTime.toFixed(1)}s</div>
                          <div className="text-gray-500">{exp.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Rapport généré le {new Date().toLocaleString()} • Laboratoire de Réactions Redox Virtuel v2.0
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canvas 3D avec contrôles de caméra */}
      <Canvas
        camera={{
          position: [4, 4, 8],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        shadows
      >
        <Scene
          experimentState={experimentState}
          onFaucetClick={handleFaucetClick}
          onIronClick={handleIronClick}
          reactantType={reactantType}
        />
        <OrbitControls
          ref={controlsRef}
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
      </Canvas>
    </div>
  )
}
