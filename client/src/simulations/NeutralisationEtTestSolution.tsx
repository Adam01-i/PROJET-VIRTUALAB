"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text, Html, Environment } from "@react-three/drei"
import { RotateCcw, Eye, Info, BookOpen, Award, AlertTriangle, Droplets, Sparkles, FlaskConical, CheckCircle } from 'lucide-react'
import * as THREE from "three"

// ===================================
// TYPES ET DONNÉES CHIMIQUES OPTIMISÉES
// ===================================

interface ReactionChimique {
  id: string
  nom: string
  equation: string
  type: "acide-base" | "precipitation" | "indicateur"
  couleurInitiale1: string
  couleurInitiale2: string
  couleurFinale: string
  precipite?: boolean
  couleurPrecipite?: string
  bulles?: boolean
  description: string
  observation: string
  explication: string
  niveau: "facile" | "moyen" | "difficile"
}

interface Solution {
  id: string
  nom: string
  formule: string
  couleur: string
  concentration: string
  pH?: number
  type: "acide" | "base" | "sel" | "indicateur"
  securite: "faible" | "moyen" | "eleve"
  description: string
  transparent?: boolean
  opacity?: number
}

// Base de données des solutions - SEULEMENT CELLES QUI RÉAGISSENT
const SOLUTIONS: Record<string, Solution> = {
  // Acides
  hcl: {
    id: "hcl",
    nom: "Acide chlorhydrique",
    formule: "HCl",
    couleur: "#3b82f6",
    concentration: "0.1 M",
    pH: 1,
    type: "acide",
    securite: "eleve",
    description: "Acide fort, incolore, très réactif",
  },
  ch3cooh: {
    id: "ch3cooh",
    nom: "Acide acétique",
    formule: "CH₃COOH",
    couleur: "#60a5fa",
    concentration: "0.1 M",
    pH: 3,
    type: "acide",
    securite: "moyen",
    description: "Acide faible, vinaigre dilué",
  },

  // Bases
  naoh: {
    id: "naoh",
    nom: "Soude",
    formule: "NaOH",
    couleur: "#10b981",
    concentration: "0.1 M",
    pH: 13,
    type: "base",
    securite: "eleve",
    description: "Base forte, très corrosive",
  },
  nh3: {
    id: "nh3",
    nom: "Ammoniaque",
    formule: "NH₃",
    couleur: "#06b6d4",
    concentration: "0.1 M",
    pH: 11,
    type: "base",
    securite: "moyen",
    description: "Base faible, odeur piquante",
  },

  // Sels pour précipitation
  agno3: {
    id: "agno3",
    nom: "Nitrate d'argent",
    formule: "AgNO₃",
    couleur: "#e5e7eb",
    concentration: "0.1 M",
    type: "sel",
    securite: "eleve",
    description: "Sel d'argent, forme des précipités colorés",
  },
  nacl: {
    id: "nacl",
    nom: "Chlorure de sodium",
    formule: "NaCl",
    couleur: "#f8fafc",
    concentration: "0.1 M",
    type: "sel",
    securite: "faible",
    description: "Sel de table dissous",
    transparent: true,
    opacity: 0.3,
  },
  cuso4: {
    id: "cuso4",
    nom: "Sulfate de cuivre",
    formule: "CuSO₄",
    couleur: "#1e40af",
    concentration: "0.1 M",
    type: "sel",
    securite: "moyen",
    description: "Sel de cuivre, bleu caractéristique",
  },

  // Indicateurs colorés - CORRIGÉS
  bbt: {
    id: "bbt",
    nom: "Bleu de bromothymol",
    formule: "BBT",
    couleur: "#fbbf24", // Jaune en milieu acide
    concentration: "0.1%",
    type: "indicateur",
    securite: "faible",
    description: "Indicateur coloré pH : jaune→vert→bleu",
    transparent: true,
    opacity: 0.6,
  },
  phenol: {
    id: "phenol",
    nom: "Phénolphtaléine",
    formule: "C₂₀H₁₄O₄",
    couleur: "#f8fafc", // Incolore en milieu neutre/acide
    concentration: "0.1%",
    type: "indicateur",
    securite: "faible",
    description: "Indicateur : incolore→rose en milieu basique",
    transparent: true,
    opacity: 0.2,
  },
}

