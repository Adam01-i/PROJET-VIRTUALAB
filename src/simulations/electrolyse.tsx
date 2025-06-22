"use client"

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Cylinder, Box, Sphere, Text, Plane } from "@react-three/drei"
import {
  Zap,
  ChevronDown,
  RotateCcw,
  BookOpen,
  Info,
  Pause,
  Calculator,
  Battery,
  Activity,
  BarChart3,
  EyeOff,
  Eye,
} from "lucide-react"
import * as THREE from "three"

// ===================================
// TYPES ET INTERFACES
// ===================================

interface ElectrolyteType {
  id: string
  name: string
  color: string
  formula: string
  colorHex: string
  concentration: number
  conductivity: number
  ionization: string
  molarMass: number
}

interface ElectrodeType {
  id: string
  name: string
  material: string
  color: string
  colorHex: string
  reactivity: "inerte" | "active" | "consommable"
  conductivity: number
}

interface ExperimentData {
  id: string
  timestamp: Date
  electrolyte: ElectrolyteType
  anode: ElectrodeType
  cathode: ElectrodeType
  voltage: number
  current: number
  duration: number
  results: {
    anodeReaction: string
    cathodeReaction: string
    gasProduced: string
    massDeposited: number
    efficiency: number
    energyConsumed: number
  }
  observations: string
}

// ===================================
// DONNÉES DE LABORATOIRE
// ===================================

const electrolytes: ElectrolyteType[] = [
  {
    id: "nacl",
    name: "Chlorure de sodium",
    color: "bg-blue-50/80",
    formula: "NaCl",
    colorHex: "#3b82f6",
    concentration: 1.0,
    conductivity: 85.2,
    ionization: "Na⁺ + Cl⁻",
    molarMass: 58.44,
  },
  {
    id: "cuso4",
    name: "Sulfate de cuivre",
    color: "bg-cyan-100/80",
    formula: "CuSO₄",
    colorHex: "#06b6d4",
    concentration: 0.5,
    conductivity: 73.4,
    ionization: "Cu²⁺ + SO₄²⁻",
    molarMass: 159.61,
  },
  {
    id: "h2so4",
    name: "Acide sulfurique",
    color: "bg-yellow-100/80",
    formula: "H₂SO₄",
    colorHex: "#eab308",
    concentration: 0.1,
    conductivity: 429.0,
    ionization: "2H⁺ + SO₄²⁻",
    molarMass: 98.08,
  },
  {
    id: "kno3",
    name: "Nitrate de potassium",
    color: "bg-purple-100/80",
    formula: "KNO₃",
    colorHex: "#a855f7",
    concentration: 0.8,
    conductivity: 71.4,
    ionization: "K⁺ + NO₃⁻",
    molarMass: 101.1,
  },
]

const electrodes: ElectrodeType[] = [
  {
    id: "carbon",
    name: "Carbone (Graphite)",
    material: "C",
    color: "bg-gray-800/90",
    colorHex: "#1f2937",
    reactivity: "inerte",
    conductivity: 25.0,
  },
  {
    id: "copper",
    name: "Cuivre",
    material: "Cu",
    color: "bg-orange-600/90",
    colorHex: "#ea580c",
    reactivity: "active",
    conductivity: 596.0,
  },
  {
    id: "platinum",
    name: "Platine",
    material: "Pt",
    color: "bg-gray-400/90",
    colorHex: "#9ca3af",
    reactivity: "inerte",
    conductivity: 94.0,
  },
  {
    id: "zinc",
    name: "Zinc",
    material: "Zn",
    color: "bg-blue-400/90",
    colorHex: "#60a5fa",
    reactivity: "consommable",
    conductivity: 169.0,
  },
  {
    id: "gold",
    name: "Or",
    material: "Au",
    color: "bg-yellow-500/90",
    colorHex: "#eab308",
    reactivity: "inerte",
    conductivity: 452.0,
  },
  {
    id: "silver",
    name: "Argent",
    material: "Ag",
    color: "bg-gray-300/90",
    colorHex: "#d1d5db",
    reactivity: "active",
    conductivity: 630.0,
  },
]

// ===================================
// UTILITAIRES CHIMIQUES
// ===================================

class ElectrolysisCalculator {
  static getSolutionColor(
    electrolyteAdded: boolean,
    electrolysis: boolean,
    reactionComplete: boolean,
    selectedElectrolyte: ElectrolyteType,
    voltage: number,
    duration: number,
  ): string {
    if (!electrolyteAdded) return "#ffffff"
    if (electrolyteAdded && !electrolysis) return selectedElectrolyte.colorHex
    if (electrolysis && !reactionComplete) {
      return this.getElectrolysisColor(selectedElectrolyte, voltage, duration)
    }
    if (reactionComplete) return this.getResultColor(selectedElectrolyte)
    return "#ffffff"
  }

  static getElectrolysisColor(selectedElectrolyte: ElectrolyteType, voltage: number, duration: number): string {
    const intensity = Math.min(voltage / 12, 1)
    const timeProgress = Math.min(duration / 30, 1) // Progression sur 30 secondes
    const transitions: Record<string, string> = {
      nacl: `hsl(200, ${70 + timeProgress * 20}%, ${70 - intensity * 20 - timeProgress * 10}%)`,
      cuso4: `hsl(190, ${80 + timeProgress * 15}%, ${60 - intensity * 30 - timeProgress * 15}%)`,
      h2so4: `hsl(50, ${90 + timeProgress * 10}%, ${80 - intensity * 40 - timeProgress * 20}%)`,
      kno3: `hsl(270, ${70 + timeProgress * 25}%, ${75 - intensity * 25 - timeProgress * 15}%)`,
    }
    return transitions[selectedElectrolyte.id] || selectedElectrolyte.colorHex
  }

  static getResultColor(selectedElectrolyte: ElectrolyteType): string {
    const resultColors: Record<string, string> = {
      nacl: "#10b981",
      cuso4: "#dc2626",
      h2so4: "#f59e0b",
      kno3: "#8b5cf6",
    }
    return resultColors[selectedElectrolyte.id] || "#6b7280"
  }

  static getFillLevel(electrolyteAdded: boolean): number {
    return electrolyteAdded ? 0.7 : 0
  }

