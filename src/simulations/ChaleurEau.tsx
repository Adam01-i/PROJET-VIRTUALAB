"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { ThreeEvent } from "@react-three/fiber"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Environment, Text } from "@react-three/drei"
import type { OrbitControls as OrbitControlsType } from "@react-three/drei"
import { Vector3, Vector2, Color, Raycaster, Plane, MathUtils, Group } from "three"
import * as THREE from "three"
import { Card, CardContent } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
// Removed as the module '../components/ui/badge' does not exist.
// import { Badge } from "../components/ui/badge"
// Removed as the module '../components/ui/badge' does not exist.
// import { Badge } from "../components/ui/Badge"
// Removed as the module '../components/ui/Badge' does not exist.
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/Dialog"

// Définition des solutions réelles de laboratoire avec propriétés chimiques précises
const solutions: { [key: string]: { 
  name: string;
  color: string;
  temp: number;
  density: number;
  viscosity: number;
  pH: number;
  concentration: number;
  formula: string;
  description: string;
  type: string;
} } = {
  hcl: {
    name: "HCl 0.1M",
    color: "#ff6b6b",
    temp: 20,
    density: 1.003,
    viscosity: 1.0,
    pH: 1.0,
    concentration: 0.1,
    formula: "HCl",
    description: "Acide chlorhydrique - Acide fort",
    type: "acid",
  },
  naoh: {
    name: "NaOH 0.1M",
    color: "#51cf66",
    temp: 20,
    density: 1.004,
    viscosity: 1.1,
    pH: 13.0,
    concentration: 0.1,
    formula: "NaOH",
    description: "Hydroxyde de sodium - Base forte",
    type: "base",
  },
  h2so4: {
    name: "H₂SO₄ 0.05M",
    color: "#ff8787",
    temp: 20,
    density: 1.003,
    viscosity: 1.2,
    pH: 0.7,
    concentration: 0.05,
    formula: "H₂SO₄",
    description: "Acide sulfurique - Acide fort diprotique",
    type: "acid",
  },
  koh: {
    name: "KOH 0.1M",
    color: "#69db7c",
    temp: 20,
    density: 1.005,
    viscosity: 1.05,
    pH: 13.0,
    concentration: 0.1,
    formula: "KOH",
    description: "Hydroxyde de potassium - Base forte",
    type: "base",
  },
  ch3cooh: {
    name: "CH₃COOH 0.1M",
    color: "#ffd43b",
    temp: 20,
    density: 1.0,
    viscosity: 0.9,
    pH: 2.9,
    concentration: 0.1,
    formula: "CH₃COOH",
    description: "Acide acétique - Acide faible",
    type: "weak_acid",
  },
  nh3: {
    name: "NH₃ 0.1M",
    color: "#74c0fc",
    temp: 20,
    density: 0.998,
    viscosity: 0.85,
    pH: 11.1,
    concentration: 0.1,
    formula: "NH₃",
    description: "Ammoniaque - Base faible",
    type: "weak_base",
  },
  nacl: {
    name: "NaCl 0.1M",
    color: "#e9ecef",
    temp: 20,
    density: 1.004,
    viscosity: 1.0,
    pH: 7.0,
    concentration: 0.1,
    formula: "NaCl",
    description: "Chlorure de sodium - Sel neutre",
    type: "salt",
  },
  cuso4: {
    name: "CuSO₄ 0.1M",
    color: "#339af0",
    temp: 20,
    density: 1.012,
    viscosity: 1.1,
    pH: 4.0,
    concentration: 0.1,
    formula: "CuSO₄",
    description: "Sulfate de cuivre - Sel acide",
    type: "acid_salt",
  },
  water: {
    name: "H₂O distillée",
    color: "#e3f2fd",
    temp: 20,
    density: 1.0,
    viscosity: 1.0,
    pH: 7.0,
    concentration: 0,
    formula: "H₂O",
    description: "Eau distillée - Neutre",
    type: "neutral",
  },
  empty: {
    name: "Vide",
    color: "#ffffff",
    temp: 20,
    density: 0,
    viscosity: 0,
    pH: 7.0,
    concentration: 0,
    formula: "",
    description: "Bécher vide",
    type: "empty",
  },
}

// Type definition for reaction data
type ReactionType = {
  type: string;
  equation: string;
  deltaH: number;
  description: string;
  color: string;
  products: string[];
  tempChange: number;
}

