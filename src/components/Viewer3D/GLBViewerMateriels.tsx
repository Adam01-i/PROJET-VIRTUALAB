/* eslint-disable @typescript-eslint/no-explicit-any */
import { Canvas, useThree, invalidate } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Maximize2, Minimize2 } from 'lucide-react'; // Icônes

interface GLBViewerProps {
  glbUrl: string;
  materielsName?: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current) return;

    const box = new THREE.Box3().setFromObject(ref.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Centrage du modèle à l'origine
    ref.current.position.sub(center);

    // Mise à l’échelle réaliste : l’objet occupe ~80% de la scène
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    ref.current.scale.setScalar(scale);

    // Activer les ombres
    ref.current.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} ref={ref} />;
}

function ResetCameraOnModelChange({ trigger }: { trigger: string }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    camera.position.set(2, 2, 4); // Vue légèrement en hauteur
    camera.lookAt(0, 0, 0);

    controlsRef.current.reset();
    invalidate();
  }, [camera, trigger]);

  return <OrbitControls ref={controlsRef} enableZoom enableDamping dampingFactor={0.1} />;
}

export default function GLBViewer({ glbUrl, materielsName }: GLBViewerProps) {
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
      {/* Overlay du nom de la molécule */}
      {materielsName && (
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
          {materielsName}
        </div>
      )}
      <Canvas
        camera={{ position: [2, 2, 4], fov: 60 }}
        style={{ background: 'white' }} // Fond gris foncé
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Lumières de type studio */}
          
          {/* Key Light (Lumière principale) */}
          <directionalLight
            position={[10, 10, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.001}
          />

          {/* Fill Light (Lumière de remplissage) */}
          <directionalLight
            position={[-5, 5, 5]}
            intensity={0.7}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.001}
            color="0x555555" // Lumière plus douce
          />
          
          {/* Back Light (Lumière de contre-jour) */}
          <directionalLight
            position={[0, 5, -10]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.001}
            color="0xeeeeee"
          />

          {/* Spot Light pour un effet projecteur */}
          <spotLight
            position={[0, 10, 0]}
            intensity={0.8}
            angle={0.2}
            penumbra={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            color="0xffffff"
          />

          {/* Modèle 3D */}
          <Model url={glbUrl} />
          <ResetCameraOnModelChange trigger={glbUrl} />
        </Suspense>
      </Canvas>

      {/* Bouton plein écran */}
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
