import { useState, useEffect, useRef } from 'react';
import { molecules } from '../../data/Viewer3D/moleculeData';
import { labEquipment } from '../../data/Viewer3D/labEquipmentData';
import MoleculeCard from './MoleculeCard';
import EquipmentCard from './EquipmentCard';
import MoleculeDetails from './MoleculeDetail';
import EquipmentDetails from './EquipmentDetail';
import { FlaskRound as Flask, PenTool as Tool, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Molecule, LabEquipment } from '../../types/Viewer3D/molecule-equipment';
import * as $3Dmol from '3dmol';

type ViewMode = 'molecules' | 'equipment';

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const dataList = viewMode === 'molecules' ? molecules : labEquipment;
  const selectedItem = dataList[selectedIndex];

  const handleNext = () => {
    setSelectedIndex((prevIndex) => (prevIndex + 1) % dataList.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prevIndex) =>
      (prevIndex - 1 + dataList.length) % dataList.length
    );
  };

  useEffect(() => {
    const viewerDiv = viewerRef.current;
    if (!viewerDiv || !selectedItem?.structure) return;
  
    viewerDiv.innerHTML = '';
  
    const viewer = $3Dmol.createViewer(viewerDiv, {
      backgroundColor: '#1c0f3f',
    });
  
    const url = selectedItem.structure;
    const isObj = url.endsWith('.obj');
  
    if (isObj) {
      fetch(url)
        .then(res => res.text())
        .then(objData => {
          viewer.addModel(objData, 'obj');
          viewer.setStyle({}, { line: { linewidth: 2, color: 'white' } });
          viewer.zoomTo();
          viewer.render();
        })
        .catch(err => console.error("Erreur chargement .obj :", err));
    } else {
      $3Dmol.download(url, viewer, {}, () => {
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
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">
              {viewMode === 'molecules' ? 'Molécules disponibles' : 'Matériel disponible'}
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dataList.map((item, index) =>
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
          </div>
        </div>

        <div className="relative md:col-span-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden max-h-780">
          <div ref={viewerRef} style={{ width: '100%', height: '780px' }} />

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
