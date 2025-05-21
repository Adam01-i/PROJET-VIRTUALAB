'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import ProfQuizCard from './ProfQuizCard';
import type { Quiz } from '../../../../types/Quiz/quiz';

const DUREE_OPTIONS = ["10 min", "20 min", "30 min", "45 min"];
const NIVEAU_OPTIONS = ["Débutant", "Intermédiaire", "Avancé"];

export default function ProfQuizView() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [formData, setFormData] = useState<Quiz | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [, setUploading] = useState(false);
  const [classes, setClasses] = useState<{ id: string, code_classe: string }[]>([]);
  const [classeFilter, setClasseFilter] = useState<string>('all');

  const getClasseNom = (id: string | null | undefined) => {
    if (!id) return '—';
    const classe = classes.find((c) => c.id === id);
    return classe?.code_classe || '—';
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [classeFilter]);

  const fetchClasses = async () => {
    const { data, error } = await supabase.from('mes_classes').select('id, code_classe');
    if (!error && data) setClasses(data);
  };

  const fetchQuizzes = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    let query = supabase
      .from('quizzes')
      .select('*')
      .eq('auteur_id', userId)
      .order('created_at', { ascending: false });

    if (classeFilter !== 'all') query = query.eq('classe_id', classeFilter);

    const { data, error } = await query;

    if (error) toast.error('Erreur chargement des quiz');
    else setQuizzes(data || []);
  };

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.classe_id) {
      toast.error('Titre, description et classe requis.');
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const isNew = !formData.id;

    await toast.promise(
      (async () => {
        if (isNew) {
          const { data: inserted, error } = await supabase
            .from('quizzes')
            .insert([{
              ...formData,
              id: uuidv4(),
              auteur_id: userId,
              questions: []
            }])
            .select();
          if (error || !inserted || !inserted[0]) throw new Error("Erreur lors de l'ajout.");
        } else {
          await supabase.from('quizzes').update(formData).eq('id', formData.id);
        }
      })(),
      {
        loading: "⏳ Enregistrement...",
        success: isNew ? "✅ Quiz ajouté !" : "✅ Modifié !",
        error: "❌ Échec de l'enregistrement.",
      }
    );

    fetchQuizzes();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce quiz ?")) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) toast.error("Erreur suppression");
    else {
      toast.success("Quiz supprimé");
      fetchQuizzes();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData(null);
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `quiz-images/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("images-sim").upload(filePath, file);
    if (!error) {
      const { data } = supabase.storage.from("images-sim").getPublicUrl(filePath);
      if (formData) setFormData({ ...formData, image: data.publicUrl });
    } else toast.error("Erreur d'upload image");
    setUploading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-indigo-700">🧠 Mes Quiz</h2>
        <button
          onClick={() => {
            setFormData({
              id: '',
              titre: '',
              description: '',
              duree: DUREE_OPTIONS[0],
              niveau: NIVEAU_OPTIONS[0],
              image: '',
              questions: [],
              classe_id: '',
              auteur_id: '',
            });
            setIsEditing(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow text-sm"
        >
          ➕ Nouveau Quiz
        </button>
      </div>

      {/* 🔍 Filtre par classe */}
      <div>
        <label className="text-sm font-medium text-gray-600 mr-2">Classe :</label>
        <select
          className="border px-3 py-1 rounded text-sm"
          onChange={(e) => setClasseFilter(e.target.value)}
          value={classeFilter}
        >
          <option value="all">Toutes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.code_classe}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <p className="text-gray-500 italic">Aucun quiz trouvé.</p>
          ) : (
            quizzes.map((quiz) => (
              <ProfQuizCard
                key={quiz.id}
                quiz={quiz}
                classeNom={getClasseNom(quiz.classe_id)}
                onEdit={(quiz) => {
                  setFormData(quiz);
                  setIsEditing(true);
                }}
                onDelete={handleDelete}
              />
            ))

          )}
        </div>

        {/* 🧾 Formulaire */}
        {isEditing && formData && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="bg-white border p-4 rounded shadow space-y-4"
          >
            <h3 className="text-lg font-semibold text-indigo-600">
              {formData.id ? "Modifier" : "Nouveau"} Quiz
            </h3>

            <input
              required
              placeholder="Titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <textarea
              required
              placeholder="Description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border p-2 rounded text-sm"
            />

            <div className="flex gap-3">
              <select
                value={formData.duree}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                className="flex-1 border p-2 rounded"
              >
                {DUREE_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select
                value={formData.niveau}
                onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                className="flex-1 border p-2 rounded"
              >
                {NIVEAU_OPTIONS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>

            <select
              required
              value={formData.classe_id}
              onChange={(e) => setFormData({ ...formData, classe_id: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.code_classe}</option>
              ))}
            </select>

            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            {formData.image && <img src={formData.image} className="rounded border w-full mt-2" alt="preview" />}

            <div className="flex justify-end gap-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">💾 Enregistrer</button>
              <button type="button" onClick={resetForm} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
