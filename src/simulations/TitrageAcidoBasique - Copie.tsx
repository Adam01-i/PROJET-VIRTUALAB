import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// Composant représentant le robinet
const Robinet = ({ onClick }: { onClick: () => void }) => {
  return (
    <mesh position={[0, 3, 0]} onClick={onClick} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 0.5]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
};

// Composant représentant le bécher
const Becher = ({ volume }: { volume: number }) => {
  const maxHeight = 5; // Hauteur maximale du liquide dans le bécher
  const currentHeight = (volume / 100) * maxHeight; // Calculer la hauteur en fonction du volume
  
  return (
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[1, 1, maxHeight]} />
      <meshStandardMaterial color="lightgray" />

      {/* Liquide dans le bécher */}
      <mesh position={[0, -maxHeight / 2 + currentHeight / 2, 0]}>
        <cylinderGeometry args={[1, 1, currentHeight]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </mesh>
  );
};

// Simulation de titrage acido-basique
export default function TitrageAcidoBasiqueSimulation() {
  const [volume, setVolume] = useState(0); // Volume du liquide dans le bécher

  // Fonction qui est appelée lorsqu'on clique sur le robinet
  const remplirBecher = () => {
    if (volume < 100) {
      setVolume(volume + 10); // Ajouter 10 mL à chaque clic
    }
  };

  return (
    <div className="simulation-container">
      <h2 className="text-2xl text-center mb-4">Simulation de Titrage Acido-Basique</h2>

      <div className="threejs-canvas mt-8">
        <Canvas style={{ height: "500px", width: "100%" }} shadows>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          
          {/* Le grand bécher */}
          <Becher volume={volume} />
          
          {/* Le robinet qui, lorsqu'on clique dessus, va remplir le bécher */}
          <Robinet onClick={remplirBecher} />
          
          <OrbitControls />
        </Canvas>
      </div>

      {/* Affichage du volume de liquide dans le bécher */}
      <div className="text-center mt-4">
        <p>Volume de liquide dans le bécher : {volume} mL</p>
      </div>
    </div>
  );
}
