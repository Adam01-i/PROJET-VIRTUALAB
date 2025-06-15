"use client"

import * as React from "react"
import { useRef, useState, Suspense, useEffect, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Html, ContactShadows } from "@react-three/drei"
import * as THREE from "three"
import { FlaskConical, Camera } from "lucide-react"

// Types pour la simulation
interface TitrageConfig {
    titrant: string
    titré: string
    indicateur: string
    volumeEquivalence: number
    initialVolumeErlenmeyer: number
    concentrationErlenmeyer: number
    concentrationBurette: number
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
    { value: "HCl 0.1M", label: "Acide Chlorhydrique", formula: "HCl", color: "#3b82f6" },
    { value: "CH₃COOH 0.1M", label: "Acide Acétique", formula: "CH₃COOH", color: "#8b5cf6" },
]

const TITRÉS = [
    { value: "NaOH 0.1M", label: "Hydroxyde de Sodium", formula: "NaOH", color: "#10b981" },
    { value: "NH₄OH 0.1M", label: "Hydroxyde d'Ammonium", formula: "NH₄OH", color: "#f59e0b" },
]

const INDICATEURS = [
    { value: "Phénolphtaléine", label: "Phénolphtaléine", color: "#ec4899", range: "pH 8.2-10" },
    { value: "Bleu de bromothymol", label: "Bleu de Bromothymol", color: "#3b82f6", range: "pH 6.0-7.6" },
]

