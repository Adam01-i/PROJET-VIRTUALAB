'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Center } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';

interface GLBViewerProps {
  glbUrl: string;
  moleculeName?: string;
}

function MoleculeModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });

  return <primitive object={scene} ref={ref} />;
}

export default function GLBViewerMolecules({ glbUrl, moleculeName }: GLBViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={viewerRef}
      className={`relative w-full h-[80vh] ${isFullscreen ? 'h-screen' : 'h-[400px]'} rounded-lg overflow-hidden bg-gradient-to-br from-purple-700 to-purple-300`}
    >
      {/* Titre molécule */}
      {moleculeName && (
        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-md font-semibold text-sm text-gray-800 z-10 shadow">
          {moleculeName}
        </div>
      )}

      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [2, 2, 2], fov: 45 }}
        dpr={[1, 2]}
        shadows
      >
        <Suspense fallback={null}>
          <Environment preset="warehouse" background={false} />
          <ambientLight intensity={0.5} />
          <directionalLight intensity={1} position={[5, 5, 5]} />
          <OrbitControls enableZoom enableRotate autoRotate autoRotateSpeed={0.5} />
          <Center>
            <MoleculeModel url={glbUrl} />
          </Center>
        </Suspense>
      </Canvas>

      {/* Plein écran */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-md z-10 shadow backdrop-blur"
      >
        {isFullscreen ? (
          <>
            <Minimize2 size={16} />
            <span>Quitter</span>
          </>
        ) : (
          <>
            <Maximize2 size={16} />
            <span>Plein écran</span>
          </>
        )}
      </button>
    </div>
  );
}
