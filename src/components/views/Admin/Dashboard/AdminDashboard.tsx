'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import CardStat from '../../../ui/CardStat';
// @ts-ignore
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
};

type Classe = {
  id: string;
  code_classe: string;
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ professeurs: 0, eleves: 0, classes: 0 });
  const [classes, setClasses] = useState<Classe[]>([]);

  const [roleFilters, setRoleFilters] = useState({ role: 'tous', dateRange: '7j' });
  const [classeFilters, setClasseFilters] = useState({ classeId: 'toutes', dateRange: '7j' });

  const [activityByRole, setActivityByRole] = useState<ActivityLog[]>([]);
  const [activityByClasse, setActivityByClasse] = useState<ActivityLog[]>([]);

  const [, setLoading] = useState(true);

  const buttonClass = (active: boolean) =>
    `px-3 py-1 rounded-full border text-sm ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`;

  useEffect(() => {
    const fetchCountsAndClasses = async () => {
      setLoading(true);
      const [professeurs, eleves, classData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professeur'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'eleve'),
        supabase.from('classes').select('id, code_classe'),
      ]);

      setCounts({
        professeurs: professeurs.count ?? 0,
        eleves: eleves.count ?? 0,
        classes: classData.data?.length ?? 0,
      });

      setClasses(classData.data || []);
      setLoading(false);
    };

    fetchCountsAndClasses();
  }, []);

  // 🟣 ACTIVITÉ PAR RÔLE
  useEffect(() => {
    const fetchRoleActivity = async () => {
      const days = roleFilters.dateRange === '7j' ? 7 : roleFilters.dateRange === '30j' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('type, created_at, user:profiles!activity_logs_user_id_fkey(role)')
        .gte('created_at', startDate.toISOString());

      const roles = ['professeur', 'eleve', 'admin'];
      const grouped: ActivityLog[] = roles.map((r) => ({
        date: r,
        simulation: 0,
        quiz: 0,
      }));

      for (const log of logs || []) {
        // Explicitly type log.user as any to avoid 'never' error
        const user = log.user as { role?: string } | { role?: string }[] | null | undefined;
        const role = Array.isArray(user) ? user[0]?.role : user?.role;
        if (!role) continue;

        if (roleFilters.role !== 'tous' && role !== roleFilters.role) continue;
        if (!['simulation', 'quiz'].includes(log.type)) continue;

        const row = grouped.find((g) => g.date === role);
        if (row) row[log.type as 'simulation' | 'quiz'] += 1;
      }

      setActivityByRole(grouped);
    };

    fetchRoleActivity();
  }, [roleFilters]);

  // 🔵 ACTIVITÉ PAR CLASSE
  useEffect(() => {
    const fetchClasseActivity = async () => {
      const days = classeFilters.dateRange === '7j' ? 7 : classeFilters.dateRange === '30j' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let { data: logs } = await supabase
        .from('activity_logs')
        .select('created_at, type, user_id')
        .gte('created_at', startDate.toISOString());

      if (classeFilters.classeId !== 'toutes') {
        const { data: elevesClasse } = await supabase
          .from('eleves_classes')
          .select('eleve_id')
          .eq('classe_id', classeFilters.classeId);
        const ids = elevesClasse?.map((e) => e.eleve_id);
        logs = logs?.filter((log) => ids?.includes(log.user_id)) ?? null;
      }

      const grouped: ActivityLog[] = [];
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        grouped.push({
          date: date.toISOString().split('T')[0],
          simulation: 0,
          quiz: 0,
        });
      }

      for (const log of logs || []) {
        const dateKey = log.created_at.split('T')[0];
        const row = grouped.find((r) => r.date === dateKey);
        if (row && ['simulation', 'quiz'].includes(log.type)) {
          row[log.type as 'simulation' | 'quiz'] += 1;
        }
      }

      setActivityByClasse(grouped);
    };

    fetchClasseActivity();
  }, [classeFilters]);

  const cards = [
    {
      label: 'Professeurs',
      count: counts.professeurs,
      icon: <AcademicCapIcon className="h-6 w-6 text-indigo-500" />,
    },
    {
      label: 'Élèves',
      count: counts.eleves,
      icon: <UserGroupIcon className="h-6 w-6 text-green-500" />,
    },
    {
      label: 'Classes',
      count: counts.classes,
      icon: <BuildingLibraryIcon className="h-6 w-6 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-10 px-4 py-6">
      <h1 className="text-3xl font-extrabold text-indigo-900 mb-4">🎛️ Tableau de bord</h1>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <CardStat key={index} label={card.label} count={card.count} icon={card.icon} />
        ))}
      </div>

      {/* Graphe par rôle */}
      <div className="mt-12 bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">👥 Activité par rôle</h2>
        <div className="flex gap-2 flex-wrap mb-4">
          {['7j', '30j', 'tout'].map((opt) => (
            <button
              key={opt}
              onClick={() => setRoleFilters((f) => ({ ...f, dateRange: opt }))}
              className={buttonClass(roleFilters.dateRange === opt)}
            >
              {opt === '7j' ? '7 jours' : opt === '30j' ? '30 jours' : 'Tout'}
            </button>
          ))}
          {['tous', 'professeur', 'eleve', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilters((f) => ({ ...f, role: r }))}
              className={buttonClass(roleFilters.role === r)}
            >
              {r === 'tous' ? 'Tous profils' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activityByRole}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#4B5563" />
            <YAxis stroke="#4B5563" allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="simulation" stackId="a" fill="#6366F1" name="Simulations" />
            <Bar dataKey="quiz" stackId="a" fill="#10B981" name="Quiz" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphe par classe */}
      <div className="mt-12 bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">🏫 Activité par classe</h2>
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
            <Bar dataKey="simulation" stackId="b" fill="#818CF8" name="Simulations" />
            <Bar dataKey="quiz" stackId="b" fill="#34D399" name="Quiz" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
