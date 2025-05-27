'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

type Classe = {
  id: string;
  code_classe: string;
};

type ActivityLog = {
  date: string;
  simulation: number;
  quiz: number;
  objet3d: number;
};

type Props = {
  classes: Classe[];
};

export default function ActivityByClass({ classes }: Props) {
  const [classeFilters, setClasseFilters] = useState({ classeId: 'toutes', dateRange: '7j' });
  const [activityByClasse, setActivityByClasse] = useState<ActivityLog[]>([]);

  const buttonClass = (active: boolean) =>
    `px-3 py-1 rounded-full border text-sm ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`;

  useEffect(() => {
    const fetchClasseActivity = async () => {
      const days =
        classeFilters.dateRange === '7j' ? 7 :
        classeFilters.dateRange === '30j' ? 30 :
        365;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let { data: logs } = await supabase
        .from('activity_logs')
        .select('created_at, type, user_id')
        .gte('created_at', startDate.toISOString());

      // 🎯 Filtrage classe → élève
      if (classeFilters.classeId !== 'toutes') {
        const { data: elevesClasse } = await supabase
          .from('eleves_classes')
          .select('eleve_id')
          .eq('classe_id', classeFilters.classeId);

        const ids = elevesClasse?.map((e) => e.eleve_id);
        logs = logs?.filter((log) => ids?.includes(log.user_id)) ?? [];
      }

      const grouped: ActivityLog[] = [];
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        grouped.push({
          date: date.toISOString().split('T')[0],
          simulation: 0,
          quiz: 0,
          objet3d: 0,
        });
      }

      for (const log of logs || []) {
        const dateKey = log.created_at.split('T')[0];
        const row = grouped.find((r) => r.date === dateKey);
        if (!row) continue;

        if (log.type === 'simulation') row.simulation += 1;
        else if (log.type === 'quiz') row.quiz += 1;
        else if (log.type === 'objet3d') row.objet3d += 1;
      }

      setActivityByClasse(grouped);
    };

    fetchClasseActivity();
  }, [classeFilters]);

  return (
    <div className="mt-12 bg-white shadow rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">🏫 Activité par classe (Simulations, Quiz, Objets 3D)</h2>

      <div className="flex gap-2 flex-wrap mb-4">
        {['7j', '30j', 'tout'].map((opt) => (
          <button
            key={opt}
            onClick={() => setClasseFilters((f) => ({ ...f, dateRange: opt }))}
            className={buttonClass(classeFilters.dateRange === opt)}
          >
            {opt === '7j' ? '7 jours' : opt === '30j' ? '30 jours' : 'Tout'}
          </button>
        ))}

        <select
          value={classeFilters.classeId}
          onChange={(e) => setClasseFilters((f) => ({ ...f, classeId: e.target.value }))}
          className="border rounded px-3 py-1 text-sm shadow-sm text-gray-700"
        >
          <option value="toutes">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code_classe}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={activityByClasse}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" stroke="#4B5563" />
          <YAxis stroke="#4B5563" allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="simulation" stackId="a" fill="#6366F1" name="Simulations" />
          <Bar dataKey="quiz" stackId="a" fill="#10B981" name="Quiz" />
          <Bar dataKey="objet3d" stackId="a" fill="#F59E0B" name="Objets 3D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
