import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ProfQuizCard from "./ProfQuizCard";
import { supabase } from "../../../lib/supabaseClient";
import type { Quiz, QuizQuestion } from "../../../types/Quiz/quiz";
import { toast } from "sonner";

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
    <div className="p-6 md:p-2 bg-gray-100 text-gray-800 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-purple-700">Gestion des quiz</h2>
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
        <div className="md:w-[60%] space-y-4 scroll-y max-h-[84vh] overflow-auto">
          {quizList.length === 0 ? (
            <div className="text-gray-500">Aucun quiz trouvé.</div>
          ) : (
            quizList.map((quiz) => (
              <div
                key={quiz.id}
                className={`cursor-pointer p-5 rounded-xl shadow-md border transition-all duration-200 ${selectedQuiz?.id === quiz.id
                  ? "bg-purple-100 border-purple-300"
                  : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                onClick={() => {
                  setSelectedQuiz(quiz);
                  setIsEditing(false);
                }}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{quiz.titre}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{quiz.description}</p>
                <div className="text-sm text-gray-500 flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full">{quiz.niveau}</span>
                  <span>{quiz.questions?.length || 0} questions</span>
                  <span>{quiz.duree}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="md:w-[40%] space-y-6 scroll-y max-h-[84vh] overflow-auto">
          {selectedQuiz && !isEditing && (
            <ProfQuizCard
              quiz={selectedQuiz}
              onStart={handleEdit}
              onDelete={() => handleDelete(selectedQuiz.id)}
            />
          )}

          {isEditing && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 space-y-6">
              {/* Champs du formulaire */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titre</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Image du quiz</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setIsUploadingImage(true);
                      toast.loading("⏳ Upload de l'image en cours...");

                      const imageUrl = await uploadQuizImage(file);

                      toast.dismiss();
                      setIsUploadingImage(false);

                      if (imageUrl) {
                        toast.success("✅ Image uploadée avec succès");
                        setFormData((prev) => ({ ...prev, image: imageUrl }));
                      } else {
                        toast.error("❌ Échec de l'upload");
                      }
                    }}

                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />

                  {formData.image && (
                    <div className="mt-2">
                      <img
                        src={formData.image}
                        alt="Aperçu du quiz"
                        className="w-full h-auto max-h-48 object-contain border rounded-md"
                      />
                    </div>
                  )}
                </div>


                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium">Durée</label>
                    <select
                      value={formData.duree}
                      onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Choisir une durée --</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="1 h">1 h</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm font-medium">Niveau</label>
                    <select
                      value={formData.niveau}
                      onChange={(e) =>
                        setFormData({ ...formData, niveau: e.target.value as Quiz['niveau'] })
                      }
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-800">Questions</h4>
                {formData.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 bg-white border rounded-md space-y-4 shadow-sm">
                    <div className="text-sm font-semibold text-purple-700">
                      Question {qIndex + 1}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Intitulé</label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Options</label>
                      {q.options.map((opt, oIndex) => (
                        <input
                          key={oIndex}
                          type="text"
                          value={opt}
                          placeholder={`Option ${oIndex + 1}`}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="w-full p-2 mb-2 border border-gray-300 rounded-md"
                        />
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Bonne réponse</label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', Number(e.target.value))}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      >
                        {q.options.map((_, idx) => (
                          <option key={idx} value={idx}>
                            Option {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Explication</label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Supprimer cette question
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-sm font-medium text-purple-700 hover:underline"
                >
                  ➕ Ajouter une question
                </button>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className={`px-4 py-2 ${isUploadingImage ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white rounded-md text-sm font-medium`}
                >
                  {isUploadingImage ? "Upload image..." : "Enregistrer"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md text-sm font-medium"
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
