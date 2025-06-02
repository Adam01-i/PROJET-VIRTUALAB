import { useState, useEffect, useRef } from 'react';
import {
  FlaskRound as Flask,
  PenTool as Tool,
  Trash2,
  Pencil,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'sonner';
import ProfGLBViewer from './ProfGLBViewer';
import ProfMaterielsDetails from './ProfMaterielsDetails';
import ProfMoleculeDetails from './ProfMoleculeDetails';
import type { lab_items } from '../../../../types/Viewer3D/lab_items';

type ViewMode = 'molecule' | 'equipment';
type LabItemWithClasse = lab_items & {
  code_classe?: string[];
  code_classe_affichage?: string;
  selectedClasseIds?: string[];
};

export default function Prof3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecule');
  const [selectedItem, setSelectedItem] = useState<LabItemWithClasse | null>(null);
  const [moleculeList, setMoleculeList] = useState<LabItemWithClasse[]>([]);
  const [equipmentList, setEquipmentList] = useState<LabItemWithClasse[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; code_classe: string }[]>([]);
  const [classeFilter, setClasseFilter] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const drawerRef = useRef(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<LabItemWithClasse>>({
    id: '',
    nom: '',
    description: '',
    structure: '',
    category: 'molecule',
    formule: '',
    importance: '',
    usage: '',
    precautions: '',
    selectedClasseIds: [],
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [viewMode, classeFilter]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('mes_classes')
      .select('id, code_classe');

    if (!error) setClassesList(data || []);
    else toast.error("Erreur de chargement des classes du professeur");
  };



  const fetchItems = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return toast.error("Utilisateur non connecté");

    let query = supabase
      .from('vue_lab_items_details')
      .select('*')
      .eq('category', viewMode)
      .eq('auteur_id', userId)
      .order('created_at', { ascending: false });

    if (classeFilter) query = query.contains('code_classe', [classeFilter]);

    const { data, error } = await query;
    if (error) return toast.error("Erreur de chargement des éléments.");

    if (viewMode === 'molecule') {
      setMoleculeList(data || []);
    } else {
      setEquipmentList(data || []);
    }
  };

  const logActivity = async (item: LabItemWithClasse) => {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;
    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      type: 'simulation',
      meta: { lab_item_id: item.id, nom: item.nom, category: item.category },
    });
  };

  const handleSubmit = async () => {
    const isEdit = !!formData.id;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return toast.error("Utilisateur non connecté");

    const itemData = {
      nom: formData.nom,
      description: formData.description,
      structure: formData.structure,
      category: viewMode,
      formule: formData.formule,
      importance: formData.importance,
      usage: formData.usage,
      precautions: formData.precautions,
      auteur_id: userId,
    };

    await toast.promise(async () => {
      let itemId = formData.id;

      if (isEdit) {
        const { error } = await supabase
          .from('lab_items')
          .update(itemData)
          .eq('id', itemId)
          .eq('auteur_id', userId);

        if (error) throw error;

        await supabase
          .from('classes_labitems')
          .delete()
          .eq('labitem_id', itemId);
      } else {
        const { data: inserted, error } = await supabase
          .from('lab_items')
          .insert([itemData])
          .select();

        if (error || !inserted?.[0]) throw error || new Error("Erreur ajout");
        itemId = inserted[0].id;
      }

      const associations = (formData.selectedClasseIds || []).map((classeId) => ({
        labitem_id: itemId,
        classe_id: classeId,
      }));

      const { error: relError } = await supabase
        .from('classes_labitems')
        .insert(associations);

      if (relError) throw relError;

      // ✅ Log activité
      await supabase.from('activity_logs').insert({
        user_id: userId,
        type: 'objet3d',
        duree: null,
        meta: {
          action: isEdit ? 'modification_labitem' : 'ajout_labitem',
          item_id: itemId,
          nom: itemData.nom,
          category: itemData.category,
        },
      });

      setIsEditing(false);
      setFormData({ id: '', structure: '', selectedClasseIds: [] });
      fetchItems();
    }, {
      loading: isEdit ? "Mise à jour..." : "Ajout...",
      success: "✅ Sauvegardé",
      error: "❌ Erreur enregistrement",
    });

  };

  const handleDelete = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return toast.error("Utilisateur non connecté");

    if (!confirm("Supprimer cet élément ?")) return;

    await toast.promise(async () => {
      const { error } = await supabase
        .from('lab_items')
        .delete()
        .eq('id', id)
        .eq('auteur_id', userId);
      if (error) throw error;

      fetchItems();
    }, {
      loading: "Suppression...",
      success: "✅ Supprimé",
      error: "❌ Échec de suppression",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folder = viewMode === 'molecule' ? 'molecules' : 'equipments';
    const filename = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('structures').upload(filename, file);

    if (error) return toast.error("❌ Échec de l'upload");

    const { data } = supabase.storage.from('structures').getPublicUrl(filename);
    if (data?.publicUrl) {
      setFormData((prev) => ({ ...prev, structure: data.publicUrl }));
      toast.success("✅ Fichier .glb uploadé !");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDrawerOpen &&
        drawerRef.current &&
        !(drawerRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setIsDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDrawerOpen]);


  return (
    <div className="p-6 text-base text-gray-800 pt-6 space-y-4">
      <h1 className="text-3xl font-bold text-indigo-800">Mes Objets 3D</h1>

      <div className="flex justify-between items-center mb-6">
        <button
          className="1g:hidden text-purple-600 flex items-center gap-2"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Menu size={20} />
          Filtres
        </button>

        <button
          onClick={() => {
            setIsEditing(true);
            setSelectedItem(null);
            setFormData({
              id: '',
              nom: '',
              description: '',
              structure: '',
              category: viewMode,
              formule: '',
              importance: '',
              usage: '',
              precautions: '',
              selectedClasseIds: [],
            });
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouveau {viewMode === 'molecule' ? 'Molécule' : 'Matériel'}
        </button>
      </div>

      {/* 🔍 Drawer mobile filtres */}
      <div
        ref={drawerRef}
        className={`1g:hidden fixed top-0 left-0 w-64 h-full bg-white z-50 shadow-lg p-4 transform transition-transform duration-300 ease-in-out
      ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-indigo-700">Filtres</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setViewMode('molecule');
              setIsDrawerOpen(false);
            }}
            className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === 'molecule'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
          >
            <Flask size={16} /> Molécules ({moleculeList.length})
          </button>

          <button
            onClick={() => {
              setViewMode('equipment');
              setIsDrawerOpen(false);
            }}
            className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === 'equipment'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
          >
            <Tool size={16} /> Matériel ({equipmentList.length})
          </button>

          <select
            className="border px-2 py-1 rounded text-sm bg-white text-indigo-600"
            value={classeFilter || ''}
            onChange={(e) => {
              setClasseFilter(e.target.value || null);
              setIsDrawerOpen(false);
            }}
          >
            <option value="">Toutes les classes</option>
            {classesList.map((cl) => (
              <option key={cl.id} value={cl.code_classe}>{cl.code_classe}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="hidden 1g+:flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('molecule')}
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === 'molecule'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
            }`}
        >
          <Flask size={16} /> Molécules
          <span className="ml-2 text-sm text-black font-normal">| {moleculeList.length}</span>
        </button>

        <button
          onClick={() => setViewMode('equipment')}
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === 'equipment'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
            }`}
        >
          <Tool size={16} /> Matériel
          <span className="ml-2 text-sm text-black font-normal">| {equipmentList.length}</span>
        </button>

        <select
          className="border px-2 py-1 rounded text-sm bg-white text-indigo-600"
          value={classeFilter || ''}
          onChange={(e) => setClasseFilter(e.target.value || null)}
        >
          <option value="">Toutes les classes</option>
          {classesList.map((cl) => (
            <option key={cl.id} value={cl.code_classe}>{cl.code_classe}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* === LISTE === */}
        <div className="md:w-[60%] space-y-3">
          {(viewMode === 'molecule' ? moleculeList : equipmentList).length === 0 ? (
            <p className="text-gray-500 italic">Aucun élément trouvé.</p>
          ) : (
            (viewMode === 'molecule' ? moleculeList : equipmentList).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setIsEditing(false);
                  logActivity(item);
                }}
                className={`cursor-pointer p-4 rounded-md border shadow-sm transition ${selectedItem?.id === item.id
                  ? 'bg-purple-100 border-purple-300'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{item.nom}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    <div className="text-sm text-gray-500 flex gap-3 mt-1">
                      {item.code_classe?.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-gray-100 rounded-full">{c}</span>
                      ))}
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
                          ...item,
                          selectedClasseIds: [], // sera rempli dynamiquement
                        });
                      }}
                    />
                    <Trash2
                      size={16}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* === PANNEAU DE DROITE === */}
        <div className="md:w-[40%] space-y-4 text-sm">
          {!isEditing && selectedItem && (
            <>
              <ProfGLBViewer glbUrl={selectedItem.structure} moleculeName={selectedItem.nom} />
              {viewMode === 'molecule' ? (
                <ProfMoleculeDetails molecule={selectedItem} />
              ) : (
                <ProfMaterielsDetails equipment={selectedItem} />
              )}
            </>
          )}

          {isEditing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4 bg-white p-5 rounded-md shadow border mt-4"
              style={{ maxHeight: '75vh', overflowY: 'auto' }}
            >
              <input
                required
                placeholder="Nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full p-2 border rounded"
              />

              <textarea
                required
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={3}
              />

              <input
                type="file"
                accept=".glb"
                onChange={handleFileUpload}
                className="w-full text-sm"
              />

              <div className="space-y-1">
                <p className="text-sm font-semibold">Classes assignées :</p>
                {classesList.map((cl) => (
                  <label key={cl.id} className="block text-sm">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.selectedClasseIds?.includes(cl.id) || false}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...(formData.selectedClasseIds || []), cl.id]
                          : (formData.selectedClasseIds || []).filter((id) => id !== cl.id);
                        setFormData({ ...formData, selectedClasseIds: updated });
                      }}
                    />
                    {cl.code_classe}
                  </label>
                ))}
              </div>

              {viewMode === 'molecule' && (
                <>
                  <input
                    placeholder="Formule chimique"
                    value={formData.formule || ''}
                    onChange={(e) => setFormData({ ...formData, formule: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <textarea
                    placeholder="Importance"
                    value={formData.importance || ''}
                    onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </>
              )}

              {viewMode === 'equipment' && (
                <textarea
                  placeholder="Usage"
                  value={formData.usage || ''}
                  onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                />
              )}

              <div className="flex justify-end gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                  {formData.id ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
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