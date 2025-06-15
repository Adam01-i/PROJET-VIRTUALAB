"use client"

import * as React from "react"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, ContactShadows, Text } from "@react-three/drei"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useSpring, animated, config } from "@react-spring/three"
import * as THREE from "three"
import {
  RotateCcw,
  Thermometer,
  Timer,
  Zap,
  Activity,
  Settings,
  FlaskConical,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  XCircle,
  MousePointer,
} from "lucide-react"

// Types optimisés
type ExperimentStep = "initial" | "pouring" | "poured" | "inserting" | "reacting" | "complete" | "incomplete"
type ReactantType = "CuSO4" | "AgNO3" | "ZnSO4"
type ReactionType = "complete" | "incomplete" | "none"

// Configuration des réactifs optimisée
const REACTANTS = {
  CuSO4: {
    name: "Sulfate de Cuivre",
    formula: "CuSO₄",
    color: "#6366f1",
    finalColor: "#22c55e",
    incompleteColor: "#f59e0b",
    depositColor: "#b45309",
    equation: "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)",
    incompleteEquation: "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s) (partielle)",
    canReact: true,
    reactionProbability: 0.85,
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

// Hook pour la gestion optimisée du zoom
function useCameraZoom() {
  const [zoom, setZoom] = useState(6.5)

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.5 : -0.5
    setZoom((prev) => Math.max(2, Math.min(10, prev + delta)))
  }, [])

  return { zoom, handleWheel }
}

// Composant Contrôleur de Caméra
function CameraController({ zoom }: { zoom: number }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.z = zoom
    camera.updateProjectionMatrix()
  }, [camera, zoom])

  return null
}

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

// Composant Robinet 3D
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
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.3} />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.55, 16]} />
        <meshStandardMaterial color={reactant.color} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, -0.15, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.3, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

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

      <Text position={[0, 1.6, 0]} fontSize={0.08} color="#333333" anchorX="center" anchorY="middle">
        {reactant.formula}
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

// Composant Bécher 3D
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

        {/* <mesh position={[0, 1.05, 0]} castShadow>
          <torusGeometry args={[1, 0.05, 8, 32]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.3} />
        </mesh> */}

        <mesh position={[1.05, 0.8, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} transmission={0.85} />
        </mesh>

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

        {[0.25, 0.5, 0.75, 1].map((height, index) => (
          <group key={index}>
            <mesh position={[1.1, -1 + height * 1.8, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <Text
              position={[1.3, -1 + height * 1.8, 0]}
              fontSize={0.06}
              color="#333333"
              anchorX="left"
              anchorY="middle"
            >
              {(index + 1) * 50}mL
            </Text>
          </group>
        ))}

        <Text position={[0, -1.3, 1.1]} fontSize={0.08} color="#333333" anchorX="center" anchorY="middle">
          Bécher 250mL
        </Text>
      </group>
    )
  },
)