  static getElectrolysisReactions(
    selectedElectrolyte: ElectrolyteType,
    anode: ElectrodeType,
    cathode: ElectrodeType,
  ): {
    anodeReaction: string
    cathodeReaction: string
    globalReaction: string
    anodeProduct: string
    cathodeProduct: string
    additionalProduct?: string
  } {
    const reactions: Record<string, Record<string, Record<string, any>>> = {
      nacl: {
        carbon: {
          carbon: {
            anodeReaction: "2Cl⁻ → Cl₂ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH",
            anodeProduct: "Cl₂",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
        },
        copper: {
          carbon: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Cu + 2NaCl + 2H₂O → Cu²⁺ + H₂ + 2NaOH + 2Cl⁻",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
          copper: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Cu + 2H₂O → Cu²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
        },
        platinum: {
          carbon: {
            anodeReaction: "2Cl⁻ → Cl₂ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH",
            anodeProduct: "Cl₂",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
          platinum: {
            anodeReaction: "2Cl⁻ → Cl₂ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH",
            anodeProduct: "Cl₂",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
        },
        zinc: {
          carbon: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Zn + 2H₂O → Zn²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
          zinc: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Zn + 2H₂O → Zn²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
        },
        gold: {
          carbon: {
            anodeReaction: "2Cl⁻ → Cl₂ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH",
            anodeProduct: "Cl₂",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
          gold: {
            anodeReaction: "2Cl⁻ → Cl₂ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH",
            anodeProduct: "Cl₂",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
        },
        silver: {
          carbon: {
            anodeReaction: "Ag → Ag⁺ + e⁻ (+ 2Cl⁻ → Cl₂ + 2e⁻)",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2Ag + 2NaCl + 2H₂O → 2Ag⁺ + Cl₂ + H₂ + 2NaOH",
            anodeProduct: "Cl₂ + Ag⁺ (dissolution)",
            cathodeProduct: "H₂",
            additionalProduct: "NaOH",
          },
          silver: {
            anodeReaction: "Ag → Ag⁺ + e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2Ag + 2H₂O → 2Ag⁺ + H₂ + 2OH⁻",
            anodeProduct: "Ag⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
        },
      },
      cuso4: {
        carbon: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
        },
        copper: {
          carbon: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "Transfert de Cu de l'anode vers la cathode",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "Cu (dépôt)",
          },
          copper: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "Raffinage électrolytique du cuivre",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "Cu (dépôt)",
          },
        },
        platinum: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
          platinum: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
        },
        zinc: {
          carbon: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "Zn + CuSO₄ → ZnSO₄ + Cu",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "Cu (dépôt)",
          },
          zinc: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "Zn + CuSO₄ → ZnSO₄ + Cu",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "Cu (dépôt)",
          },
        },
        gold: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
          gold: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
        },
        silver: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
          silver: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "Cu²⁺ + 2e⁻ → Cu",
            globalReaction: "2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄",
            anodeProduct: "O₂",
            cathodeProduct: "Cu (dépôt)",
          },
        },
      },
      h2so4: {
        carbon: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
        },
        copper: {
          carbon: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "Cu + H₂SO₄ → CuSO₄ + H₂",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
          copper: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "Cu + H₂SO₄ → CuSO₄ + H₂",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
        },
        platinum: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
          platinum: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
        },
        zinc: {
          carbon: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "Zn + H₂SO₄ → ZnSO₄ + H₂",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
          zinc: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "Zn + H₂SO₄ → ZnSO₄ + H₂",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "H₂",
          },
        },
        gold: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
          gold: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
        },
        silver: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
          silver: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H⁺ + 2e⁻ → H₂",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
          },
        },
      },
      kno3: {
        carbon: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
        },
        copper: {
          carbon: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Cu + 2H₂O → Cu²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
          copper: {
            anodeReaction: "Cu → Cu²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Cu + 2H₂O → Cu²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Cu²⁺ (dissolution)",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
        },
        platinum: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
          platinum: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
        },
        zinc: {
          carbon: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Zn + 2H₂O → Zn²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
          zinc: {
            anodeReaction: "Zn → Zn²⁺ + 2e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "Zn + 2H₂O → Zn²⁺ + H₂ + 2OH⁻",
            anodeProduct: "Zn²⁺ (dissolution)",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
        },
        gold: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
          gold: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
        },
        silver: {
          carbon: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
          silver: {
            anodeReaction: "2H₂O → O₂ + 4H⁺ + 4e⁻",
            cathodeReaction: "2H₂O + 2e⁻ → H₂ + 2OH⁻",
            globalReaction: "2H₂O → 2H₂ + O₂",
            anodeProduct: "O₂",
            cathodeProduct: "H₂",
            additionalProduct: "KOH",
          },
        },
      },
    }

    const electrolyteKey = selectedElectrolyte.id
    const anodeKey = anode.id
    const cathodeKey = cathode.id

    const result = reactions[electrolyteKey]?.[anodeKey]?.[cathodeKey] ||
      reactions[electrolyteKey]?.[cathodeKey]?.[anodeKey] ||
      reactions[electrolyteKey]?.carbon?.carbon || {
        anodeReaction: "Oxydation à l'anode",
        cathodeReaction: "Réduction à la cathode",
        globalReaction: "Électrolyse en cours",
        anodeProduct: "Produit anodique",
        cathodeProduct: "Produit cathodique",
      }

    return result
  }

  static getDetailedResult(
    selectedElectrolyte: ElectrolyteType,
    anode: ElectrodeType,
    cathode: ElectrodeType,
    voltage: number,
    current: number,
    duration: number,
  ): {
    anodeReaction: string
    cathodeReaction: string
    gasProduced: string
    massDeposited: number
    efficiency: number
    energyConsumed: number
    mechanism: string
    observation: string
    interpretation: string
    theoreticalYield: number
    actualYield: number
    purity: number
    gasVolume: number
    pH: number
    temperature: number
  } {
    const reactions = this.getElectrolysisReactions(selectedElectrolyte, anode, cathode)
    const faradayConstant = 96485
    const charge = current * duration
    const moles = charge / faradayConstant

    // Facteur de temps pour adapter les résultats (30s max)
    const timeFactor = Math.min(duration / 30, 1)
    const efficiencyBase = 85 + Math.random() * 10
    const efficiency = efficiencyBase * (0.7 + 0.3 * timeFactor) // Efficacité augmente avec le temps

    const results: Record<string, any> = {
      nacl: {
        gasProduced: "H₂ et Cl₂",
        massDeposited: 0,
        mechanism: "Électrolyse avec formation de gaz aux deux électrodes",
        observation: `Dégagement gazeux progressif, formation de NaOH (solution basique). Intensité: ${Math.round(timeFactor * 100)}%`,
        interpretation: "Oxydation des Cl⁻ à l'anode, réduction de H₂O à la cathode",
        theoreticalYield: moles * 2 * 22.4,
        gasVolume: (moles * 2 * 22.4 * efficiency) / 100,
        pH: 12.5 + Math.random() * 1.5 + timeFactor * 0.5,
        temperature: 25 + current * 2 + Math.random() * 5 + timeFactor * 3,
      },
      cuso4: {
        gasProduced: anode.id === "copper" ? "Aucun" : "O₂",
        massDeposited: (moles * 63.55 * efficiency) / 100,
        mechanism: anode.id === "copper" ? "Raffinage électrolytique" : "Électrodéposition",
        observation: `Dépôt rouge de cuivre à la cathode. Épaisseur: ${Math.round(timeFactor * 100)}%`,
        interpretation: "Réduction de Cu²⁺ en Cu métallique",
        theoreticalYield: moles * 63.55,
        gasVolume: anode.id === "copper" ? 0 : (moles * 0.5 * 22.4 * efficiency) / 100,
        pH: 3.5 + Math.random() * 1.0 - timeFactor * 0.2,
        temperature: 25 + current * 1.5 + Math.random() * 3 + timeFactor * 2,
      },
      h2so4: {
        gasProduced: "H₂ et O₂",
        massDeposited: 0,
        mechanism: "Électrolyse de l'eau en milieu acide",
        observation: `Dégagement gazeux dans un rapport 2:1 (H₂:O₂). Volume: ${Math.round(timeFactor * 100)}%`,
        interpretation: "Décomposition de l'eau, H₂SO₄ joue le rôle d'électrolyte",
        theoreticalYield: moles * 1.5 * 22.4,
        gasVolume: (moles * 1.5 * 22.4 * efficiency) / 100,
        pH: 1.5 + Math.random() * 0.5,
        temperature: 25 + current * 3 + Math.random() * 7 + timeFactor * 4,
      },
      kno3: {
        gasProduced: "H₂ et O₂",
        massDeposited: 0,
        mechanism: "Électrolyse de l'eau en milieu neutre",
        observation: `Dégagement gazeux, KNO₃ reste en solution. Progression: ${Math.round(timeFactor * 100)}%`,
        interpretation: "Électrolyse de l'eau, KNO₃ sert d'électrolyte support",
        theoreticalYield: moles * 1.5 * 22.4,
        gasVolume: (moles * 1.5 * 22.4 * efficiency) / 100,
        pH: 7.0 + Math.random() * 1.0,
        temperature: 25 + current * 2.5 + Math.random() * 4 + timeFactor * 2.5,
      },
    }

    const result = results[selectedElectrolyte.id] || results.nacl
    const actualYield = result.massDeposited || result.gasVolume
    const theoreticalYield = result.theoreticalYield

    return {
      ...reactions,
      ...result,
      actualYield,
      purity: 95 + Math.random() * 4 * timeFactor,
      efficiency,
      energyConsumed: (voltage * current * duration) / 1000,
    }
  }

  static calculateCurrent(voltage: number, electrolyte: ElectrolyteType): number {
    const resistance = 100 / electrolyte.conductivity
    return Math.max(0, (voltage - 1.5) / resistance)
  }

  static shouldShowDeposit(
    selectedElectrolyte: ElectrolyteType,
    anode: ElectrodeType,
    cathode: ElectrodeType,
    reactionComplete: boolean,
    duration: number,
  ): boolean {
    if (duration < 5) return false

    // Dépôt de cuivre pour CuSO4 sur toutes les cathodes
    if (selectedElectrolyte.id === "cuso4") return true

    // Pas de dépôt métallique visible pour les autres solutions
    return false
  }

  static getDepositColor(selectedElectrolyte: ElectrolyteType): string {
    const depositColors: Record<string, string> = {
      cuso4: "#b45309",
    }
    return depositColors[selectedElectrolyte.id] || "#6b7280"
  }

  // Nouvelle fonction pour les observations en temps réel
  static getRealTimeObservation(
    selectedElectrolyte: ElectrolyteType,
    anode: ElectrodeType,
    cathode: ElectrodeType,
    duration: number,
    current: number,
  ): string {
    const timePhases = [
      { min: 0, max: 5, phase: "Démarrage" },
      { min: 5, max: 15, phase: "Stabilisation" },
      { min: 15, max: 25, phase: "Régime établi" },
      { min: 25, max: 30, phase: "Fin de réaction" },
    ]

    const currentPhase = timePhases.find((p) => duration >= p.min && duration < p.max)?.phase || "Terminé"

    const observations: Record<string, Record<string, string[]>> = {
      nacl: {
        Démarrage: [
          "Premières bulles visibles aux électrodes",
          "Courant se stabilise progressivement",
          "Solution commence à s'échauffer légèrement",
        ],
        Stabilisation: [
          "Dégagement gazeux régulier de H₂ à la cathode",
          "Formation de Cl₂ à l'anode (odeur caractéristique)",
          "pH de la solution augmente (formation de NaOH)",
        ],
        "Régime établi": [
          "Production gazeuse constante et abondante",
          "Solution devient plus basique (pH > 12)",
          "Température stable, réaction optimale",
        ],
        "Fin de réaction": [
          "Dégagement gazeux maximal atteint",
          "Concentration en NaOH élevée",
          "Efficacité de l'électrolyse optimale",
        ],
      },
      cuso4: {
        Démarrage: [
          "Premiers signes de dépôt cuivré à la cathode",
          "Solution bleue s'éclaircit légèrement",
          "Dégagement d'O₂ à l'anode commence",
        ],
        Stabilisation: [
          "Dépôt de cuivre rouge-orangé visible",
          "Solution devient moins concentrée en Cu²⁺",
          "Formation régulière d'O₂ à l'anode",
        ],
        "Régime établi": [
          "Couche de cuivre s'épaissit uniformément",
          "Solution nettement décolorée",
          "Dégagement d'O₂ constant",
        ],
        "Fin de réaction": [
          "Dépôt de cuivre bien formé et adhérent",
          "Solution presque incolore",
          "Rendement de dépôt maximal",
        ],
      },
      h2so4: {
        Démarrage: ["Dégagement de H₂ à la cathode", "Formation d'O₂ à l'anode", "Rapport volumétrique 2:1 s'établit"],
        Stabilisation: [
          "Production gazeuse dans le rapport théorique",
          "Solution reste acide (pH constant)",
          "Température augmente modérément",
        ],
        "Régime établi": [
          "Électrolyse de l'eau optimale",
          "Gaz produits dans les proportions exactes",
          "H₂SO₄ joue parfaitement son rôle d'électrolyte",
        ],
        "Fin de réaction": [
          "Volume maximal de gaz produit",
          "Efficacité énergétique optimale",
          "Décomposition de l'eau complète",
        ],
      },
      kno3: {
        Démarrage: ["Électrolyse de l'eau commence", "KNO₃ facilite la conduction", "Premiers dégagements gazeux"],
        Stabilisation: ["H₂ et O₂ produits régulièrement", "Solution reste neutre", "KNO₃ inerte chimiquement"],
        "Régime établi": ["Production gazeuse stable", "Électrolyte support efficace", "Pas de réactions parasites"],
        "Fin de réaction": ["Volume gazeux maximal atteint", "KNO₃ intact en solution", "Électrolyse propre de l'eau"],
      },
    }

    const phaseObservations = observations[selectedElectrolyte.id]?.[currentPhase] || ["Observation en cours..."]
    const randomIndex = Math.floor((duration * 0.5) % phaseObservations.length)

    return `${currentPhase} (${duration.toFixed(1)}s): ${phaseObservations[randomIndex]}`
  }
}

