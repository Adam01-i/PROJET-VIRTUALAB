"use client"

import { useRef, useState, useEffect, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Html, Cylinder, Sphere, Box } from "@react-three/drei"
import * as THREE from "three"
import LabEnvironment3D from "../components/3D/LabEnvironment3D"
import InteractiveSimulationInterface from "../components/3D/InteractiveSimulationInterface"

// Configuration de la simulation
interface TitrageState {
  volumeEcoule: number
  isRunning: boolean
  pH: number
  couleurSolution: string
  temperature: number
  concentration: number
  equivalenceAtteinte: boolean
  debit: number
}

// Composant pour la burette 3D
function Burette3D({ 
  position, 
  volumeEcoule, 
  isRunning, 
  couleurSolution, 
  onVolumeChange 
}: {
  position: [number, number, number]
  volumeEcoule: number
  isRunning: boolean
  couleurSolution: string
  onVolumeChange: (volume: number) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (isRunning && volumeEcoule < 50) {
      const newVolume = volumeEcoule + delta * 2
      onVolumeChange(Math.min(newVolume, 50))
    }
  })

  return (
    <group position={position}>
      {/* Corps de la burette */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <Cylinder args={[0.15, 0.15, 3]} />
        <meshStandardMaterial 
          color={hovered ? "#e0e7ff" : "#f3f4f6"} 
          transparent 
          opacity={0.8} 
        />
      </mesh>

      {/* Solution dans la burette */}
      <mesh position={[0, -1.5 + (volumeEcoule / 50) * 1.5, 0]}>
        <Cylinder args={[0.12, 0.12, (50 - volumeEcoule) / 50 * 3]} />
        <meshStandardMaterial color={couleurSolution} transparent opacity={0.7} />
      </mesh>

      {/* Robinet */}
      <mesh position={[0, -1.6, 0]} castShadow>
        <Box args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Graduations */}
      {[0, 10, 20, 30, 40, 50].map((vol, i) => (
        <Html key={i} position={[0.2, 1.5 - (vol / 50) * 3, 0]} distanceFactor={5}>
          <div className="text-xs text-gray-700 bg-white/80 px-1 rounded">
            {vol}mL
          </div>
        </Html>
      ))}

      {hovered && (
        <Html distanceFactor={8}>
          <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
            <h3 className="font-semibold text-gray-800">Burette</h3>
            <p className="text-sm text-gray-600">Volume écoulé: {volumeEcoule.toFixed(1)} mL</p>
          </div>
        </Html>
      )}
    </group>
  )
}

// Composant pour l'erlenmeyer 3D
function Erlenmeyer3D({ 
  position, 
  couleurSolution, 
  volume, 
  agitation 
}: {
  position: [number, number, number]
  couleurSolution: string
  volume: number
  agitation: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const solutionRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (agitation && solutionRef.current) {
      solutionRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 5) * 0.1
      solutionRef.current.position.x = Math.sin(state.clock.elapsedTime * 8) * 0.02
    }
  })

  return (
    <group position={position}>
      {/* Corps de l'erlenmeyer */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <Cylinder args={[0.3, 0.2, 0.8]} />
        <meshStandardMaterial 
          color={hovered ? "#e0e7ff" : "#f8fafc"} 
          transparent 
          opacity={0.9} 
        />
      </mesh>

      {/* Col de l'erlenmeyer */}
      <mesh position={[0, 0.5, 0]}>
        <Cylinder args={[0.08, 0.08, 0.3]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.9} />
      </mesh>

      {/* Solution dans l'erlenmeyer */}
      <mesh ref={solutionRef} position={[0, -0.3, 0]}>
        <Cylinder args={[0.25, 0.18, volume / 100 * 0.6]} />
        <meshStandardMaterial color={couleurSolution} transparent opacity={0.8} />
      </mesh>

      {/* Étiquette */}
      <Html position={[0.4, 0, 0]} distanceFactor={6}>
        <div className="text-xs text-gray-700 bg-white/80 px-2 py-1 rounded">
          Erlenmeyer<br/>
          {volume.toFixed(0)} mL
        </div>
      </Html>

      {hovered && (
        <Html distanceFactor={8}>
          <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
            <h3 className="font-semibold text-gray-800">Erlenmeyer</h3>
            <p className="text-sm text-gray-600">Solution titrée</p>
            <p className="text-sm text-gray-600">Volume: {volume.toFixed(0)} mL</p>
          </div>
        </Html>
      )}
    </group>
  )
}

