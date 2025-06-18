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

// ===================================
// ENVIRONNEMENT DE LABORATOIRE REDOX - Plus clair
// ===================================

function RedoxLabEnvironment() {
  return (
    <group>
      {/* Sol principal - indigo foncé */}
      <mesh position={[0, -4, 0]} receiveShadow>
        <boxGeometry args={[20, 0.1, 16]} />
        <meshStandardMaterial color="#4c51bf" roughness={0.4} />
      </mesh>

      {/* Mur arrière - indigo moyen */}
      <mesh position={[0, 0, -8]} receiveShadow>
        <boxGeometry args={[20, 10, 0.2]} />
        <meshStandardMaterial color="#5a67d8" roughness={0.5} />
      </mesh>

      {/* Murs latéraux - indigo moyen */}
      <mesh position={[-10, 0, 0]} receiveShadow>
        <boxGeometry args={[0.2, 10, 16]} />
        <meshStandardMaterial color="#5a67d8" roughness={0.5} />
      </mesh>

      <mesh position={[10, 0, 0]} receiveShadow>
        <boxGeometry args={[0.2, 10, 16]} />
        <meshStandardMaterial color="#5a67d8" roughness={0.5} />
      </mesh>

      {/* Plafond - indigo clair */}
      <mesh position={[0, 5, 0]} receiveShadow>
        <boxGeometry args={[20, 0.2, 16]} />
        <meshStandardMaterial color="#667eea" roughness={0.4} />
      </mesh>

      {/* Hotte de laboratoire pour réactions chimiques */}
      <group position={[0, 2.5, -7.5]}>
        <mesh castShadow>
          <boxGeometry args={[8, 4, 1.5]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[8.2, 0.3, 1.7]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Système d'extraction */}
        <mesh position={[0, 2.5, 0.8]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 8]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Armoires de stockage des réactifs - Gauche - indigo */}
      <group position={[-8.5, 0, -4]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 4, 1.2]} />
          <meshStandardMaterial color="#6366f1" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 2.2, 0.7]} castShadow>
          <boxGeometry args={[2.3, 0.1, 1]} />
          <meshStandardMaterial color="#4f46e5" roughness={0.2} />
        </mesh>
        {/* Étiquette de sécurité */}
        <mesh position={[0, 1, 0.7]} castShadow>
          <boxGeometry args={[1.5, 0.8, 0.05]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
      </group>

      {/* Armoires de stockage des réactifs - Droite - plus claires */}
      <group position={[8.5, 0, -4]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 4, 1.2]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 2.2, 0.7]} castShadow>
          <boxGeometry args={[2.3, 0.1, 1]} />
          <meshStandardMaterial color="#d5dbdb" roughness={0.2} />
        </mesh>
      </group>

      {/* Étagères avec bouteilles de réactifs redox */}
      <group position={[-9, -1, -2.5]}>
        {[0, 0.8, 1.6].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[0.3, 0.05, 3]} />
            <meshStandardMaterial color="#d4a574" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Bouteilles de solutions redox */}
      {[
        { pos: [-8.8, 0.8, -1], color: "#3b82f6", label: "CuSO₄" },
        { pos: [-8.8, 0.8, -2], color: "#8b5cf6", label: "AgNO₃" },
        { pos: [-8.8, 0.8, -3], color: "#06b6d4", label: "ZnSO₄" },
        { pos: [-8.8, 0.8, -4], color: "#ef4444", label: "FeSO₄" },
        { pos: [-8.8, 1.6, -1], color: "#10b981", label: "NiSO₄" },
        { pos: [-8.8, 1.6, -2], color: "#f59e0b", label: "PbNO₃" },
        { pos: [-8.8, 1.6, -3], color: "#8b5cf6", label: "MnSO₄" },
        { pos: [-8.8, 1.6, -4], color: "#06b6d4", label: "CoSO₄" },
      ].map((bottle, i) => (
        <group key={i}>
          <mesh position={bottle.pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <mesh position={[bottle.pos[0], bottle.pos[1] - 0.08, bottle.pos[2]]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.35, 8]} />
            <meshStandardMaterial color={bottle.color} transparent opacity={0.7} />
          </mesh>
          <Text
            position={[bottle.pos[0] + 0.3, bottle.pos[1], bottle.pos[2]]}
            fontSize={0.04}
            color="#2c3e50"
            anchorX="left"
            anchorY="middle"
          >
            {bottle.label}
          </Text>
        </group>
      ))}

      {/* Station de pesée et mesure */}
      <group position={[7, -3.8, -6]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.4, 1]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.08, 16]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.1} />
        </mesh>
        <Text position={[0, 0.6, 0]} fontSize={0.06} color="#2c3e50" anchorX="center" anchorY="middle">
          Balance Analytique
        </Text>
      </group>

      {/* pH-mètre et conductimètre */}
      <group position={[-7, -3.7, -6]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 0.6]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0.35]} castShadow>
          <boxGeometry args={[0.6, 0.3, 0.05]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
        <Text position={[0, 0.6, 0]} fontSize={0.05} color="#2c3e50" anchorX="center" anchorY="middle">
          pH-mètre
        </Text>
      </group>

      {/* Système d'agitation magnétique - Position corrigée sous la table */}
      <group position={[0, -4.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.2, 16]} />
          <meshStandardMaterial color="#667eea" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
          <meshStandardMaterial color="#a5b4fc" roughness={0.1} />
        </mesh>
        <Text position={[0, 0.4, 0]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
          Agitateur Magnétique
        </Text>
      </group>

      {/* Éclairage de laboratoire spécialisé - plus lumineux */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 4.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.1, 0.4]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[1.6, 0.05, 0.45]} />
            <meshStandardMaterial color="#ecf0f1" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Panneaux de sécurité redox */}
      <group position={[8, 1.5, -7.8]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 1.2, 0.1]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
        <Text position={[0, 0.3, 0.1]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
          ⚠️
        </Text>
        <Text position={[0, 0, 0.1]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle">
          DANGER
        </Text>
        <Text position={[0, -0.3, 0.1]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
          RÉACTIFS
        </Text>
      </group>

      {/* Douche de sécurité */}
      <group position={[9, -1.5, -2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#3498db" metalness={0.6} roughness={0.3} />
        </mesh>
        <Text position={[0, 2.2, 0]} fontSize={0.04} color="#2c3e50" anchorX="center" anchorY="middle">
          Douche de Sécurité
        </Text>
      </group>

      {/* Lave-œil d'urgence */}
      <group position={[-9, -3.5, 1]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.4, 0.6]} />
          <meshStandardMaterial color="#3498db" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0.4]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial color="#ecf0f1" />
        </mesh>
        <Text position={[0, 0.6, 0]} fontSize={0.04} color="#2c3e50" anchorX="center" anchorY="middle">
          Lave-œil
        </Text>
      </group>

      {/* Tableau de série électrochimique */}
      <group position={[-5, 1.5, -7.8]}>
        <mesh castShadow>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Text position={[0, 0.8, 0.1]} fontSize={0.08} color="#2c3e50" anchorX="center" anchorY="middle">
          SÉRIE ÉLECTROCHIMIQUE
        </Text>
        <Text position={[0, 0.4, 0.1]} fontSize={0.05} color="#2c3e50" anchorX="center" anchorY="middle">
          Zn²⁺/Zn (-0.76V)
        </Text>
        <Text position={[0, 0.2, 0.1]} fontSize={0.05} color="#2c3e50" anchorX="center" anchorY="middle">
          Fe²⁺/Fe (-0.44V)
        </Text>
        <Text position={[0, 0, 0.1]} fontSize={0.05} color="#2c3e50" anchorX="center" anchorY="middle">
          Cu²⁺/Cu (+0.34V)
        </Text>
        <Text position={[0, -0.2, 0.1]} fontSize={0.05} color="#2c3e50" anchorX="center" anchorY="middle">
          Ag⁺/Ag (+0.80V)
        </Text>
        <Text position={[0, -0.5, 0.1]} fontSize={0.04} color="#e74c3c" anchorX="center" anchorY="middle">
          Plus réactif → Moins réactif
        </Text>
      </group>

      {/* Ventilation et extraction */}
      <group position={[0, 4.8, 4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.3, 8]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 8]} />
          <meshStandardMaterial color="#7f8c8d" />
        </mesh>
      </group>

      {/* Poubelles de tri pour déchets chimiques */}
      <group position={[8.5, -3.5, 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.8, 8]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
        <Text position={[0, 0.6, 0]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle">
          Déchets Métaux
        </Text>
      </group>

      <group position={[7.5, -3.5, 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.8, 8]} />
          <meshStandardMaterial color="#f39c12" />
        </mesh>
        <Text position={[0, 0.6, 0]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle">
          Solutions Acides
        </Text>
      </group>
    </group>
  )
}

// Composant Table 3D amélioré pour redox
const RedoxLabTable = React.memo(() => {
  return (
    <group position={[0, -3.9, 0]}>
      {/* Plateau principal - indigo foncé */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[6, 0.2, 3]} />
        <meshStandardMaterial color="#3730a3" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Bordure métallique */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[6.1, 0.04, 3.1]} />
        <meshStandardMaterial color="#4338ca" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Pieds de table - design industriel */}
      {[
        [-2.5, -1, -1],
        [2.5, -1, -1],
        [-2.5, -1, 1],
        [2.5, -1, 1],
      ].map((pos, index) => (
        <group key={index}>
          <mesh position={pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 2, 16]} />
            <meshStandardMaterial color="#7f8c8d" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Base élargie */}
          <mesh position={[pos[0], pos[1] - 0.9, pos[2]]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
            <meshStandardMaterial color="#95a5a6" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Supports pour équipements */}
      <mesh position={[2, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#95a5a6" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
})

// Composant Robinet 3D amélioré - Position corrigée
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
      {/* Support mural */}
      <mesh position={[0, 0.8, -0.3]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.2]} />
        <meshStandardMaterial color="#7f8c8d" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tige verticale */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#bdc3c7" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Réservoir avec solution colorée */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.55, 16]} />
        <meshStandardMaterial
          color={reactant.color}
          transparent
          opacity={0.8}
          emissive={reactant.color}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Étiquette du réservoir */}
      <mesh position={[0, 1.2, 0.3]} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Corps du robinet */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
        <meshStandardMaterial color="#bdc3c7" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bec verseur - Position corrigée pour verser dans le bécher */}
      <mesh position={[0, -0.25, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.3, 16]} />
        <meshStandardMaterial color="#bdc3c7" metalness={0.8} roughness={0.2} />
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
          <meshStandardMaterial
            color={disabled ? "#95a5a6" : "#e74c3c"}
            metalness={0.6}
            roughness={0.3}
            emissive={disabled ? "#000000" : "#e74c3c"}
            emissiveIntensity={disabled ? 0 : 0.1}
          />
        </mesh>
      </animated.group>

      {/* Étiquettes avec meilleur contraste */}
      <Text position={[0, 1.6, 0]} fontSize={0.08} color="#2c3e50" anchorX="center" anchorY="middle">
        {reactant.name}
      </Text>
      <Text position={[0, 1.45, 0]} fontSize={0.06} color="#34495e" anchorX="center" anchorY="middle">
        {reactant.formula}
      </Text>
      <Text position={[0, 1.3, 0]} fontSize={0.05} color="#7f8c8d" anchorX="center" anchorY="middle">
        {reactant.molarMass}g/mol • {reactant.density}g/mL
      </Text>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.06}
        color={disabled ? "#95a5a6" : isOpen ? "#27ae60" : "#e74c3c"}
        anchorX="center"
        anchorY="middle"
      >
        {disabled ? "BLOQUÉ" : isOpen ? "OUVERT" : "FERMÉ"}
      </Text>
    </group>
  )
}

