'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import CardStat from '../../../ui/CardStat';

interface User {
  name: string;
  surname: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ professeurs: 0, eleves: 0, admins: 0 });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const { data: users, error: recentErr } = await supabase
          .from('profiles')
          .select('name, surname, email, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentErr) throw recentErr;
        setRecentUsers(users || []);
      } catch (err) {
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-4">👥 Utilisateurs récents</h2>
            <ul className="bg-white shadow rounded-xl p-4 divide-y divide-gray-100">
              {recentUsers.length === 0 ? (
                <li className="text-gray-500 text-sm italic py-2">Aucun utilisateur récemment inscrit.</li>
              ) : (
                recentUsers.map((user, index) => (
                  <li key={index} className="py-2 text-sm text-gray-700 flex justify-between items-center">
                    <div>
                      <strong>{user.name} {user.surname}</strong> <span className="text-gray-500">({user.role})</span>
                    </div>
                    <span className="text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}

      <div className="text-gray-700 mt-10 italic text-sm border-t pt-4">
        👋 Bienvenue sur l’espace administrateur. Utilisez la barre latérale pour accéder aux différentes sections de gestion.
      </div>
    </div>
  );
}
