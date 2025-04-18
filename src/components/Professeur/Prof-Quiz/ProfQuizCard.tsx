import { Brain, Clock, Pencil, Trash2 } from 'lucide-react';
import type { Quiz } from '../../../types/Quiz/quiz';

type ProfQuizCardProps = {
  quiz: Quiz;
  onStart: (quiz: Quiz) => void;
};

export default function ProfQuizCard({ quiz, onStart }: ProfQuizCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-200 border border-gray-200">
      <div className="h-48 overflow-hidden relative">
        <img
          src={quiz.image}
          alt={quiz.titre}
          className="w-full h-full object-cover transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full shadow">
            {quiz.niveau}
          </span>
        </div>
      </div>

      <div className="p-6 text-gray-800">
        <h3 className="text-2xl font-semibold mb-2">{quiz.titre}</h3>
        <p className="text-gray-600 mb-4">{quiz.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2">
            <Brain size={16} />
            <span>{quiz.questions.length} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{quiz.duree}</span>
          </div>
        </div>

        <div className="flex justify-between gap-4 mb-2">
          <button
            onClick={() => onStart(quiz)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 w-full"
          >
            <Pencil size={18} />
            Modifier
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 w-full"
          >
            <Trash2 size={18} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