// Composant Bécher 3D amélioré - Position corrigée
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
            opacity={2}
            roughness={0.02}
            transmission={0.95}
            thickness={0.05}
          />
        </mesh>

        {/* Bec verseur */}
        <mesh position={[1.05, 0.8, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} transmission={0.85} />
        </mesh>

        {/* Solution avec animation et émissivité */}
        {solutionLevel > 0 && (
          <>
            <mesh position={[0, -1 + solutionLevel * 0.9, 0]}>
              <cylinderGeometry args={[0.8 + (1 - 0.8) * solutionLevel, 0.8, solutionLevel * 1.8, 32]} />
              <meshStandardMaterial
                color={solutionColor}
                transparent
                opacity={0.8}
                emissive={solutionColor}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh ref={solutionRef} position={[0, -1 + solutionLevel * 0.9 + (solutionLevel * 1.8) / 2, 0]}>
              <cylinderGeometry args={[0.8 + (1 - 0.8) * solutionLevel, 0.8 + (1 - 0.8) * solutionLevel, 0.02, 32]} />
              <meshStandardMaterial
                color={solutionColor}
                transparent
                opacity={0.9}
                emissive={solutionColor}
                emissiveIntensity={0.2}
              />
            </mesh>
          </>
        )}

        {/* Graduations avec meilleur contraste */}
        {[0.25, 0.5, 0.75, 1].map((height, index) => (
          <group key={index}>
            <mesh position={[1.1, -1 + height * 1.8, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#2c3e50" />
            </mesh>
            <Text
              position={[1.3, -1 + height * 1.8, 0]}
              fontSize={0.06}
              color="#2c3e50"
              anchorX="left"
              anchorY="middle"
            >
              {(index + 1) * 50}mL
            </Text>
          </group>
        ))}

        <Text position={[0, -1.3, 1.1]} fontSize={0.08} color="#2c3e50" anchorX="center" anchorY="middle">
          Bécher 250mL
        </Text>
      </group>
    )
  },
)

