'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
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

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ professeurs: 0, eleves: 0, admins: 0 });
  const [activityData, setActivityData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<'7j' | '30j' | 'tout'>('7j');
  const [userRole, setUserRole] = useState<'tous' | 'professeur' | 'eleve' | 'admin'>('tous');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const roles = ['professeur', 'eleve', 'admin'];
        const results = await Promise.all(
          roles.map((role) =>
            supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('role', role)
          )
        );

        setCounts({
          professeurs: results[0].count ?? 0,
          eleves: results[1].count ?? 0,
          admins: results[2].count ?? 0,
        });

        // Déterminer la date minimale
        const days = dateRange === '7j' ? 7 : dateRange === '30j' ? 30 : 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Filtrer par type d'utilisateur si besoin
        const roleFilter =
          userRole !== 'tous'
            ? `AND user_id IN (SELECT id FROM profiles WHERE role = '${userRole}')`
            : '';

        const { data: logs, error: logsError } = await supabase.rpc(
          'fetch_activity_logs_filtered',
          {
            since: startDate.toISOString(),
            role_filter: roleFilter,
          }
        );

        if (logsError || !logs) throw logsError;

        // Créer la base vide
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

        for (const log of logs) {
          const dateKey = log.created_at.split('T')[0];
          const target = grouped.find((d) => d.date === dateKey);
          const activityType = log.type as keyof Omit<ActivityLog, 'date'>;
          if (target && ['simulation', 'quiz'].includes(log.type)) {
            target[activityType]++;
          }
        }

        setActivityData(grouped);
      } catch (err) {
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange, userRole]);

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
      label: 'Admins',
      count: counts.admins,
      icon: <ShieldCheckIcon className="h-6 w-6 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-10 px-4 py-6">
      <h1 className="text-3xl font-extrabold text-indigo-900 flex items-center gap-2">
        🎛️ Tableau de bord administrateur
      </h1>

      {loading ? (
        <div className="text-gray-600 animate-pulse">Chargement des données...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <CardStat
                key={index}
                label={card.label}
                count={card.count}
                icon={card.icon}
              />
            ))}
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mt-6 items-center">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm shadow-sm text-gray-700"
            >
              <option value="7j">Derniers 7 jours</option>
              <option value="30j">Derniers 30 jours</option>
              <option value="tout">Tout</option>
            </select>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm shadow-sm text-gray-700"
            >
              <option value="tous">Tous les utilisateurs</option>
              <option value="professeur">Professeurs</option>
              <option value="eleve">Élèves</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Graphique en barres empilées */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              📊 Activité des utilisateurs ({dateRange}, {userRole})
            </h2>
            <div className="bg-white shadow rounded-xl p-6">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={activityData}>
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
          </div>
        </>
      )}

      <div className="text-gray-700 mt-10 italic text-sm border-t pt-4">
        👋 Bienvenue sur l’espace administrateur. Utilisez la barre latérale pour accéder aux différentes sections de gestion.
      </div>
    </div>
  );
}