// Base de données des réactions - SEULEMENT LES RÉACTIONS POSSIBLES
const REACTIONS: Record<string, ReactionChimique> = {
  "hcl-naoh": {
    id: "hcl-naoh",
    nom: "Neutralisation acide-base",
    equation: "HCl + NaOH → NaCl + H₂O",
    type: "acide-base",
    couleurInitiale1: "#3b82f6",
    couleurInitiale2: "#10b981",
    couleurFinale: "#94a3b8",
    description: "Réaction de neutralisation classique",
    observation: "Mélange des couleurs, léger dégagement de chaleur",
    explication: "L'acide et la base se neutralisent pour former un sel et de l'eau",
    niveau: "facile",
  },

  "ch3cooh-naoh": {
    id: "ch3cooh-naoh",
    nom: "Neutralisation acide faible-base forte",
    equation: "CH₃COOH + NaOH → CH₃COONa + H₂O",
    type: "acide-base",
    couleurInitiale1: "#60a5fa",
    couleurInitiale2: "#10b981",
    couleurFinale: "#8b5cf6",
    description: "Neutralisation d'un acide faible par une base forte",
    observation: "Changement de couleur progressif",
    explication: "Formation d'acétate de sodium et d'eau",
    niveau: "moyen",
  },

  "hcl-nh3": {
    id: "hcl-nh3",
    nom: "Neutralisation acide fort-base faible",
    equation: "HCl + NH₃ → NH₄Cl",
    type: "acide-base",
    couleurInitiale1: "#3b82f6",
    couleurInitiale2: "#06b6d4",
    couleurFinale: "#0ea5e9",
    description: "Neutralisation d'un acide fort par une base faible",
    observation: "Formation de chlorure d'ammonium",
    explication: "Réaction acide-base avec formation d'un sel",
    niveau: "moyen",
  },

  "hcl-bbt": {
    id: "hcl-bbt",
    nom: "Test d'acidité avec BBT",
    equation: "HCl + BBT → BBT⁺ (jaune)",
    type: "indicateur",
    couleurInitiale1: "#3b82f6",
    couleurInitiale2: "#fbbf24",
    couleurFinale: "#eab308",
    description: "Test colorimétrique d'acidité",
    observation: "L'indicateur devient jaune vif en milieu acide",
    explication: "Le BBT change de couleur selon le pH : jaune en milieu acide",
    niveau: "facile",
  },

  "naoh-bbt": {
    id: "naoh-bbt",
    nom: "Test de basicité avec BBT",
    equation: "NaOH + BBT → BBT⁻ (bleu)",
    type: "indicateur",
    couleurInitiale1: "#10b981",
    couleurInitiale2: "#fbbf24",
    couleurFinale: "#3b82f6",
    description: "Test colorimétrique de basicité",
    observation: "L'indicateur devient bleu en milieu basique",
    explication: "Le BBT devient bleu en milieu basique (pH > 7.6)",
    niveau: "facile",
  },

  "naoh-phenol": {
    id: "naoh-phenol",
    nom: "Test de basicité avec phénolphtaléine",
    equation: "NaOH + Phénolphtaléine → Rose vif",
    type: "indicateur",
    couleurInitiale1: "#10b981",
    couleurInitiale2: "#f8fafc",
    couleurFinale: "#ec4899",
    description: "Test colorimétrique de basicité",
    observation: "Apparition spectaculaire d'une couleur rose intense",
    explication: "La phénolphtaléine devient rose fuchsia en milieu basique",
    niveau: "facile",
  },

  "agno3-nacl": {
    id: "agno3-nacl",
    nom: "Précipitation de chlorure d'argent",
    equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
    type: "precipitation",
    couleurInitiale1: "#e5e7eb",
    couleurInitiale2: "#f8fafc",
    couleurFinale: "#f1f5f9",
    precipite: true,
    couleurPrecipite: "#ffffff",
    description: "Formation d'un précipité blanc caractéristique",
    observation: "Apparition immédiate d'un précipité blanc floconneux",
    explication: "Les ions Ag⁺ et Cl⁻ forment un composé insoluble (AgCl)",
    niveau: "moyen",
  },

  "cuso4-naoh": {
    id: "cuso4-naoh",
    nom: "Précipitation d'hydroxyde de cuivre",
    equation: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
    type: "precipitation",
    couleurInitiale1: "#1e40af",
    couleurInitiale2: "#10b981",
    couleurFinale: "#1e3a8a",
    precipite: true,
    couleurPrecipite: "#1e3a8a",
    description: "Formation d'un précipité bleu gélatineux",
    observation: "Précipité bleu caractéristique de l'hydroxyde de cuivre",
    explication: "Formation d'hydroxyde de cuivre Cu(OH)₂ insoluble",
    niveau: "moyen",
  },
}

// ===================================
// COMPOSANTS 3D AMÉLIORÉS
// ===================================

const FloatingToggleButtons = ({ sectionVisibility, toggleSectionVisibility }: any) => (
  <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
    {!sectionVisibility.controls && (
      <button
        onClick={() => toggleSectionVisibility('controls')}
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher les contrôles"
      >
        <FlaskConical size={16} />
      </button>
    )}
    {!sectionVisibility.observations && (
      <button
        onClick={() => toggleSectionVisibility('observations')}
        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher les observations"
      >
        <Eye size={16} />
      </button>
    )}
    {!sectionVisibility.guide && (
      <button
        onClick={() => toggleSectionVisibility('guide')}
        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Afficher le guide"
      >
        <Info size={16} />
      </button>
    )}
  </div>
)

