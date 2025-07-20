"use client"

import type * as React from "react"
import { useRef, useState, Suspense, useEffect, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Html, ContactShadows } from "@react-three/drei"
import * as THREE from "three"
import { FlaskConical, ChevronDown } from "lucide-react"
import {
    Calculator,
    Award,
    Eye,
    Info,
    AlertTriangle,
    CheckCircle,
    BookOpen,
    RotateCcw,
    TrendingUp,
    Play,
    Pause,
} from "lucide-react"

// Types pour la simulation
interface TitrageConfig {
    titrant: string
    titré: string
    indicateur: string
    volumeEquivalence: number
    initialVolumeErlenmeyer: number
    concentrationErlenmeyer: number
    concentrationBurette: number
    maxVolumeErlenmeyer: number
    maxVolumeBurette: number
}

interface TitrageState extends TitrageConfig {
    volumeEcoule: number
    isRunning: boolean
    debit: number
    pH: number
    couleurSolution: string
    equivalenceAtteinte: boolean
}

const TITRANTS = [
    { value: "HCl", label: "Acide Chlorhydrique", formula: "HCl", color: "#3b82f6", type: "fort" },
    { value: "CH3COOH", label: "Acide Acétique", formula: "CH₃COOH", color: "#8b5cf6", type: "faible" },
    { value: "H2SO4", label: "Acide Sulfurique", formula: "H₂SO₄", color: "#dc2626", type: "fort" },
]

const TITRÉS = [
    { value: "NaOH", label: "Hydroxyde de Sodium", formula: "NaOH", color: "#10b981", type: "forte" },
    { value: "NH4OH", label: "Hydroxyde d'Ammonium", formula: "NH₄OH", color: "#f59e0b", type: "faible" },
    { value: "KOH", label: "Hydroxyde de Potassium", formula: "KOH", color: "#06b6d4", type: "forte" },
]

const INDICATEURS = [
    { value: "Phénolphtaléine", label: "Phénolphtaléine", color: "#ec4899", range: "pH 8.2-10", transition: [8.2, 10] },
    {
        value: "Bleu de bromothymol",
        label: "Bleu de Bromothymol",
        color: "#3b82f6",
        range: "pH 6.0-7.6",
        transition: [6.0, 7.6],
    },
    { value: "Hélianthine", label: "Hélianthine", color: "#f97316", range: "pH 3.1-4.4", transition: [3.1, 4.4] },
]

