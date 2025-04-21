import { useState } from 'react';
import { FlaskRound as Flask, PenTool as Tool } from 'lucide-react';
import { molecules } from '../../../data/Viewer3D/moleculeData';
import { labEquipment } from '../../../data/Viewer3D/labEquipmentData'; // ← Ton nouveau tableau
import ProfMoleculeDetails from './ProfMoleculeDetails';
import ProfMaterielsDetails from './ProfMaterielsDetails'; // ← À créer
import ProfGLBViewer from './ProfGLBViewer'; // ← Réutilisé
import type { Molecule, LabEquipment } from '../../../types/Viewer3D/molecule-equipment';

export default function Prof3DView() {
  const [selectedMolecule, setSelectedMolecule] = useState<Molecule | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<LabEquipment | null>(null);

  type ViewMode = 'molecules' | 'equipment';
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className='flex space-x-2'>
          <button
            onClick={() => { setViewMode('molecules'); setSelectedEquipment(null); }}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewMode === 'molecules'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
            }`}
          >
            <Flask size={20} />
            <span>Molécules</span>
          </button>
          <button
            onClick={() => { setViewMode('equipment'); setSelectedMolecule(null); }}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewMode === 'equipment'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
            }`}
          >
            <Tool size={20} />
            <span>Matériel</span>
          </button>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md">
          ➕ Nouveau {viewMode === 'molecules' ? 'Molécule' : 'Matériel'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Liste gauche */}
        <div className="md:w-[60%] space-y-4 scroll-y max-h-[84vh] overflow-auto">
          {viewMode === 'molecules' ? (
            molecules.length === 0 ? (
              <div className="text-gray-500">Aucune molécule trouvée.</div>
            ) : (
              molecules.map((mol) => (
                <div
                  key={mol.id}
                  className={`cursor-pointer p-5 rounded-xl shadow-md border transition-all duration-200 ${
                    selectedMolecule?.id === mol.id
                      ? 'bg-purple-100 border-purple-300'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setSelectedMolecule(mol)}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{mol.nom}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{mol.description}</p>
                  <div className="text-sm text-gray-500 flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                      {mol.niveau || 'Niveau inconnu'}
                    </span>
                    <span>{mol.formule}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            labEquipment.length === 0 ? (
              <div className="text-gray-500">Aucun matériel trouvé.</div>
            ) : (
              labEquipment.map((equip) => (
                <div
                  key={equip.id}
                  className={`cursor-pointer p-5 rounded-xl shadow-md border transition-all duration-200 ${
                    selectedEquipment?.id === equip.id
                      ? 'bg-purple-100 border-purple-300'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setSelectedEquipment(equip)}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{equip.nom}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{equip.description}</p>
                </div>
              ))
            )
          )}
        </div>

        {/* Visualisation et détails */}
        <div className="md:w-[40%] space-y-6 scroll-y max-h-[84vh] overflow-auto">
          {viewMode === 'molecules' ? (
            selectedMolecule ? (
              <>
                <ProfGLBViewer
                  glbUrl={selectedMolecule.structure}
                  moleculeName={selectedMolecule.nom}
                />
                <ProfMoleculeDetails molecule={selectedMolecule} />
              </>
            ) : (
              <div className="text-gray-400 text-sm italic">
                Sélectionne une molécule à gauche pour voir sa visualisation 3D et ses détails.
              </div>
            )
          ) : selectedEquipment ? (
            <>
              <ProfGLBViewer
                glbUrl={selectedEquipment.structure}
                moleculeName={selectedEquipment.nom}
              />
              <ProfMaterielsDetails equipment={selectedEquipment} />
            </>
          ) : (
            <div className="text-gray-400 text-sm italic">
              Sélectionne un matériel à gauche pour voir sa visualisation 3D et ses détails.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
