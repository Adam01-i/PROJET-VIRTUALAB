import { Brain, Clock, Pencil, Trash2 } from 'lucide-react';
import type { Quiz } from '../../../../types/Quiz/quiz';

type ProfQuizCardProps = {
  quiz: Quiz;
  onStart: (quiz: Quiz) => void;
  onDelete?: () => void;
};

export default function ProfQuizCard({ quiz, onStart, onDelete }: ProfQuizCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md transition-all duration-200 border border-gray-200">
      <div className="h-40 overflow-hidden relative">
        <img
          src={quiz.image}
          alt={quiz.titre}
          className="w-full h-full object-cover transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs rounded-full shadow">
            {quiz.niveau}
          </span>
        </div>
      </div>

      <div className="p-4 text-gray-800 text-sm">
        <h3 className="text-base font-semibold mb-1">{quiz.titre}</h3>
        <p className="text-gray-600 mb-3">{quiz.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Brain size={14} />
            <span>{quiz.questions?.length || 0} questions</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} />
            <span>{quiz.duree}</span>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button
            onClick={() => onStart(quiz)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md w-full text-sm"
          >
            <Pencil size={14} />
            Modifier
          </button>
          <button
            onClick={() => onDelete?.()}
            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md w-full text-sm"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
