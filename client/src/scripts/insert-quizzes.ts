import { createClient } from '@supabase/supabase-js';

// 🔑 Clés Supabase
const SUPABASE_URL = 'https://dviccoqpvhriwxruxjby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWNjb3FwdmhyaXd4cnV4amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjU2ODYsImV4cCI6MjA2MDYwMTY4Nn0.ziHyNM3C5GiNQYqwrjCY7aHV8ACI-Wx_HwBwpwqagaI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📦 Données
import { quizData } from '../data/Quiz/quizData';

async function insertQuizzes() {
  for (const quiz of quizData) {
    const { titre, description, duree, image, questions } = quiz;

    // ➕ Insertion du quiz
    const { data: insertedQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ titre, description, duree, image }])
      .select();

    if (quizError) {
      console.error(`❌ Erreur lors de l'insertion du quiz "${titre}":`, quizError.message);
      continue;
    }

    const quizId = insertedQuiz?.[0]?.id;
    if (!quizId) {
      console.error(`⚠️ Quiz "${titre}" inséré mais aucun ID récupéré.`);
      continue;
    }

    // ➕ Insertion des questions sans champ `id`
    const formattedQuestions = questions.map((q) => ({
      quiz_id: quizId,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer, // Assure-toi que ta table Supabase utilise bien ce nom (pas 'correct_answer')
      explanation: q.explanation,
    }));

    const { error: questionError } = await supabase
      .from('questions')
      .insert(formattedQuestions);

    if (questionError) {
      console.error(`❌ Erreur insertion questions du quiz "${titre}":`, questionError.message);
    } else {
      console.log(`✅ Quiz "${titre}" et ses questions ont été insérés.`);
    }
  }
}

insertQuizzes()
  .then(() => console.log('✅ Tous les quiz et questions ont été insérés.'))
  .catch((err) => console.error('🔥 Erreur globale dans le script :', err));
