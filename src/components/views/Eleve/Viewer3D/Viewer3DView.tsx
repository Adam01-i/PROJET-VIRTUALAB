import { useState, useEffect } from 'react';
import { FlaskRound as Flask, PenTool as Tool, ChevronLeft, ChevronRight } from 'lucide-react';
import MoleculeCard from './MoleculeCard';
import EquipmentCard from './EquipmentCard';
import MoleculeDetails from './MoleculeDetail';
import EquipmentDetails from './EquipmentDetail';
import GLBViewer from './GLBViewer';
import { supabase } from '../../../../lib/supabaseClient';
import type { Molecule, LabEquipment } from '../../../../types/Viewer3D/molecule-equipment';

type ViewMode = 'molecules' | 'equipment';

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');
  const [moleculeList, setMoleculeList] = useState<Molecule[]>([]);
  const [equipmentList, setEquipmentList] = useState<LabEquipment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, [viewMode]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lab_items')
      .select('*')
      .eq('category', viewMode === 'molecules' ? 'molecule' : 'equipment')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur de chargement :", error);
      return;
    }

    if (viewMode === 'molecules') {
      setMoleculeList(data || []);
    } else {
      setEquipmentList(data || []);
    }

    setSelectedIndex(0); // Reset sur l'élément affiché
  };

  const dataList = viewMode === 'molecules' ? moleculeList : equipmentList;
  const filteredDataList = dataList.filter(item =>
    item.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedItem = filteredDataList.length > 0 ? filteredDataList[selectedIndex] : null;

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % filteredDataList.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) =>
      (prev - 1 + filteredDataList.length) % filteredDataList.length
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 text-base space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Visualisation 3D</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('molecules')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm ${viewMode === 'molecules'
              ? 'bg-purple-500 text-white'
              : 'bg-white/5 text-purple-200 hover:bg-white/10'
              }`}
          >
            <Flask size={18} />
            <span>Molécules</span>
          </button>
          <button
            onClick={() => setViewMode('equipment')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm ${viewMode === 'equipment'
              ? 'bg-purple-500 text-white'
              : 'bg-white/5 text-purple-200 hover:bg-white/10'
              }`}
          >
            <Tool size={18} />
            <span>Matériel</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          {selectedItem && (
            viewMode === 'molecules' && 'formule' in selectedItem ? (
              <MoleculeDetails molecule={selectedItem as Molecule} />
            ) : viewMode === 'equipment' && 'usage' in selectedItem ? (
              <EquipmentDetails equipment={selectedItem as LabEquipment} />
            ) : null
          )}

          <div className="bg-white/5 backdrop-blur-lg rounded-md p-4 border border-white/10">
            <h3 className="text-base font-semibold text-white mb-3">
              {viewMode === 'molecules' ? 'Molécules disponibles' : 'Matériel disponible'}
            </h3>

            <div className="mb-3">
              <input
                type="text"
                className="w-full p-2 bg-white/20 rounded-md text-white placeholder:text-gray-400 text-sm"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredDataList.length === 0 ? (
              <p className="text-white text-center text-sm">Aucun élément disponible</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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
          {selectedItem && selectedItem.structure && selectedItem.structure.endsWith('.glb') && (
            <GLBViewer
              key={`${viewMode}-${selectedItem.id}`}
              glbUrl={selectedItem.structure}
              moleculeName={selectedItem.nom}
              materielsName={selectedItem.nom}
            />
          )}

          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg text-2xl"
            aria-label="Précédent"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg text-2xl"
            aria-label="Suivant"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