// Scène 3D améliorée
function TitrageScene({
    titrageState,
    setTitrageState,
    currentTitrant,
    currentTitré,
    currentIndicateur,
    getIndicatorColor,
    config,
}: {
    titrageState: TitrageState
    setTitrageState: React.Dispatch<React.SetStateAction<TitrageState>>
    currentTitrant: any
    currentTitré: any
    currentIndicateur: any
    getIndicatorColor: (pH: number, indicator: string) => string
    config: TitrageConfig
}) {
    const goutteRef = useRef<THREE.Mesh>(null)
    const stirBarRef = useRef<THREE.Mesh>(null)

    // Calcul précis du pH corrigé
    const calculatePH = (
        volumeEcoule: number,
        initialVolumeErlenmeyer: number,
        concentrationErlenmeyer: number,
        concentrationBurette: number,
        titrant: string,
        titré: string,
    ) => {
        const V_base = initialVolumeErlenmeyer / 1000 // Volume initial de base en L
        const C_base = concentrationErlenmeyer // Concentration de la base
        const C_acid = concentrationBurette // Concentration de l'acide
        const V_acid = volumeEcoule / 1000 // Volume d'acide ajouté en L

        // Moles initiales de base
        const n_base_initial = C_base * V_base
        // Moles d'acide ajoutées
        let n_acid_added = C_acid * V_acid

        // Ajustement pour les acides diprotiques
        if (titrant === "H2SO4") {
            n_acid_added = n_acid_added * 2 // H2SO4 a 2 protons
        }

        // Volume total
        const V_total = V_base + V_acid

        let pH: number

        if (V_acid === 0) {
            // pH initial de la base
            if (titré === "NaOH" || titré === "KOH") {
                // Base forte
                const pOH = -Math.log10(C_base)
                pH = 14 - pOH
            } else if (titré === "NH4OH") {
                // Base faible (NH4OH)
                const Kb = 1.8e-5 // Constante de basicité de NH4OH
                const OH_concentration = Math.sqrt(Kb * C_base)
                const pOH = -Math.log10(OH_concentration)
                pH = 14 - pOH
            } else {
                pH = 13
            }
        } else if (n_acid_added < n_base_initial) {
            // Avant l'équivalence - excès de base
            const n_base_remaining = n_base_initial - n_acid_added
            const C_base_remaining = n_base_remaining / V_total

            if (titré === "NaOH" || titré === "KOH") {
                // Base forte
                const pOH = -Math.log10(C_base_remaining)
                pH = 14 - pOH
            } else if (titré === "NH4OH") {
                // Base faible
                const Kb = 1.8e-5
                const OH_concentration = Math.sqrt(Kb * C_base_remaining)
                const pOH = -Math.log10(OH_concentration)
                pH = 14 - pOH
            } else {
                pH = 12
            }
        } else if (Math.abs(n_acid_added - n_base_initial) < 1e-10) {
            // À l'équivalence
            if ((titrant === "HCl" || titrant === "H2SO4") && (titré === "NaOH" || titré === "KOH")) {
                // Acide fort + Base forte = pH neutre
                pH = 7.0
            } else if (titrant === "CH3COOH" && (titré === "NaOH" || titré === "KOH")) {
                // Acide faible + Base forte = pH basique à l'équivalence
                pH = 8.5
            } else if ((titrant === "HCl" || titrant === "H2SO4") && titré === "NH4OH") {
                // Acide fort + Base faible = pH acide à l'équivalence
                pH = 5.5
            } else {
                pH = 7.0
            }
        } else {
            // Après l'équivalence - excès d'acide
            const n_acid_excess = n_acid_added - n_base_initial
            const C_acid_excess = n_acid_excess / V_total

            if (titrant === "HCl" || titrant === "H2SO4") {
                // Acide fort
                pH = -Math.log10(C_acid_excess)
            } else if (titrant === "CH3COOH") {
                // Acide faible
                const Ka = 1.8e-5 // Constante d'acidité de CH3COOH
                const H_concentration = Math.sqrt(Ka * C_acid_excess)
                pH = -Math.log10(H_concentration)
            } else {
                pH = 2
            }
        }

        return Math.max(0.5, Math.min(14, pH))
    }

    useFrame((state, delta) => {
        if (titrageState.isRunning && !titrageState.equivalenceAtteinte) {
            setTitrageState((prev) => {
                const newVolume = Math.min(prev.volumeEcoule + prev.debit * delta, prev.maxVolumeBurette)

                const currentPH = calculatePH(
                    newVolume,
                    prev.initialVolumeErlenmeyer,
                    prev.concentrationErlenmeyer,
                    prev.concentrationBurette,
                    prev.titrant,
                    prev.titré,
                )

                const newCouleur = getIndicatorColor(currentPH, prev.indicateur)
                const equivalenceAtteinte =
                    Math.abs(newVolume - prev.volumeEquivalence) < 0.5 || newVolume >= prev.maxVolumeBurette

                return {
                    ...prev,
                    volumeEcoule: newVolume,
                    pH: currentPH,
                    couleurSolution: newCouleur,
                    equivalenceAtteinte,
                    isRunning: !equivalenceAtteinte && prev.isRunning,
                }
            })
        }

        // Animation de la goutte
        if (titrageState.isRunning && goutteRef.current) {
            goutteRef.current.position.y = Math.sin(state.clock.elapsedTime * 10) * 0.1 - 1.5
            goutteRef.current.visible = true
        } else if (goutteRef.current) {
            goutteRef.current.visible = false
        }

        // Animation du barreau agitateur
        if (stirBarRef.current) {
            stirBarRef.current.rotation.y += 0.15
        }
    })

    return (
        <group>
            {/* Support coloré */}
            <Support />

            {/* Burette avec étiquette */}
            <group position={[0, 2, 0]}>
                <Burette
                    volumeEcoule={titrageState.volumeEcoule}
                    maxVolume={titrageState.maxVolumeBurette}
                    isRunning={titrageState.isRunning}
                />

                {/* Étiquette Burette avec nom du réactif */}
                <Text position={[-0.5, 1.2, 0]} fontSize={0.1} color="#374151" anchorX="center" anchorY="middle">
                    BURETTE
                </Text>
                <Text position={[-0.5, 1.0, 0]} fontSize={0.08} color="#6b7280" anchorX="center" anchorY="middle">
                    {currentTitrant.label}
                </Text>
                <Text position={[-0.5, 0.8, 0]} fontSize={0.06} color="#9ca3af" anchorX="center" anchorY="middle">
                    {currentTitrant.formula}
                </Text>

                {/* Volume affiché en permanence */}
                <Text
                    position={[-0.4, 1.5 - (titrageState.volumeEcoule / titrageState.maxVolumeBurette) * 3, 0]}
                    fontSize={0.19}
                    color="#f87171"
                    anchorX="right"
                    anchorY="middle"
                    rotation={[0, Math.PI / 4, 0]}
                >
                    {(titrageState.maxVolumeBurette - titrageState.volumeEcoule).toFixed(1)} mL
                </Text>

                {/* Goutte animée */}
                <mesh ref={goutteRef} position={[0, -1.5, 0]} renderOrder={2}>
                    <sphereGeometry args={[0.03]} />
                    <meshStandardMaterial color={currentTitrant.color} transparent opacity={0.8} />
                </mesh>
            </group>

            {/* Erlenmeyer avec étiquettes */}
            <group position={[0, -1, 0]}>
                <Erlenmeyer
                    couleurSolution={titrageState.couleurSolution}
                    volumeTotal={titrageState.initialVolumeErlenmeyer + titrageState.volumeEcoule}
                    maxVolume={titrageState.maxVolumeErlenmeyer}
                    currentTitré={currentTitré}
                    currentIndicateur={currentIndicateur}
                    config={config}
                    titrageState={titrageState}
                />

                <MagneticStirrer stirBarRef={stirBarRef} />
            </group>

            {/* Table de laboratoire descendue */}
            <mesh position={[0, -2.5, 0]} receiveShadow>
                <boxGeometry args={[8, 0.2, 5]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>

            {/* Bordures de table */}
            <mesh position={[0, -2.3, 2.4]} receiveShadow>
                <boxGeometry args={[8, 0.1, 0.2]} />
                <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[0, -2.3, -2.4]} receiveShadow>
                <boxGeometry args={[8, 0.1, 0.2]} />
                <meshStandardMaterial color="#654321" />
            </mesh>

            {/* Informations pH en 3D */}
            <Text position={[0.5, 3.7, 0]} fontSize={0.15} color="#374151" anchorX="center" anchorY="middle">
                pH: {titrageState.pH.toFixed(2)}
            </Text>
        </group>
    )
}

function Support() {
    return (
        <group>
            {/* Base métallique */}
            <mesh position={[0, -2.0, 0]} castShadow>
                <cylinderGeometry args={[0.8, 0.8, 0.2]} />
                <meshStandardMaterial color="#A0AEC0" metalness={0.9} roughness={0.15} />
            </mesh>

            {/* Tige verticale */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 4.5]} />
                <meshStandardMaterial color="#CBD5E0" metalness={1.0} roughness={0.05} />
            </mesh>

            {/* Bras horizontal */}
            <mesh position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 1.5]} />
                <meshStandardMaterial color="#CBD5E0" metalness={1.0} roughness={0.05} />
            </mesh>

            {/* Pince colorée */}
            <mesh position={[0.7, 2.5, 0]} castShadow>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color="#38BDF8" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Étiquette Support */}
            <Text position={[0, -1.9, 0.9]} fontSize={0.08} color="#6b7280" anchorX="center" anchorY="middle">
                PLATEAU MAGNETIQUE
            </Text>
        </group>
    )
}

