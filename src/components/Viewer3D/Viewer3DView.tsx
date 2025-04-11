import { useState } from 'react';
import { molecules } from '../../data/Viewer3D/moleculeData';
import { labEquipment } from '../../data/Viewer3D/labEquipmentData';
import MoleculeCard from './MoleculeCard';
import EquipmentCard from './EquipmentCard';
import MoleculeDetails from './MoleculeDetail';
import EquipmentDetails from './EquipmentDetail';
import GLBViewerMolecules from './GLBViewerMolecules';
import GLBViewerMateriels from './GLBViewerMateriels';
import { FlaskRound as Flask, PenTool as Tool, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Molecule, LabEquipment } from '../../types/Viewer3D/molecule-equipment';

type ViewMode = 'molecules' | 'equipment';

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les données en fonction de la recherche
  const dataList = viewMode === 'molecules' ? molecules : labEquipment;
  const filteredDataList = dataList.filter(item => {
    const name = viewMode === 'molecules' ? (item as Molecule).nom : (item as LabEquipment).nom;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Si aucun élément n'est trouvé après filtrage, on affiche un message dans la liste
  const selectedItem = filteredDataList.length > 0 ? filteredDataList[selectedIndex] : null;

  const handleNext = () => {
    setSelectedIndex((prevIndex) => (prevIndex + 1) % filteredDataList.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prevIndex) =>
      (prevIndex - 1 + filteredDataList.length) % filteredDataList.length
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-white">Visualisation 3D</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setViewMode('molecules');
              setSelectedIndex(0);
            }}
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
            onClick={() => {
              setViewMode('equipment');
              setSelectedIndex(0);
            }}
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

          {/* Section des éléments disponibles */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">
              {viewMode === 'molecules' ? 'Molécules disponibles' : 'Matériel disponible'}
            </h3>
            {/* Champ de recherche sous le titre */}
            <div className="mb-4">
              <input
                type="text"
                className="w-full p-2 bg-white/20 rounded-lg text-white placeholder:text-gray-400"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Si aucune donnée n'est trouvée, afficher un message */}
            {filteredDataList.length === 0 ? (
              <p className="text-white text-center">Aucun élément disponible</p>
            ) : (
              <div className="space-y-3 max-h-[265px] overflow-y-auto">
                {filteredDataList.map((item, index) =>
                  viewMode === 'molecules' ? (
                    <MoleculeCard
                      key={item.id}
                      molecule={item as Molecule}
                      isSelected={selectedIndex === index}
                      onSelect={() => setSelectedIndex(index)}
                    />
                  ) : (
                    <EquipmentCard
                      key={item.id}
                      equipment={item as LabEquipment}
                      isSelected={selectedIndex === index}
                      onSelect={() => setSelectedIndex(index)}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative md:col-span-2">
          {/* Vérifier si selectedItem existe avant d'afficher la structure */}
          {selectedItem && selectedItem.structure && selectedItem.structure.endsWith('.glb') && (
            viewMode === 'molecules' ? (
              <GLBViewerMolecules
                key={`molecule-${selectedItem.id}`}
                glbUrl={selectedItem.structure}
                moleculeName={selectedItem.nom}
              />
            ) : (
              <GLBViewerMateriels
                key={`equipment-${selectedItem.id}`}
                glbUrl={selectedItem.structure}
                materielsName={selectedItem.nom}
              />
            )
          )}

          {/* Bouton précédent */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl text-3xl transition-all duration-200"
            aria-label="Précédent"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Bouton suivant */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl text-3xl transition-all duration-200"
            aria-label="Suivant"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}
