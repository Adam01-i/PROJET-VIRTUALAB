"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import { Suspense } from "react"

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} scale={1} />
}


type ProfGLBViewerProps = {
  glbUrl: string
  moleculeName: string
}

export default function ProfGLBViewer({ glbUrl, moleculeName }: ProfGLBViewerProps) {
  if (!glbUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
        Aucun modèle 3D disponible
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Model url={glbUrl} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">{moleculeName}</div>

      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        🖱️ Clic + glisser pour tourner | 🔍 Molette pour zoomer
      </div>
    </div>
  )
}
