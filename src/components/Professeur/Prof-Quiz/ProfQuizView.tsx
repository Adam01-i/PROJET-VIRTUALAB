import { useEffect, useState } from "react";
import ProfQuizCard from "./ProfQuizCard";
import { supabase } from "../../../lib/supabaseClient";
import type { Quiz, QuizQuestion } from "../../../types/Quiz/quiz";

export default function ProfQuizView() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleDelete = async (quizId: string) => {
    const confirm = window.confirm("❗ Supprimer ce quiz ? Cette action est irréversible.");
    if (!confirm) return;

    await supabase.from('questions').delete().eq('quiz_id', quizId);
    await supabase.from('quizzes').delete().eq('id', quizId);

    await fetchQuizzes();
    setSelectedQuiz(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Vérifier si des questions sont présentes
    if (formData.questions.length === 0) {
      // Ajouter une question vide par défaut si aucune question n'est présente
      const defaultQuestion = {
        quiz_id: formData.id || '',  // ID vide si c'est un nouveau quiz
        question: 'Question vide',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      };
      setFormData({ ...formData, questions: [defaultQuestion] });
    }
  
    // Si le quiz existe (édition)
    if (formData.id) {
      // Mise à jour du quiz
      await supabase.from('quizzes').update({
        titre: formData.titre,
        description: formData.description,
        niveau: formData.niveau,
        duree: formData.duree,
        image: formData.image,
      }).eq('id', formData.id);
  
      // Mise à jour des questions (sans l'ID car Supabase gère l'ID)
      const currentQuestions = formData.questions.map((q) => ({
        quiz_id: formData.id,  // Associe chaque question à son quiz
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        // Pas d'ID fourni, Supabase va générer l'ID automatiquement
      }));
  
      // Utilisation de upsert pour insérer ou mettre à jour les questions
      for (const newQuestion of currentQuestions) {
        await supabase.from('questions').upsert(newQuestion);
      }
    } else {
      // Création d'un nouveau quiz
      const { data } = await supabase
        .from('quizzes')
        .insert([{
          titre: formData.titre,
          description: formData.description,
          niveau: formData.niveau,
          duree: formData.duree,
          image: formData.image,
        }])
        .select();
  
      const quizId = data?.[0]?.id;
  
      if (quizId) {
        const questionsToInsert = formData.questions.map((q) => ({
          quiz_id: quizId,  // Associe chaque question au quiz créé
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          // Pas d'ID car Supabase gère l'ID automatiquement
        }));
  
        await supabase.from('questions').insert(questionsToInsert);
      }
    }
  
    // Réinitialisation après la soumission
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
  };
  
  
  

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: (formData.questions.length + 1).toString(),
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
                className={`cursor-pointer p-5 rounded-xl shadow-md border transition-all duration-200 ${
                  selectedQuiz?.id === quiz.id
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
                  <label className="block text-sm font-medium text-gray-700">Image (URL)</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
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
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                >
                  Enregistrer
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
