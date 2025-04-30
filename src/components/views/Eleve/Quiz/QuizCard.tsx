import { Brain, Clock, ArrowRight } from 'lucide-react';
import type { Quiz } from '../../../../types/Quiz/quiz';

type QuizCardProps = {
  quiz: Quiz;
  onStart: (quizId: string) => void;
};

export default function QuizCard({ quiz, onStart }: QuizCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-md overflow-hidden border border-white/10 hover:shadow-md transition duration-200 group">
      <div className="h-44 overflow-hidden relative">
        <img 
          src={quiz.image} 
          alt={quiz.titre} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="px-2.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
            {quiz.niveau}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-white mb-1">{quiz.titre}</h3>
        <p className="text-purple-200 text-sm mb-3 line-clamp-2">{quiz.description}</p>
        <div className="flex justify-between text-xs text-purple-300 mb-3">
          <div className="flex gap-1.5 items-center">
            <Brain size={14} />
            <span>{quiz.questions.length} questions</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <Clock size={14} />
            <span>{quiz.duree}</span>
          </div>
        </div>
        <button
          onClick={() => onStart(quiz.id)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
        >
          <span>Commencer</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
