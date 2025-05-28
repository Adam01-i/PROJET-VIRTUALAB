import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import ProfQuizCard from './ProfQuizCard';
import type { Quiz, QuizQuestion } from '../../../../types/Quiz/quiz';

const DUREE_OPTIONS = ["10 min", "20 min", "30 min", "45 min"];

type QuizWithClasse = Quiz & { code_classe?: string };

export default function ProfQuizView() {
  const [quizzes, setQuizzes] = useState<QuizWithClasse[]>([]);
  const [formData, setFormData] = useState<Quiz | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [classes, setClasses] = useState<{ id: string; code_classe: string }[]>([]);
  const [classeFilter, setClasseFilter] = useState<string>('all');
  const [, setUploading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [classeFilter]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('mes_classes').select('id, code_classe');
    if (data) setClasses(data);
  };

  const fetchQuizzes = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    let query = supabase
      .from('vue_quiz_details')
      .select('*, questions(*)')
      .eq('auteur_id', userId)
      .order('created_at', { ascending: false });

    if (classeFilter !== 'all') {
      query = query.eq('code_classe', classeFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      const normalized = data.map((q) => ({
        ...q,
        id: q.quiz_id || q.id,
        questions: q.questions ?? [],
      }));
      setQuizzes(normalized);
    } else {
      toast.error("Erreur chargement des quiz");
    }
  };

  const resetForm = () => {
    setFormData(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.classe_id) {
      toast.error('Titre, description et classe requis.');
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const isNew = !formData?.id || formData.id.trim() === '';

    if (!isNew && formData.auteur_id !== userId) {
      toast.error("Vous ne pouvez modifier que vos propres quiz.");
      return;
    }

    await toast.promise(
      (async () => {
        let quizId = formData.id;

        if (isNew) {
          const { data: inserted, error } = await supabase
            .from('quizzes')
            .insert([{
              id: uuidv4(),
              titre: formData.titre,
              description: formData.description,
              duree: formData.duree,
              image: formData.image,
              classe_id: formData.classe_id,
              auteur_id: userId,
            }])
            .select();

          if (error || !inserted || !inserted[0]) throw new Error("Erreur ajout quiz");
          quizId = inserted[0].id;
        }
        else {
          const { error } = await supabase
            .from('quizzes')
            .update({
              titre: formData.titre,
              description: formData.description,
              duree: formData.duree,
              image: formData.image,
              classe_id: formData.classe_id,
            })
            .eq('id', formData.id);
          if (error) throw new Error("Erreur update quiz");
          await supabase.from('questions').delete().eq('quiz_id', formData.id);
        }

        for (const question of formData.questions || []) {
          // Vérification minimale
          if (
            !question.question.trim() ||
            !Array.isArray(question.options) ||
            question.options.length < 2 ||
            question.options.some(opt => !opt.trim()) ||
            typeof question.correctAnswer !== 'number'
          ) {
            console.warn("Question ignorée : mal formée", question);
            continue;
          }

          await supabase.from('questions').insert({
            ...question,
            id: question.id || uuidv4(),
            quiz_id: quizId,
          });
        }


        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'quiz',
          meta: {
            quizId,
            titre: formData.titre,
            action: isNew ? 'ajout' : 'modification',
          },
        });
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

  const toFormData = (quiz: QuizWithClasse): Quiz => ({
    id: quiz.id,
    titre: quiz.titre,
    description: quiz.description,
    duree: quiz.duree,
    image: quiz.image,
    questions: quiz.questions ?? [],
    classe_id: quiz.classe_id,
    auteur_id: quiz.auteur_id,
  });

  const totalQuestions = quizzes.reduce((acc, quiz) => acc + (quiz.questions?.length || 0), 0);
  const totalQuizzes = quizzes.length;

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
          | Total : {totalQuizzes} quiz | {totalQuestions} questions
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
                classeNom={quiz.code_classe || '—'}
                onEdit={(quiz) => {
                  setFormData(toFormData(quiz));
                  setIsEditing(true);
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
        {/* Formulaire d'édition affiché à droite */}
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

            <select
              value={formData.classe_id}
              onChange={(e) => setFormData({ ...formData, classe_id: e.target.value })}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((cl) => (
                <option key={cl.id} value={cl.id}>{cl.code_classe}</option>
              ))}
            </select>

            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            {formData.image && <img src={formData.image} className="rounded border w-full mt-2" alt="quiz cover" />}

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Questions</h4>
              {(formData.questions || []).map((q, idx) => (
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