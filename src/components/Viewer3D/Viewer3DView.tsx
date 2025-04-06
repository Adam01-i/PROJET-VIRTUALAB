import { useState} from 'react';
import { molecules } from '../../data/Viewer3D/moleculeData';
import { labEquipment } from '../../data/Viewer3D/labEquipmentData';
import MoleculeCard from './MoleculeCard';
import EquipmentCard from './EquipmentCard';
import MoleculeDetails from './MoleculeDetail';
import EquipmentDetails from './EquipmentDetail';
import {FlaskRound as Flask, PenTool as Tool } from 'lucide-react';
import type { Molecule, LabEquipment } from '../../types/Viewer3D/molecule-equipment';
import { useEffect,useRef} from 'react';
import * as $3Dmol from '3dmol'; // Import 3Dmol

type ViewMode = 'molecules' | 'equipment';

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');
  const [selectedItem, setSelectedItem] = useState<Molecule | LabEquipment | null>(
    molecules[0]
  );
  const viewerRef = useRef<HTMLDivElement>(null); // réf pour le div du viewer

  useEffect(() => {
    if (viewerRef.current && selectedItem) {
      const element = viewerRef.current;

      // Clear any previous viewer (optionnel mais propre)
      element.innerHTML = "";

      const viewer = $3Dmol.createViewer(element, {
        backgroundColor: 'white',
      });

      $3Dmol.download(selectedItem.structure, viewer, {}, () => {
        viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });
        viewer.zoomTo();
        viewer.render();
      });
    }
  }, [selectedItem]);
  
  

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-white">Visualisation 3D</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('molecules')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewMode === 'molecules'
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-purple-200 hover:bg-white/10'
            }`}
          >
            <Flask size={20} />
            <span>Molécules</span>
          </button>
          <button
            onClick={() => setViewMode('equipment')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewMode === 'equipment'
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-purple-200 hover:bg-white/10'
            }`}
          >
            <Tool size={20} />
            <span>Matériel</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="space-y-6">
          {selectedItem && (
            viewMode === 'molecules' && 'formule' in selectedItem ? (
              <MoleculeDetails molecule={selectedItem as Molecule} />
            ) : viewMode === 'equipment' && 'usage' in selectedItem ? (
              <EquipmentDetails equipment={selectedItem as LabEquipment} />
            ) : null
          )}
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
  <h3 className="text-xl font-semibold text-white mb-4">
    {viewMode === 'molecules' ? 'Molécules disponibles' : 'Matériel disponible'}
  </h3>
  <div className="space-y-3 max-h-80 overflow-y-auto"> {/* Ajout du scroll ici */}
    {viewMode === 'molecules'
      ? molecules.map((molecule) => (
          <MoleculeCard
            key={molecule.id}
            molecule={molecule}
            isSelected={selectedItem?.id === molecule.id}
            onSelect={setSelectedItem}
          />
        ))
      : labEquipment.map((equipment) => (
          <EquipmentCard
            key={equipment.id}
            equipment={equipment}
            isSelected={selectedItem?.id === equipment.id}
            onSelect={setSelectedItem}
          />
        ))}
  </div>
</div>

        </div>

        <div className="md:col-span-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden max-h-780">
      {selectedItem ? (
        <div
          ref={viewerRef}
          style={{ width: '100%', height: 'max-h-780' }}
        />
      ) : (
        <div className="h-[600px] flex items-center justify-center text-purple-200">
          <p>Sélectionnez un élément pour commencer</p>
        </div>
      )}
    </div>

      </div>
    </div>
  );
}