// ===================================
// COMPOSANTS 3D
// ===================================

const LabEnvironment = () => {
  return (
    <group>
      {/* Sol du laboratoire avec carrelage réaliste */}
      <Plane args={[35, 35]} position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#e8eaed" roughness={0.8} metalness={0.1} />
      </Plane>

      {/* Carrelage détaillé avec variations */}
      {Array.from({ length: 14 }, (_, i) =>
        Array.from({ length: 14 }, (_, j) => {
          const variation = Math.random() * 0.02
          return (
            <Plane
              key={`tile-${i}-${j}`}
              args={[2.4, 2.4]}
              position={[(i - 6.5) * 2.5, -2.09 + variation, (j - 6.5) * 2.5]}
              rotation={[-Math.PI / 2, 0, Math.random() * 0.01]}
              receiveShadow
            >
              <meshStandardMaterial
                color={`hsl(210, 15%, ${88 + Math.random() * 4}%)`}
                roughness={0.7 + Math.random() * 0.2}
                metalness={0.05 + Math.random() * 0.05}
                transparent
                opacity={0.95}
              />
            </Plane>
          )
        }),
      )}

      {/* Joints de carrelage avec profondeur */}
      {Array.from({ length: 15 }, (_, i) => (
        <group key={`joint-group-${i}`}>
          <Plane args={[35, 0.08]} position={[0, -2.08, (i - 7) * 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#bdc3c7" roughness={0.9} metalness={0.0} />
          </Plane>
          <Plane args={[0.08, 35]} position={[(i - 7) * 2.5, -2.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#bdc3c7" roughness={0.9} metalness={0.0} />
          </Plane>
        </group>
      ))}

      {/* Murs du laboratoire avec texture */}
      <Plane args={[35, 20]} position={[0, 8, -17]} receiveShadow>
        <meshStandardMaterial color="#f8f9fa" roughness={0.9} metalness={0.0} />
      </Plane>
      <Plane args={[35, 20]} position={[-17, 8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#f8f9fa" roughness={0.9} metalness={0.0} />
      </Plane>
      <Plane args={[35, 20]} position={[17, 8, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#f8f9fa" roughness={0.9} metalness={0.0} />
      </Plane>

      {/* Plinthes */}
      <Box args={[35, 0.3, 0.1]} position={[0, -1.8, -16.9]} castShadow>
        <meshStandardMaterial color="#d1d5db" roughness={0.4} metalness={0.1} />
      </Box>
      <Box args={[0.1, 0.3, 35]} position={[-16.9, -1.8, 0]} castShadow>
        <meshStandardMaterial color="#d1d5db" roughness={0.4} metalness={0.1} />
      </Box>
      <Box args={[0.1, 0.3, 35]} position={[16.9, -1.8, 0]} castShadow>
        <meshStandardMaterial color="#d1d5db" roughness={0.4} metalness={0.1} />
      </Box>

      {/* Plafond avec structure */}
      <Plane args={[35, 35]} position={[0, 18, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.0} />
      </Plane>

      {/* Poutres du plafond */}
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={`beam-${i}`} args={[35, 0.4, 0.6]} position={[0, 17.8, (i - 2) * 7]} castShadow>
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} metalness={0.2} />
        </Box>
      ))}

      {/* Éclairage néon au plafond avec supports */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={`neon-group-${i}`}>
          {/* Tube néon */}
          <Box args={[12, 0.3, 0.8]} position={[(i - 1.5) * 9, 17.3, 0]} castShadow>
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.4}
              roughness={0.1}
              metalness={0.9}
            />
          </Box>
          {/* Support du néon */}
          <Box args={[12.5, 0.15, 1.2]} position={[(i - 1.5) * 9, 17.6, 0]} castShadow>
            <meshStandardMaterial color="#d1d5db" roughness={0.3} metalness={0.7} />
          </Box>
          {/* Câbles */}
          <Cylinder args={[0.02, 0.02, 1.0]} position={[(i - 1.5) * 9 - 5, 17.9, 0]} castShadow>
            <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
          </Cylinder>
          <Cylinder args={[0.02, 0.02, 1.0]} position={[(i - 1.5) * 9 + 5, 17.9, 0]} castShadow>
            <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
          </Cylinder>
        </group>
      ))}

      {/* Équipements de laboratoire détaillés */}
      <group position={[-10, -0.3, -12]}>
        {/* Hotte aspirante */}
        <Box args={[3, 4, 2]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.7} />
        </Box>
        <Box args={[2.8, 0.2, 1.8]} position={[0, 1.9, 0]} castShadow>
          <meshStandardMaterial color="#1a202c" roughness={0.2} metalness={0.8} />
        </Box>
        <Cylinder args={[0.3, 0.3, 2]} position={[0, 3, -0.8]} castShadow>
          <meshStandardMaterial color="#4a5568" roughness={0.4} metalness={0.6} />
        </Cylinder>
        <Text position={[0, 2.5, 1.1]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">
          HOTTE
        </Text>
        {/* Grille d'aération */}
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} args={[2.6, 0.05, 0.05]} position={[0, -1.5 + i * 0.4, 0.9]} castShadow>
            <meshStandardMaterial color="#718096" roughness={0.3} metalness={0.8} />
          </Box>
        ))}
      </group>

      <group position={[10, -0.3, -12]}>
        {/* Analyseur spectral */}
        <Box args={[2, 3, 1.2]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#1a202c" roughness={0.2} metalness={0.8} />
        </Box>
        <Box args={[1.8, 0.8, 0.05]} position={[0, 0.8, 0.65]} castShadow>
          <meshStandardMaterial
            color="#00ff41"
            emissive="#00ff41"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.1}
          />
        </Box>
        <Text position={[0, 2, 0.7]} fontSize={0.15} color="#10b981" anchorX="center" anchorY="middle">
          ANALYSEUR UV-VIS
        </Text>
        {/* Boutons de contrôle */}
        {Array.from({ length: 6 }, (_, i) => (
          <Cylinder key={i} args={[0.05, 0.05, 0.03]} position={[-0.7 + i * 0.28, -0.8, 0.65]} castShadow>
            <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
          </Cylinder>
        ))}
      </group>

      {/* Armoires de laboratoire détaillées */}
      {Array.from({ length: 3 }, (_, i) => (
        <group key={`cabinet-${i}`} position={[(i - 1) * 7, 2, -16.5]}>
          <Box args={[5, 8, 1.2]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#f3f4f6" roughness={0.4} metalness={0.2} />
          </Box>
          {/* Séparation centrale */}
          <Box args={[4.8, 0.1, 1.3]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#d1d5db" roughness={0.3} metalness={0.3} />
          </Box>
          {/* Poignées */}
          <Cylinder args={[0.04, 0.04, 0.15]} position={[1.8, 0.5, 0.7]} castShadow>
            <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.04, 0.04, 0.15]} position={[1.8, -0.5, 0.7]} castShadow>
            <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.8} />
          </Cylinder>
          {/* Étiquettes */}
          <Text position={[0, 4.5, 0.7]} fontSize={0.2} color="#374151" anchorX="center" anchorY="middle">
            {i === 0 ? "RÉACTIFS" : i === 1 ? "VERRERIE" : "ÉQUIPEMENTS"}
          </Text>
        </group>
      ))}

      {/* Éviers de laboratoire */}
      <group position={[-12, -1.2, 8]}>
        <Box args={[2, 0.3, 1.5]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#e5e7eb" roughness={0.2} metalness={0.8} />
        </Box>
        <Cylinder args={[0.6, 0.5, 0.25]} position={[0, 0.15, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.0} />
        </Cylinder>
        {/* Robinet */}
        <Cylinder args={[0.03, 0.03, 0.4]} position={[0, 0.5, -0.6]} castShadow>
          <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.9} />
        </Cylinder>
        <Sphere args={[0.05]} position={[0, 0.7, -0.6]} castShadow>
          <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.9} />
        </Sphere>
      </group>

      {/* Extincteur */}
      <group position={[15, 0, -15]}>
        <Cylinder args={[0.15, 0.15, 1.2]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.7} />
        </Cylinder>
        <Text position={[0, 0.8, 0.2]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
          CO₂
        </Text>
      </group>

      {/* Prises électriques */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`outlet-${i}`} position={[(i - 2.5) * 6, -1.5, -16.8]}>
          <Box args={[0.15, 0.1, 0.05]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#f3f4f6" roughness={0.3} metalness={0.1} />
          </Box>
          <Cylinder args={[0.01, 0.01, 0.02]} position={[-0.03, 0.02, 0.03]} castShadow>
            <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
          </Cylinder>
          <Cylinder args={[0.01, 0.01, 0.02]} position={[0.03, 0.02, 0.03]} castShadow>
            <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
          </Cylinder>
        </group>
      ))}
    </group>
  )
}

