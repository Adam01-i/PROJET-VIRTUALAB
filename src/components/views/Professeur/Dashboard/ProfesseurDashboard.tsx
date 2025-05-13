import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  UsersRound,
  FlaskRound,
  Brain,
  Clock4,
  Flame,
} from 'lucide-react';

export default function DashboardProfesseur() {
  const [loginData, setLoginData] = useState<{ day: string; count: number }[]>([]);
  const [quizLevels, setQuizLevels] = useState<{ name: string; value: number }[]>([]);
  const [experienceNiveau, setExperienceNiveau] = useState<{ name: string; value: number }[]>([]);
  const [moyenneTemps, setMoyenneTemps] = useState<number>(0);
  const [elevesActifs, setElevesActifs] = useState<{ name: string; total: number }[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const start = new Date();
      start.setDate(start.getDate() - 6);

      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('role', 'eleve')
        .gte('created_at', start.toISOString());

      const groupedByDay = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const label = date.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
        });
        const count =
          users?.filter(
            (u) =>
              new Date(u.created_at).toDateString() === date.toDateString()
          ).length || 0;
        return { day: label, count };
      });

      setLoginData(groupedByDay);

      const { data: quizRaw } = await supabase.from('quizzes').select('niveau');
      const niveaux = ['Débutant', 'Intermédiaire', 'Avancé'];
      const quizCounts = niveaux.map((niveau) => ({
        name: niveau,
        value: quizRaw?.filter((q) => q.niveau === niveau).length || 0,
      }));
      setQuizLevels(quizCounts);

      const { data: expRaw } = await supabase.from('experiences').select('niveau');
      const uniqueNiveaux = [...new Set(expRaw?.map((e) => e.niveau))];
      const expCounts = uniqueNiveaux.map((niveau) => ({
        name: niveau,
        value: expRaw?.filter((e) => e.niveau === niveau).length || 0,
      }));
      setExperienceNiveau(expCounts);

      const { data: activites } = await supabase
        .from('activity_logs')
        .select('user_id, duree')
        .eq('type', 'simulation');

      if (activites && activites.length > 0) {
        const total = activites.reduce((acc, cur) => acc + cur.duree, 0);
        const moy = total / new Set(activites.map((a) => a.user_id)).size;
        setMoyenneTemps(Math.round(moy));
      }

      const statsMap: Record<string, number> = {};
      activites?.forEach((a) => {
        statsMap[a.user_id] = (statsMap[a.user_id] || 0) + a.duree;
      });

      const sorted = Object.entries(statsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const eleveIds = sorted.map(([id]) => id);
      const { data: profils } = await supabase
        .from('profiles')
        .select('id, name, surname')
        .in('id', eleveIds);

      const topEleves = sorted.map(([id, total]) => {
        const profil = profils?.find((p) => p.id === id);
        return {
          name: `${profil?.name || 'Inconnu'} ${profil?.surname || ''}`,
          total,
        };
      });

      setElevesActifs(topEleves);
    };

    loadStats();
  }, []);

  const maxLogin = Math.max(...loginData.map(d => d.count), 1);
//   const maxQuiz = Math.max(...quizLevels.map(q => q.value), 1);
  const maxSim = Math.max(...experienceNiveau.map(e => e.value), 1);

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen space-y-10">
      <h1 className="text-3xl font-bold text-indigo-700">📊 Tableau de bord pédagogique</h1>

      {/* Section en ligne */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 📈 Connexions SVG Bar */}
        <div className="bg-white rounded-xl border shadow-md p-5 animate-fade-in-up transition">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <UsersRound size={18} /> Connexions élèves
          </h2>
          <svg width="100%" height="120">
            {loginData.map((d, i) => {
              const barHeight = (d.count / maxLogin) * 100;
              return (
                <rect
                  key={i}
                  x={i * 30 + 10}
                  y={120 - barHeight}
                  width="20"
                  height={barHeight}
                  fill="#6366f1"
                  rx="4"
                />
              );
            })}
          </svg>
        </div>

        {/* 🧠 Quiz par niveau - Pie en SVG */}
        <div className="bg-white rounded-xl border shadow-md p-5 animate-fade-in-up transition">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Brain size={18} /> Quiz par niveau
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {quizLevels.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span className="font-semibold text-indigo-600">{item.value}</span>
              </li>
            ))}
          </ul>
          <svg viewBox="0 0 32 32" width="100%" className="mt-4">
            {(() => {
              const total = quizLevels.reduce((sum, v) => sum + v.value, 0) || 1;
              let cumulative = 0;
              return quizLevels.map((item, i) => {
                const value = item.value / total;
                const [startX, startY] = [Math.cos(2 * Math.PI * cumulative), Math.sin(2 * Math.PI * cumulative)];
                cumulative += value;
                const [endX, endY] = [Math.cos(2 * Math.PI * cumulative), Math.sin(2 * Math.PI * cumulative)];
                const largeArc = value > 0.5 ? 1 : 0;
                return (
                  <path
                    key={i}
                    d={`M16 16 L${16 + 16 * startX} ${16 + 16 * startY} A16 16 0 ${largeArc} 1 ${16 + 16 * endX} ${16 + 16 * endY} Z`}
                    fill={['#6366f1', '#818cf8', '#c7d2fe'][i % 3]}
                  />
                );
              });
            })()}
          </svg>
        </div>

        {/* 🧪 Simulations - Bar Horizontal */}
        <div className="bg-white rounded-xl border shadow-md p-5 animate-fade-in-up transition">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FlaskRound size={18} /> Simulations par niveau
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {experienceNiveau.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-24">{item.name}</span>
                <div className="flex-1 bg-gray-200 rounded h-3 relative">
                  <div
                    className="absolute left-0 top-0 h-3 rounded bg-indigo-500"
                    style={{ width: `${(item.value / maxSim) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-indigo-700 font-medium">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ⏱️ Temps moyen */}
      <div className="bg-white rounded-xl border shadow-md p-6 w-full md:w-1/2 animate-fade-in-up transition">
        <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Clock4 size={18} /> Temps moyen passé par élève
        </h2>
        <p className="text-5xl font-bold text-indigo-700">{moyenneTemps} min</p>
      </div>

      {/* 🔥 Élèves les plus actifs */}
      <div className="bg-white rounded-xl border shadow-md p-6 w-full md:w-3/4 animate-fade-in-up transition">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Flame size={18} /> Top 5 des élèves les plus actifs
        </h2>
        <ul className="space-y-2 text-sm text-gray-600">
          {elevesActifs.map((el, idx) => (
            <li key={idx} className="flex justify-between border-b pb-1">
              <span>{el.name}</span>
              <span className="text-indigo-600 font-semibold">{el.total} min</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
