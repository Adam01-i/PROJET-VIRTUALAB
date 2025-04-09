import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';

interface GLBViewerProps {
  glbUrl: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function GLBViewer({ glbUrl }: GLBViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null); // Référence à l'élément contenant le canvas

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (viewerRef.current) {
        viewerRef.current.requestFullscreen().catch((err) => console.error('Erreur en plein écran:', err));
      }
    } else {
      document.exitFullscreen().catch((err) => console.error('Erreur en sortie plein écran:', err));
    }
    setIsFullscreen((prev) => !prev); // Toggle état plein écran
  };

  return (
    <div style={{ width: '100%', height: isFullscreen ? '100vh' : '780px' }} ref={viewerRef}>
      <Canvas camera={{ position: [2, 2, 3] }} style={{ background: 'black' }}>
        <Suspense fallback={null}>
          {/* Lumière et environnement réaliste */}
          <Environment preset="studio" background />
          <Model url={glbUrl} />
        </Suspense>
        <OrbitControls enableZoom />
      </Canvas>

      {/* Bouton plein écran */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 10,
        }}
      >
        {isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      </button>
    </div>
  );
}