const LabTable = () => (
  <group>
    {/* Plateau de table gris avec texture réaliste */}
    <Box args={[10, 0.15, 5]} position={[0, -0.9, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#6b7280" roughness={0.15} metalness={0.3} />
    </Box>

    {/* Bordure de table avec chanfrein */}
    <Box args={[10.2, 0.1, 5.2]} position={[0, -0.82, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#4b5563" roughness={0.3} metalness={0.4} />
    </Box>

    {/* Pieds de table avec détails */}
    {[
      [-4.5, -1.5, -2],
      [4.5, -1.5, -2],
      [-4.5, -1.5, 2],
      [4.5, -1.5, 2],
    ].map((pos, i) => (
      <group key={i}>
        <Cylinder args={[0.08, 0.08, 1.2]} position={pos as [number, number, number]} castShadow>
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
        </Cylinder>
        {/* Base du pied */}
        <Cylinder args={[0.12, 0.08, 0.1]} position={[pos[0], pos[1] - 0.65, pos[2]]} castShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.3} metalness={0.8} />
        </Cylinder>
      </group>
    ))}

    {/* Supports horizontaux renforcés */}
    <Box args={[9, 0.06, 0.12]} position={[0, -1.8, -2]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
    </Box>
    <Box args={[9, 0.06, 0.12]} position={[0, -1.8, 2]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
    </Box>
    <Box args={[0.12, 0.06, 4]} position={[-4.5, -1.8, 0]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
    </Box>
    <Box args={[0.12, 0.06, 4]} position={[4.5, -1.8, 0]} castShadow>
      <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
    </Box>

    {/* Tiroir sous la table */}
    <Box args={[3, 0.4, 1.8]} position={[0, -1.3, 0]} castShadow>
      <meshStandardMaterial color="#4b5563" roughness={0.3} metalness={0.5} />
    </Box>
    <Cylinder args={[0.03, 0.03, 0.08]} position={[0, -1.3, 0.95]} castShadow>
      <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.8} />
    </Cylinder>
  </group>
)

const ElectrolyticCell = ({
  position,
  solutionColor,
  fillLevel = 0,
  electrolysis = false,
  showBubbles = false,
  anodeColor,
  cathodeColor,
  current = 0,
  selectedElectrolyte,
  selectedCathode,
  reactionComplete = false,
  duration = 0,
}: {
  position: [number, number, number]
  solutionColor: string
  fillLevel: number
  electrolysis?: boolean
  showBubbles?: boolean
  anodeColor: string
  cathodeColor: string
  current?: number
  selectedElectrolyte: ElectrolyteType
  selectedCathode: ElectrodeType
  reactionComplete?: boolean
  duration?: number
}) => {
  const bubblesRef = useRef<THREE.Group>(null)
  const cellRef = useRef<THREE.Group>(null)
  const depositRef = useRef<THREE.Group>(null)

  const showDeposit = ElectrolysisCalculator.shouldShowDeposit(
    selectedElectrolyte,
    selectedCathode,
    reactionComplete,
    duration,
  )
  const depositColor = ElectrolysisCalculator.getDepositColor(selectedElectrolyte)

  useFrame((state) => {
    if (bubblesRef.current && showBubbles) {
      bubblesRef.current.children.forEach((bubble: any, i: number) => {
        const speed = 0.02 + Math.random() * 0.015
        bubble.position.y += speed
        bubble.position.x += Math.sin(state.clock.elapsedTime * 4 + i) * 0.002
        bubble.position.z += Math.cos(state.clock.elapsedTime * 3 + i) * 0.002

        if (bubble.position.y > 1.8) {
          bubble.position.y = -0.8 + Math.random() * 0.2
          bubble.position.x = (Math.random() - 0.5) * 1.4
          bubble.position.z = (Math.random() - 0.5) * 0.8
        }
      })
    }

    if (cellRef.current && electrolysis) {
      const intensity = current * 0.05
      cellRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 12) * intensity * 0.001
      cellRef.current.position.z = position[2] + Math.cos(state.clock.elapsedTime * 10) * intensity * 0.001
    }

    if (depositRef.current && showDeposit) {
      const time = state.clock.elapsedTime
      depositRef.current.children.forEach((deposit: any, i: number) => {
        if (deposit.scale) {
          const baseScale = 0.8 + Math.sin(time * 2 + i) * 0.1
          deposit.scale.setScalar(baseScale)
        }
      })
    }
  })

  return (
    <group position={position}>
      <group ref={cellRef}>
        {/* Bécher en verre */}
        <Cylinder args={[1.2, 1.0, 2.5]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial
            color="#f8fafc"
            transparent
            opacity={0.15}
            roughness={0.02}
            metalness={0.0}
            envMapIntensity={1.0}
          />
        </Cylinder>

        {/* Bord du bécher */}
        <Cylinder args={[1.25, 1.22, 0.08]} position={[0, 1.25, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.2} />
        </Cylinder>

        {/* Graduations sur le bécher */}
        {[0.5, 1.0, 1.5, 2.0].map((height, i) => (
          <Cylinder key={i} args={[1.02, 1.02, 0.01]} position={[0, -1.25 + height, 0]}>
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.6} />
          </Cylinder>
        ))}

        {/* Solution électrolytique */}
        {fillLevel > 0 && (
          <group>
            <Cylinder args={[1.15, 0.95, fillLevel * 2.4]} position={[0, -1.25 + fillLevel * 1.2, 0]}>
              <meshStandardMaterial
                color={solutionColor}
                transparent
                opacity={0.8}
                roughness={0.1}
                metalness={0.0}
                envMapIntensity={0.5}
              />
            </Cylinder>
            {/* Surface de la solution */}
            <Cylinder args={[1.15, 1.15, 0.02]} position={[0, -1.25 + fillLevel * 2.4, 0]}>
              <meshStandardMaterial
                color={solutionColor}
                transparent
                opacity={0.9}
                roughness={0.0}
                metalness={0.1}
                envMapIntensity={1.0}
              />
            </Cylinder>
          </group>
        )}

        {/* Anode réaliste */}
        <group position={[-0.8, 0, 0]}>
          {/* Plaque d'électrode */}
          <Box args={[0.05, 2.0, 0.8]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial
              color={anodeColor}
              roughness={0.2}
              metalness={0.9}
              emissive={electrolysis ? anodeColor : "#000000"}
              emissiveIntensity={electrolysis ? 0.03 : 0}
            />
          </Box>
          {/* Support de l'électrode */}
          <Cylinder args={[0.02, 0.02, 0.6]} position={[0, 1.3, 0]} castShadow>
            <meshStandardMaterial color="#718096" roughness={0.3} metalness={0.8} />
          </Cylinder>
          {/* Connexion */}
          <Box args={[0.1, 0.1, 0.1]} position={[0, 1.6, 0]} castShadow>
            <meshStandardMaterial color="#dc2626" roughness={0.1} metalness={0.9} />
          </Box>
        </group>

        {/* Cathode réaliste avec dépôts */}
        <group position={[0.8, 0, 0]}>
          {/* Plaque d'électrode */}
          <Box args={[0.05, 2.0, 0.8]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial
              color={cathodeColor}
              roughness={0.2}
              metalness={0.9}
              emissive={electrolysis ? cathodeColor : "#000000"}
              emissiveIntensity={electrolysis ? 0.03 : 0}
            />
          </Box>

          {/* Dépôts métalliques sur la cathode */}
          {showDeposit && (
            <group ref={depositRef}>
              {Array.from({ length: Math.min(12, Math.floor(duration / 2)) }, (_, i) => (
                <Sphere
                  key={`deposit-${i}`}
                  args={[0.02 + Math.random() * 0.03]}
                  position={[
                    0.03 + Math.random() * 0.02,
                    -0.8 + (i / 12) * 1.6 + (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.7,
                  ]}
                  castShadow
                >
                  <meshStandardMaterial
                    color={depositColor}
                    roughness={0.3}
                    metalness={0.9}
                    emissive={depositColor}
                    emissiveIntensity={0.1}
                  />
                </Sphere>
              ))}
              {/* Couche de dépôt uniforme qui s'épaissit avec le temps */}
              <Box args={[0.02 * Math.min(duration / 15, 1), 1.8, 0.75]} position={[0.035, 0, 0]} castShadow>
                <meshStandardMaterial color={depositColor} transparent opacity={0.7} roughness={0.2} metalness={0.95} />
              </Box>
            </group>
          )}

          {/* Support de l'électrode */}
          <Cylinder args={[0.02, 0.02, 0.6]} position={[0, 1.3, 0]} castShadow>
            <meshStandardMaterial color="#718096" roughness={0.3} metalness={0.8} />
          </Cylinder>
          {/* Connexion */}
          <Box args={[0.1, 0.1, 0.1]} position={[0, 1.6, 0]} castShadow>
            <meshStandardMaterial color="#1d4ed8" roughness={0.1} metalness={0.9} />
          </Box>
        </group>

        {/* Bulles d'électrolyse spécifiques - intensité augmente avec le temps */}
        {showBubbles && (
          <group ref={bubblesRef}>
            {/* Bulles à l'anode - couleur selon la réaction */}
            {Array.from(
              { length: Math.min(selectedElectrolyte.id === "nacl" ? 10 : 8, Math.floor(duration / 2) + 3) },
              (_, i) => (
                <Sphere
                  key={`anode-${i}`}
                  args={[0.01 + Math.random() * 0.02]}
                  position={[
                    -0.8 + (Math.random() - 0.5) * 0.2,
                    -0.8 + Math.random() * 0.3,
                    (Math.random() - 0.5) * 0.8,
                  ]}
                >
                  <meshStandardMaterial
                    color={selectedElectrolyte.id === "nacl" ? "#fbbf24" : "#f59e0b"}
                    transparent
                    opacity={0.7}
                    emissive={selectedElectrolyte.id === "nacl" ? "#fbbf24" : "#f59e0b"}
                    emissiveIntensity={0.2}
                  />
                </Sphere>
              ),
            )}
            {/* Bulles à la cathode - principalement H2 */}
            {Array.from(
              { length: Math.min(selectedElectrolyte.id === "cuso4" ? 4 : 8, Math.floor(duration / 2) + 2) },
              (_, i) => (
                <Sphere
                  key={`cathode-${i}`}
                  args={[0.01 + Math.random() * 0.02]}
                  position={[
                    0.8 + (Math.random() - 0.5) * 0.2,
                    -0.8 + Math.random() * 0.3,
                    (Math.random() - 0.5) * 0.8,
                  ]}
                >
                  <meshStandardMaterial
                    color="#60a5fa"
                    transparent
                    opacity={0.7}
                    emissive="#60a5fa"
                    emissiveIntensity={0.2}
                  />
                </Sphere>
              ),
            )}
          </group>
        )}
      </group>

      {/* Étiquettes */}
      <group position={[0, 3.2, 0]}>
        <Text position={[0, 0.3, 0]} fontSize={0.15} color="#2d3748" anchorX="center" anchorY="middle">
          Cuve d'électrolyse
        </Text>
        <Text position={[0, 0.1, 0]} fontSize={0.1} color="#4a5568" anchorX="center" anchorY="middle">
          {Math.round(fillLevel * 400)}mL
        </Text>
        <Text position={[-0.8, -0.2, 0]} fontSize={0.08} color="#dc2626" anchorX="center" anchorY="middle">
          Anode (+)
        </Text>
        <Text position={[0.8, -0.2, 0]} fontSize={0.08} color="#1d4ed8" anchorX="center" anchorY="middle">
          Cathode (-)
        </Text>
        {showDeposit && (
          <Text position={[0.8, -0.4, 0]} fontSize={0.06} color="#b45309" anchorX="center" anchorY="middle">
            Dépôt Cu ({Math.round((duration / 30) * 100)}%)
          </Text>
        )}
      </group>
    </group>
  )
}

const PowerSupply = ({
  position,
  voltage = 0,
  current = 0,
  isOn = false,
  onClick,
}: {
  position: [number, number, number]
  voltage: number
  current: number
  isOn: boolean
  onClick?: () => void
}) => {
  const displayRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (displayRef.current && isOn) {
      const time = state.clock.elapsedTime
      displayRef.current.position.y = Math.sin(time * 3) * 0.001
    }
  })

  return (
    <group position={position} onClick={onClick}>
      {/* Boîtier principal */}
      <Box args={[1.5, 0.8, 1.0]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.8} />
      </Box>

      {/* Façade */}
      <Box args={[1.45, 0.75, 0.05]} position={[0, 0, 0.52]} castShadow>
        <meshStandardMaterial color="#1a202c" roughness={0.2} metalness={0.9} />
      </Box>

      {/* Écran LCD */}
      <group ref={displayRef}>
        <Box args={[0.8, 0.4, 0.02]} position={[0, 0.15, 0.55]} castShadow>
          <meshStandardMaterial
            color={isOn ? "#00ff41" : "#1a202c"}
            emissive={isOn ? "#00ff41" : "#000000"}
            emissiveIntensity={isOn ? 0.4 : 0}
            roughness={0.1}
            metalness={0.1}
          />
        </Box>
      </group>

      {/* Boutons de contrôle */}
      <Cylinder args={[0.06, 0.06, 0.04]} position={[-0.4, -0.25, 0.55]} castShadow>
        <meshStandardMaterial color={isOn ? "#ef4444" : "#7f1d1d"} roughness={0.2} metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.04]} position={[-0.1, -0.25, 0.55]} castShadow>
        <meshStandardMaterial color="#1d4ed8" roughness={0.2} metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.04]} position={[0.2, -0.25, 0.55]} castShadow>
        <meshStandardMaterial color="#059669" roughness={0.2} metalness={0.8} />
      </Cylinder>

      {/* Bornes de sortie */}
      <Cylinder args={[0.05, 0.05, 0.1]} position={[-0.6, 0.4, 0.55]} castShadow>
        <meshStandardMaterial color="#dc2626" roughness={0.1} metalness={0.9} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 0.1]} position={[0.6, 0.4, 0.55]} castShadow>
        <meshStandardMaterial color="#1d4ed8" roughness={0.1} metalness={0.9} />
      </Cylinder>

      {/* Étiquettes des bornes */}
      <Text position={[-0.6, 0.6, 0.6]} fontSize={0.08} color="#dc2626" anchorX="center" anchorY="middle">
        +
      </Text>
      <Text position={[0.6, 0.6, 0.6]} fontSize={0.08} color="#1d4ed8" anchorX="center" anchorY="middle">
        -
      </Text>

      {/* Informations */}
      <group position={[0, -1.0, 0]}>
        <Text position={[0, 0.3, 0]} fontSize={0.12} color="#2d3748" anchorX="center" anchorY="middle">
          Générateur DC
        </Text>
        <Text position={[0, 0.1, 0]} fontSize={0.08} color="#4a5568" anchorX="center" anchorY="middle">
          {voltage.toFixed(1)}V • {current.toFixed(2)}A
        </Text>
        <Text
          position={[0, -0.1, 0]}
          fontSize={0.07}
          color={isOn ? "#10b981" : "#ef4444"}
          anchorX="center"
          anchorY="middle"
        >
          {isOn ? "MARCHE" : "ARRÊT"}
        </Text>
      </group>
    </group>
  )
}

