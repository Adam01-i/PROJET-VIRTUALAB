import { useState } from 'react';
import { quizData } from '../../data/Quiz/quizData';
import QuizCard from './QuizCard';
import QuizSession from './QuizSession';

export default function QuizView() {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  const handleStartQuiz = (quizId: string) => {
    setActiveQuiz(quizId);
  };

  const handleCompleteQuiz = (score: number) => {
    console.log(`Quiz completed with score: ${score}`);
  };

  const currentQuiz = activeQuiz ? quizData.find(q => q.id === activeQuiz) : null;

  if (currentQuiz) {
    return (
      <QuizSession
        quiz={currentQuiz}
        onComplete={handleCompleteQuiz}
        onExit={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-white">Quiz disponibles</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizData.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onStart={handleStartQuiz}
          />
        ))}
      </div>
    </div>
  );
}