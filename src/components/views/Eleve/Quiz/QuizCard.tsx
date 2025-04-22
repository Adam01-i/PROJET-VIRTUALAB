import { Brain, Clock, ArrowRight } from 'lucide-react';
import type { Quiz } from '../../../../types/Quiz/quiz';

type QuizCardProps = {
  quiz: Quiz;
  onStart: (quizId: string) => void;
};

export default function QuizCard({ quiz, onStart }: QuizCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 border border-white/10 group">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={quiz.image} 
          alt={quiz.titre} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full">
            {quiz.niveau}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-white">{quiz.titre}</h3>
        <p className="text-purple-200 mb-4 line-clamp-2">{quiz.description}</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-purple-300">
            <Brain size={16} />
            <span>{quiz.questions.length} questions</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-300">
            <Clock size={16} />
            <span>{quiz.duree}</span>
          </div>
        </div>
        <button 
          onClick={() => onStart(quiz.id)}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Commencer le quiz</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}