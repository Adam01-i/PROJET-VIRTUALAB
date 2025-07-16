"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text, Html, Environment, ContactShadows, Box, Plane, Sphere, Cylinder } from "@react-three/drei"
import * as THREE from "three"

// Interface pour les objets interactifs du laboratoire
interface LabObject {
  id: string
  name: string
  position: [number, number, number]
  type: 'equipment' | 'furniture' | 'decoration'
  interactive: boolean
  description?: string
}

// Composant pour un objet de laboratoire interactif
function InteractiveLabObject({ 
  object, 
  onHover, 
  onUnhover, 
  onClick,
  isHovered 
}: {
  object: LabObject
  onHover: (id: string) => void
  onUnhover: () => void
  onClick: (id: string) => void
  isHovered: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.position.y = object.position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05
    }
  })

  const handlePointerOver = () => {
    setHovered(true)
    onHover(object.id)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    onUnhover()
    document.body.style.cursor = 'auto'
  }

  const getObjectGeometry = () => {
    switch (object.type) {
      case 'equipment':
        return <Box args={[0.3, 0.6, 0.3]} />
      case 'furniture':
        return <Box args={[1, 0.8, 0.5]} />
      case 'decoration':
        return <Sphere args={[0.2]} />
      default:
        return <Box args={[0.2, 0.2, 0.2]} />
    }
  }

  const getObjectColor = () => {
    if (hovered || isHovered) return "#4f46e5"
    switch (object.type) {
      case 'equipment': return "#3b82f6"
      case 'furniture': return "#8b5cf6"
      case 'decoration': return "#10b981"
      default: return "#6b7280"
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={object.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={() => onClick(object.id)}
      castShadow
      receiveShadow
    >
      {getObjectGeometry()}
      <meshStandardMaterial 
        color={getObjectColor()} 
        emissive={hovered ? "#1e1b4b" : "#000000"}
        emissiveIntensity={hovered ? 0.2 : 0}
      />
      
      {(hovered || isHovered) && (
        <Html distanceFactor={10}>
          <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border max-w-xs">
            <h3 className="font-semibold text-gray-800">{object.name}</h3>
            {object.description && (
              <p className="text-sm text-gray-600 mt-1">{object.description}</p>
            )}
          </div>
        </Html>
      )}
    </mesh>
  )
}

// Composant pour la paillasse du laboratoire
function LabBench() {
  return (
    <group>
      {/* Surface de la paillasse */}
      <mesh position={[0, 0.8, 0]} receiveShadow>
        <Box args={[4, 0.1, 2]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>
      
      {/* Pieds de la paillasse */}
      {[[-1.8, 0.4, -0.8], [1.8, 0.4, -0.8], [-1.8, 0.4, 0.8], [1.8, 0.4, 0.8]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <Cylinder args={[0.05, 0.05, 0.8]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      ))}
      
      {/* Étagères */}
      <mesh position={[0, 1.5, -0.95]} receiveShadow>
        <Box args={[3.8, 0.05, 0.3]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      
      <mesh position={[0, 2.0, -0.95]} receiveShadow>
        <Box args={[3.8, 0.05, 0.3]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
    </group>
  )
}

// Composant pour l'éclairage du laboratoire
function LabLighting() {
  return (
    <>
      {/* Éclairage principal */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Éclairage de la paillasse */}
      <pointLight position={[0, 3, 0]} intensity={0.8} color="#f8fafc" />
      <pointLight position={[-2, 2.5, 0]} intensity={0.5} color="#ddd6fe" />
      <pointLight position={[2, 2.5, 0]} intensity={0.5} color="#ddd6fe" />
      
      {/* Éclairage d'ambiance */}
      <spotLight
        position={[0, 5, 3]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.6}
        color="#a5b4fc"
        castShadow
      />
    </>
  )
}

// Composant pour le sol et les murs du laboratoire
function LabStructure() {
  return (
    <>
      {/* Sol */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <Plane args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      
      {/* Mur arrière */}
      <mesh position={[0, 2, -3]} receiveShadow>
        <Plane args={[20, 6]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Murs latéraux */}
      <mesh position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <Plane args={[10, 6]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      <mesh position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <Plane args={[10, 6]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </>
  )
}

// Objets interactifs du laboratoire
const LAB_OBJECTS: LabObject[] = [
  {
    id: "microscope",
    name: "Microscope",
    position: [-1.5, 1, 0.5],
    type: "equipment",
    interactive: true,
    description: "Cliquez pour observer des échantillons au microscope"
  },
  {
    id: "balance",
    name: "Balance de précision",
    position: [1.5, 1, 0.5],
    type: "equipment",
    interactive: true,
    description: "Mesurez avec précision vos échantillons"
  },
  {
    id: "centrifugeuse",
    name: "Centrifugeuse",
    position: [0, 1, -0.5],
    type: "equipment",
    interactive: true,
    description: "Séparez vos mélanges par centrifugation"
  },
  {
    id: "ph-metre",
    name: "pH-mètre",
    position: [-0.8, 1, 0.2],
    type: "equipment",
    interactive: true,
    description: "Mesurez le pH de vos solutions"
  },
  {
    id: "agitateur",
    name: "Agitateur magnétique",
    position: [0.8, 1, 0.2],
    type: "equipment",
    interactive: true,
    description: "Mélangez vos solutions de manière homogène"
  },
  {
    id: "support",
    name: "Support universel",
    position: [0, 1, 0.8],
    type: "equipment",
    interactive: true,
    description: "Support pour vos montages expérimentaux"
  },
  {
    id: "hotte",
    name: "Hotte aspirante",
    position: [0, 2.2, -0.8],
    type: "furniture",
    interactive: true,
    description: "Zone de sécurité pour manipulations dangereuses"
  },
  {
    id: "evier",
    name: "Évier de laboratoire",
    position: [2.5, 1, -0.5],
    type: "furniture",
    interactive: true,
    description: "Nettoyez votre matériel ici"
  }
]

// Composant principal de l'environnement 3D
export default function LabEnvironment3D({ 
  children, 
  onObjectClick,
  selectedObject 
}: {
  children?: React.ReactNode
  onObjectClick?: (objectId: string) => void
  selectedObject?: string
}) {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null)
  const [animateCamera, setAnimateCamera] = useState(true)
  
  const handleObjectClick = (objectId: string) => {
    console.log(`Interaction avec: ${objectId}`)
    if (onObjectClick) {
      onObjectClick(objectId)
    }
  }

  const cameraAnimation = () => {
    if (animateCamera) {
      setTimeout(() => setAnimateCamera(false), 3000)
    }
  }

  useEffect(() => {
    cameraAnimation()
  }, [])

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ 
          position: animateCamera ? [8, 8, 8] : [6, 6, 8], 
          fov: 45 
        }}
        gl={{ 
          toneMapping: THREE.ACESFilmicToneMapping,
          antialias: true
        }}
      >
        <LabLighting />
        <LabStructure />
        <LabBench />
        
        {/* Objets interactifs */}
        {LAB_OBJECTS.map((object) => (
          <InteractiveLabObject
            key={object.id}
            object={object}
            onHover={setHoveredObject}
            onUnhover={() => setHoveredObject(null)}
            onClick={handleObjectClick}
            isHovered={selectedObject === object.id}
          />
        ))}
        
        {/* Contenu personnalisé (simulations) */}
        {children}
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 1, 0]}
        />
        
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.3}
          scale={15}
          blur={2}
          far={10}
          resolution={1024}
          color="#1e293b"
        />
        
        <Environment preset="studio" />
      </Canvas>
      
      {/* Interface utilisateur overlay */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Laboratoire Virtuel 3D</h3>
          <p className="text-sm text-gray-600 mb-2">
            {hoveredObject 
              ? `Survol: ${LAB_OBJECTS.find(obj => obj.id === hoveredObject)?.name}`
              : "Explorez l'environnement 3D"
            }
          </p>
          <div className="text-xs text-gray-500">
            • Clic gauche + glisser: Rotation<br/>
            • Molette: Zoom<br/>
            • Clic droit + glisser: Pan
          </div>
        </div>
      </div>
      
      {/* Indicateurs d'interactivité */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-semibold text-gray-800 mb-2">Éléments interactifs</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {LAB_OBJECTS.filter(obj => obj.interactive).map((obj) => (
              <div 
                key={obj.id}
                className={`p-1 rounded cursor-pointer transition-colors ${
                  selectedObject === obj.id 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleObjectClick(obj.id)}
              >
                {obj.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}