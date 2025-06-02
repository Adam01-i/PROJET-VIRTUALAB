'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import ProfQuizCard from './ProfQuizCard';
import type { QuizQuestion, QuizWithClasse } from '../../../../types/Quiz/quiz';

const DUREE_OPTIONS = ["10 min", "20 min", "30 min", "45 min"];

export default function ProfQuizView() {
  const [quizzes, setQuizzes] = useState<QuizWithClasse[]>([]);
  const [formData, setFormData] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [classes, setClasses] = useState<{ id: string; code_classe: string }[]>([]);
  const [classeFilter, setClasseFilter] = useState<string>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [, setUploading] = useState(false);

  useEffect(() => {
    const fetchInit = async () => {
      const { data: session } = await supabase.auth.getSession();
      setUserId(session?.session?.user?.id ?? null);

      const { data: classesData } = await supabase.from('mes_classes').select('id, code_classe');
      if (classesData) setClasses(classesData);
    };
    fetchInit();
  }, []);

  useEffect(() => {
    if (userId) fetchQuizzes();
  }, [classeFilter, userId]);

  const fetchQuizzes = async () => {
    if (!userId) return;

    let query = supabase
      .from('vue_quiz_details')
      .select('*')
      .eq('auteur_id', userId)
      .order('created_at', { ascending: false });

    if (classeFilter !== 'all') {
      query = query.contains('code_classe', [classeFilter]);
    }

    const { data, error } = await query;
    if (error || !data) {
      toast.error('Erreur chargement quiz');
      return;
    }

    const quizIds = data.map((q) => q.quiz_id);

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .in('quiz_id', quizIds);

    const groupedQuestions = questionsData?.reduce((acc, q) => {
      if (!acc[q.quiz_id]) acc[q.quiz_id] = [];
      acc[q.quiz_id].push(q);
      return acc;
    }, {} as Record<string, QuizQuestion[]>) || {};

    const normalized = data.map((q) => ({
      ...q,
      id: q.quiz_id,
      questions: groupedQuestions[q.quiz_id] ?? [],
    }));

    setQuizzes(normalized);
  };

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.selectedClasseIds?.length) {
      toast.error('Titre, description et au moins une classe sont requis.');
      return;
    }

    if (!userId) {
      toast.error("Utilisateur non authentifié.");
      return;
    }

    const isNew = !formData.id;

    await toast.promise(
      (async () => {
        let quizId = formData.id;

        const quizPayload = {
          titre: formData.titre,
          description: formData.description,
          duree: formData.duree,
          image: formData.image,
          auteur_id: userId,
        };

        if (isNew) {
          const { data: inserted, error } = await supabase
            .from('quizzes')
            .insert([{ id: uuidv4(), ...quizPayload }])
            .select();

          if (error || !inserted?.[0]) throw new Error("Erreur création quiz");
          quizId = inserted[0].id;
        } else {
          const { error } = await supabase
            .from('quizzes')
            .update(quizPayload)
            .eq('id', quizId);
          if (error) throw new Error("Erreur mise à jour quiz");

          await supabase.from('questions').delete().eq('quiz_id', quizId);
        }

        // ⛓️ Mise à jour des classes liées
        await supabase.from('classes_quizzes').delete().eq('quiz_id', quizId);
        const associations = formData.selectedClasseIds.map((classeId: string) => ({
          quiz_id: quizId,
          classe_id: classeId,
        }));
        const { error: relError } = await supabase.from('classes_quizzes').insert(associations);
        if (relError) throw new Error("Erreur association classes");

        for (const question of formData.questions || []) {
          if (
            !question.question.trim() ||
            !Array.isArray(question.options) ||
            question.options.length < 2 ||
            question.options.some((opt: string) => !opt.trim())
          ) continue;

          await supabase.from('questions').insert({
            ...question,
            id: question.id || uuidv4(),
            quiz_id: quizId,
          });
        }
      })(),
      {
        loading: "Enregistrement...",
        success: isNew ? "Quiz ajouté !" : "Quiz mis à jour !",
        error: "Erreur lors de la sauvegarde",
      }
    );

    fetchQuizzes();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce quiz ?")) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (!error) {
      toast.success("Quiz supprimé");
      fetchQuizzes();
    } else {
      toast.error("Erreur suppression");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `quiz-images/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('images-sim').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images-sim').getPublicUrl(path);
      if (formData) setFormData({ ...formData, image: data.publicUrl });
    } else {
      toast.error("Erreur upload image");
    }
    setUploading(false);
  };

  const resetForm = () => {
    setFormData(null);
    setIsEditing(false);
  };

  const createEmptyQuestion = (): QuizQuestion => ({
    id: uuidv4(),
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    image: '',
  });

  const addQuestion = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      questions: [...(formData.questions || []), createEmptyQuestion()],
    });
  };

  const removeQuestion = (idx: number) => {
    if (!formData) return;
    const updated = [...(formData.questions || [])];
    updated.splice(idx, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleQuestionChange = (idx: number, field: keyof QuizQuestion, value: any) => {
    if (!formData) return;
    const updated = [...(formData.questions || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    if (!formData) return;
    const updated = [...(formData.questions || [])];
    updated[qIdx].options[optIdx] = value;
    setFormData({ ...formData, questions: updated });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-800">Mes Quiz</h1>
        <button
          onClick={() => {
            setFormData({
              id: '',
              titre: '',
              description: '',
              duree: DUREE_OPTIONS[0],
              image: '',
              questions: [],
              selectedClasseIds: [],
            });
            setIsEditing(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow text-sm"
        >
          ➕ Nouveau Quiz
        </button>
      </div>

      <div>
        <label className="font-semibold text-gray-600 mr-2">Classe :</label>
        <select
          className="border px-3 py-1 rounded text-sm bg-white text-indigo-600"
          onChange={(e) => setClasseFilter(e.target.value)}
          value={classeFilter}
        >
          <option value="all">Toutes</option>
          {classes.map((c) => (
            <option key={c.code_classe} value={c.code_classe}>{c.code_classe}</option>
          ))}
        </select>
        <span className="ml-3 text-sm text-gray-500 font-normal">
          | Total : {quizzes.length} quiz | {quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0)} questions
        </span>
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
                classeNoms={quiz.code_classe || []}
                classeAffichage={quiz.code_classe_affichage}
                onEdit={async (quiz) => {
                  const { data: classeLinks } = await supabase
                    .from("classes_quizzes")
                    .select("classe_id")
                    .eq("quiz_id", quiz.id);

                  setFormData({
                    ...quiz,
                    selectedClasseIds: classeLinks?.map((l) => l.classe_id) || [],
                  });
                  setIsEditing(true);
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {isEditing && formData && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="bg-white border p-4 rounded shadow space-y-4 overflow-hidden"
            style={{ maxHeight: "75vh", overflowY: "auto" }}
          >
            <h3 className="text-lg font-semibold text-indigo-700">
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
              rows={3}
              required
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <select
              value={formData.duree}
              onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
              className="w-full border p-2 rounded"
            >
              {DUREE_OPTIONS.map((d) => <option key={d}>{d}</option>)}
            </select>

            <div className="space-y-1">
              <p className="text-sm font-semibold">Classes assignées :</p>
              {classes.map((cl) => (
                <label key={cl.id} className="block text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.selectedClasseIds?.includes(cl.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.selectedClasseIds, cl.id]
                        : formData.selectedClasseIds.filter((id: string) => id !== cl.id);
                      setFormData({ ...formData, selectedClasseIds: updated });
                    }}
                  />
                  {cl.code_classe}
                </label>
              ))}
            </div>

            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            {formData.image && <img src={formData.image} className="rounded border w-full mt-2" alt="quiz cover" />}

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Questions</h4>
              {(formData.questions || []).map((q: QuizQuestion, idx: number) => (
                <div key={q.id || idx} className="bg-gray-50 p-3 rounded-md border space-y-2 text-sm">
                  <p className="font-medium text-gray-600">Question {idx + 1}</p>
                  <input
                    value={q.question}
                    onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Intitulé de la question"
                  />
                  {q.options.map((opt, optIdx) => (
                    <input
                      key={optIdx}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder={`Option ${optIdx + 1}`}
                    />
                  ))}
                  <select
                    value={String(q.correctAnswer)}
                    onChange={(e) => handleQuestionChange(idx, 'correctAnswer', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  >
                    {q.options.map((_, i) => (
                      <option key={i} value={i}>Bonne réponse : Option {i + 1}</option>
                    ))}
                  </select>
                  <textarea
                    value={q.explanation}
                    onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Explication (facultatif)"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="text-indigo-700 text-sm hover:underline"
              >
                ➕ Ajouter une question
              </button>
            </div>

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