// Composant Barre de Fer amélioré - Position corrigée
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
      return "#f39c12"
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
        <meshStandardMaterial color="#4a5568" side={THREE.DoubleSide} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Dépôt métallique avec émissivité */}
      {copperDeposit > 0 && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.1, 1.5 * copperDeposit]} />
          <meshStandardMaterial
            color={depositColor}
            side={THREE.DoubleSide}
            transparent={reactionType === "incomplete"}
            opacity={reactionType === "incomplete" ? 0.7 : 1}
            emissive={depositColor}
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {/* Étiquettes avec meilleur contraste */}
      <Text position={[0, 0.9, 0.01]} fontSize={0.1} color="#2c3e50" anchorX="center" anchorY="middle">
        Barre de Fer
      </Text>
      <Text position={[0, 0.7, 0.01]} fontSize={0.06} color="#34495e" anchorX="center" anchorY="middle">
        Fe (s) - 55.8 g/mol
      </Text>

      {!disabled && !isAnimating && (
        <Text position={[0, -0.9, 0.01]} fontSize={0.04} color="#3498db" anchorX="center" anchorY="middle">
          Cliquez pour insérer !
        </Text>
      )}

      {isAnimating && (
        <Text position={[0, -0.9, 0.01]} fontSize={0.04} color="#f39c12" anchorX="center" anchorY="middle">
          Insertion en cours...
        </Text>
      )}
    </animated.group>
  )
}

