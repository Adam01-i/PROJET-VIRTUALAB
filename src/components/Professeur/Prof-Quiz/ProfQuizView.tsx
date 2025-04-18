import { useState } from "react";
import ProfQuizCard from "./ProfQuizCard";
import { quizData } from "../../../data/Quiz/quizData";
import type { Quiz, QuizQuestion  } from "../../../types/Quiz/quiz";

export default function ProfQuizView() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>(quizData[0]);
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

  const handleEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsEditing(true);
    setFormData({ ...quiz });
  };

  const handleQuestionChange = (
    index: number,
    field: keyof QuizQuestion,
    value: string | number
  ) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion  = {
      id: (formData.questions.length + 1).toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
  };

  const removeQuestion = (index: number) => {
    const updated = [...formData.questions];
    updated.splice(index, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("✅ Données mises à jour :", formData);
    setIsEditing(false);
  };

  return (
    <div className="p-6 md:p-8 bg-gray-100 text-gray-800 min-h-screen">
      <h2 className="text-3xl font-bold text-purple-700 mb-6">Gestion des quiz</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Liste des quiz */}
        <div className="md:w-[62%] space-y-4">
          {quizData.map((quiz) => (
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
                <span>{quiz.questions.length} questions</span>
                <span>{quiz.duree}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Détails + édition */}
        <div className="md:w-[38%] space-y-6">
          <ProfQuizCard quiz={selectedQuiz} onStart={handleEdit} />

          {isEditing && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 space-y-6 overflow-auto">
              {/* Info quiz */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titre</label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700">Durée</label>
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
                    <label className="block text-sm font-medium text-gray-700">Niveau</label>
                    <select
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value as Quiz['niveau'] })}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Choisir un niveau --</option>
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

                    <div className="bg-purple-50 p-3 rounded-md">
                      <label className="block text-sm font-medium mb-1">Intitulé</label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <label className="block text-sm font-medium mb-1">Options</label>
                      {q.options.map((option, oIndex) => (
                        <input
                          key={oIndex}
                          type="text"
                          value={option}
                          placeholder={`Option ${oIndex + 1}`}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Bonne réponse</label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, 'correctAnswer', Number(e.target.value))
                        }
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
                        rows={2}
                        value={q.explanation}
                        onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
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
