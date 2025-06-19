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

type ActivityLog = {
  date: string;
  simulation: number;
  quiz: number;
  objet3d: number;
};

type Profile = {
  id: string;
  name: string;
};

export default function ActivityByEleve({ eleves }: { eleves: Profile[] }) {
  const [filters, setFilters] = useState({ eleveId: 'tous', dateRange: 'tous' });
  const [activityByEleve, setActivityByEleve] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const days = filters.dateRange === '7j' ? 7 : filters.dateRange === '30j' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('created_at, type, user_id')
        .gte('created_at', startDate.toISOString());

      const eleveIds = eleves.map((e) => e.id);
      const relevantLogs = logs?.filter((l) => eleveIds.includes(l.user_id)) || [];

      const grouped: Record<string, ActivityLog> = {};

      for (const eleve of eleves) {
        if (filters.eleveId !== 'tous' && eleve.id !== filters.eleveId) continue;
        grouped[eleve.name] = { date: eleve.name, simulation: 0, quiz: 0, objet3d: 0 };
      }

      for (const log of relevantLogs) {
        const eleve = eleves.find((e) => e.id === log.user_id);
        if (!eleve || (filters.eleveId !== 'tous' && eleve.id !== filters.eleveId)) continue;
        const row = grouped[eleve.name];
        if (!row) continue;
        if (log.type === 'simulation') row.simulation++;
        else if (log.type === 'quiz') row.quiz++;
        else if (log.type === 'objet3d') row.objet3d++;

      }

      setActivityByEleve(Object.values(grouped));
    };

    fetchActivity();
  }, [filters, eleves]);

  const buttonClass = (active: boolean) =>
    `px-3 py-1 rounded-full border text-sm ${active
      ? 'bg-indigo-600 text-white border-indigo-600'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`;

  return (
    <div className="mt-20 bg-white shadow rounded-xl p-6 space-y-6 text-gray-800">
      <h2 className="text-2xl font-semibold">Activité par élève</h2>
      <div className="flex gap-2 flex-wrap items-center mb-4">
        {['7j', '30j', 'tout'].map((opt) => (
          <button
            key={opt}
            onClick={() => setFilters((f) => ({ ...f, dateRange: opt }))}
            className={buttonClass(filters.dateRange === opt)}
          >
            {opt === '7j' ? '7 jours' : opt === '30j' ? '30 jours' : 'Tout'}
          </button>
        ))}

        <select
          value={filters.eleveId}
          onChange={(e) => setFilters((f) => ({ ...f, eleveId: e.target.value }))}
          className="border rounded px-3 py-1 text-sm text-gray-700"
        >
          <option value="tous">Tous les élèves</option>
          {eleves.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={activityByEleve}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" stroke="#4B5563" />
          <YAxis stroke="#4B5563" allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="simulation" stackId="b" fill="#6366F1" name="Simulations" />
          <Bar dataKey="quiz" stackId="b" fill="#10B981" name="Quiz" />
          <Bar dataKey="objet3d" stackId="b" fill="#FBBF24" name="Objets 3D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
