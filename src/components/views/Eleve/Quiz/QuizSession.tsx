import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, X, HelpCircle, RefreshCw, Award } from 'lucide-react';
import type { Quiz, QuizProgress } from '../../../../types/Quiz/quiz';

type QuizSessionProps = {
  quiz: Quiz;
  onComplete: (score: number) => void;
  onExit: () => void;
};

export default function QuizSession({ quiz, onComplete, onExit }: QuizSessionProps) {
  const [progress, setProgress] = useState<QuizProgress>({
    currentQuestion: 0,
    answers: [],
    score: 0,
    completed: false,
    showExplanation: false,
  });

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0 || progress.completed) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [progress.completed]);

  const currentQuestion = quiz.questions[progress.currentQuestion];
  const hasAnswered = progress.answers[progress.currentQuestion] !== undefined;

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered) return;

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const newAnswers = [...progress.answers];
    newAnswers[progress.currentQuestion] = answerIndex;

    setProgress(prev => ({
      ...prev,
      answers: newAnswers,
      score: isCorrect ? prev.score + 1 : prev.score,
      showExplanation: true,
    }));
  };

  const handleNext = () => {
    if (progress.currentQuestion === quiz.questions.length - 1) {
      setProgress(prev => ({ ...prev, completed: true }));
      onComplete(progress.score);
    } else {
      setProgress(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        showExplanation: false,
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center space-x-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Quitter le quiz</span>
          </button>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-purple-300">
              <Check size={20} className="text-green-500" />
              <span>{progress.score} / {progress.answers.length}</span>
            </div>
            <div className="px-4 py-2 bg-purple-500/20 rounded-lg text-purple-300">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((progress.currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            Question {progress.currentQuestion + 1} sur {quiz.questions.length}
          </h3>
          <p className="text-xl text-purple-200">{currentQuestion.question}</p>
        </div>

        {currentQuestion.image && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img 
              src={currentQuestion.image} 
              alt="Question illustration" 
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                hasAnswered
                  ? index === currentQuestion.correctAnswer
                    ? 'bg-green-500/20 border-green-500 text-white'
                    : index === progress.answers[progress.currentQuestion]
                    ? 'bg-red-500/20 border-red-500 text-white'
                    : 'bg-white/5 border-white/10 text-purple-200'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-purple-200'
              } border`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {hasAnswered && (
                  index === currentQuestion.correctAnswer ? (
                    <Check size={20} className="text-green-500" />
                  ) : index === progress.answers[progress.currentQuestion] ? (
                    <X size={20} className="text-red-500" />
                  ) : null
                )}
              </div>
            </button>
          ))}
        </div>

        {progress.showExplanation && (
          <div className="mt-8 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-start space-x-3">
              <HelpCircle size={24} className="text-purple-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-semibold mb-2">Explication</h4>
                <p className="text-purple-200">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="flex justify-between">
          <button
            onClick={() => setProgress(prev => ({ ...prev, currentQuestion: prev.currentQuestion - 1 }))}
            disabled={progress.currentQuestion === 0}
            className="flex items-center space-x-2 text-purple-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} />
            <span>Question précédente</span>
          </button>
          {hasAnswered && (
            <button
              onClick={handleNext}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>
                {progress.currentQuestion === quiz.questions.length - 1 ? 'Terminer' : 'Question suivante'}
              </span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {progress.completed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-indigo-900 rounded-xl p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={40} className="text-purple-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Quiz terminé !</h3>
              <p className="text-purple-200">
                Vous avez obtenu un score de {progress.score} sur {quiz.questions.length}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setProgress({
                    currentQuestion: 0,
                    answers: [],
                    score: 0,
                    completed: false,
                    showExplanation: false,
                  });
                }}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2"
              >
                <RefreshCw size={20} />
                <span>Recommencer le quiz</span>
              </button>
              <button
                onClick={onExit}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg"
              >
                Retour aux quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}