function LabEnvironmentChimie() {
  return (
    <group>
      {/* Sol de laboratoire */}
      <mesh position={[0, -3.5, 0]} receiveShadow>
        <boxGeometry args={[20, 0.1, 15]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>

      {/* Mur arrière avec tableau périodique */}
      <mesh position={[0, 0, -7]} receiveShadow>
        <boxGeometry args={[20, 8, 0.2]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>

      {/* Tableau périodique décoratif */}
      <group position={[0, 1, -6.8]}>
        <mesh>
          <boxGeometry args={[6, 3, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Html position={[0, 0, 0.1]} transform scale={0.2}>
          <div className="bg-white p-4 rounded border-2 border-blue-500">
            <div className="text-center font-bold text-blue-800 mb-2">RÉACTIONS CHIMIQUES</div>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {[
                { symbol: "A+B", name: "Neutralisation", color: "bg-green-100" },
                { symbol: "Ind", name: "Indicateurs", color: "bg-yellow-100" },
                { symbol: "Ppt", name: "Précipitation", color: "bg-blue-100" },
                { symbol: "pH", name: "Acidité", color: "bg-red-100" },
              ].map((element, i) => (
                <div key={i} className={`${element.color} border border-gray-400 p-2 text-center rounded`}>
                  <div className="font-bold text-xs">{element.symbol}</div>
                  <div className="text-xs">{element.name}</div>
                </div>
              ))}
            </div>
          </div>
        </Html>
      </group>

      {/* Armoires de produits chimiques */}
      <group position={[-8, 0, -6]}>
        <mesh castShadow>
          <boxGeometry args={[2, 4, 1]} />
          <meshStandardMaterial color="#374151" roughness={0.3} />
        </mesh>
        <Html position={[0, 2.2, 0.6]} transform scale={0.1}>
          <div className="bg-red-600 text-white px-2 py-1 rounded font-bold text-center">
            ⚠️ RÉACTIFS
            <br />
            CHIMIQUES
          </div>
        </Html>
      </group>

      {/* Hotte aspirante */}
      <group position={[0, 2, -6.5]}>
        <mesh castShadow>
          <boxGeometry args={[8, 2, 0.5]} />
          <meshStandardMaterial color="#6b7280" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[8.2, 0.2, 0.7]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>

      {/* Éclairage de laboratoire */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 3.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.1, 0.3]} />
            <meshStandardMaterial color="#f3f4f6" emissive="#ffffff" emissiveIntensity={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function TableLaboratoire() {
  return (
    <group position={[0, -3.4, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[10, 0.2, 5]} />
        <meshStandardMaterial color="#1f2937" roughness={0.3} />
      </mesh>
      {/* Pieds de table */}
      {[
        [-4, -1, -2],
        [4, -1, -2],
        [-4, -1, 2],
        [4, -1, 2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.2, 2, 0.2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}
    </group>
  )
}

const BecherChimique = ({
  position,
  solution,
  fillLevel = 0.8,
  onClick,
  isPouring = false,
  isReacting = false,
  precipite = false,
  couleurPrecipite = "#ffffff",
}: {
  position: [number, number, number]
  solution: Solution
  fillLevel?: number
  onClick?: () => void
  isPouring?: boolean
  isReacting?: boolean
  precipite?: boolean
  couleurPrecipite?: string
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return

    if (isPouring) {
      const isLeft = position[0] < 0
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, isLeft ? 0.3 : -0.3, 0.03)
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 2.5, 0.03)
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        isLeft ? -Math.PI / 3 : Math.PI / 3,
        0.03,
      )
    } else {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, position[0], 0.05)
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.05)
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.05)
    }

    if (hovered && !isPouring) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.02
    }

    if (isReacting) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1
    }
  })

  return (
    <group
      position={position}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <group ref={meshRef}>
        {/* Bécher en verre */}
        <Cylinder args={[0.6, 0.55, 1.8, 32]} position={[0, 0, 0]} castShadow>
          <meshPhysicalMaterial
            color="#f8fafc"
            transparent
            opacity={0.2}
            roughness={0.05}
            transmission={0.95}
            thickness={0.1}
          />
        </Cylinder>

        {/* Bec verseur */}
        <Cylinder args={[0.62, 0.6, 0.12, 32]} position={[0, 0.84, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </Cylinder>

        {/* Solution chimique - CORRIGÉE POUR LES INDICATEURS */}
        {fillLevel > 0 && (
          <group>
            <Cylinder args={[0.55, 0.5, fillLevel * 1.6]} position={[0, -0.9 + (fillLevel * 1.6) / 2, 0]}>
              <meshStandardMaterial
                color={solution.couleur}
                transparent={solution.transparent || false}
                opacity={solution.transparent ? solution.opacity || 0.6 : 0.9}
                emissive={solution.transparent ? "#000000" : solution.couleur}
                emissiveIntensity={solution.transparent ? 0 : 0.1}
              />
            </Cylinder>

            {/* Surface de la solution */}
            <Cylinder args={[0.55, 0.55, 0.02]} position={[0, -0.9 + fillLevel * 1.6, 0]}>
              <meshStandardMaterial
                color={solution.couleur}
                transparent={solution.transparent || false}
                opacity={solution.transparent ? solution.opacity || 0.6 : 1.0}
                roughness={0.0}
                metalness={0.2}
                emissive={solution.transparent ? "#000000" : solution.couleur}
                emissiveIntensity={solution.transparent ? 0 : 0.2}
              />
            </Cylinder>

            {/* Précipité au fond */}
            {precipite && (
              <Cylinder args={[0.5, 0.45, 0.1]} position={[0, -1.7, 0]}>
                <meshStandardMaterial color={couleurPrecipite} roughness={0.8} />
              </Cylinder>
            )}
          </group>
        )}

        {/* Graduations */}
        {Array.from({ length: 5 }, (_, i) => (
          <Text
            key={i}
            position={[0.65, -0.6 + i * 0.3, 0]}
            fontSize={0.06}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
          >
            {(i + 1) * 20}mL
          </Text>
        ))}

        {/* Jet de versement */}
        {isPouring && fillLevel > 0.1 && (
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(position[0] < 0 ? 0.6 : -0.6, 0.9, 0),
                  new THREE.Vector3(position[0] < 0 ? 0.8 : -0.8, 0.7, 0),
                ]),
                64,
                0.04,
                8,
                false,
              ]}
            />
            <meshStandardMaterial
              color={solution.couleur}
              transparent={solution.transparent || false}
              opacity={solution.transparent ? solution.opacity || 0.6 : 0.8}
              emissive={solution.transparent ? "#000000" : solution.couleur}
              emissiveIntensity={solution.transparent ? 0 : 0.3}
            />
          </mesh>
        )}
      </group>

      {/* Étiquette de la solution */}
      <group position={[0, 2.2, 0]}>
        <Text position={[0, 0.2, 0]} fontSize={0.12} color="#1f2937" anchorX="center" anchorY="middle">
          {solution.nom}
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.09} color="#4b5563" anchorX="center" anchorY="middle">
          {solution.formule}
        </Text>
        <Text position={[0, -0.15, 0]} fontSize={0.07} color="#6b7280" anchorX="center" anchorY="middle">
          {solution.concentration}
        </Text>

        {/* Indicateur de sécurité */}
        {solution.securite === "eleve" && (
          <Sphere args={[0.04]} position={[0.25, 0.1, 0]}>
            <meshBasicMaterial color="#ef4444" />
          </Sphere>
        )}
        {solution.securite === "moyen" && (
          <Sphere args={[0.04]} position={[0.25, 0.1, 0]}>
            <meshBasicMaterial color="#f59e0b" />
          </Sphere>
        )}
      </group>

      {/* Effet de survol */}
      {hovered && (
        <Cylinder args={[0.7, 0.7, 0.05]} position={[0, -1.2, 0]}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </Cylinder>
      )}
    </group>
  )
}

