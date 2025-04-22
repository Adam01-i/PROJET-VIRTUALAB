import { useState, useEffect } from 'react';
import { FlaskRound as Flask, PenTool as Tool, Trash2 } from 'lucide-react';
import ProfMoleculeDetails from './ProfMoleculeDetails';
import ProfMaterielsDetails from './ProfMaterielsDetails';
import ProfGLBViewer from './ProfGLBViewer';
import type { Molecule, LabEquipment } from '../../../../types/Viewer3D/molecule-equipment';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'sonner';

type ViewMode = 'molecule' | 'equipment';

export default function Prof3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecule');
  const [selectedMolecule, setSelectedMolecule] = useState<Molecule | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<LabEquipment | null>(null);
  const [moleculeList, setMoleculeList] = useState<Molecule[]>([]);
  const [equipmentList, setEquipmentList] = useState<LabEquipment[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Partial<Molecule & LabEquipment>>({
    id: '',
    nom: '',
    description: '',
    structure: '',
    category: 'molecule',
  });

  useEffect(() => {
    fetchItems();
  }, [viewMode]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lab_items')
      .select('*')
      .eq('category', viewMode)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur de chargement");
      return;
    }

    if (viewMode === 'molecule') {
      setMoleculeList(data || []);
    } else {
      setEquipmentList(data || []);
    }
  };

  const handleSubmit = async () => {
    const isEdit = !!formData.id;

    const payload = {
      ...formData,
      category: viewMode,
    };

    try {
      await toast.promise(
        (async () => {
          if (isEdit) {
            return await supabase.from('lab_items').update(payload).eq('id', formData.id);
          } else {
            return await supabase.from('lab_items').insert([payload]);
          }
        })(),
        {
          loading: isEdit ? "Mise à jour..." : "Ajout en cours...",
          success: isEdit ? "✅ Modifié avec succès !" : "✅ Ajouté avec succès !",
          error: "❌ Erreur lors de la sauvegarde",
        }
      );

      setIsEditing(false);
      setFormData({ nom: '', description: '', structure: '', category: viewMode });
      fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Supprimer cet élément ?");
    if (!confirmDelete) return;
  
    try {
      await toast.promise(
        (async () => {
          return await supabase.from('lab_items').delete().eq('id', id);
        })(),
        {
          loading: "Suppression...",
          success: "✅ Supprimé",
          error: "❌ Erreur lors de la suppression",
        }
      );
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };
  

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className='flex space-x-2'>
          <button
            onClick={() => {
              setViewMode('molecule');
              setSelectedEquipment(null);
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${viewMode === 'molecule'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
          >
            <Flask size={20} />
            <span>Molécules</span>
          </button>
          <button
            onClick={() => {
              setViewMode('equipment');
              setSelectedMolecule(null);
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${viewMode === 'equipment'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
          >
            <Tool size={20} />
            <span>Matériel</span>
          </button>
        </div>
        <button
          onClick={() => {
            setIsEditing(true);
            setSelectedMolecule(null);
            setSelectedEquipment(null);
            setFormData({
              id: '',
              nom: '',
              description: '',
              structure: '',
              category: viewMode,
            });
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouveau {viewMode === 'molecule' ? 'Molécule' : 'Matériel'}
        </button>
      </div>

      {/* FORMULAIRE */}
      {isEditing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 bg-white p-6 rounded-md shadow border mb-6"
        >
          <input
            type="text"
            placeholder="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="URL du fichier .glb"
            value={formData.structure}
            onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <div className="flex justify-end gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Enregistrer</button>
            <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
          </div>
        </form>
      )}

      {/* ZONE AFFICHAGE */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* LISTE GAUCHE */}
        <div className="md:w-[60%] space-y-4 scroll-y max-h-[84vh] overflow-auto">
          {viewMode === 'molecule'
            ? moleculeList.length === 0
              ? <div className="text-gray-500">Aucune molécule trouvée.</div>
              : moleculeList.map((mol) => (
                <div
                  key={mol.id}
                  className={`cursor-pointer p-5 rounded-xl shadow-md border transition-all duration-200 ${selectedMolecule?.id === mol.id
                    ? 'bg-purple-100 border-purple-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  onClick={() => {
                    setSelectedMolecule(mol);
                    setSelectedEquipment(null);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{mol.nom}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{mol.description}</p>
                      <div className="text-sm text-gray-500 flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                          {mol.niveau || 'Niveau inconnu'}
                        </span>
                        <span>{mol.formule}</span>
                      </div>
                    </div>
                    <Trash2
                      size={16}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(mol.id);
                      }}
                    />
                  </div>
                </div>
              ))
            : equipmentList.length === 0
              ? <div className="text-gray-500">Aucun matériel trouvé.</div>
              : equipmentList.map((equip) => (
                <div
                  key={equip.id}
                  className={`cursor-pointer p-5 rounded-xl shadow-md border transition-all duration-200 ${selectedEquipment?.id === equip.id
                    ? 'bg-purple-100 border-purple-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  onClick={() => {
                    setSelectedEquipment(equip);
                    setSelectedMolecule(null);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{equip.nom}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{equip.description}</p>
                    </div>
                    <Trash2
                      size={16}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(equip.id);
                      }}
                    />
                  </div>
                </div>
              ))
          }
        </div>

        {/* VISUALISATION 3D + DÉTAILS */}
        <div className="md:w-[40%] space-y-6 scroll-y max-h-[84vh] overflow-auto">
          {viewMode === 'molecule' && selectedMolecule ? (
            <>
              <ProfGLBViewer glbUrl={selectedMolecule.structure} moleculeName={selectedMolecule.nom} />
              <ProfMoleculeDetails molecule={selectedMolecule} />
            </>
          ) : viewMode === 'equipment' && selectedEquipment ? (
            <>
              <ProfGLBViewer glbUrl={selectedEquipment.structure} moleculeName={selectedEquipment.nom} />
              <ProfMaterielsDetails equipment={selectedEquipment} />
            </>
          ) : (
            <div className="text-gray-400 text-sm italic">
              Sélectionne un élément à gauche pour voir sa visualisation 3D et ses détails.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
