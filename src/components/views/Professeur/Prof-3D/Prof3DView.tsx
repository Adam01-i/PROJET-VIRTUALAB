import { useState, useEffect } from 'react';
import { FlaskRound as Flask, PenTool as Tool, Trash2, Pencil } from 'lucide-react';
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
    id: 'undefined',
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
  
    try {
      await toast.promise(async () => {
        if (isEdit) {
          // ✅ Mode modification
          await supabase.from('lab_items').update({
            nom: formData.nom,
            description: formData.description,
            structure: formData.structure,
            category: viewMode,
            formule: formData.formule,
            niveau: formData.niveau,
            importance: formData.importance,
            usage: formData.usage,
          }).eq('id', formData.id);
  
          // Mise à jour locale
          if (viewMode === 'molecule') {
            setMoleculeList((prev) =>
              prev.map((item) =>
                item.id === formData.id ? { ...item, ...formData } as Molecule : item
              )
            );
          } else {
            setEquipmentList((prev) =>
              prev.map((item) =>
                item.id === formData.id ? { ...item, ...formData } as LabEquipment : item
              )
            );
          }
  
        } else {
          // ✅ Mode ajout
          const { data: insertedItems, error: insertError } = await supabase
            .from('lab_items')
            .insert([{
              nom: formData.nom,
              description: formData.description,
              structure: formData.structure,
              category: viewMode,
              formule: formData.formule,
              niveau: formData.niveau,
              importance: formData.importance,
              usage: formData.usage,
            }])
            .select(); // 🔥 récupère l'élément ajouté directement
  
          if (insertError || !insertedItems || insertedItems.length === 0) {
            throw insertError || new Error("Insertion échouée");
          }
  
          const newItem = insertedItems[0];
  
          // Mise à jour locale immédiate
          if (viewMode === 'molecule') {
            setMoleculeList((prev) => [newItem, ...prev]);
          } else {
            setEquipmentList((prev) => [newItem, ...prev]);
          }
        }
  
        setIsEditing(false);
        setFormData({
          id: undefined,
          nom: '',
          description: '',
          structure: '',
          category: viewMode,
          formule: '',
          niveau: '',
          importance: '',
          usage: '',
        });
  
      }, {
        loading: isEdit ? 'Mise à jour...' : 'Ajout en cours...',
        success: isEdit ? '✅ Modifié avec succès !' : '✅ Ajouté avec succès !',
        error: '❌ Erreur lors de la sauvegarde.',
      });
  
    } catch (err) {
      console.error("Erreur handleSubmit:", err);
      toast.error("Une erreur est survenue.");
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const folder = viewMode === 'molecule' ? 'molecules' : 'equipments';
    const filename = `${folder}/${Date.now()}_${file.name}`;
  
    const { error } = await supabase.storage
      .from('structures')
      .upload(filename, file);
  
    if (error) {
      toast.error("❌ Échec de l'upload du fichier .glb");
      console.error(error);
      return;
    }
  
    const { data } = supabase.storage
  .from('structures')
  .getPublicUrl(filename);

if (data?.publicUrl) {
  setFormData((prev) => ({
    ...prev,
    structure: data.publicUrl,
  }));
  toast.success("✅ Fichier .glb uploadé !");
}

  };
  


  return (
    <div className="p-4 max-w-[1280px] mx-auto text-base text-gray-800 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode('molecule');
              setSelectedEquipment(null);
              setIsEditing(false);
            }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${viewMode === 'molecule'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
          >
            <Flask size={16} />
            <span>Molécules</span>
          </button>
          <button
            onClick={() => {
              setViewMode('equipment');
              setSelectedMolecule(null);
              setIsEditing(false);
            }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${viewMode === 'equipment'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
          >
            <Tool size={16} />
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
              formule: '',
              niveau: '',
              importance: '',
              usage: ''
            });

          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouveau {viewMode === 'molecule' ? 'Molécule' : 'Matériel'}
        </button>
      </div>



      {/* LISTE + DÉTAILS */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* LISTE */}
        <div className="md:w-[60%] space-y-3 max-h-[84vh] overflow-auto">
          {viewMode === 'molecule'
            ? moleculeList.length === 0
              ? <p className="text-gray-500">Aucune molécule trouvée.</p>
              : moleculeList.map((mol) => (
                <div
                  key={mol.id}
                  onClick={() => {
                    setSelectedMolecule(mol);
                    setSelectedEquipment(null);
                    setIsEditing(false);
                  }}
                  className={`cursor-pointer p-4 rounded-md border shadow-sm transition ${selectedMolecule?.id === mol.id
                    ? 'bg-purple-100 border-purple-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">{mol.nom}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{mol.description}</p>
                      <div className="text-sm text-gray-500 flex gap-3 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                          {mol.niveau || 'Niveau inconnu'}
                        </span>
                        <span>{mol.formule}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pencil
                        size={16}
                        className="text-blue-500 hover:text-blue-700 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setFormData({
                            ...mol,
                            category: viewMode,
                          });
                        }}
                      />
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
                </div>
              ))
            : equipmentList.length === 0
              ? <p className="text-gray-500">Aucun matériel trouvé.</p>
              : equipmentList.map((equip) => (
                <div
                  key={equip.id}
                  onClick={() => {
                    setSelectedEquipment(equip);
                    setSelectedMolecule(null);
                    setIsEditing(false);
                  }}
                  className={`cursor-pointer p-4 rounded-md border shadow-sm transition ${selectedEquipment?.id === equip.id
                    ? 'bg-purple-100 border-purple-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">{equip.nom}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{equip.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pencil
                        size={16}
                        className="text-blue-500 hover:text-blue-700 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setFormData({
                            ...equip,
                            category: viewMode,
                          });
                        }}
                      />
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
                </div>
              ))}
        </div>

        {/* DÉTAILS + 3D */}
        <div className="md:w-[40%] space-y-4 max-h-[84vh] overflow-auto text-sm">
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
            <p className="text-gray-400 italic">
              Sélectionne un élément à gauche pour voir sa visualisation 3D et ses détails.
            </p>
          )}

          {/* 👉 FORMULAIRE EN DESSOUS DES DÉTAILS */}
          {isEditing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4 bg-white p-5 rounded-md shadow border mt-4"
            >
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Structure (.glb)</label>

                <input
                  type="text"
                  placeholder="URL du fichier .glb ou automatique après l’upload"
                  value={formData.structure}
                  onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />

                <input
                  type="file"
                  accept=".glb"
                  onChange={handleFileUpload}
                  className="mt-2 block w-full text-sm text-gray-700
               file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0
               file:text-sm file:font-semibold
               file:bg-purple-600 file:text-white
               hover:file:bg-purple-700"
                />
              </div>


              {viewMode === 'molecule' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Formule chimique</label>
                    <input
                      type="text"
                      value={formData.formule || ''}
                      onChange={(e) => setFormData({ ...formData, formule: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Niveau</label>
                    <input
                      type="text"
                      value={formData.niveau || ''}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Importance</label>
                    <textarea
                      value={formData.importance || ''}
                      onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {viewMode === 'equipment' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Usage</label>
                  <textarea
                    value={formData.usage || ''}
                    onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    rows={2}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md">
                  {formData.id ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded-md"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}  