function Burette({
    volumeEcoule,
    maxVolume,
    isRunning,
}: {
    volumeEcoule: number
    maxVolume: number
    isRunning: boolean
}) {
    const graduations = []
    const buretteHeight = 3
    const clampedVolumeEcoule = Math.min(volumeEcoule, maxVolume)
    const liquidHeight = Math.max(0, buretteHeight * (1 - clampedVolumeEcoule / maxVolume))

    // Graduations plus lisibles
    for (let i = 0; i <= maxVolume; i += 5) {
        graduations.push(
            <group key={i} position={[0, 1.5 - (i / maxVolume) * buretteHeight, 0]}>
                <mesh position={[0.12, 0, 0]}>
                    <boxGeometry args={[0.03, 0.02, 0.02]} />
                    <meshStandardMaterial color="#E5E7EB" />
                </mesh>
                <Text position={[0.25, 0, 0]} fontSize={0.06} color="#374151" anchorX="left" anchorY="middle">
                    {i}
                </Text>
            </group>,
        )
    }

    const stopcockRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (stopcockRef.current) {
            stopcockRef.current.rotation.z = isRunning ? Math.PI / 4 : 0
        }
    })

    return (
        <group>
            {/* Corps en verre */}
            <mesh castShadow renderOrder={1}>
                <cylinderGeometry args={[0.1, 0.1, buretteHeight]} />
                <meshPhysicalMaterial
                    color="#C7D2FE"
                    transparent
                    opacity={0.35}
                    roughness={0.1}
                    metalness={0.0}
                    transmission={0.9}
                    ior={1.5}
                />
            </mesh>

            {/* Solution visible */}
            {liquidHeight > 0 && (
                <mesh position={[0, 1.5 - (buretteHeight - liquidHeight) / 2, 0]} renderOrder={2}>
                    <cylinderGeometry args={[0.09, 0.09, liquidHeight]} />
                    <meshStandardMaterial color="#60A5FA" transparent opacity={0.9} />
                </mesh>
            )}

            {/* Robinet rouge clair */}
            <mesh ref={stopcockRef} position={[0, -1.6, 0]} castShadow>
                <boxGeometry args={[0.06, 0.25, 0.06]} />
                <meshStandardMaterial color="#F87171" metalness={0.6} roughness={0.4} />
                <mesh position={[0, 0, 0.12]} rotation={[0, Math.PI / 2, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.25]} />
                    <meshStandardMaterial color="#F87171" metalness={0.6} roughness={0.4} />
                </mesh>
            </mesh>

            {/* Graduations visibles */}
            {graduations}

            {/* Bec verseur transparent */}
            <mesh position={[0, -1.7, 0]} renderOrder={1} castShadow>
                <coneGeometry args={[0.025, 0.12]} />
                <meshPhysicalMaterial
                    color="#C7D2FE"
                    transparent
                    opacity={0.35}
                    roughness={0.1}
                    metalness={0.0}
                    transmission={0.9}
                    ior={1.5}
                />
            </mesh>
        </group>
    )
}

// Erlenmeyer avec volume précis
function Erlenmeyer({
    couleurSolution,
    volumeTotal,
    maxVolume,
    currentTitré,
    currentIndicateur,
}: {
    couleurSolution: string
    volumeTotal: number
    maxVolume: number
    currentTitré: any
    currentIndicateur: any
    config: TitrageConfig
    titrageState: TitrageState
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [cameraPosition, setCameraPosition] = useState<THREE.Vector3>(new THREE.Vector3())

    useFrame(({ camera }) => {
        setCameraPosition(camera.position.clone())
    })

    // Calculer la transparence basée sur la position de la caméra
    const calculateOpacity = () => {
        const distance = cameraPosition.distanceTo(new THREE.Vector3(0, -1, 0))
        const height = cameraPosition.y

        // Si la caméra est au-dessus de l'erlenmeyer, le rendre plus transparent
        if (height > 2 && distance < 3) {
            return Math.max(0.1, 0.4 - (height - 2) * 0.1)
        }
        return 0.65
    }

    // Calcul précis du niveau de solution
    const fillRatio = Math.min(volumeTotal / maxVolume, 0.95) // Ne pas dépasser 95% pour éviter le débordement
    const solutionHeight = fillRatio * 1.6 // Hauteur maximale de l'erlenmeyer
    const rayonBas = 0.3
    const rayonMaxHaut = 1.0

    // Calcul du rayon en fonction de la hauteur (forme conique de l'erlenmeyer)
    const rayonHaut = rayonBas + (rayonMaxHaut - rayonBas) * (solutionHeight / 1.6)

    return (
        <group>
            {/* Corps en verre avec transparence adaptative */}
            <mesh ref={meshRef} castShadow renderOrder={2}>
                <cylinderGeometry args={[1.0, 0.3, 1.6, 64]} />
                <meshPhysicalMaterial
                    color="#F0FDFA"
                    transparent
                    opacity={calculateOpacity()}
                    roughness={0.1}
                    metalness={0.0}
                    transmission={0.9}
                    ior={1.5}
                    depthWrite={false}
                />
            </mesh>

            {/* Col en verre */}
            <mesh position={[0, 0.8, 0]} castShadow renderOrder={1}>
                <cylinderGeometry args={[0.15, 0.15, 0.8, 32]} />
                <meshPhysicalMaterial
                    color="#F0FDFA"
                    transparent
                    opacity={calculateOpacity()}
                    roughness={0.1}
                    metalness={0.0}
                    transmission={0.9}
                    ior={1.5}
                    depthWrite={false}
                />
            </mesh>

            {/* Solution interne avec volume précis */}
            {solutionHeight > 0 && (
                <mesh position={[0, -0.8 + solutionHeight / 2, 0]} renderOrder={3} receiveShadow>
                    <cylinderGeometry args={[rayonHaut, rayonBas, solutionHeight, 64]} />
                    <meshStandardMaterial color={couleurSolution} transparent opacity={0.95} roughness={0.3} metalness={0.05} />
                </mesh>
            )}

            {/* Graduations de volume sur l'erlenmeyer */}
            {[25, 50, 75, 100, 125].map((vol) => {
                if (vol <= maxVolume) {
                    const heightPos = -0.8 + (vol / maxVolume) * 1.6
                    return (
                        <group key={vol} position={[0.8, heightPos, 0]}>
                            <mesh position={[0.1, 0, 0]}>
                                <boxGeometry args={[0.02, 0.01, 0.01]} />
                                <meshStandardMaterial color="#6b7280" />
                            </mesh>
                            <Text position={[0.2, 0, 0]} fontSize={0.04} color="#374151" anchorX="left" anchorY="middle">
                                {vol}mL
                            </Text>
                        </group>
                    )
                }
                return null
            })}

            {/* Étiquettes améliorées */}
            <group position={[1.5, 0.6, 0]}>
                <Text position={[0, 0.2, 0]} fontSize={0.12} color="#374151" anchorX="center" anchorY="middle">
                    ERLENMEYER
                </Text>
                <Text position={[0, 0, 0]} fontSize={0.08} color="#6b7280" anchorX="center" anchorY="middle">
                    {currentTitré.label}
                </Text>
                <Text position={[0, -0.15, 0]} fontSize={0.06} color="#9ca3af" anchorX="center" anchorY="middle">
                    {currentTitré.formula}
                </Text>
                <Text position={[0, -0.3, 0]} fontSize={0.06} color="#f59e0b" anchorX="center" anchorY="middle">
                    + {currentIndicateur.label}
                </Text>
                {/* Indicateur de volume précis */}
                <Text position={[0, -0.45, 0]} fontSize={0.05} color="#374151" anchorX="center" anchorY="middle">
                    {volumeTotal.toFixed(1)} / {maxVolume} mL
                </Text>
            </group>
        </group>
    )
}

function MagneticStirrer({ stirBarRef }: { stirBarRef: React.RefObject<THREE.Mesh> }) {
    return (
        <group>
            {/* Base de l'agitateur */}
            <mesh position={[0, -1.2, 0]} castShadow>
                <boxGeometry args={[2.0, 0.3, 2.0]} />
                <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* LED indicateur */}
            <mesh position={[0.35, -1.15, 0.35]} castShadow>
                <sphereGeometry args={[0.03]} />
                <meshStandardMaterial color="#34D399" emissive="#34D399" emissiveIntensity={2.0} />
            </mesh>

            {/* Barreau agitateur */}
            <mesh ref={stirBarRef} position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.4]} />
                <meshStandardMaterial color="#FDE68A" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Étiquette */}
            <Text position={[0.5, -0.6, 0.25]} fontSize={0.07} color="#6b7280" anchorX="center" anchorY="middle">
                AGITATEUR
            </Text>
        </group>
    )
}

