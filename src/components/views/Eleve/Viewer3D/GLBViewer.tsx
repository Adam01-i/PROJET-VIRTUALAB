import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';

interface GLBViewerProps {
  glbUrl: string;
  moleculeName?: string;
  materielsName?: string;
}

function MoleculeModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current) return;

    const box = new THREE.Box3().setFromObject(ref.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    ref.current.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    ref.current.scale.setScalar(scale);
  }, [scene]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;
    }
  });

  return <primitive object={scene} ref={ref} />;
}

export default function GLBViewerMolecules({ glbUrl, moleculeName, materielsName }: GLBViewerProps) {
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

  const label = moleculeName || materielsName;

  return (
    <div
      ref={viewerRef}
      className="relative w-full bg-gradient-to-br from-purple-700 to-purple-300 rounded-lg overflow-hidden"
      style={{ height: isFullscreen ? '100vh' : '610px' }}
    >
      {/* Nom affiché en haut à gauche */}
      {label && (
        <div className="absolute top-4 left-4 bg-white/90 text-sm font-semibold text-gray-800 px-3 py-1.5 rounded-md z-10 shadow">
          {label}
        </div>
      )}

      {/* Affichage 3D */}
      <Canvas camera={{ position: [2, 2, 3] }}>
        <Suspense fallback={null}>
          <Environment preset="studio" background={false} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <MoleculeModel url={glbUrl} />
          <OrbitControls enableZoom enableRotate />
        </Suspense>
      </Canvas>

      {/* Bouton plein écran */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm shadow-md z-10"
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
