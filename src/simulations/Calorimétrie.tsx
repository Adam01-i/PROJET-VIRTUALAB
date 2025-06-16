"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text } from "@react-three/drei"
import { RotateCcw, ClipboardList, LineChart, Info, Thermometer } from "lucide-react"
import * as THREE from "three"

// ===================================
// TYPES ET INTERFACES
// ===================================

interface SolutionType {
  id: string
  name: string
  formula: string
  type: string
  color: string
  concentration: number
  density: number
  molarMass: number
  colorHex: string
}

interface ReactionType {
  name: string
  heatOfReaction: number
  ratio: number
  products: string
  expectedDeltaT: number
}

// ===================================
// DONNÉES DE LABORATOIRE
// ===================================

const SOLUTIONS: Record<string, SolutionType> = {
  hcl: {
    id: "hcl",
    name: "Acide chlorhydrique",
    formula: "HCl",
    type: "acid",
    color: "bg-blue-200",
    concentration: 1,
    density: 1.02,
    molarMass: 36.46,
    colorHex: "#3b82f6",
  },
  h2so4: {
    id: "h2so4",
    name: "Acide sulfurique",
    formula: "H₂SO₄",
    type: "acid",
    color: "bg-blue-300",
    concentration: 1,
    density: 1.07,
    molarMass: 98.08,
    colorHex: "#1d4ed8",
  },
  ch3cooh: {
    id: "ch3cooh",
    name: "Acide acétique",
    formula: "CH₃COOH",
    type: "acid",
    color: "bg-blue-100",
    concentration: 1,
    density: 1.01,
    molarMass: 60.05,
    colorHex: "#60a5fa",
  },
  naoh: {
    id: "naoh",
    name: "Hydroxyde de sodium",
    formula: "NaOH",
    type: "base",
    color: "bg-green-100",
    concentration: 1,
    density: 1.04,
    molarMass: 40.0,
    colorHex: "#10b981",
  },
  koh: {
    id: "koh",
    name: "Hydroxyde de potassium",
    formula: "KOH",
    type: "base",
    color: "bg-green-200",
    concentration: 1,
    density: 1.05,
    molarMass: 56.11,
    colorHex: "#059669",
  },
  "ca(oh)2": {
    id: "ca(oh)2",
    name: "Hydroxyde de calcium",
    formula: "Ca(OH)₂",
    type: "base",
    color: "bg-green-300",
    concentration: 0.5,
    density: 1.03,
    molarMass: 74.09,
    colorHex: "#047857",
  },
  na2co3: {
    id: "na2co3",
    name: "Carbonate de sodium",
    formula: "Na₂CO₃",
    type: "salt",
    color: "bg-yellow-100",
    concentration: 1,
    density: 1.05,
    molarMass: 105.99,
    colorHex: "#f59e0b",
  },
}

const REACTIONS: Record<string, ReactionType> = {
  "hcl-naoh": {
    name: "HCl + NaOH → NaCl + H₂O",
    heatOfReaction: -57.3,
    ratio: 1,
    products: "NaCl + H₂O",
    expectedDeltaT: 13.7,
  },
  "hcl-koh": {
    name: "HCl + KOH → KCl + H₂O",
    heatOfReaction: -57.6,
    ratio: 1,
    products: "KCl + H₂O",
    expectedDeltaT: 13.8,
  },
  "h2so4-naoh": {
    name: "H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O",
    heatOfReaction: -130.2,
    ratio: 0.5,
    products: "Na₂SO₄ + 2 H₂O",
    expectedDeltaT: 15.6,
  },
  "ch3cooh-naoh": {
    name: "CH₃COOH + NaOH → CH₃COONa + H₂O",
    heatOfReaction: -55.8,
    ratio: 1,
    products: "CH₃COONa + H₂O",
    expectedDeltaT: 13.3,
  },
}

// ===================================
// UTILITAIRES CHIMIQUES
// ===================================

