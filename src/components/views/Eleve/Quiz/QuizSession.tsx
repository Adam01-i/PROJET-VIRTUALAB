'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, X, HelpCircle, Award } from 'lucide-react';
import type { QuizProgress, QuizWithClasse } from '../../../../types/Quiz/quiz';
import { supabase } from '../../../../lib/supabaseClient';

type QuizSessionProps = {
  quiz: QuizWithClasse;
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

  const [timeLeft, setTimeLeft] = useState(600);

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

  const logActivity = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;

    await supabase.from('activity_logs').insert({
      user_id: userId,
      type: 'quiz',
      duree: 600 - timeLeft,
      meta: {
        quiz_id: quiz.id,
        titre: quiz.titre,
        score: progress.score,
        total: quiz.questions.length,
        pourcentage: Math.round((progress.score / quiz.questions.length) * 100),
      },
    });
  };

  const handleNext = () => {
    if (progress.currentQuestion === quiz.questions.length - 1) {
      setProgress(prev => ({ ...prev, completed: true }));

      const saveScore = async () => {
        const { data: session } = await supabase.auth.getSession();
        const user = session?.session?.user;
        if (!user) return;

        await supabase.from('quiz_results').insert({
          eleve_id: user.id,
          quiz_id: quiz.id,
          score: progress.score,
          total: quiz.questions.length,
        });

        await logActivity();
        onComplete(progress.score);
      };

      saveScore();
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
    <div className="max-w-[700px] mx-auto bg-white rounded-md border border-gray-200 shadow-lg my-20">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-md">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="flex items-center gap-2 text-white text-sm">
            <ArrowLeft size={16} />
            <span>Quitter</span>
          </button>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-300">
              <Check size={16} />
              <span>{progress.score} / {progress.answers.length}</span>
            </div>
            <div className="px-3 py-1 bg-purple-700/30 rounded text-white">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${((progress.currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-b-md">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Question {progress.currentQuestion + 1} / {quiz.questions.length}
          </h3>
          <p className="text-base text-gray-700">{currentQuestion.question}</p>
        </div>

        {currentQuestion.image && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-md">
            <img src={currentQuestion.image} alt="Illustration" className="w-full h-52 object-cover rounded-md" />
          </div>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctAnswer;
            const isSelected = progress.answers[progress.currentQuestion] === index;

            let baseClasses = 'w-full p-3 rounded-md border transition-all text-left text-sm';
            let stateClasses = 'bg-white/10 hover:bg-white/20 text-gray-600 border-gray-300';

            if (hasAnswered) {
              if (isCorrect) stateClasses = 'bg-green-500/20 text-white border-green-500';
              else if (isSelected) stateClasses = 'bg-red-500/20 text-white border-red-500';
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
                <h4 className="text-black font-semibold mb-1">Explication</h4>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-b-md">
        <div className="flex justify-between">
          <button
            onClick={() =>
              setProgress(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion - 1,
                showExplanation: false,
              }))
            }
            disabled={progress.currentQuestion === 0}
            className="flex items-center gap-2 text-white text-sm disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            <span>Précédente</span>
          </button>

          {hasAnswered && (
            <button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <span>{progress.currentQuestion === quiz.questions.length - 1 ? 'Terminer' : 'Suivante'}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {progress.completed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-indigo-900 rounded-md p-5 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={24} className="text-purple-500" />
              </div>
              <h3 className="text-2xl text-white font-semibold mb-2">Bien joué ! 🎉</h3>
              <p className="text-white">
                Ton score final est de {progress.score} / {quiz.questions.length}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onExit}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full py-2 rounded-md text-sm"
              >
                Revenir à l'accueil
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white w-full py-2 rounded-md text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