const ElectricalWires = ({
  isOn = false,
  generatorPos,
  cellPos,
}: {
  isOn: boolean
  generatorPos: [number, number, number]
  cellPos: [number, number, number]
}) => {
  const wireRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (wireRef.current && isOn) {
      const time = state.clock.elapsedTime
      wireRef.current.children.forEach((wire: any, i) => {
        if (wire.material) {
          wire.material.emissiveIntensity = 0.1 + Math.sin(time * 5 + i) * 0.05
        }
      })
    }
  })

  // Calcul des points pour les fils - éviter de traverser l'électrolyse
  const redWirePoints = [
    new THREE.Vector3(generatorPos[0] - 0.6, generatorPos[1] + 0.4, generatorPos[2] + 0.55),
    new THREE.Vector3(generatorPos[0] - 0.6, generatorPos[1] + 1.2, generatorPos[2] + 0.55),
    new THREE.Vector3(generatorPos[0] - 0.6, generatorPos[1] + 1.2, generatorPos[2] + 2),
    new THREE.Vector3(cellPos[0] - 0.8, cellPos[1] + 1.2, cellPos[2] + 2),
    new THREE.Vector3(cellPos[0] - 0.8, cellPos[1] + 1.6, cellPos[2]),
  ]

  const blueWirePoints = [
    new THREE.Vector3(generatorPos[0] + 0.6, generatorPos[1] + 0.4, generatorPos[2] + 0.55),
    new THREE.Vector3(generatorPos[0] + 0.6, generatorPos[1] + 1.2, generatorPos[2] + 0.55),
    new THREE.Vector3(generatorPos[0] + 0.6, generatorPos[1] + 1.2, generatorPos[2] - 2),
    new THREE.Vector3(cellPos[0] + 0.8, cellPos[1] + 1.2, cellPos[2] - 2),
    new THREE.Vector3(cellPos[0] + 0.8, cellPos[1] + 1.6, cellPos[2]),
  ]

  const redCurve = new THREE.CatmullRomCurve3(redWirePoints)
  const blueCurve = new THREE.CatmullRomCurve3(blueWirePoints)

  return (
    <group ref={wireRef}>
      {/* Fil rouge (positif) */}
      <mesh>
        <tubeGeometry args={[redCurve, 30, 0.015, 8, false]} />
        <meshStandardMaterial
          color="#dc2626"
          roughness={0.3}
          metalness={0.7}
          emissive={isOn ? "#dc2626" : "#000000"}
          emissiveIntensity={isOn ? 0.1 : 0}
        />
      </mesh>

      {/* Fil bleu (négatif) */}
      <mesh>
        <tubeGeometry args={[blueCurve, 30, 0.015, 8, false]} />
        <meshStandardMaterial
          color="#1d4ed8"
          roughness={0.3}
          metalness={0.7}
          emissive={isOn ? "#1d4ed8" : "#000000"}
          emissiveIntensity={isOn ? 0.1 : 0}
        />
      </mesh>
    </group>
  )
}