// Composant pour l'indicateur pH 3D
function PHIndicator3D({ 
  position, 
  pH 
}: {
  position: [number, number, number]
  pH: number
}) {
  const getColorFromPH = (ph: number) => {
    if (ph < 3) return "#ff0000"      // Rouge (très acide)
    if (ph < 5) return "#ff8800"      // Orange (acide)
    if (ph < 6) return "#ffff00"      // Jaune (légèrement acide)
    if (ph < 8) return "#00ff00"      // Vert (neutre)
    if (ph < 10) return "#0088ff"     // Bleu (basique)
    return "#8800ff"                  // Violet (très basique)
  }

  return (
    <group position={position}>
      {/* Écran du pH-mètre */}
      <mesh castShadow>
        <Box args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>

      {/* Affichage numérique */}
      <Html position={[0, 0, 0.03]} distanceFactor={8}>
        <div 
          className="text-lg font-mono font-bold px-2 py-1 rounded text-center"
          style={{ 
            backgroundColor: getColorFromPH(pH),
            color: pH > 6 ? 'white' : 'black',
            minWidth: '60px'
          }}
        >
          pH: {pH.toFixed(1)}
        </div>
      </Html>

      {/* Sonde */}
      <mesh position={[0, -0.3, 0]}>
        <Cylinder args={[0.02, 0.02, 0.4]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
    </group>
  )
}

// Composant pour les graphiques en temps réel
function RealTimeGraph({ 
  data, 
  position 
}: {
  data: Array<{x: number, y: number}>
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      <Html distanceFactor={6}>
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border w-64">
          <h4 className="font-semibold text-gray-800 mb-2">Courbe de titrage</h4>
          <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border relative">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Grille */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Courbe */}
              {data.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  points={data.map((point, i) => 
                    `${(point.x / 50) * 240},${120 - (point.y / 14) * 120}`
                  ).join(' ')}
                />
              )}
              
              {/* Point actuel */}
              {data.length > 0 && (
                <circle
                  cx={(data[data.length - 1].x / 50) * 240}
                  cy={120 - (data[data.length - 1].y / 14) * 120}
                  r="3"
                  fill="#ef4444"
                />
              )}
            </svg>
            
            {/* Labels des axes */}
            <div className="absolute bottom-0 left-0 text-xs text-gray-500 p-1">0</div>
            <div className="absolute bottom-0 right-0 text-xs text-gray-500 p-1">50mL</div>
            <div className="absolute top-0 left-0 text-xs text-gray-500 p-1">pH 14</div>
            <div className="absolute bottom-0 left-0 text-xs text-gray-500 p-1">pH 0</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// Simulation principale
export default function TitrageAcidoBasiqueAmélioré() {
  const [titrageState, setTitrageState] = useState<TitrageState>({
    volumeEcoule: 0,
    isRunning: false,
    pH: 2.1,
    couleurSolution: "#ff4444",
    temperature: 25,
    concentration: 0.1,
    equivalenceAtteinte: false,
    debit: 1
  })

  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [agitation, setAgitation] = useState(false)
  const [graphData, setGraphData] = useState<Array<{x: number, y: number}>>([
    { x: 0, y: 2.1 }
  ])

  // Calcul du pH en fonction du volume écoulé
  const calculatePH = (volume: number) => {
    // Simulation simplifiée d'une courbe de titrage
    if (volume < 24) {
      return 2.1 + (volume / 24) * 4
    } else if (volume < 26) {
      // Zone d'équivalence - saut de pH
      return 6 + ((volume - 24) / 2) * 6
    } else {
      return 12 + Math.log10(1 + (volume - 26) / 10)
    }
  }

  // Couleur de la solution selon le pH
  const getSolutionColor = (pH: number) => {
    if (pH < 3) return "#ff4444"
    if (pH < 6) return "#ff8844"
    if (pH < 8) return "#44ff44"
    if (pH < 10) return "#4488ff"
    return "#8844ff"
  }

  // Mise à jour de l'état du titrage
  useEffect(() => {
    const newPH = calculatePH(titrageState.volumeEcoule)
    const newColor = getSolutionColor(newPH)
    const equivalence = titrageState.volumeEcoule >= 24 && titrageState.volumeEcoule <= 26

    setTitrageState(prev => ({
      ...prev,
      pH: newPH,
      couleurSolution: newColor,
      equivalenceAtteinte: equivalence
    }))

    // Mise à jour du graphique
    if (titrageState.volumeEcoule > 0) {
      setGraphData(prev => {
        const newData = [...prev]
        if (newData.length === 0 || newData[newData.length - 1].x !== titrageState.volumeEcoule) {
          newData.push({ x: titrageState.volumeEcoule, y: newPH })
        }
        return newData
      })
    }
  }, [titrageState.volumeEcoule])

  // Gestionnaire des changements d'état de l'interface
  const handleStateChange = (state: any) => {
    if (state.isPlaying !== undefined) {
      setTitrageState(prev => ({ ...prev, isRunning: state.isPlaying }))
    }
    if (state.temperature !== undefined) {
      setTitrageState(prev => ({ ...prev, temperature: state.temperature }))
    }
    if (state.reset) {
      setTitrageState({
        volumeEcoule: 0,
        isRunning: false,
        pH: 2.1,
        couleurSolution: "#ff4444",
        temperature: 25,
        concentration: 0.1,
        equivalenceAtteinte: false,
        debit: 1
      })
      setGraphData([{ x: 0, y: 2.1 }])
    }
  }

  // Gestionnaire des clics sur les objets du laboratoire
  const handleObjectClick = (objectId: string) => {
    setSelectedObject(objectId)
    
    switch (objectId) {
      case 'agitateur':
        setAgitation(!agitation)
        break
      case 'ph-metre':
        // Afficher plus d'informations sur le pH
        console.log(`pH actuel: ${titrageState.pH.toFixed(2)}`)
        break
      case 'balance':
        // Ouvrir l'interface de pesée
        console.log("Balance activée")
        break
    }
  }

  return (
    <div className="w-full h-full relative">
      <InteractiveSimulationInterface onStateChange={handleStateChange}>
        <LabEnvironment3D 
          selectedObject={selectedObject}
          onObjectClick={handleObjectClick}
        >
          {/* Burette */}
          <Burette3D
            position={[-0.5, 2.5, 0]}
            volumeEcoule={titrageState.volumeEcoule}
            isRunning={titrageState.isRunning}
            couleurSolution="#0066cc"
            onVolumeChange={(vol) => 
              setTitrageState(prev => ({ ...prev, volumeEcoule: vol }))
            }
          />

          {/* Erlenmeyer */}
          <Erlenmeyer3D
            position={[0, 1.4, 0]}
            couleurSolution={titrageState.couleurSolution}
            volume={100 + titrageState.volumeEcoule}
            agitation={agitation}
          />

          {/* pH-mètre */}
          <PHIndicator3D
            position={[1.2, 1.8, 0]}
            pH={titrageState.pH}
          />

          {/* Support universel */}
          <mesh position={[0, 1.8, -0.3]} castShadow>
            <Cylinder args={[0.02, 0.02, 1.5]} />
            <meshStandardMaterial color="#666666" />
          </mesh>

          {/* Bras de support */}
          <mesh position={[-0.3, 2.5, -0.3]} castShadow>
            <Cylinder args={[0.015, 0.015, 0.6]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#666666" />
          </mesh>

          {/* Graphique en temps réel */}
          <RealTimeGraph
            data={graphData}
            position={[2, 2.5, 0]}
          />

          {/* Particules d'agitation */}
          {agitation && (
            <group>
              {[...Array(20)].map((_, i) => (
                <mesh key={i} position={[
                  Math.random() * 0.4 - 0.2,
                  1.4 + Math.random() * 0.2,
                  Math.random() * 0.4 - 0.2
                ]}>
                  <Sphere args={[0.005]} />
                  <meshStandardMaterial color="#ffffff" opacity={0.6} transparent />
                </mesh>
              ))}
            </group>
          )}

          {/* Effets visuels pour l'équivalence */}
          {titrageState.equivalenceAtteinte && (
            <pointLight 
              position={[0, 2, 0]} 
              intensity={0.5} 
              color="#ffff00" 
              distance={2}
            />
          )}
        </LabEnvironment3D>
      </InteractiveSimulationInterface>

      {/* Notifications */}
      {titrageState.equivalenceAtteinte && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <h3 className="font-semibold text-yellow-800">Point d'équivalence atteint!</h3>
            </div>
            <p className="text-yellow-700 mt-1">
              Volume d'équivalence: {titrageState.volumeEcoule.toFixed(1)} mL
            </p>
          </div>
        </div>
      )}
    </div>
  )
}