class CalorimetryCalculator {
  static getSolutionColor(
    step: number,
    solution1Added: boolean,
    solution2Added: boolean,
    reactionComplete: boolean,
    selectedSolution1: SolutionType,
    selectedSolution2: SolutionType,
  ): string {
    if (step === 0) return "#ffffff"
    if (step === 1 && solution1Added) return selectedSolution1.colorHex
    if (step >= 2 && solution1Added && solution2Added) {
      if (reactionComplete) {
        // Couleur du mélange après réaction
        if (selectedSolution1.type === "acid" && selectedSolution2.type === "base") return "#e0f2fe"
        if (selectedSolution1.type === "base" && selectedSolution2.type === "acid") return "#e0f2fe"
        return "#f3e8ff"
      }
      // Mélange en cours
      return this.blendColors(selectedSolution1.colorHex, selectedSolution2.colorHex)
    }
    return "#ffffff"
  }

  static blendColors(color1: string, color2: string): string {
    // Conversion hex vers RGB et mélange simple
    const hex1 = color1.replace("#", "")
    const hex2 = color2.replace("#", "")

    const r1 = Number.parseInt(hex1.substr(0, 2), 16)
    const g1 = Number.parseInt(hex1.substr(2, 2), 16)
    const b1 = Number.parseInt(hex1.substr(4, 2), 16)

    const r2 = Number.parseInt(hex2.substr(0, 2), 16)
    const g2 = Number.parseInt(hex2.substr(2, 2), 16)
    const b2 = Number.parseInt(hex2.substr(4, 2), 16)

    const r = Math.round((r1 + r2) / 2)
    const g = Math.round((g1 + g2) / 2)
    const b = Math.round((b1 + b2) / 2)

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }

  static getFillLevel(step: number, solution1Added: boolean, solution2Added: boolean): number {
    let level = 0
    if (step >= 1 && solution1Added) level += 0.3
    if (step >= 2 && solution2Added) level += 0.3
    return Math.min(level, 0.8)
  }

  static getReactionData(solution1: string, solution2: string): ReactionType | null {
    const key1 = `${solution1}-${solution2}`
    const key2 = `${solution2}-${solution1}`
    return REACTIONS[key1] || REACTIONS[key2] || null
  }
}

// ===================================
// COMPOSANTS 3D
// ===================================