const LabLighting = () => (
  <>
    {/* Éclairage ambiant */}
    <ambientLight intensity={0.4} color="#f0f4f8" />

    {/* Éclairage principal */}
    <directionalLight
      position={[10, 15, 8]}
      intensity={1.2}
      color="#ffffff"
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-far={60}
      shadow-camera-left={-25}
      shadow-camera-right={25}
      shadow-camera-top={25}
      shadow-camera-bottom={-25}
      shadow-bias={-0.0001}
    />

    {/* Éclairage de remplissage */}
    <directionalLight position={[-8, 10, -8]} intensity={0.5} color="#e0e7ff" />
    <directionalLight position={[8, 10, -8]} intensity={0.3} color="#fef3c7" />

    {/* Éclairage ponctuel sur la table */}
    <pointLight position={[0, 4, 3]} intensity={0.4} color="#ffffff" distance={10} decay={2} />

    {/* Éclairage néon du plafond */}
    {Array.from({ length: 4 }, (_, i) => (
      <pointLight
        key={`ceiling-light-${i}`}
        position={[(i - 1.5) * 9, 17, 0]}
        intensity={0.3}
        color="#f0f8ff"
        distance={20}
        decay={1.5}
      />
    ))}

    {/* Éclairage d'accentuation */}
    <spotLight
      position={[0, 8, 5]}
      target-position={[0, 0, 0]}
      intensity={0.5}
      angle={Math.PI / 6}
      penumbra={0.3}
      color="#ffffff"
      castShadow
    />
  </>
)

// ===================================
// SCÈNE PRINCIPALE
// ===================================

