'use client';

import { useState, useEffect } from 'react';
import {
  FlaskRound as Flask,
  PenTool as Tool,
  Trash2,
  Pencil,
  Box
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'sonner';
import Prof3DFormModal from './Prof3DFormModal';
import Prof3DPreviewModal from './Prof3DPreviewModal';
import type { lab_items } from '../../../../types/Viewer3D/lab_items';

type ViewMode = 'molecule' | 'equipment';

type LabItemWithClasse = lab_items & {
  code_classe?: string[];
  code_classe_affichage?: string;
  selectedClasseIds?: string[];
};

export default function Prof3DView() {
  const [viewMode, setViewMode] = useState<ViewMode>('molecule');
  const [moleculeList, setMoleculeList] = useState<LabItemWithClasse[]>([]);
  const [equipmentList, setEquipmentList] = useState<LabItemWithClasse[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; code_classe: string }[]>([]);
  const [classeFilter, setClasseFilter] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LabItemWithClasse> | null>(null);
  const [previewItem, setPreviewItem] = useState<LabItemWithClasse | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [viewMode, classeFilter]);

  const fetchClasses = async () => {
    const { data, error } = await supabase.from('mes_classes').select('id, code_classe');
    if (!error) setClassesList(data || []);
    else toast.error('Erreur de chargement des classes du professeur');
  };

  const fetchItems = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return toast.error('Utilisateur non connecté');

    let query = supabase
      .from('vue_lab_items_details')
      .select('*')
      .eq('category', viewMode)
      .eq('auteur_id', userId)
      .order('created_at', { ascending: false });

    if (classeFilter) query = query.contains('code_classe', [classeFilter]);

    const { data, error } = await query;
    if (error) return toast.error('Erreur de chargement des éléments.');

    if (viewMode === 'molecule') setMoleculeList(data || []);
    else setEquipmentList(data || []);
  };

  const handleSubmit = async () => {
    const isEdit = !!formData?.id;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return toast.error('Utilisateur non connecté');

    const itemData = {
      nom: formData?.nom,
      description: formData?.description,
      structure: formData?.structure,
      category: viewMode,
      formule: formData?.formule,
      importance: formData?.importance,
      usage: formData?.usage,
      precautions: formData?.precautions,
      auteur_id: userId,
    };

    await toast.promise(async () => {
      let itemId = formData?.id;

      if (isEdit) {
        const { error } = await supabase
          .from('lab_items')
          .update(itemData)
          .eq('id', itemId)
          .eq('auteur_id', userId);
        if (error) throw error;
        await supabase.from('classes_labitems').delete().eq('labitem_id', itemId);
      } else {
        const { data: inserted, error } = await supabase
          .from('lab_items')
          .insert([itemData])
          .select();
        if (error || !inserted?.[0]) throw error || new Error('Erreur ajout');
        itemId = inserted[0].id;
      }

      const associations = (formData?.selectedClasseIds || []).map((classeId) => ({
        labitem_id: itemId,
        classe_id: classeId,
      }));

      const { error: relError } = await supabase.from('classes_labitems').insert(associations);
      if (relError) throw relError;

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
      setFormData(null);
      fetchItems();
    }, {
      loading: isEdit ? 'Mise à jour...' : 'Ajout...',
      success: '✅ Sauvegardé',
      error: '❌ Erreur enregistrement',
    });
  };

  const handleDelete = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return toast.error('Utilisateur non connecté');

    if (!confirm('Supprimer cet élément ?')) return;

    await toast.promise(async () => {
      const { error } = await supabase.from('lab_items').delete().eq('id', id).eq('auteur_id', userId);
      if (error) throw error;
      fetchItems();
    }, {
      loading: 'Suppression...',
      success: '✅ Supprimé',
      error: '❌ Échec de suppression',
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
      toast.success('✅ Fichier .glb uploadé !');
    }
  };

  return (
    <div className="p-6 text-base text-gray-800 pt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-800">Mes Objets 3D</h1>
        <button
          onClick={() => {
            setIsEditing(true);
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

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setViewMode('molecule')}
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${viewMode === 'molecule'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
          }`}
        >
          <Flask size={16} /> Molécules ({moleculeList.length})
        </button>
        <button
          onClick={() => setViewMode('equipment')}
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
          onChange={(e) => setClasseFilter(e.target.value || null)}
        >
          <option value="">Toutes les classes</option>
          {classesList.map((cl) => (
            <option key={cl.id} value={cl.code_classe}>{cl.code_classe}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(viewMode === 'molecule' ? moleculeList : equipmentList).map((item) => (
          <div key={item.id} className="p-4 bg-white border rounded-md shadow hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold text-gray-800">{item.nom}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                <div className="text-xs text-gray-500 flex gap-2 mt-1 flex-wrap">
                  {item.code_classe?.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-gray-100 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Box
                  size={18}
                  className="text-indigo-500 cursor-pointer hover:scale-110 transition"
                  onClick={() => setPreviewItem(item)}
                />
                <Pencil
                  size={16}
                  className="text-blue-500 cursor-pointer"
                  onClick={() => {
                    setIsEditing(true);
                    setFormData({ ...item, selectedClasseIds: [] });
                  }}
                />
                <Trash2
                  size={16}
                  className="text-red-500 cursor-pointer"
                  onClick={() => handleDelete(item.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Prof3DFormModal
        open={isEditing}
        setOpen={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsEditing(false);
          setFormData(null);
        }}
        classes={classesList}
        viewMode={viewMode}
        handleFileUpload={handleFileUpload}
      />

      {previewItem && (
        <Prof3DPreviewModal
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
          glbUrl={previewItem.structure}
          nom={previewItem.nom}
        />
      )}
    </div>
  );
}