const LabTable = () => (
  <group>
    <Box args={[10, 0.2, 6]} position={[0, -1, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.1} />
    </Box>
    {[
      [-4.5, -2, -2.5],
      [4.5, -2, -2.5],
      [-4.5, -2, 2.5],
      [4.5, -2, 2.5],
    ].map((pos, i) => (
      <Cylinder key={i} args={[0.1, 0.1, 2]} position={pos as [number, number, number]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
      </Cylinder>
    ))}
  </group>
)

const Beaker3D = ({
  position,
  color,
  fillLevel = 0.7,
  onClick,
  isPouring = false,
  label,
  formula,
}: {
  position: [number, number, number]
  color: string
  fillLevel?: number
  onClick?: () => void
  isPouring?: boolean
  label: string
  formula: string
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const liquidRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!meshRef.current) return

    if (isPouring) {
      const targetY = 2.5
      const targetRotation = position[0] < 0 ? 0.8 : -0.8
      const targetX = position[0] < 0 ? position[0] + 1.2 : position[0] - 1.2

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

  return (
    <group position={position} onClick={onClick}>
      <group ref={meshRef}>
        {/* Corps du bécher */}
        <Cylinder args={[0.6, 0.55, 2, 32]} position={[0, 0, 0]} castShadow>
          <meshPhysicalMaterial
            color="#f8fafc"
            transparent
            opacity={0.15}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={0.1}
          />
        </Cylinder>

        {/* Rebord */}
        <Cylinder args={[0.62, 0.6, 0.1, 32]} position={[0, 0.95, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </Cylinder>

        {/* Bec verseur */}
        <Cylinder args={[0.1, 0.15, 0.4, 16]} position={[0.6, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.2} roughness={0.1} />
        </Cylinder>

        {/* Liquide */}
        <group ref={liquidRef}>
          <Cylinder args={[0.55, 0.5, fillLevel * 1.8]} position={[0, -1 + fillLevel * 0.9, 0]}>
            <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.1} />
          </Cylinder>
          <Cylinder args={[0.55, 0.55, 0.02]} position={[0, -0.1 + fillLevel * 0.9, 0]}>
            <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.0} metalness={0.1} />
          </Cylinder>
        </group>

        {/* Graduations */}
        {[0.3, 0.6, 0.9].map((height, i) => (
          <Cylinder key={i} args={[0.61, 0.61, 0.01, 32]} position={[0, -0.7 + height, 0]}>
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.3} />
          </Cylinder>
        ))}

        {/* Jet de liquide */}
        {isPouring && (
          <Cylinder
            args={[0.03, 0.05, 3]}
            position={position[0] < 0 ? [1.2, -0.8, 0] : [-1.2, -0.8, 0]}
            rotation={[0, 0, position[0] < 0 ? Math.PI / 3 : -Math.PI / 3]}
          >
            <meshStandardMaterial color={color} transparent opacity={0.8} emissive={color} emissiveIntensity={0.1} />
          </Cylinder>
        )}
      </group>

      {/* Étiquettes 3D */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.15}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {label}
      </Text>
      <Text
        position={[0, 1.3, 0]}
        fontSize={0.1}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {formula}
      </Text>
      <Text
        position={[0, 1.1, 0]}
        fontSize={0.08}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {Math.round(fillLevel * 100)}mL
      </Text>
    </group>
  )
}

const Calorimeter3D = ({
  position,
  solutionColor,
  fillLevel = 0,
  isReacting = false,
  showBubbles = false,
}: {
  position: [number, number, number]
  solutionColor: string
  fillLevel: number
  temperature: number
  isReacting?: boolean
  showBubbles?: boolean
}) => {
  const bubblesRef = useRef<THREE.Group>(null)
  const stirrerRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    // Animation des bulles
    if (bubblesRef.current && showBubbles) {
      bubblesRef.current.children.forEach((bubble, i) => {
        const speed = 0.02 + Math.random() * 0.01
        bubble.position.y += speed
        bubble.position.x += Math.sin(state.clock.elapsedTime * 2 + i) * 0.002
        bubble.position.z += Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.002

        if (bubble.position.y > 2) {
          bubble.position.y = -1.5 + Math.random() * 0.5
          bubble.position.x = (Math.random() - 0.5) * 0.6
          bubble.position.z = (Math.random() - 0.5) * 0.6
        }
      })
    }

    // Animation de l'agitateur
    if (stirrerRef.current && isReacting) {
      stirrerRef.current.rotation.y = state.clock.elapsedTime * 3
    }
  })

  return (
    <group position={position}>
      {/* Calorimètre extérieur */}
      <Cylinder args={[1.2, 1.2, 3, 32]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.8} />
      </Cylinder>

      {/* Isolation */}
      <Cylinder args={[1.15, 1.15, 2.9, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#f3f4f6" roughness={0.6} />
      </Cylinder>

      {/* Gobelet intérieur */}
      <Cylinder args={[0.8, 0.8, 2.5, 32]} position={[0, 0, 0]} castShadow>
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.2}
          roughness={0.05}
          metalness={0.1}
          transmission={0.8}
        />
      </Cylinder>

      {/* Couvercle */}
      <Cylinder args={[1.25, 1.25, 0.1, 32]} position={[0, 1.55, 0]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.8} />
      </Cylinder>

      {/* Trou pour thermomètre */}
      <Cylinder args={[0.08, 0.08, 0.15, 16]} position={[0.3, 1.55, 0]}>
        <meshStandardMaterial color="#1f2937" />
      </Cylinder>

      {/* Solution */}
      {fillLevel > 0 && (
        <group>
          <Cylinder args={[0.75, 0.7, fillLevel * 2.3]} position={[0, -1.25 + fillLevel * 1.15, 0]}>
            <meshStandardMaterial color={solutionColor} transparent opacity={0.85} roughness={0.2} />
          </Cylinder>
          <Cylinder args={[0.75, 0.75, 0.02]} position={[0, -1.25 + fillLevel * 2.3, 0]}>
            <meshStandardMaterial color={solutionColor} transparent opacity={0.9} roughness={0.0} metalness={0.1} />
          </Cylinder>
        </group>
      )}

      {/* Bulles de réaction */}
      {showBubbles && (
        <group ref={bubblesRef}>
          {Array.from({ length: 20 }, (_, i) => (
            <Sphere
              key={i}
              args={[0.02 + Math.random() * 0.03]}
              position={[(Math.random() - 0.5) * 0.6, -1.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6]}
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

      {/* Agitateur magnétique */}
      {fillLevel > 0 && (
        <group ref={stirrerRef} position={[0, -1.2, 0]}>
          <Box args={[0.3, 0.05, 0.05]}>
            <meshStandardMaterial color="#1f2937" metalness={0.8} />
          </Box>
        </group>
      )}

      {/* Graduations */}
      {[0.2, 0.4, 0.6, 0.8].map((height, i) => (
        <Cylinder key={i} args={[0.81, 0.81, 0.005]} position={[0, -1 + height * 2, 0]}>
          <meshStandardMaterial color="#64748b" transparent opacity={0.4} />
        </Cylinder>
      ))}

      {/* Étiquette */}
      <Text
        position={[0, -2, 0]}
        fontSize={0.12}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        Calorimètre
      </Text>
      <Text
        position={[0, -2.2, 0]}
        fontSize={0.08}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {Math.round(fillLevel * 100)}mL
      </Text>
    </group>
  )
}

const Thermometer3D = ({
  position,
  temperature = 25,
  isActive = false,
}: {
  position: [number, number, number]
  temperature: number
  isActive?: boolean
}) => {
  const mercuryRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (mercuryRef.current && isActive) {
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.05
      mercuryRef.current.scale.setScalar(scale)
    }
  })

  const mercuryHeight = Math.max(0.1, Math.min(2, (temperature - 20) * 0.08))

  return (
    <group position={position}>
      {/* Corps du thermomètre */}
      <Cylinder args={[0.08, 0.08, 2.5, 16]} position={[0, 0, 0]} castShadow>
        <meshPhysicalMaterial color="#f8fafc" transparent opacity={0.3} roughness={0.05} transmission={0.9} />
      </Cylinder>

      {/* Bulbe */}
      <Sphere args={[0.12, 16, 16]} position={[0, -1.25, 0]} castShadow>
        <meshPhysicalMaterial color="#f8fafc" transparent opacity={0.3} roughness={0.05} transmission={0.9} />
      </Sphere>

      {/* Mercure */}
      <group>
        <Sphere args={[0.1, 16, 16]} position={[0, -1.25, 0]}>
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.2} />
        </Sphere>
        <Cylinder ref={mercuryRef} args={[0.06, 0.06, mercuryHeight, 16]} position={[0, -1.25 + mercuryHeight / 2, 0]}>
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.2} />
        </Cylinder>
      </group>

      {/* Graduations */}
      {[20, 30, 40, 50].map((i) => (
        <group key={i} position={[0, -1 + i * 0.4, 0]}>
          <Box args={[0.02, 0.01, 0.12]} position={[0.1, 0, 0]}>
            <meshStandardMaterial color="#374151" />
          </Box>
        </group>
      ))}

      {/* Étiquette */}
      <Text
        position={[0.3, 0, 0]}
        fontSize={0.1}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        Thermomètre
      </Text>
      <Text
        position={[0.3, -0.2, 0]}
        fontSize={0.08}
        color={isActive ? "#dc2626" : "#6b7280"}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {temperature.toFixed(1)}°C
      </Text>
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
// SCÈNE PRINCIPALE
// ===================================

const CalorimetryScene = ({
  selectedSolution1,
  selectedSolution2,
  step,
  solution1Added,
  solution2Added,
  isReacting,
  reactionComplete,
  pouringLeft,
  pouringRight,
  temperature,
  onPourSolution1,
  onPourSolution2,
}: {
  selectedSolution1: SolutionType
  selectedSolution2: SolutionType
  step: number
  solution1Added: boolean
  solution2Added: boolean
  isReacting: boolean
  reactionComplete: boolean
  pouringLeft: boolean
  pouringRight: boolean
  temperature: number
  onPourSolution1: () => void
  onPourSolution2: () => void
}) => {
  const solutionColor = useMemo(
    () =>
      CalorimetryCalculator.getSolutionColor(
        step,
        solution1Added,
        solution2Added,
        reactionComplete,
        selectedSolution1,
        selectedSolution2,
      ),
    [step, solution1Added, solution2Added, reactionComplete, selectedSolution1, selectedSolution2],
  )

  const fillLevel = useMemo(
    () => CalorimetryCalculator.getFillLevel(step, solution1Added, solution2Added),
    [step, solution1Added, solution2Added],
  )

  return (
    <>
      <color attach="background" args={["#312e81"]} />
      <LabLighting />
      <LabTable />

      {/* Bécher solution 1 */}
      <Beaker3D
        position={[-3, -0.15, 0]}
        color={selectedSolution1.colorHex}
        fillLevel={solution1Added ? 0.4 : 0.7}
        onClick={onPourSolution1}
        isPouring={pouringLeft}
        label={selectedSolution1.name}
        formula={selectedSolution1.formula}
      />

      {/* Bécher solution 2 */}
      <Beaker3D
        position={[3, -0.15, 0]}
        color={selectedSolution2.colorHex}
        fillLevel={solution2Added ? 0.4 : 0.7}
        onClick={onPourSolution2}
        isPouring={pouringRight}
        label={selectedSolution2.name}
        formula={selectedSolution2.formula}
      />

      {/* Calorimètre central */}
      <Calorimeter3D
        position={[0, -0.15, 0]}
        solutionColor={solutionColor}
        fillLevel={fillLevel}
        temperature={temperature}
        isReacting={isReacting}
        showBubbles={isReacting}
      />

      {/* Thermomètre */}
      <Thermometer3D position={[0.3, 1.4, 0]} temperature={temperature} isActive={isReacting} />

      {/* Contrôles de caméra */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
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
// HOOK PERSONNALISÉ
// ===================================

const useCalorimetrySimulation = () => {
  const [selectedSolution1, setSelectedSolution1] = useState(SOLUTIONS.hcl)
  const [selectedSolution2, setSelectedSolution2] = useState(SOLUTIONS.naoh)
  const [step, setStep] = useState(0)
  const [temperature, setTemperature] = useState(25.0)
  const [initialTemp, setInitialTemp] = useState(25.0)
  const [finalTemp, setFinalTemp] = useState<number | null>(null)
  const [solution1Added, setSolution1Added] = useState(false)
  const [solution2Added, setSolution2Added] = useState(false)
  const [isReacting, setIsReacting] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [pouringLeft, setPouringLeft] = useState(false)
  const [pouringRight, setPouringRight] = useState(false)
  const [tempData, setTempData] = useState([{ time: 0, temp: 25.0 }])
  const [showTempGraph, setShowTempGraph] = useState(false)

  const animationRef = useRef<number | null>(null)

  // Reset automatique
  useEffect(() => {
    const resetState = () => {
      setSolution1Added(false)
      setSolution2Added(false)
      setStep(0)
      setTemperature(25.0)
      setInitialTemp(25.0)
      setFinalTemp(null)
      setIsReacting(false)
      setReactionComplete(false)
      setShowResults(false)
      setPouringLeft(false)
      setPouringRight(false)
      setTempData([{ time: 0, temp: 25.0 }])
      setShowTempGraph(false)
    }
    resetState()
  }, [selectedSolution1.id, selectedSolution2.id])

  const pourSolution1 = useCallback(() => {
    if (step !== 0 || pouringLeft) return
    setPouringLeft(true)
    setTimeout(() => {
      setSolution1Added(true)
      setStep(1)
      setPouringLeft(false)
    }, 2000)
  }, [step, pouringLeft])

  const pourSolution2 = useCallback(() => {
    if (step !== 1 || pouringRight) return
    setPouringRight(true)
    setTimeout(() => {
      setSolution2Added(true)
      setStep(2)
      setPouringRight(false)
      startReaction()
    }, 2000)
  }, [step, pouringRight])

  const startReaction = useCallback(() => {
    setIsReacting(true)
    setShowTempGraph(true)
    setTempData([{ time: 0, temp: initialTemp }])

    const reactionData = CalorimetryCalculator.getReactionData(selectedSolution1.id, selectedSolution2.id)
    if (!reactionData) return

    const targetTemp = initialTemp + reactionData.expectedDeltaT * (0.95 + Math.random() * 0.1)
    const startTime = Date.now()
    const duration = 8000

    const updateTemperature = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const sigmoid = (x: number) => 1 / (1 + Math.exp(-10 * (x - 0.5)))
      const factor = sigmoid(progress)

      const newTemp = initialTemp + (targetTemp - initialTemp) * factor
      const roundedTemp = Number.parseFloat(newTemp.toFixed(2))

      setTemperature(roundedTemp)

      if (elapsed % 500 < 50) {
        setTempData((prev) => [...prev, { time: elapsed / 1000, temp: roundedTemp }])
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateTemperature)
      } else {
        setFinalTemp(roundedTemp)
        setIsReacting(false)
        setReactionComplete(true)
        setStep(3)
      }
    }

    animationRef.current = requestAnimationFrame(updateTemperature)
  }, [initialTemp, selectedSolution1.id, selectedSolution2.id])

  const calculateResults = useCallback(() => {
    if (step !== 3) return
    setShowResults(true)
    setStep(4)
  }, [step])

  const handleReset = useCallback(() => {
    setStep(0)
    setTemperature(25.0)
    setInitialTemp(25.0)
    setFinalTemp(null)
    setSolution1Added(false)
    setSolution2Added(false)
    setIsReacting(false)
    setReactionComplete(false)
    setShowResults(false)
    setPouringLeft(false)
    setPouringRight(false)
    setTempData([{ time: 0, temp: 25.0 }])
    setShowTempGraph(false)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const getStatusMessage = useCallback(() => {
    if (step === 0) return "Cliquez sur le premier bécher pour verser la solution dans le calorimètre."
    if (step === 1) return "Première solution ajoutée. Cliquez sur le second bécher."
    if (step === 2) return "Réaction en cours... Observez l'évolution de la température."
    if (step === 3) return "Réaction terminée! Cliquez sur 'Résultats' pour analyser."
    if (step === 4) return "Analyse terminée. Vous pouvez réinitialiser l'expérience."
    return ""
  }, [step])

  const getReactionEquation = useCallback(() => {
    const reactionData = CalorimetryCalculator.getReactionData(selectedSolution1.id, selectedSolution2.id)
    return reactionData?.name || "Réaction non définie"
  }, [selectedSolution1.id, selectedSolution2.id])

  const getDetailedResults = useCallback(() => {
    if (!finalTemp) return null

    const deltaT = finalTemp - initialTemp
    const totalMass = 50 * selectedSolution1.density + 50 * selectedSolution2.density
    const heatReleased = totalMass * 4.18 * deltaT
    const moles1 = (50 * selectedSolution1.concentration) / 1000
    const moles2 = (50 * selectedSolution2.concentration) / 1000
    const limitingReagent = Math.min(moles1, moles2)
    const heatPerMole = heatReleased / limitingReagent

    return {
      deltaT,
      totalMass,
      heatReleased,
      moles1,
      moles2,
      limitingReagent,
      heatPerMole: heatPerMole / 1000, // kJ/mol
    }
  }, [finalTemp, initialTemp, selectedSolution1, selectedSolution2])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    selectedSolution1,
    selectedSolution2,
    step,
    temperature,
    initialTemp,
    finalTemp,
    solution1Added,
    solution2Added,
    isReacting,
    reactionComplete,
    showResults,
    pouringLeft,
    pouringRight,
    tempData,
    showTempGraph,
    setSelectedSolution1,
    setSelectedSolution2,
    setShowResults,
    pourSolution1,
    pourSolution2,
    calculateResults,
    handleReset,
    getStatusMessage,
    getReactionEquation,
    getDetailedResults,
  }
}

// ===================================
// COMPOSANTS UI
// ===================================

const UIControls = ({
  selectedSolution1,
  selectedSolution2,
  step,
  setSelectedSolution1,
  setSelectedSolution2,
  calculateResults,
  handleReset,
  getReactionEquation,
}: any) => (
  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 w-80 border border-gray-200 shadow-xl">
    <h3 className="text-gray-800 font-semibold mb-3 flex items-center">
      <Thermometer className="mr-2 text-indigo-600" size={18} />
      Contrôles Calorimétrie
    </h3>

    <div className="space-y-3 mb-4">
      <div>
        <label className="text-xs text-gray-600 mb-1 block font-medium">Solution 1:</label>
        <select
          value={selectedSolution1.id}
          onChange={(e) => {
            if (step === 0) setSelectedSolution1(SOLUTIONS[e.target.value])
          }}
          disabled={step !== 0}
          className="w-full text-xs bg-gray-50 text-gray-800 border border-gray-300 rounded px-2 py-1"
        >
          <option value="hcl">HCl (Acide chlorhydrique)</option>
          <option value="h2so4">H₂SO₄ (Acide sulfurique)</option>
          <option value="ch3cooh">CH₃COOH (Acide acétique)</option>
          <option value="na2co3">Na₂CO₃ (Carbonate de sodium)</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block font-medium">Solution 2:</label>
        <select
          value={selectedSolution2.id}
          onChange={(e) => {
            if (step === 0) setSelectedSolution2(SOLUTIONS[e.target.value])
          }}
          disabled={step !== 0}
          className="w-full text-xs bg-gray-50 text-gray-800 border border-gray-300 rounded px-2 py-1"
        >
          <option value="naoh">NaOH (Hydroxyde de sodium)</option>
          <option value="koh">KOH (Hydroxyde de potassium)</option>
          <option value="ca(oh)2">Ca(OH)₂ (Hydroxyde de calcium)</option>
          <option value="na2co3">Na₂CO₃ (Carbonate de sodium)</option>
        </select>
      </div>
    </div>

    <div className="space-y-2">
      <button
        onClick={calculateResults}
        disabled={step !== 3}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          step === 3 ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <ClipboardList size={16} />
        Calculer résultats
      </button>

      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
      >
        <RotateCcw size={16} />
        Réinitialiser
      </button>
    </div>

    <div className="mt-3 p-2 bg-indigo-50 rounded-md text-xs text-gray-800">
      <p className="font-semibold">Réaction:</p>
      <p>{getReactionEquation()}</p>
    </div>
  </div>
)

const UIResults = ({ step, temperature, initialTemp, finalTemp, isReacting, getStatusMessage }: any) => (
  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-72 border border-gray-200 shadow-xl">
    <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
      <Info className="mr-2 text-indigo-600" size={16} />
      Mesures
    </h3>

    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
      <p className="text-xs text-gray-700 font-medium">{getStatusMessage()}</p>
    </div>

    <div className="space-y-1 text-xs text-gray-800">
      <div className="flex justify-between items-center">
        <span>Température:</span>
        <span className={`font-mono ${isReacting ? "text-red-600 font-bold" : ""}`}>{temperature.toFixed(1)} °C</span>
      </div>
      <div className="flex justify-between">
        <span>Initiale:</span>
        <span className="font-mono">{initialTemp.toFixed(1)} °C</span>
      </div>
      {finalTemp && (
        <>
          <div className="flex justify-between">
            <span>Finale:</span>
            <span className="font-mono">{finalTemp.toFixed(1)} °C</span>
          </div>
          <div className="flex justify-between">
            <span>ΔT:</span>
            <span className="font-mono text-red-600">+{(finalTemp - initialTemp).toFixed(1)} °C</span>
          </div>
        </>
      )}
    </div>

    <div className="mt-2 space-y-1">
      <h4 className="font-semibold text-gray-700 text-xs">État:</h4>
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: "Sol. 1", value: step >= 1, icon: "🧪" },
          { label: "Sol. 2", value: step >= 2, icon: "⚗️" },
          { label: "Réaction", value: isReacting, icon: "🔥" },
          { label: "Terminé", value: step >= 3, icon: "✅" },
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

// ===================================
// COMPOSANT PRINCIPAL
// ===================================

export default function CalorimetrieSimulation3D() {
  const {
    selectedSolution1,
    selectedSolution2,
    step,
    temperature,
    initialTemp,
    finalTemp,
    solution1Added,
    solution2Added,
    isReacting,
    reactionComplete,
    showResults,
    pouringLeft,
    pouringRight,
    tempData,
    showTempGraph,
    setSelectedSolution1,
    setSelectedSolution2,
    setShowResults,
    pourSolution1,
    pourSolution2,
    calculateResults,
    handleReset,
    getStatusMessage,
    getReactionEquation,
    getDetailedResults,
  } = useCalorimetrySimulation()

  const detailedResults = getDetailedResults()

  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 relative">
      <Canvas
        camera={{ position: [6, 6, 10], fov: 50, near: 0.1, far: 100 }}
        shadows={{ enabled: true}}
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CalorimetryScene
            selectedSolution1={selectedSolution1}
            selectedSolution2={selectedSolution2}
            step={step}
            solution1Added={solution1Added}
            solution2Added={solution2Added}
            isReacting={isReacting}
            reactionComplete={reactionComplete}
            pouringLeft={pouringLeft}
            pouringRight={pouringRight}
            temperature={temperature}
            onPourSolution1={pourSolution1}
            onPourSolution2={pourSolution2}
          />
        </Suspense>
      </Canvas>

      <UIControls
        selectedSolution1={selectedSolution1}
        selectedSolution2={selectedSolution2}
        step={step}
        setSelectedSolution1={setSelectedSolution1}
        setSelectedSolution2={setSelectedSolution2}
        calculateResults={calculateResults}
        handleReset={handleReset}
        getReactionEquation={getReactionEquation}
      />

      <UIResults
        step={step}
        temperature={temperature}
        initialTemp={initialTemp}
        finalTemp={finalTemp}
        isReacting={isReacting}
        getStatusMessage={getStatusMessage}
      />

      {/* Graphique de température */}
      {showTempGraph && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-64 border border-gray-200 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-800">Évolution température</h3>
            <LineChart className="h-3 w-3 text-red-600" />
          </div>
          <div className="h-20 bg-gray-50 rounded border flex items-end justify-between px-2 py-1">
            {tempData.slice(-10).map((point, i) => (
              <div
                key={i}
                className="bg-red-500 w-1 rounded-t"
                style={{ height: `${Math.max(5, (point.temp - 20) * 2)}%` }}
              />
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            Temps: {tempData.length > 0 ? tempData[tempData.length - 1].time.toFixed(1) : 0}s
          </div>
        </div>
      )}

      {/* Résultats détaillés */}
      {showResults && detailedResults && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Résultats de la Calorimétrie</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-base font-semibold mb-2 text-blue-800">Données mesurées</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>
                    <span className="font-semibold">Solution 1:</span> {selectedSolution1.name}
                  </li>
                  <li>
                    <span className="font-semibold">Solution 2:</span> {selectedSolution2.name}
                  </li>
                  <li>
                    <span className="font-semibold">Masse totale:</span> {detailedResults.totalMass.toFixed(2)} g
                  </li>
                  <li>
                    <span className="font-semibold">ΔT mesuré:</span> {detailedResults.deltaT.toFixed(2)} °C
                  </li>
                  <li>
                    <span className="font-semibold">Chaleur dégagée:</span> {detailedResults.heatReleased.toFixed(2)} J
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-base font-semibold mb-2 text-green-800">Calculs</h3>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>
                    <span className="font-semibold">Moles sol. 1:</span> {detailedResults.moles1.toFixed(3)} mol
                  </li>
                  <li>
                    <span className="font-semibold">Moles sol. 2:</span> {detailedResults.moles2.toFixed(3)} mol
                  </li>
                  <li>
                    <span className="font-semibold">Réactif limitant:</span>{" "}
                    {detailedResults.limitingReagent.toFixed(3)} mol
                  </li>
                  <li>
                    <span className="font-semibold">ΔH calculé:</span> {detailedResults.heatPerMole.toFixed(1)} kJ/mol
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-base font-semibold mb-2 text-purple-800">Conclusion</h3>
              <p className="text-sm text-purple-700">
                La réaction {getReactionEquation()} est exothermique, libérant environ{" "}
                {Math.abs(detailedResults.heatPerMole).toFixed(1)} kJ/mol de chaleur.
              </p>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowResults(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-xs">
        <p className="text-xs text-gray-600">
          💡 <strong>Navigation:</strong> Cliquez-glissez pour tourner, molette pour zoomer.
          <br />🧪 <strong>Interaction:</strong> Cliquez sur les béchers pour verser les solutions.
        </p>
      </div>
    </div>
  )
}