const RecipientReaction = ({
  position,
  couleurSolution,
  fillLevel = 0,
  isReacting = false,
  precipite = false,
  couleurPrecipite = "#ffffff",
  bulles = false,
  reaction,
}: {
  position: [number, number, number]
  couleurSolution: string
  fillLevel: number
  isReacting?: boolean
  precipite?: boolean
  couleurPrecipite?: string
  bulles?: boolean
  reaction?: ReactionChimique | null
}) => {
  const bubblesRef = useRef<THREE.Group>(null)
  const solutionRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    // Animation des bulles
    if (bubblesRef.current && bulles) {
      bubblesRef.current.children.forEach((bubble, i) => {
        bubble.position.y += 0.02 + Math.sin(state.clock.elapsedTime + i) * 0.01
        if (bubble.position.y > 1.5) {
          bubble.position.y = -1
          bubble.position.x = (Math.random() - 0.5) * 0.6
          bubble.position.z = (Math.random() - 0.5) * 0.6
        }
      })
    }

    // Animation de la solution pendant la réaction
    if (solutionRef.current && isReacting) {
      const mat = solutionRef.current.material as THREE.MeshStandardMaterial
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1
      }
    }
  })

  return (
    <group position={[position[0], position[1] - 1.5, position[2]]}>
      {/* Récipient principal */}
      <Cylinder args={[1.0, 0.9, 2.5, 32]} position={[0, 0, 0]} castShadow>
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.15}
          roughness={0.02}
          transmission={0.98}
          thickness={0.05}
        />
      </Cylinder>

      {/* Base du récipient */}
      <Cylinder args={[0.9, 0.9, 0.1]} position={[0, -1.2, 0]} castShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </Cylinder>

      {/* Solution chimique */}
      {fillLevel > 0 && (
        <group>
          <Cylinder
            ref={solutionRef}
            args={[0.85, 0.8, fillLevel * 2.2]}
            position={[0, -1.1 + (fillLevel * 2.2) / 2, 0]}
          >
            <meshStandardMaterial
              color={couleurSolution}
              transparent={false}
              opacity={1.0}
              roughness={0.1}
              metalness={0.05}
              emissive={couleurSolution}
              emissiveIntensity={isReacting ? 0.3 : 0.1}
            />
          </Cylinder>

          {/* Surface de la solution */}
          <Cylinder args={[0.85, 0.85, 0.03]} position={[0, -1.1 + fillLevel * 2.2, 0]}>
            <meshStandardMaterial
              color={couleurSolution}
              roughness={0.0}
              metalness={0.3}
              emissive={couleurSolution}
              emissiveIntensity={0.2}
            />
          </Cylinder>

          {/* Précipité */}
          {precipite && (
            <group>
              <Cylinder args={[0.8, 0.75, 0.15]} position={[0, -2.0, 0]}>
                <meshStandardMaterial color={couleurPrecipite} roughness={0.9} />
              </Cylinder>
              {/* Particules de précipité en suspension */}
              {Array.from({ length: 8 }, (_, i) => (
                <Sphere
                  key={i}
                  args={[0.02 + Math.random() * 0.02]}
                  position={[(Math.random() - 0.5) * 0.6, -1.5 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6]}
                >
                  <meshStandardMaterial color={couleurPrecipite} />
                </Sphere>
              ))}
            </group>
          )}
        </group>
      )}

      {/* Bulles de gaz */}
      {bulles && (
        <group ref={bubblesRef}>
          {Array.from({ length: 12 }, (_, i) => (
            <Sphere
              key={i}
              args={[0.015 + Math.random() * 0.02]}
              position={[(Math.random() - 0.5) * 0.6, -1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6]}
            >
              <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={0.7}
                emissive="#ffffff"
                emissiveIntensity={0.2}
              />
            </Sphere>
          ))}
        </group>
      )}

      {/* Étiquette du récipient */}
      <Text position={[0, -2.8, 0]} fontSize={0.1} color="#1f2937" anchorX="center" anchorY="middle">
        Récipient de Réaction
      </Text>

      {/* Affichage de la réaction en cours */}
      {reaction && (
        <group position={[1.2, 0, 0]}>
          <Box args={[0.8, 0.6, 0.1]} castShadow>
            <meshStandardMaterial color="#1f2937" />
          </Box>
          <Html position={[0, 0, 0.06]} transform scale={0.08}>
            <div className="bg-green-900 text-green-100 p-2 rounded text-center">
              <div className="font-bold text-xs mb-1">{reaction.nom}</div>
              <div className="text-xs font-mono">{reaction.equation}</div>
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}

// ===================================
// SCÈNE PRINCIPALE
// ===================================

const SceneChimie = ({
  solution1,
  solution2,
  etape,
  solution1Ajoutee,
  solution2Ajoutee,
  enReaction,
  versementGauche,
  versementDroite,
  onVerserSolution1,
  onVerserSolution2,
  niveauBecher1,
  niveauBecher2,
  reactionActive,
  couleurFinale,
  precipite,
  couleurPrecipite,
  bulles,
}: {
  solution1: Solution
  solution2: Solution
  etape: number
  solution1Ajoutee: boolean
  solution2Ajoutee: boolean
  enReaction: boolean
  reactionTerminee: boolean
  versementGauche: boolean
  versementDroite: boolean
  onVerserSolution1: () => void
  onVerserSolution2: () => void
  niveauBecher1: number
  niveauBecher2: number
  reactionActive: ReactionChimique | null
  couleurFinale: string
  precipite: boolean
  couleurPrecipite: string
  bulles: boolean
}) => {
  const niveauRemplissage = useMemo(() => {
    if (etape >= 2) return 0.8
    if (solution1Ajoutee || solution2Ajoutee) return 0.4
    return 0
  }, [etape, solution1Ajoutee, solution2Ajoutee])

  return (
    <>
      {/* Éclairage optimisé pour la chimie */}
      <ambientLight intensity={0.5} color="#f0f9ff" />
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
      <pointLight position={[0, 6, 0]} intensity={0.4} color="#ffffff" distance={12} decay={2} />
      <pointLight position={[-5, 4, 3]} intensity={0.3} color="#ddd6fe" distance={10} decay={2} />
      <pointLight position={[5, 4, 3]} intensity={0.3} color="#ddd6fe" distance={10} decay={2} />

      <color attach="background" args={["#0f172a"]} />
      <fog attach="fog" args={["#0f172a", 12, 25]} />

      <LabEnvironmentChimie />
      <TableLaboratoire />

      {/* Béchers avec solutions */}
      <BecherChimique
        position={[-2, -2.2, 0]}
        solution={solution1}
        fillLevel={niveauBecher1}
        onClick={onVerserSolution1}
        isPouring={versementGauche}
        isReacting={enReaction}
      />

      <BecherChimique
        position={[2, -2.2, 0]}
        solution={solution2}
        fillLevel={niveauBecher2}
        onClick={onVerserSolution2}
        isPouring={versementDroite}
        isReacting={enReaction}
      />

      {/* Récipient de réaction central */}
      <RecipientReaction
        position={[0, -0.5, 0]}
        couleurSolution={couleurFinale}
        fillLevel={niveauRemplissage}
        isReacting={enReaction}
        precipite={precipite}
        couleurPrecipite={couleurPrecipite}
        bulles={bulles}
        reaction={reactionActive}
      />

      {/* Titre du laboratoire */}
      <Text position={[0, 3, -5]} fontSize={0.25} color="#1e293b" anchorX="center" anchorY="middle">
        LABORATOIRE DE RÉACTIONS CHIMIQUES - 1ère S
      </Text>

      <Environment preset="apartment" />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={20}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 8}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  )
}

