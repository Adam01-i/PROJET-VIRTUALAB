import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense } from 'react';

interface GLBViewerProps {
  glbUrl: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function GLBViewer({ glbUrl }: GLBViewerProps) {
  return (
    <div style={{ width: '100%', height: '780px' }}>
      <Canvas
        camera={{ position: [2, 2, 3] }}
        style={{ background: 'black' }}
      >
        <Suspense fallback={null}>
          {/* Lumière et environnement réaliste */}
          <Environment preset="studio" background />
          <Model url={glbUrl} />
        </Suspense>
        <OrbitControls enableZoom />
      </Canvas>
    </div>
  );
}