// Calculs thermodynamiques réels pour les réactions
const reactionData: { [key: string]: ReactionType } = {
  "hcl+naoh": {
    type: "Neutralisation",
    equation: "HCl + NaOH → NaCl + H₂O",
    deltaH: -57.3,
    description: "Neutralisation complète - Réaction très exothermique",
    color: "#e74c3c",
    products: ["nacl", "water"],
    tempChange: 50,
  },
  "h2so4+naoh": {
    type: "Neutralisation",
    equation: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
    deltaH: -114.6,
    description: "Neutralisation diprotique - Très exothermique",
    color: "#c0392b",
    products: ["salt", "water"],
    tempChange: 65,
  },
  "hcl+koh": {
    type: "Neutralisation",
    equation: "HCl + KOH → KCl + H₂O",
    deltaH: -57.3,
    description: "Neutralisation complète",
    color: "#e74c3c",
    products: ["salt", "water"],
    tempChange: 50,
  },
  "ch3cooh+naoh": {
    type: "Neutralisation",
    equation: "CH₃COOH + NaOH → CH₃COONa + H₂O",
    deltaH: -55.2,
    description: "Neutralisation acide faible - Modérément exothermique",
    color: "#f39c12",
    products: ["salt", "water"],
    tempChange: 35,
  },
  "hcl+nh3": {
    type: "Neutralisation",
    equation: "HCl + NH₃ → NH₄Cl",
    deltaH: -51.5,
    description: "Formation de sel d'ammonium",
    color: "#9b59b6",
    products: ["salt"],
    tempChange: 40,
  },
  "nacl+water": {
    type: "Dissolution",
    equation: "NaCl(s) → Na⁺(aq) + Cl⁻(aq)",
    deltaH: 3.9,
    description: "Dissolution endothermique",
    color: "#3498db",
    products: ["salt_solution"],
    tempChange: -5,
  },
  "cuso4+water": {
    type: "Hydratation",
    equation: "CuSO₄ + 5H₂O → CuSO₄·5H₂O",
    deltaH: -78.2,
    description: "Hydratation du sulfate de cuivre - Très exothermique",
    color: "#2980b9",
    products: ["hydrated_salt"],
    tempChange: 70,
  },
  "h2so4+water": {
    type: "Dilution",
    equation: "H₂SO₄(conc) + H₂O → H₂SO₄(dil) + chaleur",
    deltaH: -95.0,
    description: "Dilution très exothermique - DANGER!",
    color: "#e67e22",
    products: ["diluted_acid"],
    tempChange: 80,
  },
}

// Fonction pour calculer les propriétés du mélange
function calculateMixtureProperties(solutionsList: string[], solutionTemps: Record<string, number> = {}) {
  if (solutionsList.length === 0) {
    return { temp: 20, pH: 7.0, color: "#ffffff", reaction: null }
  }

  const reactionKey = solutionsList.sort().join("+")
  const reaction = reactionData[reactionKey]

  if (reaction) {
    let avgInitialTemp = 0
    solutionsList.forEach((solKey) => {
      avgInitialTemp += solutionTemps[solKey] || solutions[solKey]?.temp || 20
    })
    avgInitialTemp = avgInitialTemp / solutionsList.length

    const finalTemp = avgInitialTemp + reaction.tempChange

    let finalPH = 7.0
    if (reaction.type === "Neutralisation") {
      finalPH = 7.0
    } else if (reaction.type === "Dissolution" && solutionsList.includes("nacl")) {
      finalPH = 7.0
    } else if (reaction.type === "Hydratation") {
      finalPH = 4.0
    }

    return {
      temp: Math.max(5, Math.min(100, finalTemp)),
      pH: finalPH,
      color: reaction.color,
      reaction: reaction,
    }
  }

  let avgTemp = 0
  let avgPH = 0
  let r = 0,
    g = 0,
    b = 0

  solutionsList.forEach((solKey) => {
    const solution = solutions[solKey]
    if (solution) {
      avgTemp += solutionTemps[solKey] || solution.temp
      avgPH += solution.pH

      const color = new Color(solution.color)
      r += color.r
      g += color.g
      b += color.b
    }
  })

  const count = solutionsList.length
  return {
    temp: count > 0 ? avgTemp / count : 20,
    pH: count > 0 ? avgPH / count : 7.0,
    color: count > 0 ? new Color(r / count, g / count, b / count).getHexString() : "#ffffff",
    reaction: null,
  }
}