export default function TitrageAcidoBasique() {
    const [showResult, setShowResult] = useState(false)
    const [experiments, setExperiments] = useState<any[]>([])
    const [currentExperiment, setCurrentExperiment] = useState<any>(null)

    const initialConfig: TitrageConfig = {
        titrant: "HCl",
        titré: "NaOH",
        indicateur: "Phénolphtaléine",
        initialVolumeErlenmeyer: 25,
        concentrationErlenmeyer: 0.1,
        concentrationBurette: 0.1,
        volumeEquivalence: 25,
        maxVolumeErlenmeyer: 150,
        maxVolumeBurette: 50,
    }

    const [config, setConfig] = useState<TitrageConfig>(initialConfig)
    const [titrageState, setTitrageState] = useState<TitrageState>({
        ...config,
        volumeEcoule: 0,
        isRunning: false,
        debit: 0.5,
        pH: 13,
        couleurSolution: "#ff1493",
        equivalenceAtteinte: false,
    })

    const controlsRef = useRef<any>(null)

    // Calcul du volume d'équivalence avec vérification des limites
    const calculateVolumeEquivalence = useCallback((config: TitrageConfig) => {
        let volumeEq = (config.concentrationErlenmeyer * config.initialVolumeErlenmeyer) / config.concentrationBurette

        // Ajustement pour les acides diprotiques comme H2SO4
        if (config.titrant === "H2SO4") {
            volumeEq = volumeEq / 2 // H2SO4 a 2 protons
        }

        // Vérifier que le volume d'équivalence ne dépasse pas les limites
        const maxPossible = Math.min(
            config.maxVolumeBurette * 0.9, // 90% de la capacité de la burette
            config.maxVolumeErlenmeyer - config.initialVolumeErlenmeyer - 5, // Laisser 5mL de marge
        )

        return Math.min(volumeEq, maxPossible)
    }, [])

    // Fonction améliorée pour calculer la couleur de l'indicateur
    const getIndicatorColor = useCallback((pH: number, indicator: string) => {
        const indicatorData = INDICATEURS.find((ind) => ind.value === indicator)
        if (!indicatorData) return "#ffffff"

        const [pHMin, pHMax] = indicatorData.transition

        if (indicator === "Phénolphtaléine") {
            if (pH < pHMin) return "#ffffff" // Incolore
            if (pH > pHMax) return "#ff1493" // Rose fuchsia
            // Transition progressive
            const intensity = (pH - pHMin) / (pHMax - pHMin)
            return `hsl(330, 100%, ${100 - intensity * 30}%)`
        } else if (indicator === "Bleu de bromothymol") {
            if (pH < pHMin) return "#ffff00" // Jaune
            if (pH > pHMax) return "#0066ff" // Bleu
            // Transition jaune -> vert -> bleu
            const intensity = (pH - pHMin) / (pHMax - pHMin)
            if (intensity < 0.5) {
                return `hsl(${60 + intensity * 60}, 100%, 50%)`
            } else {
                return `hsl(${120 + (intensity - 0.5) * 120}, 100%, 50%)`
            }
        } else if (indicator === "Hélianthine") {
            if (pH < pHMin) return "#ff0000" // Rouge
            if (pH > pHMax) return "#ffff00" // Jaune
            // Transition rouge -> orange -> jaune
            const intensity = (pH - pHMin) / (pHMax - pHMin)
            return `hsl(${intensity * 60}, 100%, 50%)`
        }
        return "#ffffff"
    }, [])

    // Mise à jour automatique de la couleur du liquide
    useEffect(() => {
        const newColor = getIndicatorColor(titrageState.pH, config.indicateur)
        if (newColor !== titrageState.couleurSolution) {
            setTitrageState((prev) => ({ ...prev, couleurSolution: newColor }))
        }
    }, [titrageState.pH, config.indicateur, getIndicatorColor, titrageState.couleurSolution])

    useEffect(() => {
        const newVolumeEq = calculateVolumeEquivalence(config)
        setConfig((prev) => ({ ...prev, volumeEquivalence: newVolumeEq }))
        reset()
    }, [
        config.concentrationErlenmeyer,
        config.initialVolumeErlenmeyer,
        config.concentrationBurette,
        config.titrant,
        config.titré,
        calculateVolumeEquivalence,
    ])

    const handleConfigChange = <K extends keyof TitrageConfig>(key: K, value: TitrageConfig[K]) => {
        // Validation stricte des limites
        if (key === "initialVolumeErlenmeyer") {
            const maxAllowed = Math.min(50, config.maxVolumeErlenmeyer - 20)
            value = Math.min(value as number, maxAllowed) as TitrageConfig[K]
        }
        if (key === "concentrationErlenmeyer" || key === "concentrationBurette") {
            value = Math.min(Math.max(value as number, 0.05), 0.5) as TitrageConfig[K]
        }

        setConfig((prev) => ({ ...prev, [key]: value }))
    }

    // Fonction reset corrigée
    const reset = useCallback(() => {
        const initialPH = config.titré === "NaOH" || config.titré === "KOH" ? 13 : 11.5
        const initialColor = getIndicatorColor(initialPH, config.indicateur)

        setTitrageState({
            ...config,
            volumeEcoule: 0,
            isRunning: false,
            debit: 0.5,
            pH: initialPH,
            couleurSolution: initialColor,
            equivalenceAtteinte: false,
        })
        setCurrentExperiment(null)
    }, [config, getIndicatorColor])

    const toggleTitrage = () => {
        // Vérification stricte des limites avant de démarrer
        const volumeTotal = config.initialVolumeErlenmeyer + config.volumeEquivalence
        if (volumeTotal > config.maxVolumeErlenmeyer) {
            alert(
                `Erreur: Le volume total (${volumeTotal.toFixed(1)}mL) dépasse la capacité de l'erlenmeyer (${config.maxVolumeErlenmeyer}mL)`,
            )
            return
        }

        setTitrageState((prev) => ({ ...prev, isRunning: !prev.isRunning }))
    }

    const handleDebitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitrageState((prev) => ({ ...prev, debit: Number(e.target.value) }))
    }

    const progressPercent = Math.min((titrageState.volumeEcoule / titrageState.volumeEquivalence) * 100, 100)

    const currentTitrant = TITRANTS.find((t) => t.value === config.titrant) || TITRANTS[0]
    const currentTitré = TITRÉS.find((t) => t.value === config.titré) || TITRÉS[0]
    const currentIndicateur = INDICATEURS.find((i) => i.value === config.indicateur) || INDICATEURS[0]

    const createExperiment = useCallback(() => {
        if (titrageState.equivalenceAtteinte && !currentExperiment) {
            const experiment = {
                id: Date.now().toString(),
                timestamp: new Date(),
                titrant: currentTitrant,
                titré: currentTitré,
                indicateur: currentIndicateur,
                volumeEquivalence: titrageState.volumeEquivalence,
                volumeEcoule: titrageState.volumeEcoule,
                pHFinal: titrageState.pH,
                precision: Math.abs(titrageState.volumeEcoule - titrageState.volumeEquivalence),
                couleurFinale: titrageState.couleurSolution,
                concentrationTitrant: config.concentrationBurette,
                concentrationTitré: config.concentrationErlenmeyer,
                volumeInitial: config.initialVolumeErlenmeyer,
                volumeTotal: config.initialVolumeErlenmeyer + titrageState.volumeEcoule,
                efficiency: Math.max(0, 100 - Math.abs(titrageState.volumeEcoule - titrageState.volumeEquivalence) * 10),
            }
            setCurrentExperiment(experiment)
            setExperiments((prev) => [experiment, ...prev.slice(0, 9)])
        }
    }, [
        titrageState.equivalenceAtteinte,
        currentExperiment,
        titrageState,
        config,
        currentTitrant,
        currentTitré,
        currentIndicateur,
    ])

    useEffect(() => {
        createExperiment()
    }, [createExperiment])

    // Vérification des limites du système
    const isSystemValid = () => {
        const volumeTotal = config.initialVolumeErlenmeyer + config.volumeEquivalence
        return volumeTotal <= config.maxVolumeErlenmeyer && config.volumeEquivalence <= config.maxVolumeBurette
    }

    return (
        <div className="w-full h-full relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900">
            {/* Interface de contrôle avec selects - GAUCHE */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl w-80 border border-gray-200">
                <h2 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-indigo-600" />
                    Configuration de l'Expérience
                </h2>

                <div className="space-y-3">
                    {/* Titrant avec select */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            Titrant (Burette)
                        </h4>
                        <div className="space-y-2">
                            <div className="relative">
                                <select
                                    value={config.titrant}
                                    onChange={(e) => handleConfigChange("titrant", e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {TITRANTS.map((titrant) => (
                                        <option key={titrant.value} value={titrant.value}>
                                            {titrant.label} ({titrant.formula})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-700 font-medium">
                                    Concentration: {config.concentrationBurette.toFixed(2)}M
                                </label>
                                <input
                                    type="range"
                                    min={0.05}
                                    max={0.5}
                                    step={0.05}
                                    value={config.concentrationBurette}
                                    onChange={(e) => handleConfigChange("concentrationBurette", Number(e.target.value))}
                                    className="w-full mt-1 accent-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Titré avec select */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Titré (Erlenmeyer)
                        </h4>
                        <div className="space-y-2">
                            <div className="relative">
                                <select
                                    value={config.titré}
                                    onChange={(e) => handleConfigChange("titré", e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    {TITRÉS.map((titré) => (
                                        <option key={titré.value} value={titré.value}>
                                            {titré.label} ({titré.formula})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-700 font-medium">
                                        Concentration: {config.concentrationErlenmeyer.toFixed(2)}M
                                    </label>
                                    <input
                                        type="range"
                                        min={0.05}
                                        max={0.5}
                                        step={0.05}
                                        value={config.concentrationErlenmeyer}
                                        onChange={(e) => handleConfigChange("concentrationErlenmeyer", Number(e.target.value))}
                                        className="w-full mt-1 accent-green-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-700 font-medium">
                                        Volume: {config.initialVolumeErlenmeyer}mL
                                    </label>
                                    <input
                                        type="range"
                                        min={10}
                                        max={Math.min(50, config.maxVolumeErlenmeyer - 20)}
                                        step={5}
                                        value={config.initialVolumeErlenmeyer}
                                        onChange={(e) => handleConfigChange("initialVolumeErlenmeyer", Number(e.target.value))}
                                        className="w-full mt-1 accent-green-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicateur avec select */}
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            Indicateur Coloré
                        </h4>
                        <div className="relative">
                            <select
                                value={config.indicateur}
                                onChange={(e) => handleConfigChange("indicateur", e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                {INDICATEURS.map((indicateur) => (
                                    <option key={indicateur.value} value={indicateur.value}>
                                        {indicateur.label} ({indicateur.range})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Observations et contrôles - DROITE */}
            <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 w-80 border border-gray-200 shadow-xl">
                <h3 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
                    <Eye className="mr-2 text-indigo-600" size={16} />
                    Observations en Temps Réel
                </h3>

                <div className="space-y-3">
                    {/* État actuel */}
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs text-gray-800 font-medium">
                            {titrageState.equivalenceAtteinte ? (
                                <span className="flex items-center gap-1">
                                    <CheckCircle size={12} className="text-green-600" />
                                    Équivalence atteinte!
                                </span>
                            ) : titrageState.isRunning ? (
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    Titrage en cours...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    Prêt à démarrer
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Données en temps réel */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-indigo-50 p-2 rounded border">
                            <div className="font-semibold text-gray-800">Volume écoulé</div>
                            <div className="text-lg font-mono text-gray-900">{titrageState.volumeEcoule.toFixed(1)} mL</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded border">
                            <div className="font-semibold text-gray-800">pH actuel</div>
                            <div className="text-lg font-mono text-gray-900">{titrageState.pH.toFixed(2)}</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded border">
                            <div className="font-semibold text-gray-800">Vol. équivalence</div>
                            <div className="text-sm font-mono text-gray-900">{titrageState.volumeEquivalence.toFixed(1)} mL</div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded border">
                            <div className="font-semibold text-gray-800">Progression</div>
                            <div className="text-sm font-mono text-gray-900">{progressPercent.toFixed(0)}%</div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                    </div>

                    {/* Phase actuelle */}
                    {/* <div
                        className={`p-2 rounded border text-xs ${phaseInfo.phase === "Équivalence"
                                ? "bg-red-50 border-red-200 text-gray-800"
                                : phaseInfo.phase === "Progression"
                                    ? "bg-orange-50 border-orange-200 text-gray-800"
                                    : phaseInfo.phase === "Dépassement"
                                        ? "bg-purple-50 border-purple-200 text-gray-800"
                                        : "bg-blue-50 border-blue-200 text-gray-800"
                            }`}
                    >
                        <div className="font-semibold">{phaseInfo.phase}</div>
                        <div className="text-gray-600">{phaseInfo.description}</div>
                    </div> */}

                    {/* Contrôle du débit - DÉPLACÉ ICI */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">Contrôle du Débit</h4>
                        <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-700 font-medium">Débit: {titrageState.debit.toFixed(1)}mL/s</label>
                            <input
                                type="range"
                                min={0.1}
                                max={2.0}
                                step={0.1}
                                value={titrageState.debit}
                                onChange={handleDebitChange}
                                className="flex-1 accent-orange-600"
                            />
                        </div>
                    </div>

                    {/* Limites du système - DÉPLACÉ ICI */}
                    <div
                        className={`p-2 rounded border text-xs ${!isSystemValid() ? "bg-red-50 border-red-200 text-red-800" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                    >
                        <div className="font-medium mb-1 flex items-center gap-1">
                            {!isSystemValid() && <AlertTriangle size={12} />}
                            Limites du système:
                        </div>
                        <div>• Burette: {titrageState.maxVolumeBurette}mL max</div>
                        <div>• Erlenmeyer: {titrageState.maxVolumeErlenmeyer}mL max</div>
                        <div>• Volume équivalence: {titrageState.volumeEquivalence.toFixed(1)}mL</div>
                        <div className={`${!isSystemValid() ? "text-red-700 font-medium" : ""}`}>
                            • Volume total prévu: {(config.initialVolumeErlenmeyer + config.volumeEquivalence).toFixed(1)}mL
                        </div>
                    </div>

                    {/* Boutons de contrôle - DÉPLACÉS ICI */}
                    <div className="flex gap-2">
                        <button
                            onClick={toggleTitrage}
                            disabled={!isSystemValid()}
                            className={`flex-1 px-4 py-2 rounded-md text-white font-medium text-sm transition-colors flex items-center justify-center gap-1 ${titrageState.isRunning
                                ? "bg-red-500 hover:bg-red-600"
                                : isSystemValid()
                                    ? "bg-indigo-500 hover:bg-indigo-600"
                                    : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {titrageState.isRunning ? (
                                <>
                                    <Pause size={14} />
                                    Arrêter
                                </>
                            ) : (
                                <>
                                    <Play size={14} />
                                    Démarrer
                                </>
                            )}
                        </button>
                        <button
                            onClick={reset}
                            className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-1"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>

                    {titrageState.equivalenceAtteinte && (
                        <button
                            onClick={() => setShowResult(true)}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Calculator size={16} />
                            Analyser résultats
                        </button>
                    )}

                    {/* Conseils */}
                    {/* <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-800">
            <div className="font-semibold mb-1">💡 Conseils:</div>
            <div className="text-gray-600">• Réduisez le débit près de l'équivalence</div>
            <div className="text-gray-600">• Observez le changement de couleur</div>
            <div className="text-gray-600">• Le pH change rapidement à l'équivalence</div>
          </div> */}
                </div>
            </div>

            {/* Rapport d'analyse avec 4 sections */}
            {showResult && currentExperiment && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white/98 backdrop-blur-sm rounded-2xl p-6 max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <Award className="mr-2 text-yellow-500" size={24} />
                                Rapport d'Analyse - Titrage Acido-Basique
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
                                            <div className="font-semibold text-gray-700 text-sm">Titrant:</div>
                                            <div className="text-gray-800 font-medium">{currentExperiment.titrant.label}</div>
                                            <div className="text-xs text-gray-600">{currentExperiment.titrant.formula}</div>
                                            <div className="text-xs text-gray-500">
                                                Concentration: {currentExperiment.concentrationTitrant.toFixed(2)}M
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="font-semibold text-gray-700 text-sm">Titré:</div>
                                            <div className="text-gray-800 font-medium">{currentExperiment.titré.label}</div>
                                            <div className="text-xs text-gray-600">{currentExperiment.titré.formula}</div>
                                            <div className="text-xs text-gray-500">
                                                {currentExperiment.concentrationTitré.toFixed(2)}M • {currentExperiment.volumeInitial}mL
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 text-sm mb-2">Indicateur:</div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: currentExperiment.indicateur.color }}
                                            ></div>
                                            <span className="font-medium text-gray-800">{currentExperiment.indicateur.label}</span>
                                            <span className="text-xs text-gray-500">({currentExperiment.indicateur.range})</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 text-sm mb-2">Conditions expérimentales:</div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div>• Volume total final: {currentExperiment.volumeTotal.toFixed(1)} mL</div>
                                            <div>• Température: 25°C (supposée)</div>
                                            <div>• Agitation magnétique: Continue</div>
                                            <div>• Débit moyen: {titrageState.debit.toFixed(1)} mL/s</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Résultats du titrage */}
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                                    <Calculator className="mr-2" size={18} />
                                    Résultats du Titrage
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-white p-2 rounded border">
                                            <div className="font-semibold text-gray-700">Volume théorique:</div>
                                            <div className="text-lg font-mono text-gray-900">
                                                {currentExperiment.volumeEquivalence.toFixed(2)} mL
                                            </div>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <div className="font-semibold text-gray-700">Volume expérimental:</div>
                                            <div className="text-lg font-mono text-gray-900">
                                                {currentExperiment.volumeEcoule.toFixed(2)} mL
                                            </div>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <div className="font-semibold text-gray-700">pH final:</div>
                                            <div className="text-lg font-mono text-gray-900">{currentExperiment.pHFinal.toFixed(2)}</div>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <div className="font-semibold text-gray-700">Précision:</div>
                                            <div className="text-lg font-mono text-gray-900">
                                                ±{currentExperiment.precision.toFixed(2)} mL
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Évaluation de la précision:</div>
                                        <div className="flex items-center gap-2">
                                            {currentExperiment.precision < 0.5 ? (
                                                <>
                                                    <CheckCircle className="text-green-600" size={16} />
                                                    <span className="text-gray-800 font-medium">
                                                        Excellent (±{currentExperiment.precision.toFixed(2)} mL)
                                                    </span>
                                                </>
                                            ) : currentExperiment.precision < 1.0 ? (
                                                <>
                                                    <AlertTriangle className="text-orange-600" size={16} />
                                                    <span className="text-gray-800 font-medium">
                                                        Bon (±{currentExperiment.precision.toFixed(2)} mL)
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="text-red-600" size={16} />
                                                    <span className="text-gray-800 font-medium">
                                                        À améliorer (±{currentExperiment.precision.toFixed(2)} mL)
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-1000 ${currentExperiment.precision < 0.5
                                                    ? "bg-green-600"
                                                    : currentExperiment.precision < 1.0
                                                        ? "bg-orange-600"
                                                        : "bg-red-600"
                                                    }`}
                                                style={{ width: `${Math.max(10, 100 - currentExperiment.precision * 50)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Efficacité globale:</div>
                                        <div className="text-2xl font-bold text-gray-800">{currentExperiment.efficiency.toFixed(1)}%</div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                                                style={{ width: `${currentExperiment.efficiency}%` }}
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
                                        <div className="font-semibold text-gray-700 mb-2">Équation de neutralisation:</div>
                                        <div className="bg-yellow-100 p-2 rounded font-mono text-sm text-gray-800">
                                            {currentExperiment.titrant.formula} + {currentExperiment.titré.formula} →
                                            {currentExperiment.titrant.formula === "HCl" && currentExperiment.titré.formula === "NaOH"
                                                ? " NaCl + H₂O"
                                                : currentExperiment.titrant.formula === "CH3COOH" && currentExperiment.titré.formula === "NaOH"
                                                    ? " CH₃COONa + H₂O"
                                                    : currentExperiment.titrant.formula === "H2SO4" && currentExperiment.titré.formula === "NaOH"
                                                        ? " Na₂SO₄ + 2H₂O"
                                                        : " Sel + H₂O"}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Calcul du volume d'équivalence:</div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div>Relation: C₁ × V₁ = C₂ × V₂</div>
                                            <div>
                                                {currentExperiment.concentrationTitré} × {currentExperiment.volumeInitial} ={" "}
                                                {currentExperiment.concentrationTitrant} × V₂
                                            </div>
                                            <div>V₂ = {currentExperiment.volumeEquivalence.toFixed(2)} mL</div>
                                            {currentExperiment.titrant.formula === "H2SO4" && (
                                                <div className="text-orange-600">Note: H₂SO₄ est diprotique (facteur 2)</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Type de titrage:</div>
                                        <div className="text-gray-600">
                                            {currentExperiment.titrant.type === "fort" && currentExperiment.titré.type === "forte"
                                                ? "Acide fort - Base forte (pH équivalence ≈ 7)"
                                                : currentExperiment.titrant.type === "faible" && currentExperiment.titré.type === "forte"
                                                    ? "Acide faible - Base forte (pH équivalence > 7)"
                                                    : currentExperiment.titrant.type === "fort" && currentExperiment.titré.type === "faible"
                                                        ? "Acide fort - Base faible (pH équivalence < 7)"
                                                        : "Titrage acido-basique"}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Choix de l'indicateur:</div>
                                        <div className="text-gray-600 text-xs">
                                            L'indicateur {currentExperiment.indicateur.label} est{" "}
                                            {currentExperiment.indicateur.transition[0] <= 7 &&
                                                currentExperiment.indicateur.transition[1] >= 7
                                                ? "approprié"
                                                : "partiellement approprié"}{" "}
                                            pour ce type de titrage (zone de virage: {currentExperiment.indicateur.range}).
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
                                            {currentExperiment.precision < 0.5 ? (
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <CheckCircle size={14} />
                                                    <span>Excellente précision obtenue</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-orange-700">
                                                    <AlertTriangle size={14} />
                                                    <span>Précision à améliorer</span>
                                                </div>
                                            )}

                                            {currentExperiment.efficiency > 90 ? (
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <CheckCircle size={14} />
                                                    <span>Efficacité excellente ({currentExperiment.efficiency.toFixed(1)}%)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-orange-700">
                                                    <AlertTriangle size={14} />
                                                    <span>Efficacité modérée ({currentExperiment.efficiency.toFixed(1)}%)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Suggestions d'amélioration:</div>
                                        <div className="text-gray-600 text-xs space-y-1">
                                            {currentExperiment.precision > 0.5 && <div>• Réduire le débit près du point d'équivalence</div>}
                                            <div>• Effectuer plusieurs titrages pour la reproductibilité</div>
                                            <div>• Vérifier l'étalonnage des instruments</div>
                                            <div>• Considérer l'utilisation d'un pH-mètre pour plus de précision</div>
                                            {currentExperiment.indicateur.transition[0] > 8 && currentExperiment.titrant.type === "fort" && (
                                                <div>• Envisager un indicateur avec une zone de virage plus appropriée</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Analyse comparative:</div>
                                        <div className="text-gray-600 text-xs">
                                            {experiments.length > 1 ? (
                                                <div>
                                                    <div>Nombre d'expériences: {experiments.length}</div>
                                                    <div>
                                                        Précision moyenne: ±
                                                        {(experiments.reduce((sum, exp) => sum + exp.precision, 0) / experiments.length).toFixed(2)}{" "}
                                                        mL
                                                    </div>
                                                    <div>
                                                        Efficacité moyenne:{" "}
                                                        {(experiments.reduce((sum, exp) => sum + exp.efficiency, 0) / experiments.length).toFixed(
                                                            1,
                                                        )}
                                                        %
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>Première expérience - Effectuez d'autres titrages pour comparaison</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-gray-700 mb-2">Applications pratiques:</div>
                                        <div className="text-gray-600 text-xs space-y-1">
                                            <div>• Contrôle qualité en industrie alimentaire</div>
                                            <div>• Analyse de l'acidité des sols</div>
                                            <div>• Dosage de médicaments</div>
                                            <div>• Traitement des eaux usées</div>
                                            <div>• Recherche en chimie analytique</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Historique compact */}
                            {experiments.length > 1 && (
                                <div className="lg:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                                        <Info className="mr-2" size={18} />
                                        Historique des Expériences ({experiments.length} titrages)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {experiments.slice(0, 6).map((exp, i) => (
                                            <div key={exp.id} className="bg-white p-2 rounded border text-xs">
                                                <div className="font-semibold text-gray-700 mb-1">#{experiments.length - i}</div>
                                                <div className="text-gray-600 space-y-1">
                                                    <div className="font-mono">
                                                        {exp.titrant.formula} → {exp.titré.formula}
                                                    </div>
                                                    <div>
                                                        Vol: {exp.volumeEcoule.toFixed(1)}mL • pH: {exp.pHFinal.toFixed(1)}
                                                    </div>
                                                    <div>Précision: ±{exp.precision.toFixed(2)}mL</div>
                                                    <div>Efficacité: {exp.efficiency.toFixed(1)}%</div>
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
                                Rapport généré le {new Date().toLocaleString()} • Laboratoire de Titrage Virtuel v2.0
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas 3D */}
            <Canvas shadows camera={{ position: [6, 6, 10], fov: 45 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
                <Suspense
                    fallback={
                        <Html center className="text-indigo-600">
                            Chargement...
                        </Html>
                    }
                >
                    <ambientLight intensity={0.6} />
                    <directionalLight
                        position={[10, 10, 10]}
                        intensity={2}
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />
                    <directionalLight position={[-8, 4, -8]} intensity={1} color="#c7d2fe" />
                    <pointLight position={[0, 3, 3]} intensity={1.2} color="#a5b4fc" />
                    <pointLight position={[0, 5, -2]} intensity={0.5} />

                    <TitrageScene
                        titrageState={titrageState}
                        setTitrageState={setTitrageState}
                        currentTitrant={currentTitrant}
                        currentTitré={currentTitré}
                        currentIndicateur={currentIndicateur}
                        getIndicatorColor={getIndicatorColor}
                        config={config}
                    />

                    <OrbitControls
                        ref={controlsRef}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={4}
                        maxDistance={15}
                        maxPolarAngle={Math.PI / 2.2}
                    />

                    <ContactShadows
                        position={[0, -2.4, 0]}
                        opacity={0.35}
                        scale={10}
                        blur={2.5}
                        far={5}
                        resolution={512}
                        color="#4f46e5"
                    />
                </Suspense>
            </Canvas>
        </div>
    )
}
