import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react'; // Icônes
interface GLBViewerProps {
  glbUrl: string;
  moleculeName?: string;
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

  // Rotation automatique
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;
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
      style={{
        width: '100%',
        height: isFullscreen ? '100vh' : '780px',
        background: 'linear-gradient(135deg, #5b21b6, #d8b4fe)' ,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Overlay du nom de la molécule */}
      {moleculeName && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#333',
            zIndex: 10,
          }}
        >
          {moleculeName}
        </div>
      )}

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
     

{/* Bouton plein écran avec icône stylée */}
<button
  onClick={toggleFullscreen}
  className="absolute top-4 right-4 flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg transition-all duration-300 z-10 backdrop-blur-md"
>
  {isFullscreen ? (
    <>
      <Minimize2 size={18} />
      <span>Quitter</span>
    </>
  ) : (
    <>
      <Maximize2 size={18} />
      <span>Plein écran</span>
    </>
  )}
</button>

    </div>
  );
}