// Environnement de laboratoire
function LabEnvironment() {
  return (
    <group>
      <mesh position={[0, -3.5, 0]} receiveShadow>
        <boxGeometry args={[20, 0.1, 15]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0, -7.5]} receiveShadow>
        <boxGeometry args={[20, 7, 0.2]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>

      <mesh position={[-10, 0, 0]} receiveShadow>
        <boxGeometry args={[0.2, 7, 15]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>

      <mesh position={[10, 0, 0]} receiveShadow>
        <boxGeometry args={[0.2, 7, 15]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1, -7.4]} castShadow>
        <boxGeometry args={[6, 3, 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </mesh>

      <group position={[-9.5, 1, -5]}>
        {[0, 0.8, 1.6].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[0.3, 0.05, 4]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {[
        { pos: [-9.3, 1.8, -2], color: "#ff6b6b", label: "HCl" },
        { pos: [-9.3, 1.8, -3], color: "#51cf66", label: "NaOH" },
        { pos: [-9.3, 1.8, -4], color: "#ff8787", label: "H₂SO₄" },
        { pos: [-9.3, 1.8, -5], color: "#339af0", label: "CuSO₄" },
        { pos: [-9.3, 1.8, -6], color: "#ffd43b", label: "CH₃COOH" },
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
    </group>
  )
}

// Table de laboratoire
function LabTable() {
  return (
    <group position={[0, -3.45, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[8, 0.15, 4]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.3} metalness={0.1} />
      </mesh>

      {[
        [-3.5, -1.5, -1.5],
        [-3.5, -1.5, 1.5],
        [3.5, -1.5, -1.5],
        [3.5, -1.5, 1.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
          <meshStandardMaterial color="#7f8c8d" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Système de flux de liquide
type LiquidStreamProps = {
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  color: string;
  isPouring: boolean;
  viscosity?: number;
};

function LiquidStream({ startPoint, endPoint, color, isPouring, viscosity = 0.8 }: LiquidStreamProps) {
  const streamRef = useRef<Group>(null)
  const particlesRef = useRef<Array<THREE.Mesh | null>>([])
  const [particles, setParticles] = useState<Array<{
    id: string | number;
    position: number[];
    velocity: number[];
    size: number;
    opacity: number;
    color?: Color;
    life?: number;
    maxLife?: number;
    rotationSpeed?: number;
    delay?: number;
  }>>([])

  useEffect(() => {
    if (isPouring) {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        position: [0, -i * 0.05, 0],
        velocity: [0, -0.01 - Math.random() * 0.02, 0],
        size: 0.03 + Math.random() * 0.02,
        opacity: 0.7 + Math.random() * 0.3,
      }))
      setParticles(newParticles)
    } else {
      setParticles([])
    }
  }, [isPouring])

  useFrame(() => {
    if (!isPouring || !streamRef.current) return

    streamRef.current.position.set(startPoint[0], startPoint[1], startPoint[2])
    streamRef.current.lookAt(endPoint[0], endPoint[1], endPoint[2])

    particlesRef.current.forEach((particle, i) => {
      if (!particle) return
      const gravity = 0.005 * (1 / viscosity)
      particle.position.y -= gravity
      if (particle.position.y < -1) {
        particle.position.y = 0
      }
    })
  })

  if (!isPouring) return null

  return (
    <group ref={streamRef}>
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.02, 1, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {particles.map((particle, i) => (
        <mesh
          key={particle.id}
          position={new Vector3(...particle.position)}
          ref={(el) => {
            if (el) particlesRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial
            color={particle.color || new Color(color)}
            transparent
            opacity={particle.opacity || 0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

// Bécher draggable
function DraggableBeaker({
  position,
  solution,
  onDrag,
  onDrop,
  isPouring,
  id,
  side,
  onSelect,
}: {
  position: [number, number, number];
  solution: string;
  onDrag: (id: string, position: [number, number, number]) => void;
  onDrop: (id: string, solution: string, isPouring: boolean) => void;
  isPouring: boolean;
  id: string;
  side: string;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const liquidRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState(position)
  const [liquidLevel, setLiquidLevel] = useState(0.6)
  const [streamStart, setStreamStart] = useState<[number, number, number]>([0, 0, 0])
  const [streamEnd, setStreamEnd] = useState<[number, number, number]>([0, -2, 0])
  const [tiltAngle, setTiltAngle] = useState(0)
  const [scaleValue, setScaleValue] = useState(1)
  const [liquidHeight, setLiquidHeight] = useState(0.6)
  const { camera } = useThree()

  useFrame((state, delta) => {
    const targetTilt = isPouring ? -Math.PI / 3 : 0
    setTiltAngle((prev) => prev + (targetTilt - prev) * delta * 5)

    const targetScale = isDragging ? 1.1 : 1
    setScaleValue((prev) => prev + (targetScale - prev) * delta * 8)

    const targetHeight = isPouring ? Math.max(0.1, liquidLevel - 0.1) : liquidLevel
    setLiquidHeight((prev) => prev + (targetHeight - prev) * delta * 3)

    if (groupRef.current) {
      groupRef.current.position.set(dragPosition[0], dragPosition[1], dragPosition[2])
      groupRef.current.rotation.z = tiltAngle
      groupRef.current.scale.setScalar(scaleValue)
    }

    if (liquidRef.current) {
      liquidRef.current.position.y = -0.4 + liquidHeight * 0.3
    }
  })

  useEffect(() => {
    if (isPouring && liquidLevel > 0.1) {
      const pourInterval = setInterval(() => {
        setLiquidLevel((prev) => {
          const newLevel = Math.max(0.1, prev - 0.015)
          return newLevel
        })
      }, 80)
      return () => clearInterval(pourInterval)
    }
  }, [isPouring, liquidLevel])

  useEffect(() => {
    if (isPouring) {
      const start = [
        dragPosition[0] + 0.4 * Math.cos(tiltAngle),
        dragPosition[1] + 0.4 * Math.sin(tiltAngle),
        dragPosition[2],
      ]
      const end = [0, -2.45, 0]
      setStreamStart(start as [number, number, number])
      setStreamEnd(end as [number, number, number])
    }
  }, [isPouring, dragPosition, tiltAngle])

  const handleMouseDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (solution !== "empty" && liquidLevel > 0.1) {
        e.stopPropagation()
        setIsDragging(true)
        onSelect(id)
      }
    },
    [solution, liquidLevel, id, onSelect],
  )

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent): void => {
      if (!isDragging) return

      const raycaster = new Raycaster()
      const mouse = new Vector2()

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const plane = new Plane(new Vector3(0, 1, 0), 2.8)
      const planeIntersect = new Vector3()
      raycaster.ray.intersectPlane(plane, planeIntersect)

      if (planeIntersect) {
      const clampedX = MathUtils.clamp(planeIntersect.x, -3.5, 3.5)
      const clampedZ = MathUtils.clamp(planeIntersect.z, -1.5, 1.5)

      const newPos: [number, number, number] = [clampedX, Math.max(-1.5, planeIntersect.y), clampedZ]
      setDragPosition(newPos)
      onDrag(id, newPos)

      const distanceToCalorimeter = Math.sqrt(planeIntersect.x ** 2 + planeIntersect.z ** 2)
      if (distanceToCalorimeter < 1.2 && planeIntersect.y > -1) {
        onDrop(id, solution, true)
      } else {
        onDrop(id, solution, false)
      }
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setTimeout(() => {
          setDragPosition(position)
        }, 500)
        onDrop(id, solution, false)
      }
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, camera, onDrag, onDrop, id, solution, position])

  return (
    <>
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onPointerDown={handleMouseDown}
          castShadow
          onPointerOver={(e) => {
            document.body.style.cursor = solution !== "empty" && liquidLevel > 0.1 ? "grab" : "default";
          }}
          onPointerOut={(e) => {
            document.body.style.cursor = "default";
          }}
        >
          <cylinderGeometry args={[0.4, 0.35, 0.8, 32, 1, true]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} metalness={0.3} />
        </mesh>

        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.05, 32]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>

        {solution !== "empty" && liquidLevel > 0.1 && solutions[solution] && (
          <mesh ref={liquidRef}>
            <cylinderGeometry args={[0.32, 0.32, 0.6, 32]} />
            <meshStandardMaterial
              color={solutions[solution].color}
              transparent
              opacity={0.95}
              roughness={0.1}
              metalness={0.1}
              emissive={solutions[solution].color}
              emissiveIntensity={0.3}
            />
          </mesh>
        )}

        <mesh position={[0.35, 0.2, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.2, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>

        {solutions[solution] && (
          <Html position={[0, -0.7, 0]} transform scale={0.1} occlude>
            <div className="bg-white px-3 py-1 rounded-md shadow-md border">
              <div className="font-bold text-sm" style={{ color: solutions[solution].color }}>
                {solutions[solution].name}
              </div>
              <div className="text-xs text-gray-600">{solutions[solution].formula}</div>
              <div className="text-xs text-gray-500">{Math.round(liquidLevel * 100)}mL</div>
            </div>
          </Html>
        )}

        <mesh position={[0, -0.8, 0]} visible={isDragging}>
          <ringGeometry args={[0.4, 0.45, 16]} />
          <meshBasicMaterial color="#3498db" />
        </mesh>
      </group>

      {solutions[solution] && (
        <LiquidStream
          startPoint={streamStart}
          endPoint={streamEnd}
          color={solutions[solution].color}
          isPouring={isPouring}
          viscosity={solutions[solution].viscosity}
        />
      )}
    </>
  )
}

// Thermomètre externe plus visible
function ExternalThermometer({ temperature }: { temperature: number }) {
  const thermometerRef = useRef<THREE.Group | null>(null)
  const liquidRef = useRef<THREE.Mesh | null>(null)

  useFrame((state, delta) => {
    if (liquidRef.current) {
      const height = Math.max(0.1, Math.min(1, (temperature - 10) / 80))
      liquidRef.current.scale.y = height
    }
  })

  return (
    <group position={[1.8, -2.85, 0]} ref={thermometerRef}>
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      <mesh position={[0, -0.7, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} roughness={0.1} />
      </mesh>

      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 1.5, 16, 1, true]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={0.8} />
      </mesh>

      <mesh ref={liquidRef} position={[0, -0.2, 0]} scale={[1, 0.5, 1]}>
        <cylinderGeometry args={[0.06, 0.06, 1.5, 16]} />
        <meshStandardMaterial
          color={temperature > 60 ? "#ff0000" : temperature > 40 ? "#ff4500" : temperature > 25 ? "#ffaa00" : "#0066ff"}
          emissive={temperature > 60 ? "#ff0000" : temperature > 40 ? "#ff4500" : "#000000"}
          emissiveIntensity={temperature > 40 ? 0.4 : 0.1}
        />
      </mesh>

      <mesh position={[0, -0.4, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={temperature > 60 ? "#ff0000" : temperature > 40 ? "#ff4500" : temperature > 25 ? "#ffaa00" : "#0066ff"}
          emissive={temperature > 60 ? "#ff0000" : temperature > 40 ? "#ff4500" : "#000000"}
          emissiveIntensity={temperature > 40 ? 0.4 : 0.1}
        />
      </mesh>

      {[0, 20, 40, 60, 80, 100].map((temp, i) => (
        <group key={i}>
          <mesh position={[0.1, -0.4 + i * 0.24, 0]} castShadow>
            <boxGeometry args={[0.04, 0.01, 0.01]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <Html position={[0.2, -0.4 + i * 0.24, 0]} transform scale={0.05}>
            <div className="bg-white px-1 rounded text-xs font-bold border">{temp}°C</div>
          </Html>
        </group>
      ))}

      <Html position={[0, 1.5, 0]} transform scale={0.15}>
        <div className="bg-black text-green-400 px-4 py-2 rounded font-mono text-xl font-bold border-2 border-green-400 shadow-lg">
          {Math.round(temperature)}°C
        </div>
      </Html>

      <Html position={[0, -1, 0]} transform scale={0.08}>
        <div className="bg-white px-2 py-1 rounded text-sm font-bold border shadow-md">🌡️ Thermomètre Digital</div>
      </Html>
    </group>
  )
}

// Calorimètre
function Calorimeter({ temperature, mixedSolutions, isReceiving, pH, reactionInfo }: { temperature: number; mixedSolutions: string[]; isReceiving: boolean; pH: number; reactionInfo: ReactionType | null }) {
  const groupRef = useRef<THREE.Group | null>(null)
  const liquidRef = useRef<THREE.Mesh | null>(null)
  const steamRef = useRef<THREE.Group | null>(null)
  const bubblesRef = useRef<(THREE.Mesh | null)[]>([])
  const [glowIntensity, setGlowIntensity] = useState(0)
  const [bubblesScale, setBubblesScale] = useState(0)
  const [liquidOpacity, setLiquidOpacity] = useState(0)

  const getMixedColor = () => {
    if (mixedSolutions.length === 0) return new Color("#ffffff")

    if (reactionInfo) {
      return new Color(reactionInfo.color)
    }

    let r = 0,
      g = 0,
      b = 0
    mixedSolutions.forEach((solKey) => {
      const sol = solutions[solKey]
      if (sol) {
        const color = new Color(sol.color)
        r += color.r
        g += color.g
        b += color.b
      }
    })

    const count = mixedSolutions.length
    return count > 0 ? new Color(r / count, g / count, b / count) : new Color("#ffffff")
  }

  const liquidLevel = Math.min(0.8, mixedSolutions.length * 0.25)

  useFrame((state, delta) => {
    const targetGlow = isReceiving ? 1 : 0
    setGlowIntensity((prev) => prev + (targetGlow - prev) * delta * 5)

    const targetBubbles = temperature > 40 ? 1 : 0
    setBubblesScale((prev) => prev + (targetBubbles - prev) * delta * 3)

    const targetOpacity = mixedSolutions.length > 0 ? 0.8 : 0
    setLiquidOpacity((prev) => prev + (targetOpacity - prev) * delta * 4)

    if (steamRef.current && temperature > 60) {
      steamRef.current.rotation.y = state.clock.elapsedTime * 0.5
      steamRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }

    // Animation des bulles pour réactions exothermiques
    bubblesRef.current.forEach((bubble, i) => {
      if (!bubble || !bubble.position) return

      // Mouvement ascendant des bulles
      bubble.position.y += 0.005 * (temperature > 50 ? 2 : 1)

      // Mouvement latéral aléatoire
      bubble.position.x += Math.sin(state.clock.elapsedTime * (i + 1)) * 0.001
      bubble.position.z += Math.cos(state.clock.elapsedTime * (i + 1)) * 0.001

      // Réinitialiser les bulles qui atteignent la surface ou sortent du calorimètre
      if (
        bubble.position.y > -0.6 + liquidLevel ||
        Math.abs(bubble.position.x) > 0.9 ||
        Math.abs(bubble.position.z) > 0.9
      ) {
        bubble.position.y = -0.8
        bubble.position.x = (Math.random() - 0.5) * 0.8
        bubble.position.z = (Math.random() - 0.5) * 0.8
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, -2.85, 0]}>
      <mesh position={[0, -0.7, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      <mesh castShadow>
        <cylinderGeometry args={[1.1, 1.0, 1.2, 32, 1, true]} />
        <meshStandardMaterial
          color="#c0c0c0"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.8}
          emissive={getMixedColor()}
          emissiveIntensity={glowIntensity * 0.3}
        />
      </mesh>

      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.1, 32]} />
        <meshStandardMaterial color="#a0a0a0" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh ref={liquidRef} position={[0, -0.6 + liquidLevel / 2, 0]} castShadow visible={mixedSolutions.length > 0}>
        <cylinderGeometry args={[0.95, 0.95, liquidLevel, 32]} />
        <meshStandardMaterial
          color={getMixedColor()}
          transparent
          opacity={liquidOpacity}
          roughness={0.2}
          metalness={0.1}
          emissive={getMixedColor()}
          emissiveIntensity={temperature > 60 ? 0.4 : 0.1}
        />
      </mesh>

      {temperature > 40 && mixedSolutions.length > 1 && (
        <group scale={bubblesScale}>
          {reactionInfo && Array.from({ length: reactionInfo.deltaH < 0 ? 20 : 8 }, (_, i) => (
            <mesh
              key={i}
              ref={(el) => {
                bubblesRef.current[i] = el;
              }}
              position={[(Math.random() - 0.5) * 0.8, -0.8 + Math.random() * 0.2, (Math.random() - 0.5) * 0.8]}
            >
              <sphereGeometry args={[0.02 + Math.random() * 0.02, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}

      {temperature > 70 && (
        <group ref={steamRef} position={[0, 0.8, 0]}>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[Math.sin(i * 1.2) * 0.3, i * 0.15, Math.cos(i * 1.2) * 0.3]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      )}

      <Html position={[1.2, 0, 0]} transform scale={0.1}>
        <div className="bg-white px-2 py-1 rounded text-xs font-mono border shadow-md space-y-1">
          <div className="text-blue-600">pH: {pH.toFixed(1)}</div>
          {reactionInfo && (
            <div className="text-green-600 text-xs">
              ΔH: {reactionInfo.deltaH > 0 ? "+" : ""}
              {reactionInfo.deltaH} kJ/mol
            </div>
          )}
        </div>
      </Html>

      {mixedSolutions.length > 0 && (
        <mesh position={[0, -0.8, 0]} rotation={[0, Date.now() * 0.001, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}

      {isReceiving && (
        <group position={[0, -0.6 + liquidLevel, 0]}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.5, Math.random() * 0.2, (Math.random() - 0.5) * 0.5]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={getMixedColor()} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

// Particules de réaction - Version corrigée
function ReactionParticles({ solutions, temperature, reactionInfo }: { solutions: string[]; temperature: number; reactionInfo: ReactionType | null }) {
  type Particle = {
    id: string;
    position: number[];
    velocity: number[];
    color: Color;
    life: number;
    maxLife: number;
    size: number;
    rotationSpeed: number;
    delay: number;
  };
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<any[]>([])
  const [animationStarted, setAnimationStarted] = useState(false)

  // Nettoyer les références lors du démontage
  useEffect(() => {
    return () => {
      particlesRef.current = []
    }
  }, [])

  useEffect(() => {
    if (solutions.length < 2 || !reactionInfo) {
      setParticles([])
      setAnimationStarted(false)
      particlesRef.current = []
      return
    }

    const timer = setTimeout(() => {
      setAnimationStarted(true)

      const particleColor = new Color(reactionInfo.color)
      const particleCount = Math.abs(reactionInfo.deltaH) > 50 ? 150 : 80
      const particleEnergy = Math.abs(reactionInfo.deltaH) / 40

      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        position: [(Math.random() - 0.5) * 1.2, -2.85 + Math.random() * 0.5, (Math.random() - 0.5) * 1.2],
        velocity: [
          (Math.random() - 0.5) * 0.04 * particleEnergy,
          Math.random() * 0.03 * particleEnergy,
          (Math.random() - 0.5) * 0.04 * particleEnergy,
        ],
        color: particleColor,
        life: 1.5,
        maxLife: 1.5,
        size: 0.01 + Math.random() * 0.03,
        rotationSpeed: Math.random() * 0.15 * particleEnergy,
        delay: Math.random() * 1.5,
      }))

      setParticles(newParticles)
      particlesRef.current = new Array<any>(newParticles.length).fill(null)
    }, 800)

    return () => clearTimeout(timer)
  }, [solutions, temperature, reactionInfo])

  useFrame((state, delta) => {
    if (!animationStarted || particles.length === 0) return

    // Créer une copie des particules pour la mise à jour
    const updatedParticles: Particle[] = []

    particles.forEach((particle, i) => {
      if (!particle) return

      const particleRef = particlesRef.current[i]

      // Appliquer le délai avant d'animer
      if (particle.delay > 0) {
        updatedParticles.push({ ...particle, delay: particle.delay - delta })
        return
      }

      // Mettre à jour la position si la référence existe
      if (particleRef && particleRef.position) {
        // Appliquer la vélocité avec un mouvement plus organique
        particleRef.position.x += particle.velocity[0] + Math.sin(state.clock.elapsedTime * 2 + i) * 0.002
        particleRef.position.y += particle.velocity[1]
        particleRef.position.z += particle.velocity[2] + Math.cos(state.clock.elapsedTime * 2 + i) * 0.002

        // Rotation plus dynamique
        particleRef.rotation.x += particle.rotationSpeed * (1 + Math.sin(state.clock.elapsedTime))
        particleRef.rotation.y += particle.rotationSpeed * (1 + Math.cos(state.clock.elapsedTime))
      }

      // Réduire la durée de vie
      const newLife = Math.max(0, particle.life - delta * 0.25)

      // Ajuster l'opacité et la taille en fonction de la durée de vie
      if (particleRef && particleRef.material && newLife > 0) {
        particleRef.material.opacity = (newLife / particle.maxLife) * 0.7
        // Faire grossir puis rétrécir les particules
        const scale = Math.max(0.1, 1 - Math.abs(newLife / particle.maxLife - 0.5) * 0.5)
        particleRef.scale.set(scale, scale, scale)
      }

      // Garder seulement les particules vivantes
      if (newLife > 0) {
        updatedParticles.push({ ...particle, life: newLife })
      }
    })

    // Mettre à jour l'état seulement si nécessaire
    if (updatedParticles.length !== particles.length) {
      setParticles(updatedParticles)
      // Ajuster la taille du tableau de références
      particlesRef.current = particlesRef.current.slice(0, updatedParticles.length)
    }
  })

  return (
    <group>
      {particles.map((particle, i) => (
        <mesh
          key={particle.id}
          position={new Vector3(...particle.position)}
          ref={(el) => {
            if (el && particlesRef.current) {
              particlesRef.current[i] = el
            }
          }}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={(particle.life / particle.maxLife) * 0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

interface ReactionTimeParams {
  solutionsList: string[];
}

function getReactionTime(solutionsList: ReactionTimeParams["solutionsList"]): number {
  const reactionKey: string = solutionsList.sort().join("+");
  const reaction: ReactionType | undefined = reactionData[reactionKey];

  if (!reaction) return 3000;

  switch (reaction.type) {
    case "Neutralisation":
      return Math.abs(reaction.deltaH) > 50 ? 2000 : 3000;
    case "Dissolution":
      return 4000;
    case "Hydratation":
      return 1500;
    case "Dilution":
      return 1000;
    default:
      return 3000;
  }
}

// Interface de contrôle
interface ControlPanelProps {
  leftSolution: string;
  rightSolution: string;
  onLeftSolutionChange: (value: string) => void;
  onRightSolutionChange: (value: string) => void;
  temperature: number;
  mixedSolutions: string[];
  pH: number;
  reactionInfo: ReactionType | null;
  onReset: () => void;
  isReacting: boolean;
  reactionProgress: number;
  leftTemp: number;
  rightTemp: number;
  onLeftTempChange: (value: number) => void;
  onRightTempChange: (value: number) => void;
}

function ControlPanel({
  leftSolution,
  rightSolution,
  onLeftSolutionChange,
  onRightSolutionChange,
  temperature,
  mixedSolutions,
  pH,
  reactionInfo,
  onReset,
  isReacting,
  reactionProgress,
  leftTemp,
  rightTemp,
  onLeftTempChange,
  onRightTempChange,
}: ControlPanelProps) {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showControls, setShowControls] = useState(true)

  return (
    <div className="absolute top-4 left-4 z-10 space-y-4">
      <Button
        onClick={() => setShowControls(!showControls)}
        variant="outline"
        size="sm"
        className="bg-white/90 backdrop-blur-sm"
      >
        {showControls ? "🙈 Masquer" : "👁️ Afficher"} Contrôles
      </Button>

      {showControls && (
        <Card className="w-96 backdrop-blur-sm bg-white/90">
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">🧪 Bécher Gauche</label>
                <Select value={leftSolution} onValueChange={onLeftSolutionChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(solutions)
                      .filter(([key]) => key !== "empty")
                      .map(([key, sol]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: sol.color }} />
                            {sol.formula}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {leftSolution !== "empty" && (
                  <div className="mt-2">
                    <label className="text-xs font-medium mb-1 block">🌡️ Température initiale</label>
                    <Select
                      value={leftTemp.toString()}
                      onValueChange={(value) => onLeftTempChange(Number.parseInt(value))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">❄️ Froide (15°C)</SelectItem>
                        <SelectItem value="20">🏠 Ambiante (20°C)</SelectItem>
                        <SelectItem value="25">☀️ Tiède (25°C)</SelectItem>
                        <SelectItem value="35">🔥 Chaude (35°C)</SelectItem>
                        <SelectItem value="45">🔥 Très chaude (45°C)</SelectItem>
                        <SelectItem value="60">🔥🔥 Très chaude (60°C)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500 mt-1">{leftTemp}°C</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">🧪 Bécher Droit</label>
                <Select value={rightSolution} onValueChange={onRightSolutionChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(solutions)
                      .filter(([key]) => key !== "empty")
                      .map(([key, sol]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: sol.color }} />
                            {sol.formula}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {rightSolution !== "empty" && (
                  <div className="mt-2">
                    <label className="text-xs font-medium mb-1 block">🌡️ Température initiale</label>
                    <Select
                      value={rightTemp.toString()}
                      onValueChange={(value) => onRightTempChange(Number.parseInt(value))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">❄️ Froide (15°C)</SelectItem>
                        <SelectItem value="20">🏠 Ambiante (20°C)</SelectItem>
                        <SelectItem value="25">☀️ Tiède (25°C)</SelectItem>
                        <SelectItem value="35">🔥 Chaude (35°C)</SelectItem>
                        <SelectItem value="45">🔥 Très chaude (45°C)</SelectItem>
                        <SelectItem value="60">🔥🔥 Très chaude (60°C)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500 mt-1">{rightTemp}°C</div>
                  </div>
                )}
              </div>
            </div>

            {isReacting && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-orange-800">⚗️ Réaction en cours...</span>
                  <span className="text-xs text-orange-600">{Math.round(reactionProgress)}%</span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${reactionProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-medium">🔬 Dans le calorimètre:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {mixedSolutions.length > 0 ? (
                  mixedSolutions.map((sol, index) => (
                    <span key={index} className="text-xs text-gray-700 font-medium">
                      {solutions[sol]?.name || sol}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">Vide - Prêt pour l'expérience</span>
                )}
              </div>
            </div>

            {reactionInfo && !isReacting && mixedSolutions.length >= 2 && (
              <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
                <DialogTrigger>
                  <Button variant="default" className="w-full mb-2">
                    📊 Analyser Réaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h3 className="font-semibold text-blue-800 mb-2">Équation Chimique</h3>
                      <div className="text-lg font-mono bg-white p-2 rounded border">{reactionInfo.equation}</div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="font-semibold text-green-800 mb-3">Données Thermodynamiques</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border">
                          <div className="text-sm text-gray-600">Enthalpie de réaction</div>
                          <div className="text-xl font-bold text-green-700">
                            ΔH = {reactionInfo.deltaH > 0 ? "+" : ""}
                            {reactionInfo.deltaH} kJ/mol
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-sm text-gray-600">Type de réaction</div>
                          <div className="text-xl font-bold text-blue-700">
                            {reactionInfo.deltaH < 0 ? "Exothermique" : "Endothermique"}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-sm text-gray-600">Température finale</div>
                          <div className="text-xl font-bold text-red-700">{Math.round(temperature)}°C</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-sm text-gray-600">pH final</div>
                          <div className="text-xl font-bold text-purple-700">{pH.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <h3 className="font-semibold text-yellow-800 mb-2">Mécanisme Réactionnel</h3>
                      <p className="text-gray-700 leading-relaxed">{reactionInfo.description}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button onClick={onReset} variant="outline" className="w-full">
              🔄 Nouvelle Expérience
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Composant principal avec export par défaut
export default function CalorimetrySimulation() {
  const [leftSolution, setLeftSolution] = useState("empty")
  const [rightSolution, setRightSolution] = useState("empty")
  const [leftTemp, setLeftTemp] = useState(20)
  const [rightTemp, setRightTemp] = useState(20)
  const [temperature, setTemperature] = useState(20)
  const [pH, setPH] = useState(7.0)
  const [mixedSolutions, setMixedSolutions] = useState<string[]>([])
  const [solutionTemperatures, setSolutionTemperatures] = useState({})
  const [reactionInfo, setReactionInfo] = useState<ReactionType | null>(null)
  const [isReceiving, setIsReceiving] = useState(false)
  const [selectedBeaker, setSelectedBeaker] = useState<string | null>(null)
  //const controlsRef = useRef<OrbitControlsType | null>(null)
  const [pouringBeaker, setPouringBeaker] = useState<string | null>(null)
  const [isReacting, setIsReacting] = useState(false)
  const [reactionProgress, setReactionProgress] = useState(0)

  const leftPosition: [number, number, number] = [-2.5, -2.85, 0]
  const rightPosition: [number, number, number] = [2.5, -2.85, 0]

  const handleSelectBeaker = (beakerId: string) => {
    setSelectedBeaker(beakerId)
  }

  const handleDrag = (_beakerId: string, position: [number, number, number]) => {
    // Position mise à jour en temps réel
  }

  const handleLeftTempChange = (temp: number) => {
    setLeftTemp(temp)
  }

  const handleRightTempChange = (temp: number): void => {
    setRightTemp(temp)
  }

  const handleDrop = (beakerId: string, solution: string, isPouring: boolean): void => {
    if (isPouring && !pouringBeaker && solution !== "empty") {
      setPouringBeaker(beakerId);

      setTimeout(() => {
        if (!mixedSolutions.includes(solution)) {
          const newMixedSolutions: string[] = [...mixedSolutions, solution];
          const currentTemp: number = beakerId === "left" ? leftTemp : rightTemp;
          const newSolutionTemps: Record<string, number> = {
            ...solutionTemperatures,
            [solution]: currentTemp,
          };

          setMixedSolutions(newMixedSolutions);
          setSolutionTemperatures(newSolutionTemps);
          setIsReceiving(true);

          if (newMixedSolutions.length >= 2) {
            setIsReacting(true);
            setReactionProgress(0);

            const reactionTime: number = getReactionTime(newMixedSolutions);
            const interval: NodeJS.Timeout = setInterval(() => {
              setReactionProgress((prev) => {
                const newProgress: number = prev + 100 / (reactionTime / 100);
                if (newProgress >= 100) {
                  clearInterval(interval);
                  setIsReacting(false);
                  calculateReactionProperties(newMixedSolutions, newSolutionTemps);
                  return 100;
                }
                return newProgress;
              });
            }, 100);
          }
        }
      }, 500);
    } else if (!isPouring && pouringBeaker === beakerId) {
      setPouringBeaker(null);
      setSelectedBeaker(null);
      setTimeout(() => setIsReceiving(false), 500);
    }
  };

  interface CalculateReactionPropertiesParams {
    solutionsList: string[];
    solutionTemps: Record<string, number>;
  }

  interface MixtureProperties {
    temp: number;
    pH: number;
    color: string;
    reaction: ReactionType | null;
  }

  const calculateReactionProperties = (
    solutionsList: string[],
    solutionTemps: Record<string, number>
  ): void => {
    const properties: MixtureProperties = calculateMixtureProperties(solutionsList, solutionTemps);

    setTemperature(properties.temp);
    setPH(properties.pH);
    setReactionInfo(properties.reaction);
  };

  const handleReset = () => {
    setMixedSolutions([])
    setSolutionTemperatures({})
    setTemperature(20)
    setPH(7.0)
    setReactionInfo(null)
    setIsReceiving(false)
    setPouringBeaker(null)
    setSelectedBeaker(null)
    setIsReacting(false)
    setReactionProgress(0)
    setLeftTemp(20)
    setRightTemp(20)
  }

  /*useEffect(() => {
    if (controlsRef.current) {
      if (controlsRef.current && 'controls' in controlsRef.current) {
        if (controlsRef.current && 'controls' in controlsRef.current) {
          if (controlsRef.current && 'enabled' in controlsRef.current) {
            controlsRef.current.enabled = !selectedBeaker;
          }
        }
      }
    }
  }, [selectedBeaker])*/

  return (
    <div className="w-full h-full relative">
      <ControlPanel
        leftSolution={leftSolution}
        rightSolution={rightSolution}
        onLeftSolutionChange={setLeftSolution}
        onRightSolutionChange={setRightSolution}
        leftTemp={leftTemp}
        rightTemp={rightTemp}
        onLeftTempChange={handleLeftTempChange}
        onRightTempChange={handleRightTempChange}
        temperature={temperature}
        pH={pH}
        mixedSolutions={mixedSolutions}
        reactionInfo={reactionInfo}
        onReset={handleReset}
        isReacting={isReacting}
        reactionProgress={reactionProgress}
      />

      <Canvas shadows>
        <color attach="background" args={["#f5f5f5"]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#ffffff" />
        <pointLight position={[5, 3, -5]} intensity={0.5} color="#ffffff" />

        <LabEnvironment />
        <LabTable />

        <Calorimeter
          temperature={temperature}
          mixedSolutions={mixedSolutions}
          isReceiving={isReceiving}
          pH={pH}
          reactionInfo={reactionInfo}
        />

        <ExternalThermometer temperature={temperature} />

        <DraggableBeaker
          id="left"
          position={leftPosition}
          solution={leftSolution}
          onDrag={handleDrag}
          onDrop={(beakerId, solution, isPouring) => handleDrop(beakerId, solution, isPouring)}
          isPouring={pouringBeaker === "left"}
          side="left"
          onSelect={handleSelectBeaker}
        />

        <DraggableBeaker
          id="right"
          position={rightPosition}
          solution={rightSolution}
          onDrag={handleDrag}
          onDrop={(beakerId, solution, isPouring) => handleDrop(beakerId, solution, isPouring)}
          isPouring={pouringBeaker === "right"}
          side="right"
          onSelect={handleSelectBeaker}
        />

        <ReactionParticles solutions={mixedSolutions} temperature={temperature} reactionInfo={reactionInfo} />

        <Text position={[0, 3.5, -6]} fontSize={0.4} color="#2c3e50" anchorX="center" anchorY="middle">
          LABORATOIRE DE CHIMIE - CALORIMÉTRIE QUANTITATIVE
        </Text>

        <Environment preset="apartment" />
        <OrbitControls
         // ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={4}
          maxDistance={12}
          target={[0, -1, 0]}
        />
      </Canvas>

      <div className="absolute bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg">
        <div className="text-sm space-y-1">
          <div className="flex items-center">
            🖱️ <span className="ml-2">Cliquez sur un bécher pour le sélectionner</span>
          </div>
          <div className="flex items-center">
            🧪 <span className="ml-2">Glissez-le au-dessus du calorimètre pour verser</span>
          </div>
          <div className="flex items-center">
            🔬 <span className="ml-2">Observez les réactions chimiques réelles</span>
          </div>
          <div className="flex items-center">
            📊 <span className="ml-2">Analysez les données thermodynamiques</span>
          </div>
        </div>
      </div>
    </div>
  )
}
