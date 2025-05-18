import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ProfQuizCard from "./ProfQuizCard";
import { supabase } from "../../../../lib/supabaseClient";
import type { Quiz, QuizQuestion } from "../../../../types/Quiz/quiz";
import {toast} from 'sonner'; // ✅ Toast import

export default function ProfQuizView() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState<Quiz>({
    id: '',
    titre: '',
    description: '',
    duree: '',
    niveau: 'Débutant',
    image: '',
    questions: [],
  });

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("❌ Erreur de chargement des quiz.");
      console.error("❌ Erreur fetch quizzes :", error);
    } else {
      setQuizList(data || []);
      setSelectedQuiz(data?.[0] || null);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsEditing(true);
    setFormData({ ...quiz });
  };

  const uploadQuizImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `quizzes/${fileName}`;

    const { error } = await supabase.storage
      .from('quiz-images')
      .upload(filePath, file);

    if (error) {
      toast.error("❌ Échec de l'upload de l'image");
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('quiz-images')
      .getPublicUrl(`quizzes/${fileName}`);

    return publicUrlData?.publicUrl ?? null;
  };

  const handleDelete = async (quizId: string) => {
    const confirmDelete = window.confirm("❗ Supprimer ce quiz ? Cette action est irréversible.");
    if (!confirmDelete) return;

    try {
      await toast.promise(
        Promise.all([
          supabase.from('questions').delete().eq('quiz_id', quizId),
          supabase.from('quizzes').delete().eq('id', quizId),
        ]),
        {
          loading: 'Suppression en cours...',
          success: '✅ Quiz supprimé avec succès.',
          error: '❌ Échec de la suppression.',
        }
      );

      await fetchQuizzes();
      setSelectedQuiz(null);
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploadingImage) {
      toast.error("⏳ Attendez que l'image soit entièrement uploadée.");
      return;
    }

    if (formData.questions.length === 0) {
      toast.error("Le quiz doit contenir au moins une question.");
      return;
    }

    try {
      await toast.promise((async () => {
        if (formData.id) {
          await supabase.from('quizzes').update({
            titre: formData.titre,
            description: formData.description,
            niveau: formData.niveau,
            duree: formData.duree,
            image: formData.image,
          }).eq('id', formData.id);

          const { data: existingQuestions } = await supabase
            .from('questions')
            .select('id')
            .eq('quiz_id', formData.id);

          const existingIds = (existingQuestions || []).map(q => q.id);
          const updatedIds = formData.questions
            .filter(q => q.id)
            .map(q => q.id);
          const idsToDelete = existingIds.filter(id => !updatedIds.includes(id));

          if (idsToDelete.length > 0) {
            await supabase.from('questions').delete().in('id', idsToDelete);
          }

          const upsertData = formData.questions.map(q => ({
            id: q.id ?? uuidv4(),
            quiz_id: formData.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          }));

          await supabase.from('questions').upsert(upsertData);
        } else {
          const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .insert([{
              titre: formData.titre,
              description: formData.description,
              niveau: formData.niveau,
              duree: formData.duree,
              image: formData.image,
            }])
            .select();

          const newQuizId = quizData?.[0]?.id;

          if (!newQuizId || quizError) {
            throw new Error("Erreur création du quiz.");
          }

          const insertQuestions = formData.questions.map(q => ({
            id: q.id ?? uuidv4(),
            quiz_id: newQuizId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          }));

          await supabase.from('questions').insert(insertQuestions);
        }
      })(), {
        loading: 'Sauvegarde en cours...',
        success: formData.id ? '✅ Quiz mis à jour !' : '✅ Nouveau quiz créé !',
        error: '❌ Erreur lors de la sauvegarde.',
      });

      setIsEditing(false);
      setFormData({
        id: '',
        titre: '',
        description: '',
        duree: '',
        niveau: 'Débutant',
        image: '',
        questions: [],
      });

      await fetchQuizzes();
    } catch (error) {
      console.error(error);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: string | number) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updated = [...formData.questions];
    updated.splice(index, 1);
    setFormData({ ...formData, questions: updated });
  };

  return (
    <div className="p-4 bg-gray-100 text-gray-800 min-h-screen max-w-[1280px] mx-auto text-base">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-purple-700">Gestion des quiz</h2>
        <button
          onClick={() => {
            setFormData({
              id: '',
              titre: '',
              description: '',
              duree: '',
              niveau: 'Débutant',
              image: '',
              questions: [],
            });
            setSelectedQuiz(null);
            setIsEditing(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouveau Quiz
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-[60%] space-y-4 max-h-[84vh] overflow-auto">
          {quizList.length === 0 ? (
            <p className="text-gray-500">Aucun quiz trouvé.</p>
          ) : (
            quizList.map((quiz) => (
              <div
                key={quiz.id}
                className={`cursor-pointer p-4 rounded-md shadow-sm border transition ${
                  selectedQuiz?.id === quiz.id
                    ? 'bg-purple-100 border-purple-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => {
                  setSelectedQuiz(quiz);
                  setIsEditing(false);
                }}
              >
                <h3 className="text-base font-semibold text-gray-800 mb-1">{quiz.titre}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{quiz.description}</p>
                <div className="text-sm text-gray-500 flex gap-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full">{quiz.niveau}</span>
                  <span>{quiz.questions?.length || 0} questions</span>
                  <span>{quiz.duree}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="md:w-[40%] space-y-6 max-h-[84vh] overflow-auto">
          {selectedQuiz && !isEditing && (
            <ProfQuizCard
              quiz={selectedQuiz}
              onStart={handleEdit}
              onDelete={() => handleDelete(selectedQuiz.id)}
            />
          )}

          {isEditing && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-md p-4 shadow-sm border space-y-5"
            >
              <div className="space-y-3 text-sm">
                <div>
                  <label className="font-medium">Titre</label>
                  <input
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setIsUploadingImage(true);
                      toast.loading("⏳ Upload image...");
                      const url = await uploadQuizImage(file);
                      toast.dismiss();
                      setIsUploadingImage(false);

                      if (url) {
                        setFormData((prev) => ({ ...prev, image: url }));
                        toast.success("✅ Image ajoutée !");
                      } else toast.error("❌ Échec upload");
                    }}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                  {formData.image && (
                    <img src={formData.image} alt="preview" className="mt-2 max-h-40 w-full object-contain border rounded-md" />
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label>Durée</label>
                    <select
                      value={formData.duree}
                      onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">-- Choisir --</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="1 h">1 h</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label>Niveau</label>
                    <select
                      value={formData.niveau}
                      onChange={(e) =>
                        setFormData({ ...formData, niveau: e.target.value as Quiz['niveau'] })
                      }
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-700">Questions</h4>
                {formData.questions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-50 p-3 rounded-md border space-y-3 text-sm">
                    <div className="font-medium text-purple-700">Question {idx + 1}</div>
                    <input
                      value={q.question}
                      onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Intitulé"
                    />
                    {q.options.map((opt, optIdx) => (
                      <input
                        key={optIdx}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                    ))}
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => handleQuestionChange(idx, 'correctAnswer', Number(e.target.value))}
                      className="w-full p-2 border rounded-md"
                    >
                      {q.options.map((_, i) => (
                        <option key={i} value={i}>Bonne réponse : Option {i + 1}</option>
                      ))}
                    </select>
                    <textarea
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Explication (facultatif)"
                      rows={2}
                    />
                    <div className="text-right">
                      <button
                        onClick={() => removeQuestion(idx)}
                        type="button"
                        className="text-red-600 text-sm hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-purple-700 text-sm font-medium hover:underline"
                >
                  ➕ Ajouter une question
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className={`px-4 py-2 text-white text-sm rounded-md ${
                    isUploadingImage
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isUploadingImage ? 'Image...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm rounded-md"
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