// ===================================
// HOOK PRINCIPAL
// ===================================

const useSimulationChimie = () => {
  const [solution1, setSolution1] = useState(SOLUTIONS.hcl)
  const [solution2, setSolution2] = useState(SOLUTIONS.naoh)
  const [etape, setEtape] = useState(0)
  const [solution1Ajoutee, setSolution1Ajoutee] = useState(false)
  const [solution2Ajoutee, setSolution2Ajoutee] = useState(false)
  const [enReaction, setEnReaction] = useState(false)
  const [reactionTerminee, setReactionTerminee] = useState(false)
  const [versementGauche, setVersementGauche] = useState(false)
  const [versementDroite, setVersementDroite] = useState(false)
  const [niveauBecher1, setNiveauBecher1] = useState(0.8)
  const [niveauBecher2, setNiveauBecher2] = useState(0.8)
  const [reactionActive, setReactionActive] = useState<ReactionChimique | null>(null)
  const [observations, setObservations] = useState<string[]>([])
  const [showResultats, setShowResultats] = useState(false)
  const [progressReaction, setProgressReaction] = useState(0)
  const [sectionVisibility, setSectionVisibility] = useState({
    controls: true,
    observations: true,
    guide: true,
    results: true
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
        question: "Que se passe-t-il lors d'une réaction de neutralisation acide-base ?",
        options: [
          { id: 'formation_sel', text: 'Formation d\'un sel et d\'eau' },
          { id: 'formation_gaz', text: 'Formation d\'un gaz' },
          { id: 'formation_precipite', text: 'Formation d\'un précipité coloré' },
          { id: 'aucun_changement', text: 'Aucun changement visible' }
        ],
        correct: 'formation_sel',
        explanation: "Lors d'une neutralisation acide-base, l'acide et la base réagissent pour former un sel et de l'eau selon la réaction générale : Acide + Base → Sel + H₂O"
      },
      {
        id: 'q2',
        question: "Pourquoi la phénolphtaléine devient-elle rose en milieu basique ?",
        options: [
          { id: 'temperature', text: 'À cause de la température' },
          { id: 'changement_ph', text: 'À cause du changement de pH' },
          { id: 'concentration', text: 'À cause de la concentration' },
          { id: 'precipitation', text: 'À cause d\'une précipitation' }
        ],
        correct: 'changement_ph',
        explanation: "La phénolphtaléine est un indicateur coloré qui change de couleur selon le pH : elle est incolore en milieu acide/neutre (pH < 8.2) et devient rose en milieu basique (pH > 8.2)."
      }
    ]
    
    if (answer === questions[currentQuestionIndex].correct) {
      setCorrectAnswers(prev => prev + 1)
    }
  }, [currentQuestionIndex])

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

  // Calcul des propriétés de la réaction
  const reactionData = useMemo(() => {
    const reactionId1 = `${solution1.id}-${solution2.id}`
    const reactionId2 = `${solution2.id}-${solution1.id}`
    return REACTIONS[reactionId1] || REACTIONS[reactionId2] || null
  }, [solution1.id, solution2.id])

  const couleurFinale = useMemo(() => {
    if (reactionTerminee && reactionData) return reactionData.couleurFinale
    if (solution2Ajoutee && reactionData) {
      const color1 = new THREE.Color(reactionData.couleurInitiale1)
      const color2 = new THREE.Color(reactionData.couleurInitiale2)
      return "#" + color1.lerp(color2, 0.5).getHexString()
    }
    if (solution1Ajoutee) return solution1.couleur
    return "#f8fafc"
  }, [etape, solution1Ajoutee, solution2Ajoutee, reactionTerminee, reactionData])

  const precipite = reactionData?.precipite || false
  const couleurPrecipite = reactionData?.couleurPrecipite || "#ffffff"
  const bulles = reactionData?.bulles || false

  // Reset lors du changement de solutions
  useEffect(() => {
    const resetState = () => {
      setSolution1Ajoutee(false)
      setSolution2Ajoutee(false)
      setEtape(0)
      setNiveauBecher1(0.8)
      setNiveauBecher2(0.8)
      setEnReaction(false)
      setReactionTerminee(false)
      setVersementGauche(false)
      setVersementDroite(false)
      setReactionActive(null)
      setObservations([])
      setShowResultats(false)
      setProgressReaction(0)
    }
    resetState()
  }, [solution1.id, solution2.id])

  const verserSolution = useCallback(
    (numeroSolution: 1 | 2) => {
      if (etape === 0) {
        if (numeroSolution === 1) {
          setVersementGauche(true)
          setTimeout(() => {
            setSolution1Ajoutee(true)
            setVersementGauche(false)
            setNiveauBecher1(0.3)
            setEtape(1)
            setObservations((prev) => [...prev, `✅ ${solution1.nom} ajouté au récipient`])
          }, 2000)
        } else {
          setVersementDroite(true)
          setTimeout(() => {
            setSolution2Ajoutee(true)
            setVersementDroite(false)
            setNiveauBecher2(0.3)
            setEtape(1)
            setObservations((prev) => [...prev, `✅ ${solution2.nom} ajouté au récipient`])
          }, 2000)
        }
      } else if (etape === 1) {
        if ((numeroSolution === 1 && !solution1Ajoutee) || (numeroSolution === 2 && !solution2Ajoutee)) {
          if (numeroSolution === 1) {
            setVersementGauche(true)
            setTimeout(() => {
              setSolution1Ajoutee(true)
              setVersementGauche(false)
              setNiveauBecher1(0.3)
              setEtape(2)
              demarrerReaction()
            }, 2000)
          } else {
            setVersementDroite(true)
            setTimeout(() => {
              setSolution2Ajoutee(true)
              setVersementDroite(false)
              setNiveauBecher2(0.3)
              setEtape(2)
              demarrerReaction()
            }, 2000)
          }
        }
      }
    },
    [etape, solution1Ajoutee, solution2Ajoutee, solution1, solution2],
  )

  const demarrerReaction = useCallback(() => {
    if (!reactionData) {
      setObservations((prev) => {
        const newObs = "⚠️ Ces solutions ne réagissent pas ensemble"
        return prev.includes(newObs) ? prev : [...prev, newObs]
      })
      return
    }

    setEnReaction(true)
    setReactionActive(reactionData)
    setObservations((prev) => {
      const newObs = `🧪 Début de la réaction: ${reactionData.nom}`
      return prev.includes(newObs) ? prev : [...prev, newObs]
    })
    setProgressReaction(0)

    const dureeReaction = 5000
    const startTime = Date.now()

    const updateReaction = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / dureeReaction, 1)
      setProgressReaction(progress)

      if (progress < 1) {
        requestAnimationFrame(updateReaction)
      } else {
        setEnReaction(false)
        setReactionTerminee(true)
        setEtape(3)
        setObservations((prev) => {
          const obs1 = `🎯 ${reactionData.observation}`
          const obs2 = `📚 ${reactionData.explication}`
          const newObservations = []
          if (!prev.includes(obs1)) newObservations.push(obs1)
          if (!prev.includes(obs2)) newObservations.push(obs2)
          return [...prev, ...newObservations]
        })
        // Déclencher le quiz après 2 secondes
        setTimeout(() => {
          setShowQuiz(true)
        }, 2000)
      }
    }

    requestAnimationFrame(updateReaction)
  }, [reactionData])

  const obtenirMessageStatut = useCallback(() => {
    if (versementGauche || versementDroite) return "⏳ Versement en cours..."
    if (!reactionData) return "⚠️ Ces solutions ne réagissent pas ensemble. Choisissez d'autres réactifs."
    const messages = [
      "🧪 Choisissez vos solutions et cliquez sur un bécher pour commencer !",
      "✅ Première solution ajoutée. Ajoutez la seconde solution.",
      `🔬 Réaction en cours... ${(progressReaction * 100).toFixed(0)}%`,
      "🎉 Réaction terminée ! Observez les résultats et consultez l'analyse.",
    ]
    return messages[etape] || messages[0]
  }, [etape, progressReaction, versementGauche, versementDroite, reactionData])

  const reinitialiser = useCallback(() => {
    setSolution1Ajoutee(false)
    setSolution2Ajoutee(false)
    setEtape(0)
    setNiveauBecher1(0.8)
    setNiveauBecher2(0.8)
    setEnReaction(false)
    setReactionTerminee(false)
    setVersementGauche(false)
    setVersementDroite(false)
    setReactionActive(null)
    setObservations([])
    setShowResultats(false)
    setProgressReaction(0)
  }, [])

  return {
    solution1,
    solution2,
    etape,
    solution1Ajoutee,
    solution2Ajoutee,
    enReaction,
    reactionTerminee,
    versementGauche,
    versementDroite,
    niveauBecher1,
    niveauBecher2,
    reactionActive,
    observations,
    showResultats,
    progressReaction,
    couleurFinale,
    precipite,
    couleurPrecipite,
    bulles,
    reactionData,
    setSolution1,
    setSolution2,
    setShowResultats,
    verserSolution1: () => verserSolution(1),
    verserSolution2: () => verserSolution(2),
    obtenirMessageStatut,
    reinitialiser,
    sectionVisibility,
    toggleSectionVisibility,
    showQuiz,
    setShowQuiz,
    currentQuestionIndex,
    selectedAnswer,
    showExplanation,
    quizCompleted,
    correctAnswers,
    handleQuizAnswer,
    nextQuestion,
    resetQuiz,
  }
}

