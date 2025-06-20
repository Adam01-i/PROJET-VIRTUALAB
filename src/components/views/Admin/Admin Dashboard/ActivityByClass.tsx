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

type Classe = { id: string; code_classe: string };
type ActivityLog = { classe: string; simulation: number; quiz: number; objet3d: number };
type Props = { classes: Classe[] };

export default function ActivityByClass({ classes }: Props) {
  const [dateRange, setDateRange] = useState<'7j' | '30j' | 'tout'>('tout');
  const [selectedClasseId, setSelectedClasseId] = useState<'toutes' | string>('toutes');
  const [activityByClasse, setActivityByClasse] = useState<ActivityLog[]>([]);

  const buttonClass = (active: boolean) =>
    `px-3 py-1 rounded-full border text-sm ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`;

  useEffect(() => {
    const fetchActivity = async () => {
      const days = dateRange === '7j' ? 7 : dateRange === '30j' ? 30 : 365;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: elevesClasse } = await supabase
        .from('eleves_classes')
        .select('eleve_id, classe_id');

      const eleveClasseMap: Record<string, string> = {};
      elevesClasse?.forEach(({ eleve_id, classe_id }) => {
        const code = classes.find((c) => c.id === classe_id)?.code_classe;
        if (code && (selectedClasseId === 'toutes' || classe_id === selectedClasseId)) {
          eleveClasseMap[eleve_id] = code;
        }
      });

      const eleveIds = Object.keys(eleveClasseMap);
      if (eleveIds.length === 0) return setActivityByClasse([]);

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('user_id, created_at, type')
        .in('user_id', eleveIds)
        .gte('created_at', since.toISOString());

      const agg: Record<string, ActivityLog> = {};
      Object.values(eleveClasseMap).forEach((classe) => {
        agg[classe] = { classe, simulation: 0, quiz: 0, objet3d: 0 };
      });

      logs?.forEach(({ user_id, type }) => {
        const classe = eleveClasseMap[user_id];
        if (!classe) return;
        if (type === 'simulation') agg[classe].simulation++;
        else if (type === 'quiz') agg[classe].quiz++;
        else if (type === 'objet3d') agg[classe].objet3d++;
      });

      setActivityByClasse(Object.values(agg));
    };

    fetchActivity();
  }, [dateRange, selectedClasseId, classes]);

  return (
    <div className="bg-white shadow rounded-xl p-6 space-y-6 text-gray-800">
      <h2 className="text-2xl font-semibold">Activité par classe</h2>

      <div className="flex flex-wrap items-center gap-3">
        {['7j', '30j', 'tout'].map((opt) => (
          <button
            key={opt}
            onClick={() => setDateRange(opt as '7j' | '30j' | 'tout')}
            className={buttonClass(dateRange === opt)}
          >
            {opt === '7j' ? '7 jours' : opt === '30j' ? '30 jours' : 'Tout'}
          </button>
        ))}

        <select
          value={selectedClasseId}
          onChange={(e) => setSelectedClasseId(e.target.value)}
          className="border rounded px-3 py-1 text-sm shadow-sm text-gray-700"
        >
          <option value="toutes">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.code_classe}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={activityByClasse}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="classe" stroke="#4B5563" />
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
