"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import { Suspense, useRef, useEffect } from "react"
import * as THREE from "three"

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const meshRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (meshRef.current && scene) {
      // Centrer manuellement le modèle
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      scene.position.sub(center)

      // Ajuster l'échelle si nécessaire
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = maxDim > 5 ? 5 / maxDim : 1
      scene.scale.setScalar(scale)
    }
  }, [scene])

  return <primitive ref={meshRef} object={scene} />
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du modèle 3D...</p>
      </div>
    </div>
  )
}

type ProfGLBViewerProps = {
  glbUrl: string
  moleculeName: string
}

export default function ProfGLBViewer({ glbUrl, moleculeName }: ProfGLBViewerProps) {
  if (!glbUrl || typeof glbUrl !== "string") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <p>Aucun modèle 3D disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative min-h-[500px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "500px",
          display: "block",
        }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0xf8fafc, 1)
        }}
      >
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          <Model url={glbUrl} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={20}
            autoRotate={false}
            dampingFactor={0.05}
            enableDamping={true}
          />
        </Suspense>
      </Canvas>

      {/* Overlay avec le nom */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium">
        {moleculeName}
      </div>

      {/* Instructions de contrôle */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
        <div className="space-y-1">
          <div>🖱️ Clic + glisser : Rotation</div>
          <div>🔍 Molette : Zoom</div>
          <div>⌨️ Shift + clic : Déplacement</div>
        </div>
      </div>

      {/* Spinner de chargement */}
      <Suspense fallback={<LoadingSpinner />}>
        <div style={{ display: "none" }}>
          <Model url={glbUrl} />
        </div>
      </Suspense>
    </div>
  )
}