// ===================================
// COMPOSANTS UI
// ===================================

const PanneauControle = ({
  solution1,
  solution2,
  etape,
  setSolution1,
  setSolution2,
  reinitialiser,
  reactionData,
  obtenirMessageStatut,
  progressReaction,
  enReaction,
  toggleSectionVisibility,
  sectionVisibility,
}: any) => (
  <div className={`absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 w-80 border border-gray-200 shadow-xl ${sectionVisibility.controls ? '' : 'hidden'}`}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-gray-800 font-bold text-lg flex items-center">
        <FlaskConical className="mr-2 text-blue-600" size={20} />
        Réactifs
      </h3>
      <button
        onClick={() => toggleSectionVisibility('controls')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Masquer/Afficher les contrôles"
      >
        <Eye size={14} className="text-gray-500" />
      </button>
    </div>

    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-700 mb-2 block font-semibold flex items-center">
          <Droplets className="mr-1 text-blue-500" size={14} />
          Solution A:
        </label>
        <select
          value={solution1.id}
          onChange={(e) => etape === 0 && setSolution1(SOLUTIONS[e.target.value])}
          disabled={etape !== 0}
          className="w-full text-sm bg-gray-50 text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <optgroup label="🔴 Acides">
            <option value="hcl">HCl - Acide chlorhydrique</option>
            <option value="ch3cooh">CH₃COOH - Acide acétique</option>
          </optgroup>
          <optgroup label="🔵 Bases">
            <option value="naoh">NaOH - Soude</option>
            <option value="nh3">NH₃ - Ammoniaque</option>
          </optgroup>
          <optgroup label="⚪ Sels">
            <option value="agno3">AgNO₃ - Nitrate d'argent</option>
            <option value="cuso4">CuSO₄ - Sulfate de cuivre</option>
            <option value="nacl">NaCl - Chlorure de sodium</option>
          </optgroup>
          <optgroup label="🟡 Indicateurs">
            <option value="bbt">BBT - Bleu de bromothymol</option>
            <option value="phenol">Phénolphtaléine</option>
          </optgroup>
        </select>
        <div className="mt-1 text-xs text-gray-600 flex items-center justify-between">
          <span>{solution1.concentration}</span>
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              solution1.securite === "eleve"
                ? "bg-red-100 text-red-800"
                : solution1.securite === "moyen"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {solution1.securite === "eleve" ? "⚠️ Danger" : solution1.securite === "moyen" ? "⚡ Attention" : "✅ Sûr"}
          </span>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-700 mb-2 block font-semibold flex items-center">
          <Droplets className="mr-1 text-green-500" size={14} />
          Solution B:
        </label>
        <select
          value={solution2.id}
          onChange={(e) => etape === 0 && setSolution2(SOLUTIONS[e.target.value])}
          disabled={etape !== 0}
          className="w-full text-sm bg-gray-50 text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <optgroup label="🔴 Acides">
            <option value="hcl">HCl - Acide chlorhydrique</option>
            <option value="ch3cooh">CH₃COOH - Acide acétique</option>
          </optgroup>
          <optgroup label="🔵 Bases">
            <option value="naoh">NaOH - Soude</option>
            <option value="nh3">NH₃ - Ammoniaque</option>
          </optgroup>
          <optgroup label="⚪ Sels">
            <option value="agno3">AgNO₃ - Nitrate d'argent</option>
            <option value="cuso4">CuSO₄ - Sulfate de cuivre</option>
            <option value="nacl">NaCl - Chlorure de sodium</option>
          </optgroup>
          <optgroup label="🟡 Indicateurs">
            <option value="bbt">BBT - Bleu de bromothymol</option>
            <option value="phenol">Phénolphtaléine</option>
          </optgroup>
        </select>
        <div className="mt-1 text-xs text-gray-600 flex items-center justify-between">
          <span>{solution2.concentration}</span>
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              solution2.securite === "eleve"
                ? "bg-red-100 text-red-800"
                : solution2.securite === "moyen"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {solution2.securite === "eleve" ? "⚠️ Danger" : solution2.securite === "moyen" ? "⚡ Attention" : "✅ Sûr"}
          </span>
        </div>
      </div>

      <button
        onClick={reinitialiser}
        className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >
        <RotateCcw size={16} />
        Nouvelle expérience
      </button>
    </div>

    {reactionData ? (
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <Sparkles className="mr-2 text-purple-600" size={16} />
          <span className="font-semibold text-purple-800 text-sm">Réaction possible:</span>
        </div>
        <div className="text-purple-700 text-sm mb-2">
          <div className="font-bold">{reactionData.nom}</div>
          <div className="font-mono text-xs bg-white/50 p-1 rounded mt-1">{reactionData.equation}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              reactionData.niveau === "facile"
                ? "bg-green-100 text-green-800"
                : reactionData.niveau === "moyen"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {reactionData.niveau === "facile"
              ? "🟢 Facile"
              : reactionData.niveau === "moyen"
                ? "🟡 Moyen"
                : "🔴 Difficile"}
          </span>
          <span className="text-xs text-purple-600">{reactionData.type}</span>
        </div>
      </div>
    ) : (
      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center mb-2">
          <AlertTriangle className="mr-2 text-red-600" size={16} />
          <span className="font-semibold text-red-800 text-sm">Aucune réaction</span>
        </div>
        <div className="text-red-700 text-sm">
          Ces solutions ne réagissent pas ensemble. Essayez d'autres combinaisons !
        </div>
      </div>
    )}

    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-sm text-blue-800 font-medium mb-1">État:</div>
      <div className="text-blue-700 text-sm">{obtenirMessageStatut()}</div>
      {enReaction && (
        <div className="mt-2">
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressReaction * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  </div>
)

const PanneauObservations = ({ 
  observations, 
  etape, 
  setShowResultats,
  toggleSectionVisibility,
  sectionVisibility 
}: any) => (
  <div className={`absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 w-64 border border-gray-200 shadow-xl ${sectionVisibility.observations ? '' : 'hidden'}`}>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-gray-800 font-bold text-sm flex items-center">
        <Eye className="mr-2 text-green-600" size={16} />
        Observations
      </h3>
      <div className="flex gap-1">
        {etape >= 3 && (
          <button
            onClick={() => setShowResultats(true)}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-all"
          >
            <BookOpen size={10} />
            Analyse
          </button>
        )}
        <button
          onClick={() => toggleSectionVisibility('observations')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Masquer/Afficher les observations"
        >
          <Eye size={12} className="text-gray-500" />
        </button>
      </div>
    </div>

    <div className="space-y-1 max-h-48 overflow-y-auto">
      {observations.length === 0 ? (
        <div className="text-gray-500 text-xs italic text-center py-3">
          Commencez l'expérience !
        </div>
      ) : (
        observations.slice(-3).map((obs: string, i: number) => (
          <div key={i} className="bg-gray-50 p-2 rounded border-l-2 border-blue-500 text-xs text-gray-700">
            {obs}
          </div>
        ))
      )}
    </div>

    <div className="mt-3 grid grid-cols-4 gap-1">
      {[
        { label: "Prep", active: etape >= 0, icon: "🧪" },
        { label: "Mix", active: etape >= 1, icon: "⚗️" },
        { label: "React", active: etape >= 2, icon: "🔥" },
        { label: "Done", active: etape >= 3, icon: "✅" },
      ].map(({ label, active, icon }) => (
        <div
          key={label}
          className={`text-center text-xs p-1 rounded border ${
            active ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"
          }`}
        >
          <div className="text-xs mb-1">{icon}</div>
          <div className="font-bold text-xs">{label}</div>
        </div>
      ))}
    </div>
  </div>
)

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
      question: "Que se passe-t-il lors d'une réaction de neutralisation acide-base ?",
      options: [
        { id: 'formation_sel', text: 'Formation d\'un sel et d\'eau' },
        { id: 'formation_gaz', text: 'Formation d\'un gaz' },
        { id: 'formation_precipite', text: 'Formation d\'un précipité coloré' },
        { id: 'aucun_changement', text: 'Aucun changement visible' }
      ],
      correct: 'formation_sel',
      explanation: "Lors d'une neutralisation acide-base, l'acide et la base réagissent pour former un sel et de l'eau selon la réaction générale : Acide + Base → Sel + H₂O"
    },
    {
      id: 'q2',
      question: "Pourquoi la phénolphtaléine devient-elle rose en milieu basique ?",
      options: [
        { id: 'temperature', text: 'À cause de la température' },
        { id: 'changement_ph', text: 'À cause du changement de pH' },
        { id: 'concentration', text: 'À cause de la concentration' },
        { id: 'precipitation', text: 'À cause d\'une précipitation' }
      ],
      correct: 'changement_ph',
      explanation: "La phénolphtaléine est un indicateur coloré qui change de couleur selon le pH : elle est incolore en milieu acide/neutre (pH < 8.2) et devient rose en milieu basique (pH > 8.2)."
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
                {correctAnswers === 2 ? "🏆 Parfait ! Vous maîtrisez les réactions chimiques !" :
                 correctAnswers === 1 ? "👍 Bien ! Continuez à étudier les réactions !" :
                 "📚 Révisez les concepts de neutralisation et d'indicateurs !"}
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
                className="flex-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors px-4 py-2 text-gray-600"
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

        <div className="mb-6 text-gray-800">
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

export default function LaboratoireReactionsChimiques() {
  const {
    solution1,
    solution2,
    etape,
    solution1Ajoutee,
    solution2Ajoutee,
    enReaction,
    reactionTerminee,
    versementGauche,
    versementDroite,
    niveauBecher1,
    niveauBecher2,
    reactionActive,
    observations,
    showResultats,
    progressReaction,
    couleurFinale,
    precipite,
    couleurPrecipite,
    bulles,
    reactionData,
    setSolution1,
    setSolution2,
    setShowResultats,
    verserSolution1,
    verserSolution2,
    obtenirMessageStatut,
    reinitialiser,
    sectionVisibility,
    toggleSectionVisibility,
    showQuiz,
    setShowQuiz,
    currentQuestionIndex,
    selectedAnswer,
    showExplanation,
    quizCompleted,
    correctAnswers,
    handleQuizAnswer,
    nextQuestion,
    resetQuiz,
  } = useSimulationChimie()

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-900/10 to-transparent" />

      <Canvas
        camera={{ position: [0, 2, 10], fov: 60, near: 0.1, far: 100 }}
        shadows
        className="w-full h-full"
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneChimie
            solution1={solution1}
            solution2={solution2}
            etape={etape}
            solution1Ajoutee={solution1Ajoutee}
            solution2Ajoutee={solution2Ajoutee}
            enReaction={enReaction}
            reactionTerminee={reactionTerminee}
            versementGauche={versementGauche}
            versementDroite={versementDroite}
            onVerserSolution1={verserSolution1}
            onVerserSolution2={verserSolution2}
            niveauBecher1={niveauBecher1}
            niveauBecher2={niveauBecher2}
            reactionActive={reactionActive}
            couleurFinale={couleurFinale}
            precipite={precipite}
            couleurPrecipite={couleurPrecipite}
            bulles={bulles}
          />
        </Suspense>
      </Canvas>

      <PanneauControle
        solution1={solution1}
        solution2={solution2}
        etape={etape}
        setSolution1={setSolution1}
        setSolution2={setSolution2}
        reinitialiser={reinitialiser}
        reactionData={reactionData}
        obtenirMessageStatut={obtenirMessageStatut}
        progressReaction={progressReaction}
        enReaction={enReaction}
        toggleSectionVisibility={toggleSectionVisibility}
        sectionVisibility={sectionVisibility}
      />

      <PanneauObservations
        observations={observations}
        etape={etape}
        reactionData={reactionData}
        showResultats={showResultats}
        setShowResultats={setShowResultats}
        toggleSectionVisibility={toggleSectionVisibility}
        sectionVisibility={sectionVisibility}
      />


      {enReaction && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white font-bold text-lg">Réaction en cours...</p>
          <p className="text-white/80 text-sm">Observez les changements chimiques</p>
          <div className="mt-3 w-48 bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressReaction * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className={`absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-sm ${sectionVisibility.guide ? '' : 'hidden'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Info className="mr-2 text-blue-600" size={14} />
            <span className="font-medium text-gray-700 text-sm">Guide d'utilisation</span>
          </div>
          <button
            onClick={() => toggleSectionVisibility('guide')}
            className="p-1 hover:bg-gray-100 rounded"
            title="Masquer/Afficher le guide"
          >
            <Eye size={12} className="text-gray-500" />
          </button>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            🖱️ <strong>Navigation:</strong> Glissez pour tourner, molette pour zoomer
          </p>
          <p>
            🧪 <strong>Expérience:</strong> Cliquez sur les béchers pour verser
          </p>
          <p>
            👀 <strong>Observation:</strong> Regardez les changements de couleur
          </p>
          <p>
            📚 <strong>Apprentissage:</strong> Consultez l'analyse détaillée
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg">
        <div className="flex items-center mb-2">
          <AlertTriangle className="mr-2 text-orange-600" size={14} />
          <span className="font-medium text-gray-700 text-sm">Sécurité</span>
        </div>
        <div className="text-xs text-gray-600">
          <p>⚠️ En laboratoire réel, portez toujours des équipements de protection</p>
          <p>🥽 Lunettes, gants et blouse obligatoires</p>
        </div>
      </div>

      <FloatingToggleButtons 
        sectionVisibility={sectionVisibility}
        toggleSectionVisibility={toggleSectionVisibility}
      />

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