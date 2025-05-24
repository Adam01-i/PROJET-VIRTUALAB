import { Brain, Clock, ArrowRight } from 'lucide-react';
import type { Quiz } from '../../../../types/Quiz/quiz';

type QuizCardProps = {
  quiz: Quiz;
  onStart: (quizId: string) => void;
  scoreInfo?: { score: number; total: number };
};

export default function QuizCard({ quiz, onStart, scoreInfo }: QuizCardProps) {
  const isCompleted = !!scoreInfo;

  const getPerformance = () => {
    if (!scoreInfo) return null;
    const ratio = scoreInfo.score / scoreInfo.total;
    if (ratio >= 0.8) return { label: 'Excellent', color: 'text-green-600' };
    if (ratio >= 0.5) return { label: 'Moyen', color: 'text-yellow-600' };
    return { label: 'Faible', color: 'text-red-600' };
  };

  const performance = getPerformance();

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition duration-300 group">
      {/* Image */}
      <div className="h-36 overflow-hidden relative">
        <img 
          src={quiz.image} 
          alt={quiz.titre} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <span className={`px-2.5 py-0.5 text-white text-xs rounded-full shadow-sm ${
            isCompleted ? 'bg-green-600' : 'bg-yellow-500'
          }`}>
            {isCompleted ? '✅ Terminé' : '⏳ À faire'}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-1">{quiz.titre}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{quiz.description}</p>

        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Brain size={14} />
            <span>{quiz.questions.length} questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{quiz.duree}</span>
          </div>
        </div>

        {scoreInfo && (
          <>
            <div className="text-xs text-indigo-600 mt-1">
              ✅ Score précédent : {scoreInfo.score} / {scoreInfo.total}
            </div>
          </>
        )}

        <button
          onClick={() => onStart(quiz.id)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 mt-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200"
        >
          <span>Commencer</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
