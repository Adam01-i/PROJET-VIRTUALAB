"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text, Html, Environment } from "@react-three/drei"
import {
  RotateCcw,
  ClipboardList,
  LineChart,
  Info,
  ThermometerIcon,
  Beaker,
  Zap,
  Eye,
  Calculator,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import * as THREE from "three"

// ===================================
// TYPES ET INTERFACES
// ===================================

interface SolutionType {
  id: string
  name: string
  formula: string
  type: string
  concentration: number
  density: number
  molarMass: number
  colorHex: string
  pH: number
  conductivity: number
  hazardLevel: "low" | "medium" | "high"
}

interface ReactionType {
  name: string
  heatOfReaction: number
  expectedDeltaT: number
}

interface ExperimentData {
  id: string
  timestamp: Date
  solutions: [SolutionType, SolutionType]
  results: {
    initialTemp: number
    finalTemp: number
    deltaT: number
    heatReleased: number
    efficiency: number
    accuracy: number
  }
}

interface InstrumentReading {
  temperature: number
  pH: number
  conductivity: number
  volume: number
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
    concentration: 1,
    density: 1.02,
    molarMass: 36.46,
    colorHex: "#3b82f6",
    pH: 0.0,
    conductivity: 421,
    hazardLevel: "high",
  },
  h2so4: {
    id: "h2so4",
    name: "Acide sulfurique",
    formula: "H₂SO₄",
    type: "acid",
    concentration: 1,
    density: 1.07,
    molarMass: 98.08,
    colorHex: "#1d4ed8",
    pH: -0.3,
    conductivity: 735,
    hazardLevel: "high",
  },
  ch3cooh: {
    id: "ch3cooh",
    name: "Acide acétique",
    formula: "CH₃COOH",
    type: "acid",
    concentration: 1,
    density: 1.01,
    molarMass: 60.05,
    colorHex: "#60a5fa",
    pH: 2.4,
    conductivity: 5.2,
    hazardLevel: "medium",
  },
  naoh: {
    id: "naoh",
    name: "Hydroxyde de sodium",
    formula: "NaOH",
    type: "base",
    concentration: 1,
    density: 1.04,
    molarMass: 40.0,
    colorHex: "#10b981",
    pH: 14.0,
    conductivity: 248,
    hazardLevel: "high",
  },
  koh: {
    id: "koh",
    name: "Hydroxyde de potassium",
    formula: "KOH",
    type: "base",
    concentration: 1,
    density: 1.05,
    molarMass: 56.11,
    colorHex: "#059669",
    pH: 13.9,
    conductivity: 273,
    hazardLevel: "high",
  },
  "ca(oh)2": {
    id: "ca(oh)2",
    name: "Hydroxyde de calcium",
    formula: "Ca(OH)₂",
    type: "base",
    concentration: 0.5,
    density: 1.03,
    molarMass: 74.09,
    colorHex: "#047857",
    pH: 12.4,
    conductivity: 3.9,
    hazardLevel: "medium",
  },
  nh3: {
    id: "nh3",
    name: "Ammoniaque",
    formula: "NH₃",
    type: "base",
    concentration: 1,
    density: 0.9,
    molarMass: 17.03,
    colorHex: "#06b6d4",
    pH: 11.6,
    conductivity: 5.1,
    hazardLevel: "medium",
  },
}

const REACTIONS: Record<string, ReactionType> = {
  "hcl-naoh": {
    name: "HCl + NaOH → NaCl + H₂O",
    heatOfReaction: -57.3,
    expectedDeltaT: 13.7,
  },
  "hcl-koh": {
    name: "HCl + KOH → KCl + H₂O",
    heatOfReaction: -57.6,
    expectedDeltaT: 13.8,
  },
  "h2so4-naoh": {
    name: "H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O",
    heatOfReaction: -130.2,
    expectedDeltaT: 15.6,
  },
  "ch3cooh-naoh": {
    name: "CH₃COOH + NaOH → CH₃COONa + H₂O",
    heatOfReaction: -55.8,
    expectedDeltaT: 13.3,
  },
  "hcl-nh3": {
    name: "HCl + NH₃ → NH₄Cl",
    heatOfReaction: -51.9,
    expectedDeltaT: 12.4,
  },
  "naoh-hcl": {
    name: "NaOH + HCl → NaCl + H₂O",
    heatOfReaction: -57.3,
    expectedDeltaT: 13.7,
  },
  "koh-hcl": {
    name: "KOH + HCl → KCl + H₂O",
    heatOfReaction: -57.6,
    expectedDeltaT: 13.8,
  },
  "naoh-h2so4": {
    name: "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O",
    heatOfReaction: -130.2,
    expectedDeltaT: 15.6,
  },
  "naoh-ch3cooh": {
    name: "NaOH + CH₃COOH → CH₃COONa + H₂O",
    heatOfReaction: -55.8,
    expectedDeltaT: 13.3,
  },
  "nh3-hcl": {
    name: "NH₃ + HCl → NH₄Cl",
    heatOfReaction: -51.9,
    expectedDeltaT: 12.4,
  },
}

// ===================================
// COMPOSANTS 3D OPTIMISÉS
// ===================================