const LabScene = ({
  selectedElectrolyte,
  selectedAnode,
  selectedCathode,
  electrolyteAdded,
  electrolysis,
  reactionComplete,
  voltage,
  current,
  duration,
  onToggleElectrolysis,
}: {
  selectedElectrolyte: ElectrolyteType
  selectedAnode: ElectrodeType
  selectedCathode: ElectrodeType
  electrolyteAdded: boolean
  electrolysis: boolean
  reactionComplete: boolean
  voltage: number
  current: number
  duration: number
  onToggleElectrolysis: () => void
}) => {
  const solutionColor = useMemo(
    () =>
      ElectrolysisCalculator.getSolutionColor(
        electrolyteAdded,
        electrolysis,
        reactionComplete,
        selectedElectrolyte,
        voltage,
        duration,
      ),
    [electrolyteAdded, electrolysis, reactionComplete, selectedElectrolyte, voltage, duration],
  )

  const fillLevel = useMemo(() => ElectrolysisCalculator.getFillLevel(electrolyteAdded), [electrolyteAdded])

  const generatorPosition: [number, number, number] = [-3.5, -0.4, 0]
  const cellPosition: [number, number, number] = [0, 0, 0]

  return (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <fog attach="fog" args={["#f8fafc", 25, 45]} />
      <LabLighting />
      <LabEnvironment />
      <LabTable />

      <ElectrolyticCell
        position={cellPosition}
        solutionColor={solutionColor}
        fillLevel={fillLevel}
        electrolysis={electrolysis}
        showBubbles={electrolysis}
        anodeColor={selectedAnode.colorHex}
        cathodeColor={selectedCathode.colorHex}
        current={current}
        selectedElectrolyte={selectedElectrolyte}
        selectedCathode={selectedCathode}
        reactionComplete={reactionComplete}
        duration={duration}
      />

      <PowerSupply
        position={generatorPosition}
        voltage={voltage}
        current={current}
        isOn={electrolysis}
        onClick={onToggleElectrolysis}
      />

      <ElectricalWires isOn={electrolysis} generatorPos={generatorPosition} cellPos={cellPosition} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={6}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 8}
        enableDamping={true}
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={1.0}
        panSpeed={1.0}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ===================================
// HOOK POUR L'ÉLECTROLYSE
// ===================================

const useElectrolysisSimulation = () => {
  const [selectedElectrolyte, setSelectedElectrolyte] = useState(electrolytes[0])
  const [selectedAnode, setSelectedAnode] = useState(electrodes[0])
  const [selectedCathode, setSelectedCathode] = useState(electrodes[0])
  const [electrolyteAdded, setElectrolyteAdded] = useState(false)
  const [electrolysis, setElectrolysis] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [electrolyteMenu, setElectrolyteMenu] = useState(false)
  const [anodeMenu, setAnodeMenu] = useState(false)
  const [cathodeMenu, setCathodeMenu] = useState(false)
  const [experiments, setExperiments] = useState<ExperimentData[]>([])
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentData | null>(null)
  const [voltage, setVoltage] = useState(6)
  const [duration, setDuration] = useState(0)
  const [realTimeObservation, setRealTimeObservation] = useState("")

  const current = useMemo(
    () => (electrolysis ? ElectrolysisCalculator.calculateCurrent(voltage, selectedElectrolyte) : 0),
    [voltage, selectedElectrolyte, electrolysis],
  )

  useEffect(() => {
    // Ne pas réinitialiser complètement, juste les résultats
    setElectrolysis(false)
    setReactionComplete(false)
    setShowResult(false)
    setShowFormula(false)
    setShowAnalysis(false)
    setCurrentExperiment(null)
    setDuration(0)
    setRealTimeObservation("")
    // Garder electrolyteAdded à true pour éviter la disparition
  }, [selectedElectrolyte.id, selectedAnode.id, selectedCathode.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      setElectrolyteAdded(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [selectedElectrolyte.id])

  useEffect(() => {
    if (!electrolysis) return

    const timer = setInterval(() => {
      setDuration((prev) => {
        const newDuration = prev + 0.1
        // Limiter à 30 secondes maximum
        if (newDuration >= 30) {
          setElectrolysis(false)
          return 30
        }
        return newDuration
      })
    }, 100)

    return () => clearInterval(timer)
  }, [electrolysis])

  // Mise à jour des observations en temps réel
  useEffect(() => {
    if (electrolysis && electrolyteAdded) {
      const observationTimer = setInterval(() => {
        const observation = ElectrolysisCalculator.getRealTimeObservation(
          selectedElectrolyte,
          selectedAnode,
          selectedCathode,
          duration,
          current,
        )
        setRealTimeObservation(observation)
      }, 1000)

      return () => clearInterval(observationTimer)
    } else {
      setRealTimeObservation("")
    }
  }, [electrolysis, electrolyteAdded, duration, selectedElectrolyte, selectedAnode, selectedCathode, current])

  useEffect(() => {
    if (!electrolysis || !electrolyteAdded) return

    // Arrêt automatique après 30 secondes
    if (duration >= 30) {
      setElectrolysis(false)
      setShowFormula(true)

      const detailedResult = ElectrolysisCalculator.getDetailedResult(
        selectedElectrolyte,
        selectedAnode,
        selectedCathode,
        voltage,
        current,
        duration,
      )

      const experiment: ExperimentData = {
        id: Date.now().toString(),
        timestamp: new Date(),
        electrolyte: selectedElectrolyte,
        anode: selectedAnode,
        cathode: selectedCathode,
        voltage,
        current,
        duration,
        results: {
          anodeReaction: detailedResult.anodeReaction,
          cathodeReaction: detailedResult.cathodeReaction,
          gasProduced: detailedResult.gasProduced,
          massDeposited: detailedResult.massDeposited,
          efficiency: detailedResult.efficiency,
          energyConsumed: detailedResult.energyConsumed,
        },
        observations: detailedResult.observation,
      }

      setCurrentExperiment(experiment)
      setExperiments((prev) => [experiment, ...prev.slice(0, 9)])

      setTimeout(() => {
        setReactionComplete(true)
      }, 1000)
    }
  }, [duration, electrolysis, electrolyteAdded, selectedElectrolyte, selectedAnode, selectedCathode, voltage, current])

  const handleReset = useCallback(() => {
    setElectrolysis(false)
    setReactionComplete(false)
    setShowFormula(false)
    setShowResult(false)
    setShowAnalysis(false)
    setElectrolyteAdded(false) // Reset complet
    setCurrentExperiment(null)
    setDuration(0)
    setRealTimeObservation("")
    setElectrolyteMenu(false)
    setAnodeMenu(false)
    setCathodeMenu(false)

    // Redémarrer l'ajout d'électrolyte après un court délai
    setTimeout(() => {
      setElectrolyteAdded(true)
    }, 1000)
  }, [])

  const toggleElectrolysis = useCallback(() => {
    if (electrolyteAdded && !reactionComplete && duration < 30) {
      setElectrolysis(!electrolysis)
      if (!electrolysis) {
        setDuration(0)
        setRealTimeObservation("")
      }
    }
  }, [electrolyteAdded, electrolysis, reactionComplete, duration])

  const getStatusMessage = useCallback(() => {
    if (!electrolyteAdded) return "⏳ Préparation de la solution électrolytique..."
    if (electrolyteAdded && !electrolysis && !reactionComplete && duration < 30)
      return "🔋 Solution prête. Cliquez sur le générateur pour démarrer l'électrolyse."
    if (electrolysis) {
      const timeLeft = 30 - duration
      return `⚡ Électrolyse en cours... ${duration.toFixed(1)}s/${30}s - ${current.toFixed(2)}A (${timeLeft.toFixed(1)}s restantes)`
    }
    if (reactionComplete || duration >= 30) return "📊 Électrolyse terminée! Analysez les résultats."
    return ""
  }, [electrolyteAdded, electrolysis, reactionComplete, duration, current])

  const getElectrolysisReactions = useCallback(
    () => ElectrolysisCalculator.getElectrolysisReactions(selectedElectrolyte, selectedAnode, selectedCathode),
    [selectedElectrolyte, selectedAnode, selectedCathode],
  )

  const getDetailedResult = useCallback(
    () =>
      reactionComplete || duration >= 30
        ? ElectrolysisCalculator.getDetailedResult(
            selectedElectrolyte,
            selectedAnode,
            selectedCathode,
            voltage,
            current,
            duration,
          )
        : null,
    [reactionComplete, duration, selectedElectrolyte, selectedAnode, selectedCathode, voltage, current],
  )

  return {
    selectedElectrolyte,
    selectedAnode,
    selectedCathode,
    electrolyteAdded,
    electrolysis,
    reactionComplete,
    showFormula,
    showResult,
    showAnalysis,
    showControls,
    electrolyteMenu,
    anodeMenu,
    cathodeMenu,
    experiments,
    currentExperiment,
    voltage,
    current,
    duration,
    realTimeObservation,
    setSelectedElectrolyte,
    setSelectedAnode,
    setSelectedCathode,
    setShowFormula,
    setShowAnalysis,
    setShowControls,
    setElectrolyteMenu,
    setAnodeMenu,
    setCathodeMenu,
    setVoltage,
    handleReset,
    toggleElectrolysis,
    getStatusMessage,
    getElectrolysisReactions,
    getDetailedResult,
    setShowResult,
  }
}

// ===================================
// COMPOSANTS UI COMPACTS
// ===================================

const UIControls = ({
  selectedElectrolyte,
  selectedAnode,
  selectedCathode,
  electrolyteMenu,
  anodeMenu,
  cathodeMenu,
  electrolyteAdded,
  electrolysis,
  voltage,
  current,
  duration,
  setSelectedElectrolyte,
  setSelectedAnode,
  setSelectedCathode,
  setElectrolyteMenu,
  setAnodeMenu,
  setCathodeMenu,
  setVoltage,
  toggleElectrolysis,
  handleReset,
  setShowFormula,
  showFormula,
  setShowResult,
  setShowAnalysis,
  reactionComplete,
  showControls,
}: any) => {
  if (!showControls) return null

  const timeLeft = Math.max(0, 30 - duration)
  const progress = Math.min((duration / 30) * 100, 100)

  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-72 border border-gray-200 shadow-xl z-10">
      <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
        <Battery className="mr-2 text-indigo-600" size={16} />
        Contrôles d'Électrolyse
      </h3>

      {/* Barre de progression temporelle */}
      {(electrolysis || duration > 0) && (
        <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded border border-blue-200">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-blue-700 font-medium">Temps d'électrolyse</span>
            <span className="font-mono text-blue-900">{duration.toFixed(1)}s / 30s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {electrolysis && (
            <div className="text-xs text-blue-600 mt-1 text-center">⏱️ {timeLeft.toFixed(1)}s restantes</div>
          )}
        </div>
      )}

      <div className="space-y-2 mb-3">
        <div className="relative">
          <label className="text-xs text-gray-600 mb-1 block font-medium">Électrolyte:</label>
          <button
            onClick={() => setElectrolyteMenu(!electrolyteMenu)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-xs hover:bg-gray-100 transition-colors"
            disabled={electrolysis}
          >
            <span className="font-medium">{selectedElectrolyte.name}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>

          {electrolyteMenu && !electrolysis && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-32 overflow-y-auto">
              {electrolytes.map((electrolyte) => (
                <button
                  key={electrolyte.id}
                  onClick={() => {
                    setSelectedElectrolyte(electrolyte)
                    setElectrolyteMenu(false)
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-gray-50 text-gray-800 text-xs transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{electrolyte.name}</div>
                  <div className="text-xs text-gray-500">
                    {electrolyte.formula} - {electrolyte.concentration}M
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <label className="text-xs text-gray-600 mb-1 block font-medium">Anode (+):</label>
            <button
              onClick={() => setAnodeMenu(!anodeMenu)}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-xs hover:bg-gray-100 transition-colors"
              disabled={electrolysis}
            >
              <span className="font-medium">{selectedAnode.material}</span>
              <ChevronDown size={12} className="text-gray-500" />
            </button>

            {anodeMenu && !electrolysis && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-28 overflow-y-auto">
                {electrodes.map((electrode) => (
                  <button
                    key={electrode.id}
                    onClick={() => {
                      setSelectedAnode(electrode)
                      setAnodeMenu(false)
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-gray-50 text-gray-800 text-xs transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{electrode.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="text-xs text-gray-600 mb-1 block font-medium">Cathode (-):</label>
            <button
              onClick={() => setCathodeMenu(!cathodeMenu)}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-md border border-gray-300 text-gray-800 text-xs hover:bg-gray-100 transition-colors"
              disabled={electrolysis}
            >
              <span className="font-medium">{selectedCathode.material}</span>
              <ChevronDown size={12} className="text-gray-500" />
            </button>

            {cathodeMenu && !electrolysis && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-28 overflow-y-auto">
                {electrodes.map((electrode) => (
                  <button
                    key={electrode.id}
                    onClick={() => {
                      setSelectedCathode(electrode)
                      setCathodeMenu(false)
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-gray-50 text-gray-800 text-xs transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{electrode.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block font-medium">Tension: {voltage}V</label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={electrolysis}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0V</span>
            <span>6V</span>
            <span>12V</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={toggleElectrolysis}
          disabled={!electrolyteAdded || duration >= 30}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            electrolyteAdded && duration < 30
              ? electrolysis
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {electrolysis ? <Pause size={14} /> : <Zap size={14} />}
          {duration >= 30 ? "Terminé" : electrolysis ? "Arrêter" : "Démarrer"}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 rounded-md text-xs transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>

          <button
            onClick={() => setShowFormula(!showFormula)}
            className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-md text-xs transition-colors"
          >
            <BookOpen size={12} />
            Réactions
          </button>
        </div>

        {(reactionComplete || duration >= 30) && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowResult(true)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Calculator size={12} />
              Bilan
            </button>
            <button
              onClick={() => setShowAnalysis(true)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <BarChart3 size={12} />
              Analyse
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded border border-blue-200">
        <p className="font-medium text-blue-800 text-xs mb-1">Paramètres électriques:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-blue-700">Tension:</span>
            <span className="font-mono text-blue-900">{voltage.toFixed(1)}V</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Courant:</span>
            <span className="font-mono text-blue-900">{current.toFixed(2)}A</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const UIResults = ({
  electrolyteAdded,
  electrolysis,
  reactionComplete,
  duration,
  current,
  realTimeObservation,
  getStatusMessage,
  getDetailedResult,
  showControls,
}: any) => {
  const detailedResult = getDetailedResult()

  if (!showControls) return null

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-64 border border-gray-200 shadow-xl z-10">
      <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
        <Activity className="mr-2 text-indigo-600" size={14} />
        Observations en Temps Réel
      </h3>

      <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-800 font-medium">{getStatusMessage()}</p>
      </div>

      {/* Observations en temps réel pendant l'électrolyse */}
      {realTimeObservation && (
        <div className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 text-xs mb-1">🔬 Observation:</h4>
          <p className="text-xs text-yellow-700">{realTimeObservation}</p>
        </div>
      )}

      {detailedResult && (
        <div className="space-y-2 mb-2">
          <div className="p-2 bg-green-50 rounded border border-green-200">
            <h4 className="font-semibold text-green-800 text-xs mb-1">⚡ Réactions:</h4>
            <p className="text-xs text-green-700 mb-1">Anode: {detailedResult.anodeReaction}</p>
            <p className="text-xs text-green-700">Cathode: {detailedResult.cathodeReaction}</p>
          </div>

          <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 text-xs mb-1">🫧 Produits:</h4>
            <p className="text-xs text-yellow-700">{detailedResult.gasProduced}</p>
            {detailedResult.massDeposited > 0 && (
              <p className="text-xs text-yellow-700">Dépôt: {detailedResult.massDeposited.toFixed(3)}g</p>
            )}
          </div>

          <div className="p-2 bg-purple-50 rounded border border-purple-200">
            <h4 className="font-semibold text-purple-800 text-xs mb-1">📊 Rendement:</h4>
            <p className="text-xs text-purple-700">
              {detailedResult.efficiency.toFixed(1)}% • {detailedResult.energyConsumed.toFixed(2)}kJ
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Durée: {duration.toFixed(1)}s / 30s ({((duration / 30) * 100).toFixed(0)}%)
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h4 className="font-semibold text-gray-700 text-xs">État du système:</h4>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Solution", value: electrolyteAdded, icon: "🧪" },
            { label: "Électrolyse", value: electrolysis, special: "electrolysis", icon: "⚡" },
            { label: "Durée", value: duration > 0, special: "duration", icon: "⏱️" },
            { label: "Terminé", value: reactionComplete || duration >= 30, special: "complete", icon: "✅" },
          ].map(({ label, value, special, icon }) => (
            <div key={label} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
              <span className="text-gray-600 flex items-center gap-1">
                <span className="text-xs">{icon}</span>
                {label}
              </span>
              <span
                className={`font-medium text-xs ${
                  special === "electrolysis"
                    ? value
                      ? "text-green-600"
                      : "text-gray-500"
                    : special === "duration"
                      ? value
                        ? "text-blue-600"
                        : "text-gray-500"
                      : special === "complete"
                        ? value
                          ? "text-purple-600"
                          : "text-gray-500"
                        : value
                          ? "text-green-600"
                          : "text-gray-500"
                }`}
              >
                {special === "duration" && value ? `${duration.toFixed(1)}s` : value ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const AnalysisModal = ({
  showAnalysis,
  setShowAnalysis,
  getDetailedResult,
}: {
  showAnalysis: boolean
  setShowAnalysis: (show: boolean) => void
  getDetailedResult: () => any
}) => {
  if (!showAnalysis) return null

  const result = getDetailedResult()
  if (!result) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <BarChart3 className="text-emerald-600" size={28} />
              Analyse Complète des Résultats (30s)
            </h2>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Données expérimentales */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">📊 Données Expérimentales</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Rendement théorique:</span>
                    <span className="font-mono text-blue-900">
                      {result.theoreticalYield?.toFixed(3)} {result.massDeposited > 0 ? "g" : "L"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Rendement réel:</span>
                    <span className="font-mono text-blue-900">
                      {result.actualYield?.toFixed(3)} {result.massDeposited > 0 ? "g" : "L"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Efficacité:</span>
                    <span className="font-mono text-blue-900">{result.efficiency?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Pureté:</span>
                    <span className="font-mono text-blue-900">{result.purity?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Durée totale:</span>
                    <span className="font-mono text-blue-900">30.0s (optimale)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">🧪 Conditions Opératoires</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Température:</span>
                    <span className="font-mono text-green-900">{result.temperature?.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">pH final:</span>
                    <span className="font-mono text-green-900">{result.pH?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Volume gazeux:</span>
                    <span className="font-mono text-green-900">{result.gasVolume?.toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Énergie consommée:</span>
                    <span className="font-mono text-green-900">{result.energyConsumed?.toFixed(2)} kJ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analyse et interprétation */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">🔬 Mécanisme Réactionnel</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Type:</span>
                    <p className="text-purple-900 mt-1">{result.mechanism}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Observation finale:</span>
                    <p className="text-purple-900 mt-1">{result.observation}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Interprétation:</span>
                    <p className="text-purple-900 mt-1">{result.interpretation}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  ⚡ Réactions Électrochimiques
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-red-700">Anode (+):</span>
                    <p className="font-mono text-red-900 mt-1 bg-red-100 p-2 rounded">{result.anodeReaction}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Cathode (-):</span>
                    <p className="font-mono text-blue-900 mt-1 bg-blue-100 p-2 rounded">{result.cathodeReaction}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Globale:</span>
                    <p className="font-mono text-green-900 mt-1 bg-green-100 p-2 rounded">{result.globalReaction}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique de rendement */}
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">📈 Analyse du Rendement (30s)</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Rendement obtenu</span>
                  <span className="font-mono">{result.efficiency?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(result.efficiency || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">{result.efficiency?.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Efficacité</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              ✅ Durée optimale de 30 secondes atteinte - Réaction complète
            </div>
          </div>

          {/* Recommandations */}
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              💡 Recommandations d'Optimisation
            </h3>
            <ul className="text-sm text-yellow-900 space-y-2">
              {result.efficiency < 80 && (
                <li>• Augmenter la concentration de l'électrolyte pour améliorer la conductivité</li>
              )}
              {result.temperature > 35 && (
                <li>• Réduire le courant pour limiter l'échauffement et les réactions parasites</li>
              )}
              {result.gasVolume > 0 && result.efficiency < 90 && (
                <li>• Optimiser la géométrie des électrodes pour une meilleure distribution du courant</li>
              )}
              <li>• La durée de 30 secondes permet une réaction complète et optimale</li>
              <li>• Maintenir une agitation douce pour homogénéiser la solution</li>
              <li>• Contrôler régulièrement le pH pour éviter les réactions secondaires</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductsDisplay = ({
  showControls,
  getElectrolysisReactions,
  selectedElectrolyte,
  selectedAnode,
  selectedCathode,
  reactionComplete,
  duration,
}: any) => {
  if (!showControls || (!reactionComplete && duration < 30)) return null

  const reactions = getElectrolysisReactions()

  return (
    <div className="absolute bottom-20 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-80 border border-gray-200 shadow-xl z-10">
      <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">🧪 Produits de l'électrolyse</h3>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-50 p-2 rounded border border-red-200">
          <h4 className="font-semibold text-red-700 text-xs mb-1">À l'anode (+):</h4>
          <p className="text-xs text-red-800 font-mono">{reactions.anodeProduct}</p>
        </div>

        <div className="bg-blue-50 p-2 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-700 text-xs mb-1">À la cathode (-):</h4>
          <p className="text-xs text-blue-800 font-mono">{reactions.cathodeProduct}</p>
        </div>
      </div>

      {reactions.additionalProduct && (
        <div className="mt-2 bg-green-50 p-2 rounded border border-green-200">
          <h4 className="font-semibold text-green-700 text-xs mb-1">Produit additionnel:</h4>
          <p className="text-xs text-green-800 font-mono">{reactions.additionalProduct}</p>
        </div>
      )}
    </div>
  )
}

// ===================================
// COMPOSANT PRINCIPAL
// ===================================

export default function ElectrolysisSimulation() {
  const {
    selectedElectrolyte,
    selectedAnode,
    selectedCathode,
    electrolyteAdded,
    electrolysis,
    reactionComplete,
    showFormula,
    showResult,
    showAnalysis,
    showControls,
    electrolyteMenu,
    anodeMenu,
    cathodeMenu,
    experiments,
    currentExperiment,
    voltage,
    current,
    duration,
    realTimeObservation,
    setSelectedElectrolyte,
    setSelectedAnode,
    setSelectedCathode,
    setShowFormula,
    setShowAnalysis,
    setShowControls,
    setElectrolyteMenu,
    setAnodeMenu,
    setCathodeMenu,
    setVoltage,
    handleReset,
    toggleElectrolysis,
    getStatusMessage,
    getElectrolysisReactions,
    getDetailedResult,
    setShowResult,
  } = useElectrolysisSimulation()

  const reactions = getElectrolysisReactions()

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 relative overflow-hidden">
      <Canvas
        camera={{ position: [5, 5, 10], fov: 45, near: 0.1, far: 100 }}
        shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <LabScene
            selectedElectrolyte={selectedElectrolyte}
            selectedAnode={selectedAnode}
            selectedCathode={selectedCathode}
            electrolyteAdded={electrolyteAdded}
            electrolysis={electrolysis}
            reactionComplete={reactionComplete}
            voltage={voltage}
            current={current}
            duration={duration}
            onToggleElectrolysis={toggleElectrolysis}
          />
        </Suspense>
      </Canvas>

      {/* Bouton pour masquer/afficher les contrôles */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full p-2 border border-gray-200 shadow-lg z-20 hover:bg-white transition-colors"
        title={showControls ? "Masquer les contrôles" : "Afficher les contrôles"}
      >
        {showControls ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
      </button>

      <UIControls
        selectedElectrolyte={selectedElectrolyte}
        selectedAnode={selectedAnode}
        selectedCathode={selectedCathode}
        electrolyteMenu={electrolyteMenu}
        anodeMenu={anodeMenu}
        cathodeMenu={cathodeMenu}
        electrolyteAdded={electrolyteAdded}
        electrolysis={electrolysis}
        voltage={voltage}
        current={current}
        duration={duration}
        setSelectedElectrolyte={setSelectedElectrolyte}
        setSelectedAnode={setSelectedAnode}
        setSelectedCathode={setSelectedCathode}
        setElectrolyteMenu={setElectrolyteMenu}
        setAnodeMenu={setAnodeMenu}
        setCathodeMenu={setCathodeMenu}
        setVoltage={setVoltage}
        toggleElectrolysis={toggleElectrolysis}
        handleReset={handleReset}
        setShowFormula={setShowFormula}
        showFormula={showFormula}
        setShowResult={setShowResult}
        setShowAnalysis={setShowAnalysis}
        reactionComplete={reactionComplete}
        showControls={showControls}
      />

      <UIResults
        electrolyteAdded={electrolyteAdded}
        electrolysis={electrolysis}
        reactionComplete={reactionComplete}
        duration={duration}
        current={current}
        realTimeObservation={realTimeObservation}
        getStatusMessage={getStatusMessage}
        getDetailedResult={getDetailedResult}
        showControls={showControls}
      />

      <AnalysisModal
        showAnalysis={showAnalysis}
        setShowAnalysis={setShowAnalysis}
        getDetailedResult={getDetailedResult}
      />

      {showFormula && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-xl max-w-4xl mx-auto z-10">
          <h4 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
            <BookOpen className="mr-2 text-indigo-600" size={14} />
            Réactions d'électrolyse (durée: 30s max):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-red-50 p-2 rounded-md border border-red-200">
              <span className="font-semibold text-red-700 text-xs block mb-1">Anode (+):</span>
              <span className="font-mono text-xs text-red-800">{reactions.anodeReaction}</span>
            </div>
            <div className="bg-blue-50 p-2 rounded-md border border-blue-200">
              <span className="font-semibold text-blue-700 text-xs block mb-1">Cathode (-):</span>
              <span className="font-mono text-xs text-blue-800">{reactions.cathodeReaction}</span>
            </div>
            <div className="bg-green-50 p-2 rounded-md border border-green-200">
              <span className="font-semibold text-green-700 text-xs block mb-1">Globale:</span>
              <span className="font-mono text-xs text-green-800">{reactions.globalReaction}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 border border-gray-200 shadow-lg max-w-xs z-10">
        <div className="flex items-center mb-1">
          <Info className="mr-1 text-indigo-600" size={12} />
          <span className="font-medium text-gray-700 text-xs">Guide d'utilisation</span>
        </div>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>
            🖱️ <strong>Navigation:</strong> Glissez pour tourner, molette pour zoomer
          </p>
          <p>
            ⚡ <strong>Électrolyse:</strong> Ajustez la tension et cliquez sur le générateur
          </p>
          <p>
            ⏱️ <strong>Durée:</strong> Maximum 30 secondes par expérience
          </p>
          <p>
            🔋 <strong>Paramètres:</strong> Choisissez électrolyte et électrodes
          </p>
          <p>
            👁️ <strong>Interface:</strong> Bouton en haut pour masquer les contrôles
          </p>
        </div>
      </div>

      <ProductsDisplay
        showControls={showControls}
        getElectrolysisReactions={getElectrolysisReactions}
        selectedElectrolyte={selectedElectrolyte}
        selectedAnode={selectedAnode}
        selectedCathode={selectedCathode}
        reactionComplete={reactionComplete}
        duration={duration}
      />
    </div>
  )
}
