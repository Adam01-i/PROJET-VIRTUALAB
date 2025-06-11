'use client';

import { Brain } from 'lucide-react';
import type { QuizWithClasse } from '../../../../types/Quiz/quiz';

type ProfQuizCardProps = {
  quiz: QuizWithClasse;
  classeNoms?: string[];
  classeAffichage?: string;
  onEdit: (quiz: QuizWithClasse) => void;
  onDelete: (id: string) => void;
};

export default function ProfQuizCard({
  quiz,
  classeNoms = [],
  onEdit,
  onDelete,
}: ProfQuizCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition">
      <div className="h-40 relative overflow-hidden">
        <img
          src={quiz.image || '/placeholder.jpg'}
          alt={quiz.titre}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {classeNoms.map((nom, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded shadow-sm"
            >
              📘 {nom}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-800 flex items-center gap-1">
          <Brain size={14} /> {quiz.titre}
        </h3>
        <p className="text-gray-600">{quiz.description}</p>

        <div className="flex justify-between text-xs text-gray-500">
          <span>🧠 {quiz.questions?.length || 0} questions</span>
          <span>⏱ {quiz.duree}</span>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEdit(quiz)}
            className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-800 transition"
          >
            ✏️ Modifier
          </button>
          <button
            onClick={() => onDelete(quiz.id)}
            className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded hover:bg-red-700 transition"
          >
            🗑 Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