// Composant Flux de Liquide 3D - Complètement corrigé
function LiquidStream3D({ active, reactantColor }: { active: boolean; reactantColor: string }) {
  const streamRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (streamRef.current && active) {
      streamRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.02
      streamRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05
    }
  })

  if (!active) return null

  return (
    <mesh ref={streamRef} position={[0, -1.8, 0.4]} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[0.015, 0.025, 1.2, 8]} />
      <meshStandardMaterial
        color={reactantColor}
        transparent
        opacity={0.9}
        emissive={reactantColor}
        emissiveIntensity={0.3}
      />
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
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Composant Scène principale - Positions corrigées
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
      {/* Éclairage amélioré et plus lumineux */}
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight
        position={[8, 8, 6]}
        intensity={2.5}
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
      <pointLight position={[0, 6, 0]} intensity={1.5} color="#ffffff" distance={15} decay={2} />
      <pointLight position={[-4, 4, 3]} intensity={0.6} color="#f8f9fa" distance={12} decay={2} />
      <pointLight position={[4, 4, 3]} intensity={0.6} color="#f8f9fa" distance={12} decay={2} />
      <spotLight position={[0, 6, 4]} angle={Math.PI / 3} penumbra={0.3} intensity={1.5} castShadow color="#ffffff" />

      <color attach="background" args={["#4c51bf"]} />
      <fog attach="fog" args={["#4c51bf", 12, 30]} />

      <Environment preset="city" />

      <RedoxLabEnvironment />
      <RedoxLabTable />

      <AlignedFaucet3D
        position={[0, -1, 0]} // Position corrigée - plus bas
        isOpen={experimentState.faucetOpen}
        onClick={onFaucetClick}
        reactantType={reactantType}
        disabled={experimentState.currentStep !== "initial"}
      />

      <ImprovedBeaker3D
        position={[0, -2.8, 0]} // Position corrigée - sur la table
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

      <ReactionBubbles3D active={experimentState.currentStep === "reacting"} position={[0, -1.5, 0]} />

      <ContactShadows position={[0, -3.9, 0]} opacity={0.4} scale={10} blur={2} far={6} />

      {/* Titre de l'expérience */}
      <Text position={[0, 3.5, -6]} fontSize={0.3} color="#2c3e50" anchorX="center" anchorY="middle">
        LABORATOIRE DE RÉACTIONS REDOX
      </Text>
    </>
  )
}