// Composant Barre de Fer 2D avec clic simple
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
      <mesh>
        <planeGeometry args={[0.08, 1.5]} />
        <meshStandardMaterial color="#4a5568" side={THREE.DoubleSide} />
      </mesh>

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

      <Text position={[0, 0.9, 0.01]} fontSize={0.1} color="#333333" anchorX="center" anchorY="middle">
        Barre de Fer
      </Text>

      {!disabled && !isAnimating && (
        <Text position={[0, -0.9, 0.01]} fontSize={0.04} color="#6366f1" anchorX="center" anchorY="middle">
          Cliquez-moi !
        </Text>
      )}

      {isAnimating && (
        <Text position={[0, -0.9, 0.01]} fontSize={0.04} color="#f59e0b" anchorX="center" anchorY="middle">
          Insertion...
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
  const [solutionColor, setSolutionColor] = useState("#6366f1")
  const [ironPosition, setIronPosition] = useState<[number, number, number]>([2.5, 0, 0])
  const [copperDeposit, setCopperDeposit] = useState(0)
  const [reactionProgress, setReactionProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPouring, setIsPouring] = useState(false)
  const [faucetOpen, setFaucetOpen] = useState(false)
  const [reactionType, setReactionType] = useState<ReactionType>("complete")
  const [reactantType, setReactantType] = useState<ReactantType>("CuSO4")

  // Zoom optimisé
  const { zoom, handleWheel } = useCameraZoom()

  // Réactif sélectionné
  const selectedReactant = REACTANTS[reactantType]

  // Données calculées avec mémoisation
  const calculatedData = useMemo(
    () => ({
      temperature: 22.5 + Math.sin(Date.now() * 0.001) * 0.3 + reactionProgress * 2,
      pH: 7.0 + reactionProgress * 1.2,
      concentration: 0.1 * (1 - reactionProgress),
      efficiency: reactionType === "incomplete" ? reactionProgress * 0.6 : reactionProgress,
    }),
    [reactionProgress, reactionType],
  )

  // Références pour les timers
  const pourTimerRef = useRef<NodeJS.Timeout>()
  const reactionTimerRef = useRef<NodeJS.Timeout>()
  const insertTimerRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(0)

  // Gestion du zoom avec la molette
  useEffect(() => {
    const canvas = document.querySelector("canvas")
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false })
      return () => canvas.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel])

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
        }
      }, 50)
    },
    [selectedReactant],
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

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900">
      {/* Section Contrôles Expérience */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl w-72 border border-indigo-200">
        <h2 className="text-md font-bold text-indigo-900 flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4" />
          Expérience
        </h2>

        {/* Sélection des réactifs */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 block mb-1">Réactif</label>
          <select
            value={reactantType}
            onChange={(e) => handleReactantChange(e.target.value as ReactantType)}
            disabled={currentStep !== "initial"}
            className="w-full p-2 text-xs border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-gray-700"
          >
            <option value="CuSO4">Sulfate de Cuivre (CuSO₄)</option>
            <option value="AgNO3">Nitrate d'Argent (AgNO₃)</option>
            <option value="ZnSO4">Sulfate de Zinc (ZnSO₄) - Pas de réaction</option>
          </select>
        </div>

        {/* État et instructions */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">État</span>
            <div
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                currentStep === "complete"
                  ? "bg-green-100 text-green-800"
                  : currentStep === "incomplete"
                    ? "bg-orange-100 text-orange-800"
                    : currentStep === "reacting"
                      ? "bg-yellow-100 text-yellow-800"
                      : currentStep === "inserting"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
              }`}
            >
              {currentStep === "incomplete" && <AlertTriangle size={10} />}
              {currentStep === "inserting" && <MousePointer size={10} />}
              {currentStep === "initial" && "Prêt"}
              {currentStep === "pouring" && "Versement"}
              {currentStep === "poured" && "Solution prête"}
              {currentStep === "inserting" && "Insertion"}
              {currentStep === "reacting" && "Réaction"}
              {currentStep === "complete" && "Terminé"}
              {currentStep === "incomplete" && "Incomplète"}
            </div>
          </div>
          <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
            <p className="text-xs text-indigo-800">
              {currentStep === "initial" && "Cliquez sur la poignée rouge du robinet"}
              {currentStep === "pouring" && "Versement en cours..."}
              {currentStep === "poured" && "Cliquez sur la barre de fer pour l'insérer"}
              {currentStep === "inserting" && "Insertion automatique de la barre..."}
              {currentStep === "reacting" && "Réaction en cours"}
              {currentStep === "complete" && "Réaction terminée !"}
              {currentStep === "incomplete" && "Réaction incomplète"}
            </p>
          </div>
        </div>

        {/* Mesures */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 p-2 rounded text-center">
            <Thermometer size={12} className="text-red-500 mx-auto mb-1" />
            <div className="text-xs font-mono text-gray-800">{calculatedData.temperature.toFixed(1)}°C</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <Zap size={12} className="text-blue-500 mx-auto mb-1" />
            <div className="text-xs font-mono text-gray-800">pH {calculatedData.pH.toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <FlaskConical size={12} className="text-purple-500 mx-auto mb-1" />
            <div className="text-xs font-mono text-gray-800">{(solutionLevel * 250).toFixed(0)}mL</div>
          </div>
        </div>

        {/* Zoom info */}
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-600">🖱️ Molette : Zoom ({zoom.toFixed(1)}x)</div>
        </div>
      </div>

      {/* Section Résultats et Contrôles */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl w-72 border border-indigo-200">
        <h3 className="text-md font-bold text-indigo-900 flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4" />
          Résultats & Analyse
        </h3>

        {/* Bouton Reset */}
        <div className="mb-3">
          <button
            onClick={handleReset}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={12} />
            Reset Expérience
          </button>
        </div>

        {/* Progression */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Progression</span>
            <span className="text-xs font-mono text-gray-800">{(reactionProgress * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                reactionType === "incomplete"
                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600"
              }`}
              style={{ width: `${reactionProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Données principales */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Timer size={10} className="text-purple-500" />
              <span className="text-xs font-medium text-gray-700">Temps</span>
            </div>
            <div className="text-xs font-mono text-gray-800">{elapsedTime.toFixed(1)}s</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs font-medium text-gray-700 block">Dépôt</span>
            <div className="text-xs font-mono text-gray-800">{(copperDeposit * 0.635).toFixed(3)}g</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs font-medium text-gray-700 block">Efficacité</span>
            <div className="text-xs font-mono text-gray-800">{(calculatedData.efficiency * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs font-medium text-gray-700 block">Type</span>
            <div className="text-xs font-mono text-gray-800 capitalize">{reactionType}</div>
          </div>
        </div>

        {/* Concentration */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">[{selectedReactant.formula}]</span>
            <span className="text-xs font-mono text-gray-800">{calculatedData.concentration.toFixed(3)}M</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(1 - reactionProgress) * 100}%` }}
            />
          </div>
        </div>

        {/* Équation */}
        {(currentStep === "complete" || currentStep === "incomplete") && (
          <div
            className={`p-2 rounded border mb-3 ${
              reactionType === "incomplete"
                ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
                : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
            }`}
          >
            <div className="text-center text-xs font-mono mb-1 text-gray-800">
              {reactionType === "incomplete" ? selectedReactant.incompleteEquation : selectedReactant.equation}
            </div>
            <div className="text-center text-xs text-gray-600">
              {selectedReactant.canReact
                ? reactionType === "incomplete"
                  ? "Réaction partielle"
                  : "Réaction complète"
                : "Aucune réaction"}
            </div>
          </div>
        )}
      </div>

      {/* Section Explication des Résultats */}
      {(currentStep === "complete" || currentStep === "incomplete") && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-indigo-200">
          <h4 className="text-md font-bold text-indigo-900 flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" />
            Explication des Résultats
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Observation */}
            <div className="bg-gray-50 p-3 rounded border">
              <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                {selectedReactant.canReact ? (
                  reactionType === "complete" ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-orange-500" />
                  )
                ) : (
                  <XCircle size={14} className="text-red-500" />
                )}
                Observation
              </h5>
              <p className="text-xs text-gray-700 leading-relaxed">
                {selectedReactant.explanation[reactionType === "none" ? "none" : reactionType]}
              </p>
            </div>

            {/* Données Quantitatives */}
            <div className="bg-gray-50 p-3 rounded border">
              <h5 className="text-sm font-semibold text-gray-800 mb-2">Données Quantitatives</h5>
              <div className="space-y-1 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Temps de réaction :</span>
                  <span className="font-mono">{elapsedTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion :</span>
                  <span className="font-mono">{(reactionProgress * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Masse déposée :</span>
                  <span className="font-mono">{(copperDeposit * 0.635).toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficacité :</span>
                  <span className="font-mono">{(calculatedData.efficiency * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Concentration finale :</span>
                  <span className="font-mono">{calculatedData.concentration.toFixed(3)}M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div className="mt-3 p-3 bg-indigo-50 rounded border border-indigo-200">
            <h5 className="text-sm font-semibold text-indigo-800 mb-1">Conclusion</h5>
            <p className="text-xs text-indigo-700 leading-relaxed">
              {selectedReactant.canReact
                ? reactionType === "complete"
                  ? `La réaction redox s'est déroulée de manière optimale avec une conversion de ${(reactionProgress * 100).toFixed(1)}%. 
                   Le dépôt métallique formé confirme la réduction complète des ions métalliques par le fer.`
                  : `La réaction redox s'est déroulée partiellement avec une conversion de ${(reactionProgress * 100).toFixed(1)}%. 
                   Les conditions expérimentales (température, agitation, surface de contact) ont limité l'efficacité de la réaction.`
                : `Aucune réaction n'a eu lieu car le fer ne peut pas réduire les ions ${selectedReactant.formula.replace(
                    /[₀-₉]/g,
                    (match) => String.fromCharCode(8304 + Number.parseInt(match)),
                  )} selon la série électrochimique des métaux.`}
            </p>
          </div>
        </div>
      )}

      {/* Canvas 3D/2D hybride */}
      <Canvas
        camera={{
          position: [0, 0, zoom],
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
        <CameraController zoom={zoom} />
        <Scene
          experimentState={experimentState}
          onFaucetClick={handleFaucetClick}
          onIronClick={handleIronClick}
          reactantType={reactantType}
        />
      </Canvas>
    </div>
  )
}