export default function TitrageAcidoBasique() {
    const initialConfig: TitrageConfig = {
        titrant: "HCl 0.1M",
        titré: "NaOH 0.1M",
        indicateur: "Phénolphtaléine",
        initialVolumeErlenmeyer: 25,
        concentrationErlenmeyer: 0.1,
        concentrationBurette: 0.1,
        volumeEquivalence: 25,
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

    useEffect(() => {
        // Calcul correct du volume d'équivalence : C1*V1 = C2*V2
        const newVolumeEq = (config.concentrationErlenmeyer * config.initialVolumeErlenmeyer) / config.concentrationBurette
        setConfig((prev) => ({ ...prev, volumeEquivalence: newVolumeEq }))
        reset()
    }, [
        config.concentrationErlenmeyer,
        config.initialVolumeErlenmeyer,
        config.concentrationBurette,
        config.titrant,
        config.titré,
        config.indicateur,
    ])

    const handleConfigChange = <K extends keyof TitrageConfig>(key: K, value: TitrageConfig[K]) => {
        setConfig((prev) => ({ ...prev, [key]: value }))
    }

    const reset = () => {
        // pH initial correct pour une base forte
        const initialPH = config.titré.includes("NaOH") ? 13 : 11.5 // NaOH plus basique que NH4OH
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
    }

    const toggleTitrage = () => {
        setTitrageState((prev) => ({ ...prev, isRunning: !prev.isRunning }))
    }

    const handleDebitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitrageState((prev) => ({ ...prev, debit: Number(e.target.value) }))
    }

    const resetCamera = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.reset()
        }
    }, [])

    // Fonction pour calculer la couleur de l'indicateur
    const getIndicatorColor = (pH: number, indicator: string) => {
        if (indicator === "Phénolphtaléine") {
            if (pH < 8.2) return "#ffffff" // Incolore en milieu acide/neutre
            if (pH < 10) {
                // Transition progressive du blanc au rose
                const intensity = (pH - 8.2) / (10 - 8.2)
                return `hsl(330, 100%, ${100 - intensity * 30}%)`
            }
            return "#ff1493" // Rose fuchsia en milieu très basique
        } else if (indicator === "Bleu de bromothymol") {
            if (pH < 6.0) return "#ffff00" // Jaune en milieu acide
            if (pH < 7.6) {
                // Transition du jaune au bleu via le vert
                const intensity = (pH - 6.0) / (7.6 - 6.0)
                if (intensity < 0.5) {
                    return `hsl(${60 + intensity * 60}, 100%, 50%)` // Jaune vers vert
                } else {
                    return `hsl(${120 + (intensity - 0.5) * 120}, 100%, 50%)` // Vert vers bleu
                }
            }
            return "#0066ff" // Bleu en milieu basique
        }
        return "#ffffff"
    }

    // Calculer le pourcentage de progression
    const progressPercent = Math.min((titrageState.volumeEcoule / titrageState.volumeEquivalence) * 100, 100)

    // Déterminer la phase du titrage
    const getPhaseInfo = () => {
        const progress = titrageState.volumeEcoule / titrageState.volumeEquivalence
        if (progress < 0.1) return { phase: "Début", color: "blue", description: "Milieu très basique" }
        if (progress < 0.9) return { phase: "Progression", color: "orange", description: "Neutralisation en cours" }
        if (progress < 1.1) return { phase: "Équivalence", color: "red", description: "Point d'équivalence proche" }
        return { phase: "Dépassement", color: "purple", description: "Milieu acide" }
    }

    const phaseInfo = getPhaseInfo()

    // Trouver les objets correspondants pour l'affichage
    const currentTitrant = TITRANTS.find((t) => t.value === config.titrant) || TITRANTS[0]
    const currentTitré = TITRÉS.find((t) => t.value === config.titré) || TITRÉS[0]
    const currentIndicateur = INDICATEURS.find((i) => i.value === config.indicateur) || INDICATEURS[0]

    return (
        <div className="w-full h-full relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900">
            {/* Interface de contrôle - Version compacte */}
            <div className="absolute top-4 left-4 z-10 bg-indigo-100 rounded-lg p-4 shadow-xl w-[300px] space-y-3 border-2 border-indigo-300">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-indigo-600" />
                    Titrage Acide-Base
                </h2>

                {/* Sélection des réactifs - Version compacte */}
                <div className="space-y-3 text-sm text-indigo-800">
                    <div>
                        <label className="font-semibold text-indigo-900 mb-1 block text-base">Titrant</label>
                        <div className="space-y-1">
                            {TITRANTS.map((titrant) => (
                                <label key={titrant.value} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="titrant"
                                        value={titrant.value}
                                        checked={config.titrant === titrant.value}
                                        onChange={(e) => handleConfigChange("titrant", e.target.value)}
                                        className="w-3 h-3 text-indigo-600"
                                    />
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: titrant.color }} />
                                    <span className="text-sm font-medium">{titrant.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-2">
                            <label className="text-xs text-indigo-700">Concentration (M)</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="range"
                                    min={0.05}
                                    max={0.5}
                                    step={0.05}
                                    value={config.concentrationBurette}
                                    onChange={(e) => handleConfigChange("concentrationBurette", Number(e.target.value))}
                                    className="w-full mt-1 accent-indigo-600"
                                />
                                <div className="text-xs text-indigo-800">{config.concentrationBurette.toFixed(2)}M</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold text-indigo-900 mb-1 block text-base">Titré</label>
                        <div className="space-y-1">
                            {TITRÉS.map((titré) => (
                                <label key={titré.value} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="titré"
                                        value={titré.value}
                                        checked={config.titré === titré.value}
                                        onChange={(e) => handleConfigChange("titré", e.target.value)}
                                        className="w-3 h-3 text-indigo-600"
                                    />
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: titré.color }} />
                                    <span className="text-sm font-medium">{titré.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-2 space-y-2">
                            <div>
                                <label className="text-xs text-indigo-700">Concentration (M)</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="range"
                                        min={0.05}
                                        max={0.5}
                                        step={0.05}
                                        value={config.concentrationErlenmeyer}
                                        onChange={(e) => handleConfigChange("concentrationErlenmeyer", Number(e.target.value))}
                                        className="w-full mt-1 accent-indigo-600"
                                    />
                                    <div className="text-xs text-indigo-800">{config.concentrationErlenmeyer.toFixed(2)}M</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-indigo-700">Volume initial (mL)</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="range"
                                        min={10}
                                        max={50}
                                        step={5}
                                        value={config.initialVolumeErlenmeyer}
                                        onChange={(e) => handleConfigChange("initialVolumeErlenmeyer", Number(e.target.value))}
                                        className="w-full mt-1 accent-indigo-600"
                                    />
                                    <div className="text-xs text-indigo-800">{config.initialVolumeErlenmeyer}mL</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold text-indigo-900 mb-1 block text-base">Indicateur</label>
                        <div className="space-y-1">
                            {INDICATEURS.map((indicateur) => (
                                <label key={indicateur.value} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="indicateur"
                                        value={indicateur.value}
                                        checked={config.indicateur === indicateur.value}
                                        onChange={(e) => handleConfigChange("indicateur", e.target.value)}
                                        className="w-3 h-3 text-indigo-600"
                                    />
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicateur.color }} />
                                    <span className="text-sm font-medium">{indicateur.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="font-medium text-indigo-800 text-sm">Débit (mL/s)</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="range"
                                min={0.1}
                                max={2.0}
                                step={0.1}
                                value={titrageState.debit}
                                onChange={handleDebitChange}
                                className="w-full mt-1 accent-indigo-600"
                            />
                            <div className="text-xs text-indigo-800">{titrageState.debit.toFixed(1)}mL/s</div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Résultats - Version compacte */}
            <div className="absolute top-4 right-4 z-10 bg-indigo-200 rounded-lg p-4 shadow-xl w-[300px] max-h-[85vh] overflow-y-auto text-sm space-y-3 border-2 border-indigo-300">
                <h3 className="text-lg font-semibold text-indigo-900">Résultats</h3>

                {/* Configuration - Version compacte */}
                <div className="bg-indigo-100 p-2 rounded border border-indigo-300 text-xs">
                    <div className="flex items-center gap-1 mb-1 text-indigo-800">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTitrant.color }} />
                        <span>{currentTitrant.label} ({config.concentrationBurette.toFixed(2)}M)</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1 text-indigo-800">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTitré.color }} />
                        <span>{currentTitré.label} ({config.concentrationErlenmeyer.toFixed(2)}M, {config.initialVolumeErlenmeyer}mL)</span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-800">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentIndicateur.color }} />
                        <span>{currentIndicateur.label}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-indigo-900">
                    <div className="font-medium">Volume écoulé:</div>
                    <div className="font-mono">{titrageState.volumeEcoule.toFixed(1)} mL</div>
                    <div className="font-medium">Vol. équivalence:</div>
                    <div className="font-mono">{titrageState.volumeEquivalence.toFixed(1)} mL</div>
                    <div className="font-medium">pH:</div>
                    <div className="font-mono text-base font-bold">{titrageState.pH.toFixed(2)}</div>
                    <div className="font-medium">Progression:</div>
                    <div className="font-mono">{progressPercent.toFixed(0)}%</div>
                </div>

                {/* État actuel - Version compacte */}
                <div className="space-y-2">
                    {titrageState.equivalenceAtteinte ? (
                        <div className="p-2 bg-green-50 border-l-4 border-green-400 rounded text-green-800 text-xs">
                            <strong>🎉 Équivalence atteinte!</strong><br />
                            Volume: {titrageState.volumeEcoule.toFixed(1)} mL, pH: {titrageState.pH.toFixed(2)}
                        </div>
                    ) : titrageState.isRunning ? (
                        <div className={`p-2 bg-${phaseInfo.color}-50 border-l-4 border-${phaseInfo.color}-400 rounded text-${phaseInfo.color}-800 text-xs`}>
                            <strong>⚗️ {phaseInfo.phase}</strong><br />
                            {phaseInfo.description}
                            {progressPercent < 90 && (
                                <div><br />Reste: {(titrageState.volumeEquivalence - titrageState.volumeEcoule).toFixed(1)} mL</div>
                            )}
                        </div>
                    ) : (
                        <div className="p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded text-indigo-800 text-xs">
                            <strong>🔬 Prêt</strong><br />
                            Vol. théorique: {titrageState.volumeEquivalence.toFixed(1)} mL
                        </div>
                    )}

                    <div className="p-2 bg-indigo-100 border border-indigo-300 rounded text-indigo-800 text-xs">
                        <strong>💡 Conseils:</strong> Ajustez le débit • Observez la couleur • Le pH change vite près de l'équivalence
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={toggleTitrage}
                        className={`flex-1 px-3 py-2 rounded-md text-white font-medium text-sm transition-colors ${titrageState.isRunning
                            ? "bg-indigo-700 hover:bg-indigo-800"
                            : "bg-indigo-500 hover:bg-indigo-600"
                            }`}
                    >
                        {titrageState.isRunning ? "Arrêter" : "Démarrer"}
                    </button>
                    <button
                        onClick={reset}
                        className="flex-1 px-3 py-2 bg-indigo-400 hover:bg-indigo-500 text-white rounded-md font-medium text-sm transition-colors"
                    >
                        Reset
                    </button>
                </div>

                <button
                    onClick={resetCamera}
                    className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <Camera className="w-4 h-4" />
                    Caméra
                </button>
            </div>


            {/* Canvas 3D avec éclairage et ombres améliorés */}
            <Canvas
                shadows
                camera={{ position: [6, 6, 10], fov: 45 }}
                gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
            >
                <Suspense fallback={<Html center className="text-indigo-600">Chargement...</Html>}>
                    {/* Éclairage global doux */}
                    <ambientLight intensity={0.6} />

                    {/* Directional Light principale avec ombre nette */}
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

                    {/* Rims Lights (éclairage de contre-jour subtil) */}
                    <directionalLight position={[-8, 4, -8]} intensity={1} color="#c7d2fe" />
                    <pointLight position={[0, 3, 3]} intensity={1.2} color="#a5b4fc" />
                    <pointLight position={[0, 5, -2]} intensity={0.5} />

                    {/* Scène personnalisée */}
                    <TitrageScene
                        titrageState={titrageState}
                        setTitrageState={setTitrageState}
                        currentTitrant={currentTitrant}
                        currentTitré={currentTitré}
                        currentIndicateur={currentIndicateur}
                        getIndicatorColor={getIndicatorColor}
                    />

                    {/* Contrôles de caméra plus fluides */}
                    <OrbitControls
                        ref={controlsRef}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={4}
                        maxDistance={15}
                        maxPolarAngle={Math.PI / 2.2} // empêche la vue par le dessous
                    />

                    {/* Ombres douces au sol */}
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

// Scène 3D améliorée
function TitrageScene({
    titrageState,
    setTitrageState,
    currentTitrant,
    currentTitré,
    currentIndicateur,
    getIndicatorColor,
}: {
    titrageState: TitrageState
    setTitrageState: React.Dispatch<React.SetStateAction<TitrageState>>
    currentTitrant: any
    currentTitré: any
    currentIndicateur: any
    getIndicatorColor: (pH: number, indicator: string) => string
}) {
    const goutteRef = useRef<THREE.Mesh>(null)
    const stirBarRef = useRef<THREE.Mesh>(null)

    // Calcul précis du pH pour un titrage acide fort - base forte
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
        const n_acid_added = C_acid * V_acid
        // Volume total
        const V_total = V_base + V_acid

        let pH: number

        if (V_acid === 0) {
            // pH initial de la base
            if (titré.includes("NaOH")) {
                // Base forte
                const pOH = -Math.log10(C_base)
                pH = 14 - pOH
            } else {
                // Base faible (NH4OH)
                const Kb = 1.8e-5 // Constante de basicité de NH4OH
                const OH_concentration = Math.sqrt(Kb * C_base)
                const pOH = -Math.log10(OH_concentration)
                pH = 14 - pOH
            }
        } else if (n_acid_added < n_base_initial) {
            // Avant l'équivalence - excès de base
            const n_base_remaining = n_base_initial - n_acid_added
            const C_base_remaining = n_base_remaining / V_total

            if (titré.includes("NaOH")) {
                // Base forte
                const pOH = -Math.log10(C_base_remaining)
                pH = 14 - pOH
            } else {
                // Base faible
                const Kb = 1.8e-5
                const OH_concentration = Math.sqrt(Kb * C_base_remaining)
                const pOH = -Math.log10(OH_concentration)
                pH = 14 - pOH
            }
        } else if (Math.abs(n_acid_added - n_base_initial) < 1e-10) {
            // À l'équivalence
            if (titrant.includes("HCl") && titré.includes("NaOH")) {
                // Acide fort + Base forte = pH neutre
                pH = 7.0
            } else {
                // Avec base faible, pH légèrement acide à l'équivalence
                pH = 5.5
            }
        } else {
            // Après l'équivalence - excès d'acide
            const n_acid_excess = n_acid_added - n_base_initial
            const C_acid_excess = n_acid_excess / V_total

            if (titrant.includes("HCl")) {
                // Acide fort
                pH = -Math.log10(C_acid_excess)
            } else {
                // Acide faible
                const Ka = 1.8e-5 // Constante d'acidité de CH3COOH
                const H_concentration = Math.sqrt(Ka * C_acid_excess)
                pH = -Math.log10(H_concentration)
            }
        }

        return Math.max(0.5, Math.min(14, pH))
    }

    useFrame((state, delta) => {
        if (titrageState.isRunning && !titrageState.equivalenceAtteinte) {
            setTitrageState((prev) => {
                const newVolume = prev.volumeEcoule + prev.debit * delta

                const currentPH = calculatePH(
                    newVolume,
                    prev.initialVolumeErlenmeyer,
                    prev.concentrationErlenmeyer,
                    prev.concentrationBurette,
                    prev.titrant,
                    prev.titré,
                )

                const newCouleur = getIndicatorColor(currentPH, prev.indicateur)
                const equivalenceAtteinte = newVolume >= prev.volumeEquivalence

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
                    maxVolume={50}
                    isRunning={titrageState.isRunning}
                />

                {/* Étiquette Burette avec nom du réactif */}
                <Text position={[-0.5, 1.2, 0]} fontSize={0.1} color="#FFFFFF" anchorX="center" anchorY="middle">
                    BURETTE
                </Text>
                <Text position={[-0.5, 1.0, 0]} fontSize={0.08} color="#E0E0FF" anchorX="center" anchorY="middle">
                    {currentTitrant.label}
                </Text>
                <Text position={[-0.5, 0.8, 0]} fontSize={0.06} color="#BBBBBB" anchorX="center" anchorY="middle">
                    {currentTitrant.formula}
                </Text>

                {/* Volume affiché en permanence */}
                <Text
                    position={[-0.4, 1.5 - (titrageState.volumeEcoule / 50) * 3, 0]}
                    fontSize={0.19}
                    color="#f87171"
                    anchorX="right"
                    anchorY="middle"
                    rotation={[0, Math.PI / 4, 0]}
                >
                    {(50 - titrageState.volumeEcoule).toFixed(1)} mL
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
                    niveauSolution={Math.max(0.25, (titrageState.initialVolumeErlenmeyer + titrageState.volumeEcoule) / 120)}
                />

                {/* Étiquette Erlenmeyer avec noms des réactifs */}
                <Text position={[1.3, 0.6, 0]} fontSize={0.1} color="#FFFFFF" anchorX="center" anchorY="middle">
                    ERLENMEYER
                </Text>
                <Text position={[1.3, 0.4, 0]} fontSize={0.08} color="#E0FFE0" anchorX="center" anchorY="middle">
                    {currentTitré.label}
                </Text>
                <Text position={[1.3, 0.2, 0]} fontSize={0.06} color="#BBBBBB" anchorX="center" anchorY="middle">
                    {currentTitré.formula}
                </Text>
                <Text
                    position={[1.3, 0.0, 0]}
                    fontSize={0.06}
                    color="#FFD700"
                    anchorX="center"
                    anchorY="middle"
                >
                    + {currentIndicateur.label}
                </Text>

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
            <Text position={[0.5, 3.7, 0]} fontSize={0.15} color="#f87171" anchorX="center" anchorY="middle">
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
            <Text position={[0, -1.9, 0.9]} fontSize={0.08} color="#E2E8F0" anchorX="center" anchorY="middle">
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
                    <meshStandardMaterial color="#E5E7EB" /> {/* gris clair */}
                </mesh>
                <Text position={[0.25, 0, 0]} fontSize={0.06} color="#F9FAFB" anchorX="left" anchorY="middle">
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
                    color="#C7D2FE" // bleu très clair
                    transparent
                    opacity={4.35}
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


// Erlenmeyer coloré
function Erlenmeyer({
    couleurSolution,
    niveauSolution,
}: {
    couleurSolution: string
    niveauSolution: number
}) {
    // Niveau minimum pour éviter 0 (invisible), niveau maximum implicite dans le calcul
    const adjustedNiveau = Math.max(0.05, niveauSolution)

    // Hauteur réelle du liquide (limitée à 1.1)
    const solutionHeight = Math.min(adjustedNiveau * 1.8, 1.8)

    // Rayon haut proportionnel à la hauteur, pour épouser le profil du récipient
    const rayonBas = 0.3
    const rayonMaxHaut = 1.0
    const rayonHaut = rayonBas + (rayonMaxHaut - rayonBas) * (solutionHeight / 1.6)

    return (
        <group>
            {/* Corps en verre */}
            <mesh castShadow renderOrder={2}>
                <cylinderGeometry args={[1.0, 0.3, 1.6, 64]} />
                <meshPhysicalMaterial
                    color="#F0FDFA"
                    transparent
                    opacity={4.05}
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
                    opacity={0.05}
                    roughness={0.1}
                    metalness={0.0}
                    transmission={0.9}
                    ior={1.5}
                    depthWrite={false}
                />
            </mesh>

            {/* Solution interne */}
            <mesh
                position={[0, -0.8 + solutionHeight / 2, 0]} // alignement avec le bas du récipient
                renderOrder={3}
                receiveShadow
            >
                <cylinderGeometry
                    args={[rayonHaut, rayonBas, solutionHeight, 64]}
                />
                <meshStandardMaterial
                    color={couleurSolution}
                    transparent
                    opacity={0.95}
                    roughness={0.3}
                    metalness={0.05}
                />
            </mesh>
        </group>
    )
}




function MagneticStirrer({ stirBarRef }: { stirBarRef: React.RefObject<THREE.Mesh> }) {
    return (
        <group>
            {/* Base de l'agitateur – posée au sol (table virtuelle) */}
            <mesh position={[0, -1.2, 0]} castShadow>
                <boxGeometry args={[2.0, 0.3, 2.0]} />
                <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* LED indicateur – verte vive, lumineuse */}
            <mesh position={[0.35, -1.15, 0.35]} castShadow>
                <sphereGeometry args={[0.03]} />
                <meshStandardMaterial color="#34D399" emissive="#34D399" emissiveIntensity={2.0} />
            </mesh>

            {/* Barreau agitateur – blanc/gris clair pour bon contraste */}
            <mesh ref={stirBarRef} position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.4]} />
                <meshStandardMaterial color="#FDE68A" metalness={9} roughness={2.2} />
            </mesh>

            {/* Étiquette visible, claire */}
            <Text
                position={[0.5, -0.6, 0.25]}
                fontSize={0.07}
                color="#F9FAFB"
                anchorX="center"
                anchorY="middle"
            >
                AGITATEUR
            </Text>
        </group>
    );
}