// Composant principal optimisé
export default function RedoxReaction() {
  // États principaux
  const [currentStep, setCurrentStep] = useState<ExperimentStep>("initial")
  const [solutionLevel, setSolutionLevel] = useState(0)
  const [solutionColor, setSolutionColor] = useState("#3b82f6")
  const [ironPosition, setIronPosition] = useState<[number, number, number]>([2.5, -1.5, 0]) // Position initiale corrigée
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
  const [showEquation, setShowEquation] = useState(false)

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
    setIronPosition([2.5, -1.5, 0]) // Position initiale corrigée
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

      // Position interpolée vers le centre du bécher - Position corrigée
      const startPos: [number, number, number] = [2.5, -1.5, 0]
      const endPos: [number, number, number] = [0, -2.3, 0] // Position finale dans le bécher

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
    <div className="w-full h-full relative bg-gradient-to-br from-gray-100 via-white to-gray-50">
      {/* Configuration de l'Expérience - GAUCHE - Largeur réduite */}
      <div className="absolute top-4 left-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl w-64 border border-gray-200">
        <h2 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Configuration
        </h2>

        <div className="space-y-3">
          {/* Sélection du réactif */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Réactif
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
                <div>• M.M: {selectedReactant.molarMass} g/mol</div>
                <div>• Densité: {selectedReactant.density} g/mL</div>
                <div>• Conc.: {EXPERIMENT_CONFIG.INITIAL_CONCENTRATION} M</div>
                <div>• Vol.: {EXPERIMENT_CONFIG.SOLUTION_VOLUME} mL</div>
              </div>
            </div>
          </div>

          {/* Métal réducteur */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              Métal
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Fer métallique (Fe)</div>
              <div>• M.M: 55.8 g/mol</div>
              <div>• E°: -0.44 V</div>
            </div>
          </div>

          {/* Prédiction théorique */}
          <div
            className={`p-3 rounded-lg border ${
              selectedReactant.canReact ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
              {selectedReactant.canReact ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <XCircle className="w-3 h-3 text-red-600" />
              )}
              Prédiction
            </h4>
            <div className="text-xs text-gray-600">
              {selectedReactant.canReact
                ? `Réaction possible (${(selectedReactant.reactionProbability * 100).toFixed(0)}%)`
                : "Aucune réaction prévue"}
            </div>
          </div>
        </div>
      </div>

      {/* Observations en Temps Réel - DROITE - Largeur réduite */}
      <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-64 border border-gray-200 shadow-xl">
        <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
          <Eye className="mr-2 text-indigo-600" size={16} />
          Observations
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
                Temp.
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
                Vol.
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
              <span className="text-xs font-medium text-gray-700">Progression</span>
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
            className={`p-2 rounded border text-xs ${
              phaseInfo.phase === "Terminé"
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
                <div className="font-semibold text-gray-700">Conv.</div>
                <div className="font-mono text-gray-900">{(reactionProgress * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Dépôt</div>
                <div className="font-mono text-gray-900">{calculatedData.massDeposited.toFixed(3)}g</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Effic.</div>
                <div className="font-mono text-gray-900">{(calculatedData.efficiency * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-semibold text-gray-700">Conc.</div>
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
              onClick={() => setShowEquation(!showEquation)}
              className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Équation
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

      {/* Équation Chimique - BAS GAUCHE - z-index élevé */}
      {showEquation && (
        <div className="absolute bottom-4 left-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-xl max-w-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <BookOpen className="mr-2 text-purple-600" size={20} />
              Équation Chimique
            </h3>
            <button
              onClick={() => setShowEquation(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="font-semibold text-gray-700 mb-2">Équation :</div>
              <div className="bg-purple-100 p-2 rounded font-mono text-sm text-gray-800 border border-purple-200">
                {reactionType === "incomplete" ? selectedReactant.incompleteEquation : selectedReactant.equation}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-700 mb-2">Type :</div>
              <div className="text-gray-600 text-sm">
                {selectedReactant.canReact ? "Réaction redox possible" : "Aucune réaction prévue"}
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="font-semibold text-gray-700 mb-2">Mécanisme :</div>
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
          </div>
        </div>
      )}

      {/* Instructions et Guide - BAS DROITE - z-index élevé */}
      <div className="absolute bottom-4 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg max-w-sm">
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

      {/* Rapport d'Analyse Détaillé - z-index très élevé */}
      {showResult && currentExperiment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
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
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          currentExperiment.reactionType === "complete"
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

      {/* Canvas 3D avec contrôles de caméra - Position de caméra corrigée */}
      <Canvas
        camera={{
          position: [2, 0, 4], // Position plus basse et plus proche
          fov: 65,
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
        className="z-0"
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
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 8}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.8}
          target={[0, -1, 0]} // Cible ajustée vers le bas
        />
      </Canvas>
    </div>
  )
}
