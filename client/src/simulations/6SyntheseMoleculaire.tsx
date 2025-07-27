"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, Cylinder, Text, Environment, Box, Plane } from "@react-three/drei"
import {
  Atom,
  Target,
  RotateCcw,
  BookOpen,
  Award,
  Lightbulb,
  Sparkles,
  FlaskConical,
  Trash2,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react"
import * as THREE from "three"

// ===================================
// TYPES ET DONNÉES CHIMIQUES
// ===================================

interface AtomeType {
  id: string
  symbole: string
  nom: string
  couleur: string
  couleurSecondaire: string
  rayon: number
  valence: number
  masse: number
  electronegativite: number
  metallic: boolean
  brillance: number
  numeroAtomique: number
}

interface Liaison {
  id: string
  atome1: string
  atome2: string
  type: "simple" | "double" | "triple"
  longueur: number
  energie: number
}

interface Molecule {
  id: string
  nom: string
  formule: string
  atomes: { id: string; type: string; position: [number, number, number] }[]
  liaisons: Liaison[]
  famille: string
  proprietes: string[]
  pointFusion: number
  pointEbullition: number
  description: string
  difficulte: "facile" | "moyen" | "difficile"
  couleur: string
  applications: string[]
  dangers: string[]
}

// Base de données des atomes avec couleurs plus vives pour fond sombre
const ATOMES: Record<string, AtomeType> = {
  H: {
    id: "H",
    symbole: "H",
    nom: "Hydrogène",
    couleur: "#ffffff",
    couleurSecondaire: "#f0f8ff",
    rayon: 0.12,
    valence: 1,
    masse: 1.008,
    electronegativite: 2.1,
    metallic: false,
    brillance: 0.1,
    numeroAtomique: 1,
  },
  C: {
    id: "C",
    symbole: "C",
    nom: "Carbone",
    couleur: "#4a5568",
    couleurSecondaire: "#718096",
    rayon: 0.18,
    valence: 4,
    masse: 12.011,
    electronegativite: 2.5,
    metallic: false,
    brillance: 0.3,
    numeroAtomique: 6,
  },
  O: {
    id: "O",
    symbole: "O",
    nom: "Oxygène",
    couleur: "#ff4757",
    couleurSecondaire: "#ff6b7a",
    rayon: 0.15,
    valence: 2,
    masse: 15.999,
    electronegativite: 3.5,
    metallic: false,
    brillance: 0.2,
    numeroAtomique: 8,
  },
  N: {
    id: "N",
    symbole: "N",
    nom: "Azote",
    couleur: "#3742fa",
    couleurSecondaire: "#5352ed",
    rayon: 0.14,
    valence: 3,
    masse: 14.007,
    electronegativite: 3.0,
    metallic: false,
    brillance: 0.2,
    numeroAtomique: 7,
  },
  S: {
    id: "S",
    symbole: "S",
    nom: "Soufre",
    couleur: "#ffa502",
    couleurSecondaire: "#ff9f43",
    rayon: 0.2,
    valence: 2,
    masse: 32.065,
    electronegativite: 2.5,
    metallic: false,
    brillance: 0.4,
    numeroAtomique: 16,
  },
  P: {
    id: "P",
    symbole: "P",
    nom: "Phosphore",
    couleur: "#a55eea",
    couleurSecondaire: "#c44569",
    rayon: 0.17,
    valence: 3,
    masse: 30.974,
    electronegativite: 2.1,
    metallic: false,
    brillance: 0.3,
    numeroAtomique: 15,
  },
  Cl: {
    id: "Cl",
    symbole: "Cl",
    nom: "Chlore",
    couleur: "#2ed573",
    couleurSecondaire: "#7bed9f",
    rayon: 0.16,
    valence: 1,
    masse: 35.453,
    electronegativite: 3.0,
    metallic: false,
    brillance: 0.2,
    numeroAtomique: 17,
  },
  Br: {
    id: "Br",
    symbole: "Br",
    nom: "Brome",
    couleur: "#ff6348",
    couleurSecondaire: "#ff7675",
    rayon: 0.19,
    valence: 1,
    masse: 79.904,
    electronegativite: 2.8,
    metallic: false,
    brillance: 0.5,
    numeroAtomique: 35,
  },
}

// Molécules cibles
const MOLECULES_CIBLES: Record<string, Molecule> = {
  eau: {
    id: "eau",
    nom: "Eau",
    formule: "H₂O",
    atomes: [
      { id: "O1", type: "O", position: [0, 0, 0] },
      { id: "H1", type: "H", position: [0.6, 0.6, 0] },
      { id: "H2", type: "H", position: [-0.6, 0.6, 0] },
    ],
    liaisons: [
      { id: "l1", atome1: "O1", atome2: "H1", type: "simple", longueur: 0.96, energie: 463 },
      { id: "l2", atome1: "O1", atome2: "H2", type: "simple", longueur: 0.96, energie: 463 },
    ],
    famille: "Oxyde",
    proprietes: ["Liquide incolore", "Solvant universel", "Essentiel à la vie", "Angle H-O-H: 104.5°"],
    pointFusion: 0,
    pointEbullition: 100,
    description: "Molécule essentielle à la vie, excellent solvant polaire avec géométrie coudée",
    difficulte: "facile",
    couleur: "#3742fa",
    applications: ["Solvant universel", "Réactions biologiques", "Industrie chimique", "Refroidissement"],
    dangers: ["Aucun danger particulier", "Attention aux températures extrêmes"],
  },

  methane: {
    id: "methane",
    nom: "Méthane",
    formule: "CH₄",
    atomes: [
      { id: "C1", type: "C", position: [0, 0, 0] },
      { id: "H1", type: "H", position: [0.6, 0.6, 0.6] },
      { id: "H2", type: "H", position: [-0.6, -0.6, 0.6] },
      { id: "H3", type: "H", position: [-0.6, 0.6, -0.6] },
      { id: "H4", type: "H", position: [0.6, -0.6, -0.6] },
    ],
    liaisons: [
      { id: "l1", atome1: "C1", atome2: "H1", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l2", atome1: "C1", atome2: "H2", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l3", atome1: "C1", atome2: "H3", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l4", atome1: "C1", atome2: "H4", type: "simple", longueur: 1.09, energie: 413 },
    ],
    famille: "Alcane",
    proprietes: ["Gaz incolore", "Combustible", "Géométrie tétraédrique", "Apolaire"],
    pointFusion: -182,
    pointEbullition: -162,
    description: "Le plus simple des hydrocarbures, géométrie tétraédrique parfaite",
    difficulte: "facile",
    couleur: "#2ed573",
    applications: ["Gaz naturel", "Combustible", "Matière première chimique", "Chauffage domestique"],
    dangers: ["Inflammable", "Asphyxiant en forte concentration"],
  },

  ethanol: {
    id: "ethanol",
    nom: "Éthanol",
    formule: "C₂H₅OH",
    atomes: [
      { id: "C1", type: "C", position: [-0.8, 0, 0] },
      { id: "C2", type: "C", position: [0.4, 0, 0] },
      { id: "O1", type: "O", position: [1.2, 0, 0] },
      { id: "H1", type: "H", position: [-1.2, 0.6, 0.6] },
      { id: "H2", type: "H", position: [-1.2, -0.6, 0.6] },
      { id: "H3", type: "H", position: [-1.2, 0, -0.8] },
      { id: "H4", type: "H", position: [0.4, 0.6, 0.6] },
      { id: "H5", type: "H", position: [0.4, -0.6, 0.6] },
      { id: "H6", type: "H", position: [1.6, 0.2, 0] },
    ],
    liaisons: [
      { id: "l1", atome1: "C1", atome2: "C2", type: "simple", longueur: 1.54, energie: 348 },
      { id: "l2", atome1: "C2", atome2: "O1", type: "simple", longueur: 1.43, energie: 358 },
      { id: "l3", atome1: "C1", atome2: "H1", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l4", atome1: "C1", atome2: "H2", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l5", atome1: "C1", atome2: "H3", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l6", atome1: "C2", atome2: "H4", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l7", atome1: "C2", atome2: "H5", type: "simple", longueur: 1.09, energie: 413 },
      { id: "l8", atome1: "O1", atome2: "H6", type: "simple", longueur: 0.96, energie: 463 },
    ],
    famille: "Alcool",
    proprietes: ["Liquide incolore", "Solvant polaire", "Groupe fonctionnel -OH", "Liaisons hydrogène"],
    pointFusion: -114,
    pointEbullition: 78,
    description: "Alcool éthylique, molécule avec groupe hydroxyle permettant les liaisons hydrogène",
    difficulte: "difficile",
    couleur: "#ffa502",
    applications: ["Solvant industriel", "Biocarburant", "Désinfectant", "Boissons alcoolisées"],
    dangers: ["Toxique à forte dose", "Inflammable", "Effet psychoactif"],
  },
}

// ===================================
// COMPOSANTS 3D ENVIRONNEMENT SOMBRE
// ===================================

const EnvironnementLaboratoireSombre = () => {
  return (
    <group>
      {/* Sol sombre */}
      <Plane args={[30, 30]} position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.1} />
      </Plane>

      {/* Murs sombres */}
      <Plane args={[30, 20]} position={[0, 7, -15]} receiveShadow>
        <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
      </Plane>
      <Plane args={[30, 20]} position={[-15, 7, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
      </Plane>
      <Plane args={[30, 20]} position={[15, 7, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
      </Plane>

      {/* Plafond avec éclairage intégré */}
      <Plane args={[30, 30]} position={[0, 17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </Plane>

      {/* Éclairage néon futuriste */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={`neon-${i}`} position={[(i - 1.5) * 8, 15, 0]}>
          <Box args={[6, 0.3, 0.8]} castShadow>
            <meshStandardMaterial
              color="#ffffff"
              emissive="#4299e1"
              emissiveIntensity={0.5}
              roughness={0.1}
              metalness={0.9}
            />
          </Box>
        </group>
      ))}

      {/* Équipements de laboratoire sombres */}
      <group position={[-10, -2, -12]}>
        <Box args={[3, 5, 2]} castShadow>
          <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.7} />
        </Box>
        <Text position={[0, 3, 1.1]} fontSize={0.3} color="#4299e1" anchorX="center">
          HOTTE ASPIRANTE
        </Text>
      </group>

      <group position={[10, -2, -12]}>
        <Box args={[2.5, 5, 1.5]} castShadow>
          <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.6} />
        </Box>
        <Text position={[0, 3, 0.8]} fontSize={0.25} color="#e53e3e" anchorX="center">
          ⚠️ PRODUITS CHIMIQUES
        </Text>
      </group>

      {/* Table de laboratoire centrale sombre */}
      <group position={[0, -2.5, 0]}>
        <Box args={[12, 0.2, 8]} castShadow receiveShadow>
          <meshStandardMaterial color="#2d3748" roughness={0.2} metalness={0.8} />
        </Box>
        {/* Pieds métalliques */}
        {[
          [-5, -1, -3.5],
          [5, -1, -3.5],
          [-5, -1, 3.5],
          [5, -1, 3.5],
        ].map((pos, i) => (
          <Cylinder key={i} args={[0.1, 0.1, 2]} position={pos as [number, number, number]} castShadow>
            <meshStandardMaterial color="#4a5568" roughness={0.3} metalness={0.9} />
          </Cylinder>
        ))}
      </group>
    </group>
  )
}

const AtomeRealisteVertical = ({
  atome,
  position,
  isSelected = false,
  isHovered = false,
  onSelect,
  onHover,
  scale = 1,
}: {
  atome: AtomeType
  position: [number, number, number]
  isSelected?: boolean
  isHovered?: boolean
  onSelect?: () => void
  onHover?: (hovered: boolean) => void
  scale?: number
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const electronsRef = useRef<THREE.Group>(null)
  const [localHovered, setLocalHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.setScalar(scale * (1.4 + Math.sin(state.clock.elapsedTime * 5) * 0.15))
      } else if (isHovered || localHovered) {
        meshRef.current.scale.setScalar(scale * 1.3)
      } else {
        meshRef.current.scale.setScalar(scale)
      }
    }

    // Animation des électrons plus rapide
    if (electronsRef.current) {
      electronsRef.current.rotation.y = state.clock.elapsedTime * 3
      electronsRef.current.rotation.x = state.clock.elapsedTime * 2
    }
  })

  const handlePointerEnter = () => {
    setLocalHovered(true)
    onHover?.(true)
  }

  const handlePointerLeave = () => {
    setLocalHovered(false)
    onHover?.(false)
  }

  return (
    <group position={position}>
      {/* Noyau atomique avec émission */}
      <Sphere
        ref={meshRef}
        args={[atome.rayon * scale]}
        onClick={onSelect}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <meshStandardMaterial
          color={atome.couleur}
          roughness={atome.metallic ? 0.1 : 0.3}
          metalness={atome.metallic ? 0.9 : 0.2}
          emissive={atome.couleur}
          emissiveIntensity={isSelected ? 0.4 : 0.1}
        />
      </Sphere>

      {/* Orbitales électroniques plus visibles */}
      <group ref={electronsRef}>
        {Array.from({ length: Math.min(atome.numeroAtomique, 8) }, (_, i) => {
          const orbitRadius = (atome.rayon + 0.15 + (i % 2) * 0.08) * scale
          const angle = (i / Math.min(atome.numeroAtomique, 8)) * Math.PI * 2
          return (
            <Sphere
              key={i}
              args={[0.025 * scale]}
              position={[
                Math.cos(angle + i) * orbitRadius,
                Math.sin(angle * 1.5 + i) * orbitRadius * 0.4,
                Math.sin(angle + i) * orbitRadius,
              ]}
            >
              <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
            </Sphere>
          )
        })}
      </group>

      {/* Étiquette plus visible */}
      <Text
        position={[0, (atome.rayon + 0.4) * scale, 0]}
        fontSize={0.15 * scale}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {atome.symbole}
      </Text>

      {/* Informations détaillées au survol */}
      {(isHovered || localHovered) && (
        <group position={[0, (atome.rayon + 0.8) * scale, 0]}>
          <Text position={[0, 0.15, 0]} fontSize={0.1 * scale} color="#e2e8f0" anchorX="center">
            {atome.nom}
          </Text>
          <Text position={[0, 0, 0]} fontSize={0.08 * scale} color="#a0aec0" anchorX="center">
            Z = {atome.numeroAtomique}
          </Text>
          <Text position={[0, -0.15, 0]} fontSize={0.08 * scale} color="#a0aec0" anchorX="center">
            Valence: {atome.valence}
          </Text>
        </group>
      )}

      {/* Halo de sélection plus visible */}
      {isSelected && (
        <Sphere args={[atome.rayon * 2 * scale]}>
          <meshBasicMaterial color={atome.couleurSecondaire} transparent opacity={0.3} wireframe />
        </Sphere>
      )}
    </group>
  )
}

const PaletteAtomesVerticale = ({
  position,
  onAtomeSelect,
}: {
  position: [number, number, number]
  onAtomeSelect: (type: string) => void
}) => {
  const [hoveredAtome, setHoveredAtome] = useState<string | null>(null)
  const atomesDisponibles = Object.values(ATOMES)

  return (
    <group position={position}>
      {/* Support vertical de la palette - FACE À LA CAMÉRA */}
      <Box args={[4, 8, 0.3]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#2d3748" roughness={0.2} metalness={0.8} />
      </Box>

      {/* Panneau de fond lumineux - FACE À LA CAMÉRA */}
      <Box args={[3.5, 7.5, 0.1]} position={[0, 0, 0.2]} castShadow>
        <meshStandardMaterial
          color="#1a202c"
          emissive="#4299e1"
          emissiveIntensity={0.1}
          roughness={0.1}
          metalness={0.9}
        />
      </Box>

      {/* Titre */}
      <Text position={[0, 3.5, 0.3]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle">
        PALETTE D'ATOMES
      </Text>

      {/* Atomes disposés verticalement en grille - FACE À LA CAMÉRA */}
      {atomesDisponibles.map((atome, index) => {
        const row = Math.floor(index / 2)
        const col = index % 2
        const x = (col - 0.5) * 1.2
        const y = 2.5 - row * 0.8
        const z = 0.4

        return (
          <group key={atome.id} position={[x, y, z]}>
            <AtomeRealisteVertical
              atome={atome}
              position={[0, 0, 0]}
              isHovered={hoveredAtome === atome.id}
              onSelect={() => onAtomeSelect(atome.id)}
              onHover={(hovered) => setHoveredAtome(hovered ? atome.id : null)}
              scale={1.2}
            />

            {/* Informations sur l'atome */}
            <Text position={[0, -0.5, 0]} fontSize={0.08} color="#e2e8f0" anchorX="center" anchorY="middle">
              {atome.nom}
            </Text>
            <Text position={[0, -0.65, 0]} fontSize={0.06} color="#a0aec0" anchorX="center" anchorY="middle">
              {atome.masse.toFixed(1)} u
            </Text>
          </group>
        )
      })}

      {/* Instructions */}
      <Text position={[0, -3.5, 0.3]} fontSize={0.1} color="#4299e1" anchorX="center" anchorY="middle">
        💡 Cliquez pour ajouter
      </Text>
    </group>
  )
}

const ZoneSyntheseVerticale = ({
  atomes,
  liaisons,
  onAtomeClick,
  selectedAtome,
  liaisonsEnFormation,
}: {
  atomes: { id: string; type: string; position: [number, number, number] }[]
  liaisons: Liaison[]
  onAtomeClick: (id: string) => void
  selectedAtome: string | null
  liaisonsEnFormation: string[]
}) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Support vertical de la zone de synthèse - FACE À LA CAMÉRA */}
      <Box args={[6, 8, 0.2]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#2d3748" roughness={0.2} metalness={0.8} />
      </Box>

      {/* Panneau de travail lumineux - FACE À LA CAMÉRA */}
      <Box args={[5.5, 7.5, 0.05]} position={[0, 0, 0.15]} castShadow>
        <meshStandardMaterial
          color="#1a202c"
          emissive="#2ed573"
          emissiveIntensity={0.05}
          roughness={0.1}
          metalness={0.9}
        />
      </Box>

      {/* Grille de construction verticale - FACE À LA CAMÉRA */}
      {Array.from({ length: 11 }, (_, i) =>
        Array.from({ length: 15 }, (_, j) => (
          <mesh key={`grid-${i}-${j}`} position={[(i - 5) * 0.4, (j - 7) * 0.4, 0.2]}>
            <sphereGeometry args={[0.01]} />
            <meshBasicMaterial color="#4299e1" transparent opacity={0.3} />
          </mesh>
        )),
      )}

      {/* Cercles de guidage - FACE À LA CAMÉRA */}
      {[1, 2, 3].map((radius) => (
        <mesh key={radius} position={[0, 0, 0.18]} rotation={[0, 0, 0]}>
          <ringGeometry args={[radius - 0.02, radius + 0.02, 32]} />
          <meshBasicMaterial color="#2ed573" transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Liaisons chimiques */}
      {liaisons.map((liaison) => (
        <LiaisonChimiqueVerticale
          key={liaison.id}
          liaison={liaison}
          atomes={atomes}
          isForming={liaisonsEnFormation.includes(liaison.id)}
        />
      ))}

      {/* Atomes dans la zone de construction */}
      {atomes.map((atome) => (
        <AtomeRealisteVertical
          key={atome.id}
          atome={ATOMES[atome.type]}
          position={[atome.position[0], atome.position[1], 0.3]}
          isSelected={selectedAtome === atome.id}
          onSelect={() => onAtomeClick(atome.id)}
        />
      ))}

      {/* Titre de la zone */}
      <Text position={[0, 3.8, 0.4]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">
        ZONE DE SYNTHÈSE
      </Text>
      <Text position={[0, 3.5, 0.4]} fontSize={0.12} color="#2ed573" anchorX="center" anchorY="middle">
        Construisez votre molécule
      </Text>
    </group>
  )
}

const LiaisonChimiqueVerticale = ({
  liaison,
  atomes,
  isForming = false,
}: {
  liaison: Liaison
  atomes: { id: string; type: string; position: [number, number, number] }[]
  isForming?: boolean
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const atome1 = atomes.find((a) => a.id === liaison.atome1)
  const atome2 = atomes.find((a) => a.id === liaison.atome2)

  useFrame((state) => {
    if (meshRef.current && isForming) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.3
    }
  })

  if (!atome1 || !atome2) return null

  // Positions face à la caméra (Z fixe)
  const pos1 = new THREE.Vector3(atome1.position[0], atome1.position[1], 0.3)
  const pos2 = new THREE.Vector3(atome2.position[0], atome2.position[1], 0.3)
  const direction = pos2.clone().sub(pos1)
  const distance = direction.length()
  const center = pos1.clone().add(pos2).multiplyScalar(0.5)

  const rayon1 = ATOMES[atome1.type].rayon
  const rayon2 = ATOMES[atome2.type].rayon
  const longueurLiaison = distance - rayon1 - rayon2

  const couleurLiaison = liaison.type === "double" ? "#ffa502" : liaison.type === "triple" ? "#ff4757" : "#ffffff"

  return (
    <group position={center.toArray()}>
      <Cylinder
        ref={meshRef}
        args={[0.05, 0.05, longueurLiaison]}
        rotation={[0, 0, Math.atan2(direction.y, direction.x)]}
      >
        <meshStandardMaterial
          color={couleurLiaison}
          roughness={0.2}
          metalness={0.8}
          emissive={couleurLiaison}
          emissiveIntensity={isForming ? 0.5 : 0.2}
        />
      </Cylinder>

      {/* Liaisons multiples */}
      {liaison.type === "double" && (
        <Cylinder
          args={[0.04, 0.04, longueurLiaison]}
          position={[0, 0, 0.1]}
          rotation={[0, 0, Math.atan2(direction.y, direction.x)]}
        >
          <meshStandardMaterial color={couleurLiaison} roughness={0.2} metalness={0.8} />
        </Cylinder>
      )}

      {liaison.type === "triple" && (
        <>
          <Cylinder
            args={[0.04, 0.04, longueurLiaison]}
            position={[0, 0, 0.08]}
            rotation={[0, 0, Math.atan2(direction.y, direction.x)]}
          >
            <meshStandardMaterial color={couleurLiaison} roughness={0.2} metalness={0.8} />
          </Cylinder>
          <Cylinder
            args={[0.04, 0.04, longueurLiaison]}
            position={[0, 0, -0.08]}
            rotation={[0, 0, Math.atan2(direction.y, direction.x)]}
          >
            <meshStandardMaterial color={couleurLiaison} roughness={0.2} metalness={0.8} />
          </Cylinder>
        </>
      )}
    </group>
  )
}

// ===================================
// SCÈNE PRINCIPALE VERTICALE
// ===================================

const SceneLaboratoireVerticale = ({
  atomesConstruction,
  liaisons,
  selectedAtome,
  liaisonsEnFormation,
  onAtomeClick,
  onAtomeSelect,
}: {
  atomesConstruction: { id: string; type: string; position: [number, number, number] }[]
  liaisons: Liaison[]
  selectedAtome: string | null
  liaisonsEnFormation: string[]
  onAtomeClick: (id: string) => void
  onAtomeSelect: (type: string) => void
}) => {
  return (
    <>
      {/* Éclairage pour environnement sombre */}
      <ambientLight intensity={0.3} color="#4299e1" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[0, 10, 5]} intensity={0.8} color="#ffffff" distance={20} decay={2} />
      <pointLight position={[-8, 5, 0]} intensity={0.6} color="#4299e1" distance={15} decay={2} />
      <pointLight position={[8, 5, 0]} intensity={0.6} color="#2ed573" distance={15} decay={2} />

      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 25, 50]} />

      <EnvironnementLaboratoireSombre />

      {/* Zone de synthèse verticale centrale - FACE À LA CAMÉRA */}
      <ZoneSyntheseVerticale
        atomes={atomesConstruction}
        liaisons={liaisons}
        onAtomeClick={onAtomeClick}
        selectedAtome={selectedAtome}
        liaisonsEnFormation={liaisonsEnFormation}
      />

      {/* Palette d'atomes verticale à droite - FACE À LA CAMÉRA */}
      <PaletteAtomesVerticale position={[8, 0, 0]} onAtomeSelect={onAtomeSelect} />

      {/* Titre du laboratoire */}
      <Text position={[0, 8, -12]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle">
        LABORATOIRE DE SYNTHÈSE MOLÉCULAIRE
      </Text>
      <Text position={[0, 7.4, -12]} fontSize={0.2} color="#4299e1" anchorX="center" anchorY="middle">
        Chimie Organique - Interface Verticale - 1ère S
      </Text>

      <Environment
        files="/hdr/potsdamer_platz_1k.hdr"
        background
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={1.0}
        panSpeed={1.0}
      />
    </>
  )
}

// ===================================
// HOOK PRINCIPAL AMÉLIORÉ
// ===================================

const useSimulationSyntheseVerticale = () => {
  const [atomesConstruction, setAtomesConstruction] = useState<
    { id: string; type: string; position: [number, number, number] }[]
  >([])
  const [liaisons, setLiaisons] = useState<Liaison[]>([])
  const [liaisonsEnFormation, setLiaisonsEnFormation] = useState<string[]>([])
  const [selectedAtome, setSelectedAtome] = useState<string | null>(null)
  const [defiActuel, setDefiActuel] = useState<Molecule>(MOLECULES_CIBLES.eau)
  const [score, setScore] = useState(0)
  const [defisCompletes, setDefisCompletes] = useState<string[]>([])
  const [showResultat, setShowResultat] = useState(false)
  const [dernierResultat, setDernierResultat] = useState<{
    estCorrecte: boolean
    score: number
    feedback: string
  } | null>(null)
  const [showAnalyse, setShowAnalyse] = useState(false)
  const [compteurAtomes, setCompteurAtomes] = useState(0)

  // Utilitaires chimiques
  const calculerDistance = useCallback((pos1: [number, number, number], pos2: [number, number, number]): number => {
    const dx = pos1[0] - pos2[0]
    const dy = pos1[1] - pos2[1]
    const dz = pos1[2] - pos2[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }, [])

  const peutFormerLiaison = useCallback((atome1: AtomeType, atome2: AtomeType, distance: number): boolean => {
    const distanceMax = (atome1.rayon + atome2.rayon) * 3.0
    return distance <= distanceMax && distance >= (atome1.rayon + atome2.rayon) * 1.5
  }, [])

  const detecterLiaisons = useCallback(
    (atomes: { id: string; type: string; position: [number, number, number] }[]): Liaison[] => {
      const nouvellesLiaisons: Liaison[] = []

      for (let i = 0; i < atomes.length; i++) {
        for (let j = i + 1; j < atomes.length; j++) {
          const atome1 = atomes[i]
          const atome2 = atomes[j]
          const distance = calculerDistance(atome1.position, atome2.position)

          const typeAtome1 = ATOMES[atome1.type]
          const typeAtome2 = ATOMES[atome2.type]

          if (peutFormerLiaison(typeAtome1, typeAtome2, distance)) {
            let typeLiaison: "simple" | "double" | "triple" = "simple"
            if ((atome1.type === "C" && atome2.type === "O") || (atome1.type === "O" && atome2.type === "C")) {
              typeLiaison = distance < 1.3 ? "double" : "simple"
            }

            nouvellesLiaisons.push({
              id: `${atome1.id}-${atome2.id}`,
              atome1: atome1.id,
              atome2: atome2.id,
              type: typeLiaison,
              longueur: distance,
              energie: 400,
            })
          }
        }
      }

      return nouvellesLiaisons
    },
    [calculerDistance, peutFormerLiaison],
  )

  // Ajouter un atome avec position verticale
  const ajouterAtome = useCallback(
    (type: string) => {
      const nouvelAtome = {
        id: `atome_${compteurAtomes}`,
        type,
        position: [(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 0] as [number, number, number],
      }

      setAtomesConstruction((prev) => [...prev, nouvelAtome])
      setCompteurAtomes((prev) => prev + 1)

      setTimeout(() => {
        const nouvellesLiaisons = detecterLiaisons([...atomesConstruction, nouvelAtome])
        const liaisonsAjoutees = nouvellesLiaisons.filter(
          (nl) => !liaisons.some((l) => l.id === nl.id || l.id === `${nl.atome2}-${nl.atome1}`),
        )

        if (liaisonsAjoutees.length > 0) {
          setLiaisonsEnFormation(liaisonsAjoutees.map((l) => l.id))
          setTimeout(() => setLiaisonsEnFormation([]), 2000)
        }
      }, 100)
    },
    [compteurAtomes, atomesConstruction, liaisons, detecterLiaisons],
  )

  const supprimerAtome = useCallback((id: string) => {
    setAtomesConstruction((prev) => prev.filter((atome) => atome.id !== id))
    setSelectedAtome(null)
  }, [])

  useEffect(() => {
    const nouvellesLiaisons = detecterLiaisons(atomesConstruction)
    setLiaisons(nouvellesLiaisons)
  }, [atomesConstruction, detecterLiaisons])

  const verifierMolecule = useCallback(() => {
    if (atomesConstruction.length === 0) {
      setDernierResultat({
        estCorrecte: false,
        score: 0,
        feedback: "Ajoutez des atomes pour commencer la synthèse !",
      })
      setShowResultat(true)
      return
    }

    const compositionUtilisateur: Record<string, number> = {}
    const compositionCible: Record<string, number> = {}

    atomesConstruction.forEach((atome) => {
      compositionUtilisateur[atome.type] = (compositionUtilisateur[atome.type] || 0) + 1
    })

    defiActuel.atomes.forEach((atome) => {
      compositionCible[atome.type] = (compositionCible[atome.type] || 0) + 1
    })

    let score = 0
    let feedback = ""

    const elementsCorrects = Object.keys(compositionCible).filter(
      (element) => compositionUtilisateur[element] === compositionCible[element],
    )

    if (
      elementsCorrects.length === Object.keys(compositionCible).length &&
      atomesConstruction.length === defiActuel.atomes.length
    ) {
      score = 100
      feedback = `🎉 Parfait ! Vous avez synthétisé ${defiActuel.nom} (${defiActuel.formule})`
      setScore((prev) => prev + 50)
      setDefisCompletes((prev) => [...prev, defiActuel.id])
    } else if (elementsCorrects.length > 0) {
      score = (elementsCorrects.length / Object.keys(compositionCible).length) * 70
      feedback = `⚗️ Bonne composition partielle ! ${elementsCorrects.length}/${Object.keys(compositionCible).length} éléments corrects`
    } else {
      score = 10
      feedback = `🔬 Continuez vos essais ! Consultez la molécule cible.`
    }

    setDernierResultat({ estCorrecte: score === 100, score, feedback })
    setShowResultat(true)
  }, [atomesConstruction, defiActuel])

  const reinitialiser = useCallback(() => {
    setAtomesConstruction([])
    setLiaisons([])
    setLiaisonsEnFormation([])
    setSelectedAtome(null)
    setShowResultat(false)
    setDernierResultat(null)
  }, [])

  const formuleActuelle = useMemo(() => {
    if (atomesConstruction.length === 0) return ""
    const compteur: Record<string, number> = {}
    atomesConstruction.forEach((atome) => {
      compteur[atome.type] = (compteur[atome.type] || 0) + 1
    })

    let formule = ""
    const ordre = ["C", "H", "N", "O", "S", "P", "Cl", "Br"]

    ordre.forEach((element) => {
      if (compteur[element]) {
        formule += element
        if (compteur[element] > 1) {
          formule += compteur[element].toString().replace(/(\d)/g, (match) => {
            const subscripts: Record<string, string> = {
              "0": "₀",
              "1": "₁",
              "2": "₂",
              "3": "₃",
              "4": "₄",
              "5": "₅",
              "6": "₆",
              "7": "₇",
              "8": "₈",
              "9": "₉",
            }
            return subscripts[match] || match
          })
        }
      }
    })

    return formule
  }, [atomesConstruction])

  const masseActuelle = useMemo(() => {
    return atomesConstruction.reduce((total, atome) => total + ATOMES[atome.type].masse, 0)
  }, [atomesConstruction])

  return {
    atomesConstruction,
    liaisons,
    liaisonsEnFormation,
    selectedAtome,
    defiActuel,
    score,
    defisCompletes,
    showResultat,
    dernierResultat,
    showAnalyse,
    formuleActuelle,
    masseActuelle,
    setSelectedAtome,
    setDefiActuel,
    setShowResultat,
    setShowAnalyse,
    ajouterAtome,
    supprimerAtome,
    verifierMolecule,
    reinitialiser,
  }
}

// ===================================
// PANNEAU UI FUSIONNÉ
// ===================================

const PanneauControleFusionne = ({
  defiActuel,
  score,
  defisCompletes,
  formuleActuelle,
  masseActuelle,
  atomesConstruction,
  selectedAtome,
  verifierMolecule,
  reinitialiser,
  supprimerAtome,
  setDefiActuel,
  liaisons,
}: any) => (
  <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 w-96 border border-gray-700 shadow-2xl">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-white font-bold text-lg flex items-center">
        <FlaskConical className="mr-2 text-blue-400" size={20} />
        Synthèse Moléculaire
      </h3>
      <div className="flex items-center gap-2">
        <Award className="text-yellow-400" size={16} />
        <span className="font-bold text-yellow-400">{score} pts</span>
      </div>
    </div>

    {/* Molécule cible */}
    <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/30">
      <div className="flex items-center mb-2">
        <Target className="mr-2 text-purple-400" size={16} />
        <span className="font-semibold text-purple-300 text-sm">Molécule cible:</span>
      </div>
      <div className="text-purple-200 text-sm mb-2">
        <div className="font-bold text-lg text-white">{defiActuel.nom}</div>
        <div className="font-mono text-xl text-blue-300 mb-1">{defiActuel.formule}</div>
        <div className="text-xs text-gray-300">{defiActuel.description}</div>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded ${defiActuel.difficulte === "facile"
            ? "bg-green-900/50 text-green-300 border border-green-500/30"
            : defiActuel.difficulte === "moyen"
              ? "bg-yellow-900/50 text-yellow-300 border border-yellow-500/30"
              : "bg-red-900/50 text-red-300 border border-red-500/30"
            }`}
        >
          {defiActuel.difficulte === "facile"
            ? "🟢 Facile"
            : defiActuel.difficulte === "moyen"
              ? "🟡 Moyen"
              : "🔴 Difficile"}
        </span>
        <span className="text-xs text-purple-300">{defiActuel.famille}</span>
      </div>
    </div>

    {/* Sélecteur de molécule */}
    <div className="mb-4">
      <label className="text-sm text-gray-300 mb-2 block font-semibold">Choisir une molécule:</label>
      <select
        value={defiActuel.id}
        onChange={(e) => {
          const nouvelleMolecule = MOLECULES_CIBLES[e.target.value]
          if (nouvelleMolecule) setDefiActuel(nouvelleMolecule)
        }}
        className="w-full text-sm bg-gray-800 text-gray-200 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {Object.values(MOLECULES_CIBLES).map((molecule) => (
          <option key={molecule.id} value={molecule.id}>
            {molecule.nom} - {molecule.formule}
            {defisCompletes.includes(molecule.id) ? " ✅" : ""}
          </option>
        ))}
      </select>
    </div>

    {/* Analyse temps réel fusionnée */}
    <div className="mb-4 p-3 bg-green-900/30 rounded-lg border border-green-500/30">
      <h4 className="font-semibold text-green-300 text-sm mb-2 flex items-center">
        <Zap className="mr-1" size={14} />
        Analyse Temps Réel:
      </h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-green-400">Formule:</span>
            <span className="font-mono text-white text-sm">{formuleActuelle || "Aucune"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-400">Masse:</span>
            <span className="font-mono text-white">{masseActuelle.toFixed(1)} u</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-green-400">Atomes:</span>
            <span className="font-mono text-white">{atomesConstruction.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-400">Liaisons:</span>
            <span className="font-mono text-white">{liaisons.length}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-green-500/20">
        <div className="flex justify-between text-xs">
          <span className="text-green-400">Cible:</span>
          <span className="font-mono text-blue-300">{defiActuel.formule}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-400">Atomes requis:</span>
          <span className="font-mono text-blue-300">{defiActuel.atomes.length}</span>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="space-y-2">
      <button
        onClick={verifierMolecule}
        disabled={atomesConstruction.length === 0}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${atomesConstruction.length > 0
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
      >
        <CheckCircle size={16} />
        Analyser la molécule
      </button>

      <div className="flex gap-2">
        <button
          onClick={reinitialiser}
          className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-all"
        >
          <RotateCcw size={14} />
          Reset
        </button>

        {selectedAtome && (
          <button
            onClick={() => supprimerAtome(selectedAtome)}
            className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-all"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        )}
      </div>
    </div>

    {/* Progression */}
    <div className="mt-4 p-2 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
      <div className="flex items-center mb-1">
        <Lightbulb className="mr-1 text-yellow-400" size={14} />
        <span className="font-semibold text-yellow-300 text-xs">Progression:</span>
      </div>
      <div className="w-full bg-yellow-900/50 rounded-full h-2 mb-1">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(defisCompletes.length / Object.keys(MOLECULES_CIBLES).length) * 100}%` }}
        />
      </div>
      <p className="text-yellow-300 text-xs">
        {defisCompletes.length}/{Object.keys(MOLECULES_CIBLES).length} molécules synthétisées
      </p>
    </div>
  </div>
)

// ===================================
// COMPOSANT PRINCIPAL
// ===================================

export default function LaboratoireSyntheseVertical() {
  const {
    atomesConstruction,
    liaisons,
    liaisonsEnFormation,
    selectedAtome,
    defiActuel,
    score,
    defisCompletes,
    showResultat,
    dernierResultat,
    showAnalyse,
    formuleActuelle,
    masseActuelle,
    setSelectedAtome,
    setDefiActuel,
    setShowResultat,
    setShowAnalyse,
    ajouterAtome,
    supprimerAtome,
    verifierMolecule,
    reinitialiser,
  } = useSimulationSyntheseVerticale()

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60, near: 0.1, far: 100 }}
        shadows
        className="w-full h-full"
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <Suspense fallback={null}>
          <SceneLaboratoireVerticale
            atomesConstruction={atomesConstruction}
            liaisons={liaisons}
            selectedAtome={selectedAtome}
            liaisonsEnFormation={liaisonsEnFormation}
            onAtomeClick={setSelectedAtome}
            onAtomeSelect={ajouterAtome}
          />
        </Suspense>
      </Canvas>

      <PanneauControleFusionne
        defiActuel={defiActuel}
        score={score}
        defisCompletes={defisCompletes}
        formuleActuelle={formuleActuelle}
        masseActuelle={masseActuelle}
        atomesConstruction={atomesConstruction}
        selectedAtome={selectedAtome}
        verifierMolecule={verifierMolecule}
        reinitialiser={reinitialiser}
        supprimerAtome={supprimerAtome}
        setDefiActuel={setDefiActuel}
        liaisons={liaisons}
      />

      {/* Guide d'utilisation adapté */}
      <div className="absolute bottom-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 border border-gray-700 shadow-lg max-w-sm">
        <div className="flex items-center mb-2">
          <BookOpen className="mr-2 text-blue-400" size={14} />
          <span className="font-medium text-white text-sm">Interface Verticale</span>
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <p>
            <strong className="text-blue-400">🖱️ Navigation:</strong> Glissez pour tourner, molette pour zoomer
          </p>
          <p>
            <strong className="text-green-400">⚛️ Palette:</strong> Panneau vertical à droite - cliquez pour ajouter
          </p>
          <p>
            <strong className="text-purple-400">🔗 Zone de synthèse:</strong> Panneau vertical central
          </p>
          <p>
            <strong className="text-yellow-400">✨ Liaisons:</strong> Formation automatique avec animations
          </p>
          <p>
            <strong className="text-red-400">🎯 Objectif:</strong> Reproduire la molécule cible exactement
          </p>
        </div>
      </div>

      {/* Indicateur de sélection */}
      {selectedAtome && (
        <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 border border-gray-700 shadow-lg">
          <div className="flex items-center mb-2">
            <Sparkles className="mr-2 text-green-400" size={14} />
            <span className="font-medium text-white text-sm">Atome Sélectionné</span>
          </div>
          <div className="text-xs text-gray-300">
            {(() => {
              const atome = atomesConstruction.find((a) => a.id === selectedAtome)
              const typeAtome = atome ? ATOMES[atome.type] : null
              return typeAtome ? (
                <>
                  <p>
                    <strong className="text-blue-400">Élément:</strong> {typeAtome.nom} ({typeAtome.symbole})
                  </p>
                  <p>
                    <strong className="text-green-400">Numéro atomique:</strong> {typeAtome.numeroAtomique}
                  </p>
                  <p>
                    <strong className="text-yellow-400">Masse atomique:</strong> {typeAtome.masse.toFixed(3)} u
                  </p>
                  <p>
                    <strong className="text-purple-400">Valence:</strong> {typeAtome.valence}
                  </p>
                  <p className="text-red-400 mt-1">🗑️ Cliquez sur "Supprimer" pour l'enlever</p>
                </>
              ) : null
            })()}
          </div>
        </div>
      )}

      {/* Modal de résultats */}
      {showResultat && dernierResultat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                {dernierResultat.estCorrecte ? (
                  <CheckCircle className="mr-2 text-green-400" size={24} />
                ) : (
                  <AlertCircle className="mr-2 text-orange-400" size={24} />
                )}
                Résultat de l'Analyse
              </h3>
              <button
                onClick={() => setShowResultat(false)}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div
              className={`p-4 rounded-lg mb-4 ${dernierResultat.estCorrecte
                ? "bg-green-900/30 border border-green-500/30"
                : "bg-orange-900/30 border border-orange-500/30"
                }`}
            >
              <p className={`text-sm mb-2 ${dernierResultat.estCorrecte ? "text-green-300" : "text-orange-300"}`}>
                {dernierResultat.feedback}
              </p>
              <div className="flex justify-between items-center">
                <span
                  className={`text-lg font-bold ${dernierResultat.estCorrecte ? "text-green-400" : "text-orange-400"}`}
                >
                  Score: {dernierResultat.score}/100
                </span>
                {dernierResultat.estCorrecte && (
                  <span className="text-sm bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30">
                    +50 points bonus !
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResultat(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Continuer
              </button>
              {dernierResultat.estCorrecte && (
                <button
                  onClick={() => {
                    setShowResultat(false)
                    setShowAnalyse(true)
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Analyser
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'analyse détaillée */}
      {showAnalyse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Atom className="mr-3 text-blue-400" size={28} />
                Analyse Complète - {defiActuel.nom}
              </h2>
              <button
                onClick={() => setShowAnalyse(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Structure moléculaire */}
              <div className="bg-blue-900/30 p-5 rounded-xl border border-blue-500/30">
                <h3 className="text-xl font-bold mb-4 text-blue-300">Structure Moléculaire</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-blue-400 mb-1">Formule moléculaire:</div>
                    <div className="font-mono text-white text-2xl">{defiActuel.formule}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-blue-400 mb-1">Nombre d'atomes:</div>
                    <div className="text-blue-300">{defiActuel.atomes.length}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-blue-400 mb-1">Liaisons chimiques:</div>
                    <div className="text-blue-300">{defiActuel.liaisons.length} liaison(s)</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-blue-400 mb-1">Famille chimique:</div>
                    <div className="text-blue-300">{defiActuel.famille}</div>
                  </div>
                </div>
              </div>

              {/* Propriétés physiques */}
              <div className="bg-green-900/30 p-5 rounded-xl border border-green-500/30">
                <h3 className="text-xl font-bold mb-4 text-green-300">Propriétés Physiques</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-green-400 mb-1">Point de fusion:</div>
                    <div className="text-green-300">{defiActuel.pointFusion}°C</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-green-400 mb-1">Point d'ébullition:</div>
                    <div className="text-green-300">{defiActuel.pointEbullition}°C</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-green-400 mb-1">Propriétés caractéristiques:</div>
                    <ul className="text-green-300 text-sm">
                      {defiActuel.proprietes.map((prop: string, i: number) => (
                        <li key={i}>• {prop}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Applications */}
              <div className="bg-purple-900/30 p-5 rounded-xl border border-purple-500/30">
                <h3 className="text-xl font-bold mb-4 text-purple-300">Applications</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-purple-400 mb-1">Utilisations principales:</div>
                    <ul className="text-purple-300 text-sm">
                      {defiActuel.applications?.map((app: string, i: number) => (
                        <li key={i}>• {app}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-purple-400 mb-1">Description:</div>
                    <div className="text-purple-300 text-sm">{defiActuel.description}</div>
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div className="bg-yellow-900/30 p-5 rounded-xl border border-yellow-500/30">
                <h3 className="text-xl font-bold mb-4 text-yellow-300">Sécurité et Précautions</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-yellow-400 mb-1">Dangers potentiels:</div>
                    <ul className="text-yellow-300 text-sm">
                      {defiActuel.dangers?.map((danger: string, i: number) => (
                        <li key={i}>⚠️ {danger}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <div className="font-semibold text-yellow-400 mb-1">Niveau de difficulté:</div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${defiActuel.difficulte === "facile"
                        ? "bg-green-900/50 text-green-300 border border-green-500/30"
                        : defiActuel.difficulte === "moyen"
                          ? "bg-yellow-900/50 text-yellow-300 border border-yellow-500/30"
                          : "bg-red-900/50 text-red-300 border border-red-500/30"
                        }`}
                    >
                      {defiActuel.difficulte === "facile"
                        ? "🟢 Facile - Niveau 1ère S"
                        : defiActuel.difficulte === "moyen"
                          ? "🟡 Moyen - Niveau 1ère S"
                          : "🔴 Difficile - Niveau 1ère S"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Synthèse réalisée le {new Date().toLocaleString()} • Laboratoire de Synthèse Moléculaire Vertical -
                Niveau 1ère S
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
