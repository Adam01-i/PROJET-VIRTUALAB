import { Canvas, useThree, invalidate } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface GLBViewerProps {
  glbUrl: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Centrer et redimensionner automatiquement le modèle
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

  return <primitive object={scene} ref={ref} />;
}

function ResetCameraOnModelChange({ trigger }: { trigger: string }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    // Attendre que les controls soient dispo
    if (!controlsRef.current) return;

    // Repositionner la caméra
    camera.position.set(2, 2, 3);
    camera.lookAt(0, 0, 0);

    // Réinitialiser les contrôles utilisateur
    controlsRef.current.reset();

    // Forcer le re-rendu
    invalidate();
  }, [camera, trigger]);

  return <OrbitControls ref={controlsRef} enableZoom />;
}

export default function GLBViewer({ glbUrl }: GLBViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch((err) =>
        console.error('Erreur en plein écran:', err)
      );
    } else {
      document.exitFullscreen().catch((err) =>
        console.error('Erreur en sortie plein écran:', err)
      );
    }
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      style={{ width: '100%', height: isFullscreen ? '100vh' : '780px' }}
      ref={viewerRef}
    >
      <Canvas camera={{ position: [2, 2, 3] }} style={{ background: 'white' }}>
        <Suspense fallback={null}>
          <Environment preset="studio" background />
          <Model url={glbUrl} />
          <ResetCameraOnModelChange trigger={glbUrl} />
        </Suspense>
      </Canvas>

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
