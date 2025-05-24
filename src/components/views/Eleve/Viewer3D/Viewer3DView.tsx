import { useState, useEffect } from 'react';
import {
  FlaskRound as Flask,
  PenTool as Tool,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import MoleculeCard from './MoleculeCard';
import EquipmentCard from './EquipmentCard';
import MoleculeDetails from './MoleculeDetail';
import EquipmentDetails from './EquipmentDetail';
import GLBViewer from './GLBViewer';
import { supabase } from '../../../../lib/supabaseClient';
import type { Molecule, LabEquipment } from '../../../../types/Viewer3D/lab_items';

type ViewMode = 'molecules' | 'equipment';

export default function Viewer3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecules');
  const [moleculeList, setMoleculeList] = useState<Molecule[]>([]);
  const [equipmentList, setEquipmentList] = useState<LabEquipment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    fetchItems();
  }, [viewMode]);

  const fetchItems = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'eleve') return;

    setPrenom(profile.name || '');

    const { data: ec } = await supabase
      .from('eleves_classes')
      .select('classe_id')
      .eq('eleve_id', user.id)
      .single();

    const classeId = ec?.classe_id;

    if (!classeId) {
      setLoading(false);
      return;
    }

    const category = viewMode === 'molecules' ? 'molecule' : 'equipment';

    const { data, error } = await supabase
      .from('lab_items')
      .select('*')
      .eq('category', category)
      .eq('classe_id', classeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur de chargement :", error);
    } else {
      viewMode === 'molecules'
        ? setMoleculeList(data || [])
        : setEquipmentList(data || []);
      setSelectedIndex(0);
    }

    setLoading(false);
  };

  const dataList = viewMode === 'molecules' ? moleculeList : equipmentList;
  const selectedItem = dataList[selectedIndex] || null;

  const handleNext = () =>
    setSelectedIndex((prev) => (prev + 1) % dataList.length);
  const handlePrev = () =>
    setSelectedIndex((prev) => (prev - 1 + dataList.length) % dataList.length);

  return (
    <div className="w-full px-6 md:px-10 py-20 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Bienvenue {prenom} – Visualisation 3D
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('molecules')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm border ${
              viewMode === 'molecules'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Flask size={18} />
            <span>Molécules</span>
          </button>
          <button
            onClick={() => setViewMode('equipment')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm border ${
              viewMode === 'equipment'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Tool size={18} />
            <span>Matériel</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar : détails + liste */}
        <div className="space-y-6">
          {selectedItem &&
            (viewMode === 'molecules' ? (
              <MoleculeDetails molecule={selectedItem as Molecule} />
            ) : (
              <EquipmentDetails equipment={selectedItem as LabEquipment} />
            ))}

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              {viewMode === 'molecules'
                ? 'Molécules disponibles'
                : 'Matériel disponible'}
            </h3>

            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : dataList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">
                Aucun élément disponible
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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
            )}
          </div>
        </div>

        {/* Viewer 3D */}
        <div className="relative md:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          {selectedItem?.structure?.endsWith('.glb') && (
            <GLBViewer
              key={`${viewMode}-${selectedItem.id}`}
              glbUrl={selectedItem.structure}
              moleculeName={selectedItem.nom}
              materielsName={selectedItem.nom}
            />
          )}

          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg"
            aria-label="Précédent"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg"
            aria-label="Suivant"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
