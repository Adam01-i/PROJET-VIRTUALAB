import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, X, HelpCircle, RefreshCw, Award,
} from 'lucide-react';
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

  const [timeLeft, setTimeLeft] = useState(600); // 10 min

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[700px] mx-auto bg-white/5 backdrop-blur-md rounded-md border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-purple-300 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            <span>Quitter</span>
          </button>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-400">
              <Check size={16} />
              <span>{progress.score} / {progress.answers.length}</span>
            </div>
            <div className="px-3 py-1 bg-purple-500/20 rounded text-purple-200">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((progress.currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-5">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Question {progress.currentQuestion + 1} / {quiz.questions.length}
          </h3>
          <p className="text-base text-purple-200">{currentQuestion.question}</p>
        </div>

        {currentQuestion.image && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img
              src={currentQuestion.image}
              alt="Illustration"
              className="w-full h-52 object-cover"
            />
          </div>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctAnswer;
            const isSelected = progress.answers[progress.currentQuestion] === index;

            let baseClasses =
              'w-full p-3 rounded-md border transition-all text-left text-sm';
            let stateClasses = 'bg-white/5 hover:bg-white/10 text-purple-200 border-white/10';

            if (hasAnswered) {
              if (isCorrect) {
                stateClasses = 'bg-green-500/20 text-white border-green-500';
              } else if (isSelected) {
                stateClasses = 'bg-red-500/20 text-white border-red-500';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={hasAnswered}
                className={`${baseClasses} ${stateClasses}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {hasAnswered && (
                    isCorrect ? (
                      <Check size={16} className="text-green-400" />
                    ) : isSelected ? (
                      <X size={16} className="text-red-400" />
                    ) : null
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {progress.showExplanation && (
          <div className="mt-6 p-3 bg-purple-500/10 rounded-md border border-purple-500/20 text-sm">
            <div className="flex gap-3 items-start">
              <HelpCircle size={20} className="text-purple-300 mt-1" />
              <div>
                <h4 className="text-white font-semibold mb-1">Explication</h4>
                <p className="text-purple-200">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex justify-between">
          <button
            onClick={() => setProgress(prev => ({
              ...prev,
              currentQuestion: prev.currentQuestion - 1,
              showExplanation: false,
            }))}
            disabled={progress.currentQuestion === 0}
            className="flex items-center gap-2 text-purple-300 hover:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            <span>Précédente</span>
          </button>

          {hasAnswered && (
            <button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <span>
                {progress.currentQuestion === quiz.questions.length - 1 ? 'Terminer' : 'Suivante'}
              </span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Modal Résultat */}
      {progress.completed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-indigo-900 rounded-md p-5 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={28} className="text-purple-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Quiz terminé !</h3>
              <p className="text-sm text-purple-200">
                Score : {progress.score} / {quiz.questions.length}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setProgress({
                  currentQuestion: 0,
                  answers: [],
                  score: 0,
                  completed: false,
                  showExplanation: false,
                })}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Recommencer</span>
              </button>
              <button
                onClick={onExit}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-md text-sm"
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
