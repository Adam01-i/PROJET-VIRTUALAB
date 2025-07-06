import * as React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { EleveActivite } from '../../../../types/Eleve/EleveActivite';

type QuizResult = {
  quiz_title: string;
  correct_answers: number;
  total_questions: number;
  date_completed: string;
};

type Props = {
  eleve: EleveActivite;
  onClose: () => void;
};

export default function EleveDetail({ eleve, onClose }: Props) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('mes_resultats_quiz')
        .select('*')
        .eq('eleve_id', eleve.id)
        .order('date_completed', { ascending: false });

      if (!error && data) {
        setResults(data);
      } else if (error) {
        console.error('Erreur fetch quiz results:', error);
      }
      setLoading(false);
    };

    fetchResults();
  }, [eleve]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl w-full space-y-4">
        <h2 className="text-xl font-bold text-indigo-800">
          📊 Détails de {eleve.name}
        </h2>

        {loading ? (
          <p className="text-gray-500">Chargement des résultats...</p>
        ) : results.length === 0 ? (
          <p className="text-gray-500 italic">Aucun quiz réalisé récemment.</p>
        ) : (
          <div className="space-y-3 overflow-auto max-h-100">
            {results.map((r, i) => {
              return (
                <div
                  key={i}
                  className="border rounded-md p-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex justify-between font-semibold text-indigo-700">
                    <span>{r.quiz_title}</span>
                    <span>{r.correct_answers}/100</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    ✅ {r.correct_answers}/{r.total_questions} bonnes réponses — 🗓️{' '}
                    {new Date(r.date_completed).toLocaleDateString()}
                  </p>
                  {/* <p className="text-sm italic text-gray-500 mt-1">{recommend}</p> */}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