// Environnement de laboratoire du premier fichier - VERSION ENRICHIE
function LabEnvironment() {
  return (
    <group>
      {/* Sol principal */}
      <mesh position={[0, -3.5, 0]} receiveShadow>
        <boxGeometry args={[25, 0.1, 20]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
      </mesh>

      {/* Mur arrière */}
      <mesh position={[0, 0, -10]} receiveShadow>
        <boxGeometry args={[25, 10, 0.2]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>

      {/* Murs latéraux */}
      <mesh position={[-12.5, 0, 0]} receiveShadow>
        <boxGeometry args={[0.2, 10, 20]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>

      <mesh position={[12.5, 0, 0]} receiveShadow>
        <boxGeometry args={[0.2, 10, 20]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>

      {/* Plafond */}
      <mesh position={[0, 5, 0]} receiveShadow>
        <boxGeometry args={[25, 0.2, 20]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.8} />
      </mesh>

      {/* Fenêtre */}
      <mesh position={[0, 1, -9.9]} castShadow>
        <boxGeometry args={[8, 4, 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </mesh>

      {/* Armoires de laboratoire - Gauche */}
      <group position={[-11, 0, -5]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2, 4, 1]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 2.2, 0.6]} castShadow>
          <boxGeometry args={[1.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#34495e" roughness={0.2} />
        </mesh>
      </group>

      {/* Armoires de laboratoire - Droite */}
      <group position={[11, 0, -5]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2, 4, 1]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 2.2, 0.6]} castShadow>
          <boxGeometry args={[1.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#34495e" roughness={0.2} />
        </mesh>
      </group>

      {/* Étagères avec bouteilles */}
      <group position={[-11.5, -1, -3]}>
        {[0, 0.8, 1.6].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[0.3, 0.05, 4]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Bouteilles de solutions */}
      {[
        { pos: [-11.3, 0.8, -1], color: "#ff6b6b", label: "HCl" },
        { pos: [-11.3, 0.8, -2], color: "#51cf66", label: "NaOH" },
        { pos: [-11.3, 0.8, -3], color: "#ff8787", label: "H₂SO₄" },
        { pos: [-11.3, 0.8, -4], color: "#339af0", label: "CuSO₄" },
        { pos: [-11.3, 0.8, -5], color: "#ffd43b", label: "CH₃COOH" },
        { pos: [-11.3, 1.6, -1], color: "#74c0fc", label: "NH₃" },
        { pos: [-11.3, 1.6, -2], color: "#69db7c", label: "KOH" },
        { pos: [-11.3, 1.6, -3], color: "#e9ecef", label: "NaCl" },
      ].map((bottle, i) => (
        <group key={i}>
          <mesh position={bottle.pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.6, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <mesh position={[bottle.pos[0], bottle.pos[1] - 0.1, bottle.pos[2]]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.4, 8]} />
            <meshStandardMaterial color={bottle.color} transparent opacity={0.7} />
          </mesh>
          <Html position={[bottle.pos[0], bottle.pos[1] - 0.5, bottle.pos[2]]} transform scale={0.05}>
            <div className="bg-white px-1 py-0.5 rounded text-xs font-bold border">{bottle.label}</div>
          </Html>
        </group>
      ))}

      {/* Équipements de laboratoire supplémentaires */}

      {/* Balance de précision */}
      <group position={[8, -3.3, -8]}>
        <mesh castShadow>
          <boxGeometry args={[1, 0.3, 0.8]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.1} />
        </mesh>
        <Html position={[0, 0.5, 0]} transform scale={0.08}>
          <div className="bg-black text-green-400 px-2 py-1 rounded font-mono text-sm">Balance</div>
        </Html>
      </group>

      {/* Microscope */}
      <group position={[-8, -3.2, -8]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 0.8, 8]} />
          <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
        </mesh>
        <Html position={[0, 1, 0]} transform scale={0.08}>
          <div className="bg-white px-2 py-1 rounded text-xs font-bold border">Microscope</div>
        </Html>
      </group>

      {/* Hotte aspirante */}
      <group position={[0, 2, -9.5]}>
        <mesh castShadow>
          <boxGeometry args={[6, 3, 1]} />
          <meshStandardMaterial color="#95a5a6" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[6.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* Éclairage de laboratoire */}
      {[-4, 0, 4].map((x, i) => (
        <group key={i} position={[x, 4.8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2, 0.1, 0.5]} />
            <meshStandardMaterial color="#ecf0f1" emissive="#ffffff" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Panneaux de sécurité */}
      <group position={[10, 1, -9.8]}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
        <Html position={[0, 0, 0.1]} transform scale={0.1}>
          <div className="bg-red-600 text-white px-2 py-1 rounded font-bold text-center">
            ⚠️
            <br />
            DANGER
            <br />
            ACIDES
          </div>
        </Html>
      </group>

      {/* Extincteur */}
      <group position={[11.5, -2, -2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
          <meshStandardMaterial color="#e74c3c" metalness={0.3} roughness={0.7} />
        </mesh>
        <Html position={[0, 1, 0]} transform scale={0.08}>
          <div className="bg-red-600 text-white px-1 py-0.5 rounded text-xs font-bold">🧯</div>
        </Html>
      </group>

      {/* Lavabo de laboratoire */}
      <group position={[-10, -3.2, 2]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.3, 1]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.3, 0.1, 0.8]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.1} />
        </mesh>
      </group>

      {/* Tableau périodique */}
      <group position={[-6, 1, -9.8]}>
        <mesh castShadow>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Html position={[0, 0, 0.1]} transform scale={0.15}>
          <div className="bg-white border-2 border-gray-300 p-2 rounded">
            <div className="text-center font-bold text-sm mb-1">TABLEAU PÉRIODIQUE</div>
            <div className="grid grid-cols-6 gap-1 text-xs">
              {["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg"].map((el, i) => (
                <div key={i} className="border border-gray-400 p-1 text-center bg-blue-50">
                  {el}
                </div>
              ))}
            </div>
          </div>
        </Html>
      </group>
    </group>
  )
}

// Table de laboratoire du premier fichier - SANS PIEDS
function LabTable() {
  return (
    <group position={[0, -3.45, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[8, 0.15, 4]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  )
}

const ProfessionalBeaker3D = ({
  position,
  color,
  fillLevel = 0.8,
  onClick,
  isPouring = false,
  label,
  formula,
  solution,
}: {
  position: [number, number, number]
  color: string
  fillLevel?: number
  onClick?: () => void
  isPouring?: boolean
  label: string
  formula: string
  solution: SolutionType
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (!meshRef.current) return

    const isLeft = position[0] < 0
    const targetX = isPouring ? (isLeft ? +0.3 : -0.3) : position[0]
    const targetY = isPouring ? 2.8 : 0
    const targetRotationZ = isPouring ? (isLeft ? -Math.PI / 2 : Math.PI / 2) : 0
    const targetRotationX = isPouring ? -0.6 : 0

    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.03)
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.03)

    meshRef.current.rotation.set(
      THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.03),
      0,
      THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotationZ, 0.03),
    )

    if (hovered && !isPouring) {
      meshRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.02
    }
  })

  const isLeft = position[0] < 0
  const spoutX = isLeft ? 0.6 : -0.6
  const spoutRotationZ = isLeft ? Math.PI / 2 : -Math.PI / 2
  const jetDirection = isLeft ? 1 : -1

  return (
    <group
      position={position}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <group ref={meshRef}>
        <Cylinder args={[0.6, 0.55, 1.8, 32]} position={[0, 0, 0]} castShadow>
          <meshPhysicalMaterial
            color="#f8fafc"
            transparent
            opacity={0.3}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={0.1}
          />
        </Cylinder>

        <Cylinder args={[0.62, 0.6, 0.12, 32]} position={[0, 0.84, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </Cylinder>

        <Cylinder args={[0.1, 0.15, 0.3, 16]} position={[spoutX, 0.7, 0]} rotation={[0, 0, spoutRotationZ]}>
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.3} roughness={0.1} />
        </Cylinder>

        {fillLevel > 0 && (
          <group>
            <Cylinder args={[0.55, 0.5, fillLevel * 1.6]} position={[0, -0.9 + (fillLevel * 1.6) / 2, 0]}>
              <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
            </Cylinder>
            <Cylinder args={[0.55, 0.55, 0.02]} position={[0, -0.9 + fillLevel * 1.6, 0]}>
              <meshStandardMaterial color={color} roughness={0.0} metalness={0.3} />
            </Cylinder>
          </group>
        )}

        {Array.from({ length: 5 }, (_, i) => (
          <Text
            key={i}
            position={[0.65, -0.6 + i * 0.3, 0]}
            fontSize={0.06}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
          >
            {(i + 1) * 10}mL
          </Text>
        ))}

        {isPouring && fillLevel > 0.1 && (
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(spoutX, 0.9, 0),
                  new THREE.Vector3(spoutX + 0.2 * jetDirection, 0.8, 0),
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

      <group position={[0, 2.5, 0]}>
        <Text position={[0, 0.2, 0]} fontSize={0.14} color="#e0e7ff" anchorX="center" anchorY="middle">
          {label}
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.1} color="#c7d2fe" anchorX="center" anchorY="middle">
          {formula}
        </Text>
        <Text position={[0, -0.15, 0]} fontSize={0.08} color="#a5b4fc" anchorX="center" anchorY="middle">
          {solution.concentration}M • pH {solution.pH}
        </Text>
        {solution.hazardLevel === "high" && (
          <Sphere args={[0.05]} position={[0.3, 0.1, 0]}>
            <meshBasicMaterial color="#f87171" />
          </Sphere>
        )}
      </group>

      {hovered && (
        <Cylinder args={[0.7, 0.7, 0.05]} position={[0, -1.2, 0]}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </Cylinder>
      )}
    </group>
  )
}

const AdvancedCalorimeter3D = ({
  position,
  solutionColor,
  fillLevel = 0,
  temperature = 25,
  isReacting = false,
  showBubbles = false,
  readings,
}: {
  position: [number, number, number]
  solutionColor: string
  fillLevel: number
  temperature: number
  isReacting?: boolean
  showBubbles?: boolean
  readings: InstrumentReading
}) => {
  const bubblesRef = useRef<THREE.Group>(null)
  const stirrerRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (bubblesRef.current && showBubbles) {
      bubblesRef.current.children.forEach((bubble, i) => {
        bubble.position.y += 0.03 + Math.sin(state.clock.elapsedTime + i) * 0.01
        if (bubble.position.y > 1.5) {
          bubble.position.y = -1
          bubble.position.x = (Math.random() - 0.5) * 0.8
          bubble.position.z = (Math.random() - 0.5) * 0.8
        }
      })
    }
    if (stirrerRef.current && isReacting) {
      stirrerRef.current.rotation.y = state.clock.elapsedTime * 3
    }
  })

  return (
    <group position={[position[0], position[1] - 1.8, position[2]]}>
      {/* Calorimètre extérieur */}
      <Cylinder args={[1.2, 1.2, 3.0, 32]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#4b5563" roughness={0.2} metalness={0.8} />
      </Cylinder>

      {/* Isolation thermique */}
      <Cylinder args={[1.15, 1.15, 2.8, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#f3f4f6" roughness={0.8} metalness={0.1} />
      </Cylinder>

      {/* Gobelet intérieur */}
      <Cylinder args={[0.8, 0.8, 2.5, 32]} position={[0, 0, 0]} castShadow>
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.2}
          roughness={0.05}
          transmission={0.95}
          thickness={0.1}
        />
      </Cylinder>

      {/* Couvercle du premier fichier */}
      <group position={[0, 1.6, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.25, 1.25, 0.15, 32]} />
          <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Trous pour thermomètre et agitateur */}
        <mesh position={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[-0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </group>

      {/* Solution dans le calorimètre */}
      {fillLevel > 0 && (
        <group>
          <Cylinder args={[0.75, 0.7, fillLevel * 2.3]} position={[0, -1.25 + (fillLevel * 2.3) / 2, 0]}>
            <meshStandardMaterial
              color={solutionColor}
              transparent={false}
              opacity={1.0}
              roughness={0.1}
              metalness={0.05}
            />
          </Cylinder>
          <Cylinder args={[0.75, 0.75, 0.03]} position={[0, -1.25 + fillLevel * 2.3, 0]}>
            <meshStandardMaterial
              color={solutionColor}
              transparent={false}
              opacity={1.0}
              roughness={0.0}
              metalness={0.2}
            />
          </Cylinder>
        </group>
      )}

      {/* Bulles */}
      {showBubbles && (
        <group ref={bubblesRef}>
          {Array.from({ length: 10 }, (_, i) => (
            <Sphere
              key={i}
              args={[0.02 + Math.random() * 0.02]}
              position={[(Math.random() - 0.5) * 0.6, -1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6]}
            >
              <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
            </Sphere>
          ))}
        </group>
      )}

      {/* Agitateur */}
      {fillLevel > 0 && (
        <group ref={stirrerRef} position={[0, -1.2, 0]}>
          <Box args={[0.3, 0.04, 0.04]}>
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.04, 0.04, 0.3]}>
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
          </Box>
        </group>
      )}

      <Text position={[0, -2.2, 0]} fontSize={0.12} color="#e0e7ff" anchorX="center" anchorY="middle">
        Calorimètre Professionnel
      </Text>

      <group position={[1.5, 0, 0]}>
        <Box args={[0.6, 0.4, 0.1]} castShadow>
          <meshStandardMaterial color="#1f2937" />
        </Box>
        <Text position={[0, 0.1, 0.06]} fontSize={0.08} color="#00ff00" anchorX="center" anchorY="middle">
          {temperature.toFixed(1)}°C
        </Text>
        <Text position={[0, -0.1, 0.06]} fontSize={0.06} color="#00ff00" anchorX="center" anchorY="middle">
          pH: {readings.pH.toFixed(1)}
        </Text>
      </group>
    </group>
  )
}

const Thermometer = ({
  position,
  readings,
  isActive = false,
}: {
  position: [number, number, number]
  readings: InstrumentReading
  isActive?: boolean
}) => {
  const mercuryHeight = Math.max(0.1, Math.min(1.8, (readings.temperature - 20) * 0.08))

  return (
    <group position={position}>
      <Cylinder args={[0.08, 0.08, 2.5, 16]} position={[0, 0, 0]} castShadow>
        <meshPhysicalMaterial color="#f8fafc" transparent opacity={0.4} roughness={0.05} transmission={0.9} />
      </Cylinder>
      <Sphere args={[0.12, 16, 16]} position={[0, -1.25, 0]} castShadow>
        <meshPhysicalMaterial color="#f8fafc" transparent opacity={0.4} roughness={0.05} transmission={0.9} />
      </Sphere>
      <group>
        <Sphere args={[0.1, 16, 16]} position={[0, -1.25, 0]}>
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={isActive ? 0.2 : 0.1} />
        </Sphere>
        <Cylinder args={[0.05, 0.05, mercuryHeight, 16]} position={[0, -1.25 + mercuryHeight / 2, 0]}>
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={isActive ? 0.2 : 0.1} />
        </Cylinder>
      </group>
      {Array.from({ length: 11 }, (_, i) => (
        <Text
          key={i}
          position={[0.15, -1 + i * 0.2, 0]}
          fontSize={0.05}
          color="#374151"
          anchorX="left"
          anchorY="middle"
        >
          {20 + i * 10}
        </Text>
      ))}
      <Text position={[0.4, 1.5, 0]} fontSize={0.1} color="#374151" anchorX="center" anchorY="middle">
        {readings.temperature.toFixed(1)}°C
      </Text>
    </group>
  )
}

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
  readings,
  onPourSolution1,
  onPourSolution2,
  beaker1FillLevel,
  beaker2FillLevel,
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
  readings: InstrumentReading
  onPourSolution1: () => void
  onPourSolution2: () => void
  beaker1FillLevel: number
  beaker2FillLevel: number
}) => {
  const solutionColor = useMemo(() => {
    if (reactionComplete) return "#9ca3af"
    if (solution2Added) {
      const color1 = new THREE.Color(selectedSolution1.colorHex)
      const color2 = new THREE.Color(selectedSolution2.colorHex)
      return "#" + color1.lerp(color2, 0.5).getHexString()
    }
    if (solution1Added) return selectedSolution1.colorHex
    return "#ffffff"
  }, [step, solution1Added, solution2Added, reactionComplete, selectedSolution1, selectedSolution2])

  const fillLevel = useMemo(() => {
    if (step >= 2) return 0.8
    if (solution1Added || solution2Added) return 0.4
    return 0
  }, [step, solution1Added, solution2Added])

  return (
    <>
      <ambientLight intensity={0.4} color="#e0e7ff" />
      <directionalLight
        position={[15, 15, 8]}
        intensity={1.2}
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
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#ffffff" distance={15} decay={2} />
      <pointLight position={[-6, 5, 4]} intensity={0.3} color="#a5b4fc" distance={12} decay={2} />
      <pointLight position={[6, 5, 4]} intensity={0.3} color="#a5b4fc" distance={12} decay={2} />

      <color attach="background" args={["#f0f0f0"]} />
      <fog attach="fog" args={["#f0f0f0", 15, 35]} />

      {/* Environnement et table du premier fichier */}
      <LabEnvironment />
      <LabTable />

      <ProfessionalBeaker3D
        position={[-1.5, -1.8, 0]}
        color={selectedSolution1.colorHex}
        fillLevel={beaker1FillLevel}
        onClick={onPourSolution1}
        isPouring={pouringLeft}
        label={selectedSolution1.name}
        formula={selectedSolution1.formula}
        solution={selectedSolution1}
      />

      <ProfessionalBeaker3D
        position={[1.5, -1.8, 0]}
        color={selectedSolution2.colorHex}
        fillLevel={beaker2FillLevel}
        onClick={onPourSolution2}
        isPouring={pouringRight}
        label={selectedSolution2.name}
        formula={selectedSolution2.formula}
        solution={selectedSolution2}
      />

      <AdvancedCalorimeter3D
        position={[0, 0.1, 0]}
        solutionColor={solutionColor}
        fillLevel={fillLevel}
        temperature={readings.temperature}
        isReacting={isReacting}
        showBubbles={isReacting}
        readings={readings}
      />

      <Thermometer position={[0.4, -0.5, 0]} readings={readings} isActive={isReacting} />

      <Text position={[0, 3.5, -6]} fontSize={0.4} color="#2c3e50" anchorX="center" anchorY="middle">
        LABORATOIRE DE CHIMIE - CALORIMÉTRIE QUANTITATIVE
      </Text>

      <Environment preset="apartment" />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 8}
        enableDamping={true}
        dampingFactor={0.03}
      />
    </>
  )
}

// ===================================
// HOOK PRINCIPAL OPTIMISÉ
// ===================================

const useCalorimetrySimulation = () => {
  const [selectedSolution1, setSelectedSolution1] = useState(SOLUTIONS.hcl)
  const [selectedSolution2, setSelectedSolution2] = useState(SOLUTIONS.naoh)
  const [step, setStep] = useState(0)
  const [readings, setReadings] = useState<InstrumentReading>({
    temperature: 25.0,
    pH: 7.0,
    conductivity: 0.0,
    volume: 0.0,
  })
  const [initialReadings, setInitialReadings] = useState<InstrumentReading>({
    temperature: 25.0,
    pH: 7.0,
    conductivity: 0.0,
    volume: 0.0,
  })
  const [finalReadings, setFinalReadings] = useState<InstrumentReading | null>(null)
  const [solution1Added, setSolution1Added] = useState(false)
  const [solution2Added, setSolution2Added] = useState(false)
  const [isReacting, setIsReacting] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [pouringLeft, setPouringLeft] = useState(false)
  const [pouringRight, setPouringRight] = useState(false)
  const [tempData, setTempData] = useState([{ time: 0, temp: 25.0, pH: 7.0, conductivity: 0.0 }])
  const [showTempGraph, setShowTempGraph] = useState(false)
  const [experiments, setExperiments] = useState<ExperimentData[]>([])
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentData | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [reactionProgress, setReactionProgress] = useState(0)
  const [beaker1FillLevel, setBeaker1FillLevel] = useState(0.8)
  const [beaker2FillLevel, setBeaker2FillLevel] = useState(0.8)

  const animationRef = useRef<number | null>(null)

  const calculateMixtureProperties = useCallback((sol1: SolutionType, sol2: SolutionType) => {
    const totalVolume = 100
    const vol1 = 50
    const vol2 = 50

    let mixturePH: number
    if (sol1.type === "acid" && sol2.type === "base") {
      const h1 = (Math.pow(10, -sol1.pH) * vol1) / totalVolume
      const oh2 = (Math.pow(10, -(14 - sol2.pH)) * vol2) / totalVolume
      const netH = h1 - oh2
      mixturePH = netH > 0 ? -Math.log10(netH) : 14 + Math.log10(-netH)
    } else {
      mixturePH = (sol1.pH * vol1 + sol2.pH * vol2) / totalVolume
    }

    const mixtureConductivity = (sol1.conductivity * vol1 + sol2.conductivity * vol2) / totalVolume

    return {
      pH: Math.max(0, Math.min(14, mixturePH)),
      conductivity: mixtureConductivity,
      volume: totalVolume,
    }
  }, [])

  useEffect(() => {
    const resetState = () => {
      setSolution1Added(false)
      setSolution2Added(false)
      setStep(0)
      setBeaker1FillLevel(0.8)
      setBeaker2FillLevel(0.8)
      const initialTemp = 25.0 + (Math.random() - 0.5) * 2
      setReadings({
        temperature: initialTemp,
        pH: 7.0,
        conductivity: 0.0,
        volume: 0.0,
      })
      setInitialReadings({
        temperature: initialTemp,
        pH: 7.0,
        conductivity: 0.0,
        volume: 0.0,
      })
      setFinalReadings(null)
      setIsReacting(false)
      setReactionComplete(false)
      setShowResults(false)
      setPouringLeft(false)
      setPouringRight(false)
      setTempData([{ time: 0, temp: initialTemp, pH: 7.0, conductivity: 0.0 }])
      setShowTempGraph(false)
      setReactionProgress(0)
    }
    resetState()
  }, [selectedSolution1.id, selectedSolution2.id])

  const pourSolution = useCallback(
    (solutionNumber: 1 | 2) => {
      if (step === 0) {
        if (solutionNumber === 1) {
          setPouringLeft(true)
          setTimeout(() => {
            setSolution1Added(true)
            setPouringLeft(false)
            setBeaker1FillLevel(0.3)
            setStep(1)
            const newReadings = {
              ...readings,
              pH: selectedSolution1.pH,
              conductivity: selectedSolution1.conductivity * 0.5,
              volume: 50,
            }
            setReadings(newReadings)
          }, 2500)
        } else {
          setPouringRight(true)
          setTimeout(() => {
            setSolution2Added(true)
            setPouringRight(false)
            setBeaker2FillLevel(0.3)
            setStep(1)
            const newReadings = {
              ...readings,
              pH: selectedSolution2.pH,
              conductivity: selectedSolution2.conductivity * 0.5,
              volume: 50,
            }
            setReadings(newReadings)
          }, 2500)
        }
      } else if (step === 1) {
        if ((solutionNumber === 1 && !solution1Added) || (solutionNumber === 2 && !solution2Added)) {
          if (solutionNumber === 1) {
            setPouringLeft(true)
            setTimeout(() => {
              setSolution1Added(true)
              setPouringLeft(false)
              setBeaker1FillLevel(0.3)
              setStep(2)
              startReaction()
            }, 2500)
          } else {
            setPouringRight(true)
            setTimeout(() => {
              setSolution2Added(true)
              setPouringRight(false)
              setBeaker2FillLevel(0.3)
              setStep(2)
              startReaction()
            }, 2500)
          }
        }
      }
    },
    [step, readings, selectedSolution1, selectedSolution2, solution1Added, solution2Added],
  )

  const pourSolution1 = useCallback(() => pourSolution(1), [pourSolution])
  const pourSolution2 = useCallback(() => pourSolution(2), [pourSolution])

  const startReaction = useCallback(() => {
    setIsReacting(true)
    setShowTempGraph(true)
    setReactionProgress(0)

    const mixtureProps = calculateMixtureProperties(selectedSolution1, selectedSolution2)
    const initialTemp = readings.temperature

    setTempData([
      {
        time: 0,
        temp: initialTemp,
        pH: mixtureProps.pH,
        conductivity: mixtureProps.conductivity,
      },
    ])

    const reactionData = getReactionData(selectedSolution1.id, selectedSolution2.id)
    if (!reactionData) return

    const heatCapacity = 4.18
    const totalMass = 50 * selectedSolution1.density + 50 * selectedSolution2.density
    const moles = Math.min((50 * selectedSolution1.concentration) / 1000, (50 * selectedSolution2.concentration) / 1000)

    const theoreticalDeltaT = Math.abs(reactionData.heatOfReaction * 1000 * moles) / (totalMass * heatCapacity)
    const efficiency = 0.85 + Math.random() * 0.1
    const targetTemp = initialTemp + theoreticalDeltaT * efficiency

    const startTime = Date.now()
    const duration = 8000

    const updateReadings = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setReactionProgress(progress)

      const sigmoid = (x: number) => 1 / (1 + Math.exp(-8 * (x - 0.5)))
      const tempFactor = sigmoid(progress)

      const noise = (Math.random() - 0.5) * 0.1
      const newTemp = initialTemp + (targetTemp - initialTemp) * tempFactor + noise

      const pHEvolution = mixtureProps.pH + (7.0 - mixtureProps.pH) * progress * 0.8
      const conductivityEvolution = mixtureProps.conductivity * (1 - progress * 0.3)

      const newReadings = {
        temperature: Number.parseFloat(newTemp.toFixed(2)),
        pH: Number.parseFloat(pHEvolution.toFixed(2)),
        conductivity: Number.parseFloat(conductivityEvolution.toFixed(1)),
        volume: mixtureProps.volume,
      }

      setReadings(newReadings)

      if (elapsed % 200 < 50) {
        setTempData((prev) => [
          ...prev,
          {
            time: elapsed / 1000,
            temp: newReadings.temperature,
            pH: newReadings.pH,
            conductivity: newReadings.conductivity,
          },
        ])
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateReadings)
      } else {
        setFinalReadings(newReadings)
        setIsReacting(false)
        setReactionComplete(true)
        setStep(3)
        setReactionProgress(1)
      }
    }

    animationRef.current = requestAnimationFrame(updateReadings)
  }, [readings, selectedSolution1, selectedSolution2, calculateMixtureProperties])

  const calculateResults = useCallback(() => {
    if (step !== 3 || !finalReadings) return

    const deltaT = finalReadings.temperature - initialReadings.temperature
    const totalMass = 50 * selectedSolution1.density + 50 * selectedSolution2.density
    const heatReleased = totalMass * 4.18 * deltaT
    const moles1 = (50 * selectedSolution1.concentration) / 1000
    const moles2 = (50 * selectedSolution2.concentration) / 1000
    const limitingReagent = Math.min(moles1, moles2)
    const heatPerMole = heatReleased / limitingReagent / 1000

    const reactionData = getReactionData(selectedSolution1.id, selectedSolution2.id)
    const theoreticalHeat = reactionData?.heatOfReaction || 0
    const accuracy = Math.max(0, 100 - Math.abs((heatPerMole - theoreticalHeat) / theoreticalHeat) * 100)
    const efficiency = Math.min(100, (Math.abs(heatPerMole) / Math.abs(theoreticalHeat)) * 100)

    const experiment: ExperimentData = {
      id: Date.now().toString(),
      timestamp: new Date(),
      solutions: [selectedSolution1, selectedSolution2],
      results: {
        initialTemp: initialReadings.temperature,
        finalTemp: finalReadings.temperature,
        deltaT,
        heatReleased,
        efficiency,
        accuracy,
      },
    }

    setCurrentExperiment(experiment)
    setExperiments((prev) => [experiment, ...prev.slice(0, 9)])
    setShowResults(true)
    setStep(4)
  }, [step, finalReadings, initialReadings, selectedSolution1, selectedSolution2])

  const handleReset = useCallback(() => {
    setStep(0)
    setBeaker1FillLevel(0.8)
    setBeaker2FillLevel(0.8)
    const newTemp = 25.0 + (Math.random() - 0.5) * 2
    setReadings({
      temperature: newTemp,
      pH: 7.0,
      conductivity: 0.0,
      volume: 0.0,
    })
    setInitialReadings({
      temperature: newTemp,
      pH: 7.0,
      conductivity: 0.0,
      volume: 0.0,
    })
    setFinalReadings(null)
    setSolution1Added(false)
    setSolution2Added(false)
    setIsReacting(false)
    setReactionComplete(false)
    setShowResults(false)
    setPouringLeft(false)
    setPouringRight(false)
    setTempData([{ time: 0, temp: newTemp, pH: 7.0, conductivity: 0.0 }])
    setShowTempGraph(false)
    setCurrentExperiment(null)
    setReactionProgress(0)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const getStatusMessage = useCallback(() => {
    if (pouringLeft || pouringRight) return "⏳ Versement en cours... Patientez."
    const messages = [
      "🧪 Prêt pour l'expérience ! Cliquez sur le premier bécher pour commencer.",
      "✅ Première solution ajoutée. Cliquez sur le second bécher pour continuer.",
      `🔥 Réaction en cours... Progression: ${(reactionProgress * 100).toFixed(0)}%`,
      "📊 Réaction terminée ! Cliquez sur 'Analyser résultats' pour voir les résultats détaillés.",
      "🎯 Analyse complète disponible. Vous pouvez réinitialiser pour une nouvelle expérience.",
    ]
    return messages[step] || messages[0]
  }, [step, reactionProgress, pouringLeft, pouringRight])

  const getReactionEquation = useCallback(() => {
    const reactionData = getReactionData(selectedSolution1.id, selectedSolution2.id)
    if (!reactionData) {
      return `⚠️ Réaction entre ${selectedSolution1.formula} et ${selectedSolution2.formula} non supportée dans cette simulation. Veuillez choisir une combinaison acide-base classique (ex: HCl + NaOH).`
    }
    return reactionData.name
  }, [selectedSolution1.id, selectedSolution2.id])

  const getDetailedResults = useCallback(() => {
    if (!finalReadings || !currentExperiment) return null

    const deltaT = finalReadings.temperature - initialReadings.temperature
    const totalMass = 50 * selectedSolution1.density + 50 * selectedSolution2.density
    const heatReleased = totalMass * 4.18 * deltaT
    const moles1 = (50 * selectedSolution1.concentration) / 1000
    const moles2 = (50 * selectedSolution2.concentration) / 1000
    const limitingReagent = Math.min(moles1, moles2)
    const heatPerMole = heatReleased / limitingReagent

    const reactionData = getReactionData(selectedSolution1.id, selectedSolution2.id)
    const theoreticalHeat = (reactionData?.heatOfReaction || 0) * 1000
    const error = Math.abs(heatPerMole - theoreticalHeat)
    const percentError = (error / Math.abs(theoreticalHeat)) * 100

    return {
      deltaT,
      totalMass,
      heatReleased,
      moles1,
      moles2,
      limitingReagent,
      heatPerMole: heatPerMole / 1000,
      theoreticalHeat: theoreticalHeat / 1000,
      error: error / 1000,
      percentError,
      efficiency: currentExperiment.results.efficiency,
      accuracy: currentExperiment.results.accuracy,
      pHChange: finalReadings.pH - initialReadings.pH,
      conductivityChange: finalReadings.conductivity - initialReadings.conductivity,
    }
  }, [finalReadings, initialReadings, selectedSolution1, selectedSolution2, currentExperiment])

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
    readings,
    initialReadings,
    finalReadings,
    solution1Added,
    solution2Added,
    isReacting,
    reactionComplete,
    showResults,
    pouringLeft,
    pouringRight,
    tempData,
    showTempGraph,
    experiments,
    currentExperiment,
    showInstructions,
    reactionProgress,
    beaker1FillLevel,
    beaker2FillLevel,
    setSelectedSolution1,
    setSelectedSolution2,
    setShowResults,
    setShowInstructions,
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
// COMPOSANTS UI OPTIMISÉS
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
  showInstructions,
  setShowInstructions,
}: any) => (
  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-80 border border-gray-200 shadow-xl">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-gray-700 font-semibold text-base flex items-center">
        <ThermometerIcon className="mr-2 text-indigo-600" size={16} />
        Laboratoire
      </h3>
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Info size={14} />
      </button>
    </div>

    <div className="space-y-3 mb-3">
      <div>
        <label className="text-xs text-gray-600 mb-1 block font-medium flex items-center">
          <Beaker className="mr-1" size={12} />
          Solution 1:
        </label>
        <select
          value={selectedSolution1.id}
          onChange={(e) => {
            if (step === 0) setSelectedSolution1(SOLUTIONS[e.target.value])
          }}
          disabled={step !== 0}
          className="w-full text-xs bg-gray-50 text-gray-700 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="hcl">HCl - Acide chlorhydrique</option>
          <option value="h2so4">H₂SO₄ - Acide sulfurique</option>
          <option value="ch3cooh">CH₃COOH - Acide acétique</option>
        </select>
        <div className="mt-1 text-xs text-gray-500">
          {selectedSolution1.density} g/mL • {selectedSolution1.conductivity} mS/cm
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block font-medium flex items-center">
          <Beaker className="mr-1" size={12} />
          Solution 2:
        </label>
        <select
          value={selectedSolution2.id}
          onChange={(e) => {
            if (step === 0) setSelectedSolution2(SOLUTIONS[e.target.value])
          }}
          disabled={step !== 0}
          className="w-full text-xs bg-gray-50 text-gray-700 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="naoh">NaOH - Hydroxyde de sodium</option>
          <option value="koh">KOH - Hydroxyde de potassium</option>
          <option value="ca(oh)2">Ca(OH)₂ - Hydroxyde de calcium</option>
          <option value="nh3">NH₃ - Ammoniaque</option>
        </select>
        <div className="mt-1 text-xs text-gray-500">
          {selectedSolution2.density} g/mL • {selectedSolution2.conductivity} mS/cm
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <button
        onClick={calculateResults}
        disabled={step !== 3}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all ${
          step === 3
            ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Calculator size={14} />
        Analyser résultats
      </button>

      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-all"
      >
        <RotateCcw size={12} />
        Reset
      </button>
    </div>

    <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded border border-indigo-200">
      <p className="font-medium text-indigo-800 text-xs mb-1">Réaction:</p>
      <p className="text-indigo-700 text-xs">{getReactionEquation()}</p>

      <div className="flex items-center gap-2 mt-1">
        {selectedSolution1.hazardLevel === "high" && (
          <span className="flex items-center text-xs text-red-600">
            <AlertTriangle size={10} className="mr-1" />
            Danger
          </span>
        )}
        {selectedSolution2.hazardLevel === "high" && (
          <span className="flex items-center text-xs text-red-600">
            <AlertTriangle size={10} className="mr-1" />
            Danger
          </span>
        )}
        {selectedSolution1.hazardLevel !== "high" && selectedSolution2.hazardLevel !== "high" && (
          <span className="flex items-center text-xs text-green-600">
            <CheckCircle size={10} className="mr-1" />
            Sécurisé
          </span>
        )}
      </div>
    </div>
  </div>
)

const UIReadings = ({
  step,
  readings,
  initialReadings,
  finalReadings,
  isReacting,
  getStatusMessage,
  reactionProgress,
  showInstructions,
}: any) => (
  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-72 border border-gray-200 shadow-xl">
    <h3 className="text-gray-700 font-semibold text-base mb-2 flex items-center">
      <Eye className="mr-2 text-indigo-600" size={16} />
      Mesures
    </h3>

    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
      <p className="text-xs text-blue-800 font-medium">{getStatusMessage()}</p>
      {isReacting && (
        <div className="mt-1">
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${reactionProgress * 100}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">{(reactionProgress * 100).toFixed(0)}%</p>
        </div>
      )}
    </div>

    <div className="space-y-2 text-xs text-gray-700">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-50 p-2 rounded border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-red-700 font-medium">Temp</span>
            <ThermometerIcon size={12} className="text-red-600" />
          </div>
          <span className={`font-mono text-sm ${isReacting ? "text-red-600 font-bold" : "text-red-800"}`}>
            {readings.temperature.toFixed(1)}°C
          </span>
        </div>

        <div className="bg-green-50 p-2 rounded border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium">pH</span>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="font-mono text-sm text-green-800">{readings.pH.toFixed(1)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-purple-50 p-2 rounded border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-purple-700 font-medium">Conduct</span>
            <Zap size={12} className="text-purple-600" />
          </div>
          <span className="font-mono text-xs text-purple-800">{readings.conductivity.toFixed(1)} mS/cm</span>
        </div>

        <div className="bg-orange-50 p-2 rounded border border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 font-medium">Vol</span>
            <div className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <span className="font-mono text-xs text-orange-800">{readings.volume.toFixed(0)} mL</span>
        </div>
      </div>

      {finalReadings && (
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-medium text-gray-700 text-xs mb-1">Variations:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>ΔT:</span>
              <span className="font-mono text-red-600 font-bold">
                +{(finalReadings.temperature - initialReadings.temperature).toFixed(1)}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span>ΔpH:</span>
              <span className="font-mono text-green-600">{(finalReadings.pH - initialReadings.pH).toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="mt-3">
      <h4 className="font-medium text-gray-700 text-xs mb-1">Étapes:</h4>
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: "A", value: step >= 1, icon: "🧪" },
          { label: "B", value: step >= 2, icon: "⚗️" },
          { label: "R", value: isReacting || step >= 3, icon: "🔥" },
          { label: "✓", value: step >= 4, icon: "📊" },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className={`text-center text-xs p-1 rounded border ${
              value ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            <div className="text-xs">{icon}</div>
            <div className="text-xs font-bold">{value ? "✓" : "○"}</div>
          </div>
        ))}
      </div>
    </div>

    {showInstructions && (
      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-xs text-yellow-700">
          {step === 0 && "💡 Cliquez sur les béchers pour verser"}
          {step === 1 && "💡 Versez la seconde solution"}
          {step === 2 && "💡 Observez la réaction en cours"}
          {step === 3 && "💡 Cliquez sur 'Analyser'"}
          {step === 4 && "💡 Consultez les résultats"}
        </p>
      </div>
    )}
  </div>
)

const TempGraph = ({ tempData, showTempGraph }: any) => {
  if (!showTempGraph || tempData.length < 2) return null

  const maxTemp = Math.max(...tempData.map((d: any) => d.temp))
  const minTemp = Math.min(...tempData.map((d: any) => d.temp))
  const tempRange = maxTemp - minTemp || 1

  return (
    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-64 border border-gray-200 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700 flex items-center">
          <LineChart className="mr-1 text-red-600" size={14} />
          Évolution
        </h3>
        <div className="text-xs text-gray-500">
          {tempData.length > 0 ? tempData[tempData.length - 1].time.toFixed(1) : 0}s
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Temp (°C)</span>
          <span>{maxTemp.toFixed(1)}°C</span>
        </div>
        <div className="h-12 bg-gray-50 rounded border flex items-end justify-between px-1 py-1">
          {tempData.slice(-15).map((point: any, i: number) => {
            const height = Math.max(2, ((point.temp - minTemp) / tempRange) * 100)
            return (
              <div
                key={i}
                className="bg-gradient-to-t from-red-500 to-red-300 w-1 rounded-t transition-all duration-300"
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>pH</span>
          <span>{tempData[tempData.length - 1]?.pH.toFixed(1) || "7.0"}</span>
        </div>
        <div className="h-8 bg-gray-50 rounded border flex items-end justify-between px-1 py-1">
          {tempData.slice(-15).map((point: any, i: number) => {
            const height = Math.max(2, (point.pH / 14) * 100)
            return (
              <div
                key={i}
                className="bg-gradient-to-t from-green-500 to-green-300 w-1 rounded-t transition-all duration-300"
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="text-center p-1 bg-red-50 rounded border border-red-200">
          <div className="font-medium text-gray-700">Max</div>
          <div className="text-gray-800">{maxTemp.toFixed(1)}°C</div>
        </div>
        <div className="text-center p-1 bg-blue-50 rounded border border-blue-200">
          <div className="font-medium text-gray-700">Durée</div>
          <div className="text-gray-800">{tempData[tempData.length - 1]?.time.toFixed(1) || 0}s</div>
        </div>
        <div className="text-center p-1 bg-green-50 rounded border border-green-200">
          <div className="font-medium text-gray-700">pH</div>
          <div className="text-gray-800">{tempData[tempData.length - 1]?.pH.toFixed(1) || "7.0"}</div>
        </div>
      </div>
    </div>
  )
}

const ResultsModal = ({
  showResults,
  setShowResults,
  currentExperiment,
  getDetailedResults,
  getReactionEquation,
  experiments,
}: any) => {
  const detailedResults = getDetailedResults()

  if (!showResults || !detailedResults || !currentExperiment) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/98 backdrop-blur-sm rounded-2xl p-6 max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Award className="mr-2 text-yellow-500" size={24} />
            Rapport d'Analyse Calorimétrique
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold mb-3 text-blue-800 flex items-center">
              <Beaker className="mr-2" size={18} />
              Données Expérimentales
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-blue-700 text-xs">Solution A:</div>
                  <div className="text-blue-600 font-medium">{currentExperiment.solutions[0].name}</div>
                  <div className="text-xs text-blue-500">{currentExperiment.solutions[0].formula}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-blue-700 text-xs">Solution B:</div>
                  <div className="text-blue-600 font-medium">{currentExperiment.solutions[1].name}</div>
                  <div className="text-xs text-blue-500">{currentExperiment.solutions[1].formula}</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Masse totale:</span>
                    <span className="font-mono text-gray-900">{detailedResults.totalMass.toFixed(2)} g</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Volume total:</span>
                    <span className="font-mono text-gray-900">100 mL</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">T° initiale:</span>
                    <span className="font-mono text-gray-900">
                      {currentExperiment.results.initialTemp.toFixed(2)} °C
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">T° finale:</span>
                    <span className="font-mono text-gray-900">{currentExperiment.results.finalTemp.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">ΔT mesuré:</span>
                    <span className="font-mono text-red-600 font-bold">+{detailedResults.deltaT.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Δ pH:</span>
                    <span className="font-mono text-green-600 font-bold">{detailedResults.pHChange.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 className="text-lg font-bold mb-3 text-green-800 flex items-center">
              <Calculator className="mr-2" size={18} />
              Calculs Thermodynamiques
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Moles A:</span>
                    <span className="font-mono text-gray-900">{detailedResults.moles1.toFixed(4)} mol</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Moles B:</span>
                    <span className="font-mono text-gray-900">{detailedResults.moles2.toFixed(4)} mol</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Réactif limitant:</span>
                    <span className="font-mono text-gray-900">{detailedResults.limitingReagent.toFixed(4)} mol</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Chaleur dégagée:</span>
                    <span className="font-mono text-gray-900">{detailedResults.heatReleased.toFixed(1)} J</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">ΔH expérimental:</span>
                    <span className="font-mono text-green-700 font-bold">
                      {detailedResults.heatPerMole.toFixed(1)} kJ/mol
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">ΔH théorique:</span>
                    <span className="font-mono text-green-600">
                      {detailedResults.theoreticalHeat.toFixed(1)} kJ/mol
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Erreur absolue:</span>
                    <span className="font-mono text-orange-600">{detailedResults.error.toFixed(1)} kJ/mol</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold text-gray-700">Erreur relative:</span>
                    <span className="font-mono text-orange-600">{detailedResults.percentError.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <h3 className="text-lg font-bold mb-3 text-purple-800 flex items-center">
              <Award className="mr-2" size={18} />
              Performance
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-purple-700">Précision:</span>
                  <span className="font-bold text-purple-800 text-lg">{detailedResults.accuracy.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, detailedResults.accuracy)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-purple-700">Efficacité:</span>
                  <span className="font-bold text-purple-800 text-lg">{detailedResults.efficiency.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, detailedResults.efficiency)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-2 rounded border">
                <div className="font-semibold text-purple-800 mb-1 text-sm">Évaluation:</div>
                <div className="text-purple-700 text-sm">
                  {detailedResults.accuracy > 90
                    ? "🏆 Excellente précision !"
                    : detailedResults.accuracy > 80
                      ? "🥈 Bonne précision"
                      : detailedResults.accuracy > 70
                        ? "🥉 Précision correcte"
                        : "⚠️ Précision faible"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <h3 className="text-lg font-bold mb-3 text-yellow-800 flex items-center">
              <FileText className="mr-2" size={18} />
              Réaction Chimique
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-yellow-700 mb-2">Équation bilan:</div>
                <div className="bg-yellow-100 p-2 rounded font-mono text-sm text-yellow-800 break-words">
                  {getReactionEquation()}
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-yellow-700 mb-2">Observations:</div>
                <ul className="text-yellow-600 text-sm space-y-1">
                  <li>• Dégagement de chaleur (ΔH {"<"} 0)</li>
                  <li>• Formation d'eau et d'un sel</li>
                  <li>• Neutralisation acide-base</li>
                  <li>• Changement de conductivité</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {experiments.length > 1 && (
          <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
              <ClipboardList className="mr-2" size={18} />
              Historique ({experiments.length} expériences)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {experiments.slice(0, 6).map((exp: ExperimentData, i: number) => (
                <div key={exp.id} className="bg-white p-2 rounded border text-xs">
                  <div className="font-semibold text-gray-700 mb-1">#{experiments.length - i}</div>
                  <div className="text-gray-600 space-y-1">
                    <div className="font-mono">
                      {exp.solutions[0].formula} + {exp.solutions[1].formula}
                    </div>
                    <div>ΔT: +{exp.results.deltaT.toFixed(1)}°C</div>
                    <div>Précision: {exp.results.accuracy.toFixed(1)}%</div>
                    <div className="text-gray-500">{exp.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Rapport généré le {new Date().toLocaleString()} • Laboratoire de Calorimétrie Virtuel
          </p>
        </div>
      </div>
    </div>
  )
}

// ===================================
// COMPOSANT PRINCIPAL
// ===================================

export default function CalorimetrieSimulationAvancee() {
  const {
    selectedSolution1,
    selectedSolution2,
    step,
    readings,
    initialReadings,
    finalReadings,
    solution1Added,
    solution2Added,
    isReacting,
    reactionComplete,
    showResults,
    pouringLeft,
    pouringRight,
    tempData,
    showTempGraph,
    experiments,
    currentExperiment,
    showInstructions,
    reactionProgress,
    beaker1FillLevel,
    beaker2FillLevel,
    setSelectedSolution1,
    setSelectedSolution2,
    setShowResults,
    setShowInstructions,
    pourSolution1,
    pourSolution2,
    calculateResults,
    handleReset,
    getStatusMessage,
    getReactionEquation,
    getDetailedResults,
  } = useCalorimetrySimulation()

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-900/10 to-transparent" />

      <Canvas
        camera={{ position: [0, 2, 8], fov: 75, near: 0.1, far: 100 }}
        shadows
        className="w-full h-full"
        gl={{ antialias: true, alpha: true }}
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
            readings={readings}
            onPourSolution1={pourSolution1}
            onPourSolution2={pourSolution2}
            beaker1FillLevel={beaker1FillLevel}
            beaker2FillLevel={beaker2FillLevel}
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
        showInstructions={showInstructions}
        setShowInstructions={setShowInstructions}
      />

      <UIReadings
        step={step}
        readings={readings}
        initialReadings={initialReadings}
        finalReadings={finalReadings}
        isReacting={isReacting}
        getStatusMessage={getStatusMessage}
        reactionProgress={reactionProgress}
        showInstructions={showInstructions}
      />

      <TempGraph tempData={tempData} showTempGraph={showTempGraph} />

      <ResultsModal
        showResults={showResults}
        setShowResults={setShowResults}
        currentExperiment={currentExperiment}
        getDetailedResults={getDetailedResults}
        getReactionEquation={getReactionEquation}
        experiments={experiments}
      />

      {isReacting && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white font-semibold">Réaction en cours...</p>
          <p className="text-white/80 text-sm">Calculs thermodynamiques en temps réel</p>
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
            📊 <strong>Mesures:</strong> Instruments en temps réel
          </p>
          <p>
            📈 <strong>Analyse:</strong> Rapports détaillés
          </p>
        </div>
      </div>
    </div>
  )
}

// ===================================
// UTILITAIRES
// ===================================

const getReactionData = (solution1Id: string, solution2Id: string): ReactionType | undefined => {
  const reactionId1 = `${solution1Id}-${solution2Id}`
  const reactionId2 = `${solution2Id}-${solution1Id}`
  return REACTIONS[reactionId1] || REACTIONS[reactionId2]
}
