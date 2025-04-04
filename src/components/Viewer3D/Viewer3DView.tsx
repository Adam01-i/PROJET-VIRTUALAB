import { useState} from 'react';
import { molecules } from '../../data/Viewer3D/moleculeData';
import { labEquipment } from '../../data/Viewer3D/labEquipmentData';
import MoleculeCard from './MoleculeCard';
import EquipmentCard from './EquipmentCard';
import MoleculeDetails from './MoleculeDetail';
import EquipmentDetails from './EquipmentDetail';
import { Cuboid as Cube, FlaskRound as Flask, PenTool as Tool } from 'lucide-react';
import type { Molecule, LabEquipment } from '../../types/Viewer3D/molecule-equipment';

type ViewMode = 'molecules' | 'equipment';

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');
  const [selectedItem, setSelectedItem] = useState<Molecule | LabEquipment | null>(
    molecules[0]
  );

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
            <div className="space-y-3">
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

        <div className="md:col-span-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
          {selectedItem ? (
            <div id="3dmol-viewer" style={{ width: '100%', height: '600px' }} />
          ) : (
            <div className="h-[600px] flex items-center justify-center text-purple-200">
              <div className="text-center">
                <Cube size={48} className="mx-auto mb-4 text-purple-300" />
                <p>Sélectionnez un élément pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}