// components/Viewer3D/OBJViewer.tsx
import { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';

interface OBJViewerProps {
  objUrl: string;
  mtlUrl: string;
  resourcePath?: string; // dossier où sont les textures
  backgroundColor?: string;
}

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <span className="text-white font-bold">{progress.toFixed(0)}%</span>
    </Html>
  );
};

const Model: React.FC<{ objUrl: string; mtlUrl: string; resourcePath?: string }> = ({
  objUrl,
  mtlUrl,
  resourcePath,
}) => {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const mtlLoader = new MTLLoader();
    mtlLoader.setResourcePath(resourcePath || ''); // dossier où chercher les textures
    mtlLoader.load(mtlUrl, (materials) => {
      materials.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(objUrl, (obj) => {
        setObject(obj);
      });
    });
  }, [objUrl, mtlUrl, resourcePath]);

  return object ? <primitive object={object} scale={1.5} /> : null;
};

const OBJViewer: React.FC<OBJViewerProps> = ({
  objUrl,
  mtlUrl,
  resourcePath,
  backgroundColor = '#1c0f3f',
}) => {
  return (
    <div className="w-full h-[780px] rounded-xl overflow-hidden">
      <Canvas style={{ background: backgroundColor }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={<Loader />}>
          <Model objUrl={objUrl} mtlUrl={mtlUrl} resourcePath={resourcePath} />
        </Suspense>
        <OrbitControls enableZoom />
      </Canvas>
    </div>
  );
};

export default OBJViewer;
