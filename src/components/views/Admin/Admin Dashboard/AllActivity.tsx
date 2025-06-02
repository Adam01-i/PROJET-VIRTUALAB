'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

type ActivityLog = {
  id: string;
  user_id: string;
  type: string;
  duree: number;
  created_at: string;
  meta: any;
  profiles: {
    name: string;
    role: string;
  } | null;
};

export default function AllActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filtered, setFiltered] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [filterRole, setFilterRole] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          user_id,
          type,
          duree,
          created_at,
          meta,
          profiles ( name, role )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error.message);
      } else {
        const mappedData = (data || []).map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0] || null
            : item.profiles || null,
        }));
        setActivities(mappedData);
        setFiltered(mappedData);
      }

      setLoading(false);
    };

    fetchActivities();
  }, []);

  useEffect(() => {
    let result = [...activities];

    if (filterRole) {
      result = result.filter((a) => a.profiles?.role === filterRole);
    }
    if (filterType) {
      result = result.filter((a) => a.type === filterType);
    }
    if (filterDate) {
      result = result.filter((a) =>
        new Date(a.created_at).toISOString().startsWith(filterDate)
      );
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.profiles?.name?.toLowerCase().includes(query)
      );
    }

    setFiltered(result);
    setCurrentPage(1); // reset page on filter/search change
  }, [filterRole, filterType, filterDate, searchQuery, activities]);

  return (
    <div className="mt-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Historique des Activités</h2>

      {/* 🔍 Filtres */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
        <select
          onChange={(e) => setFilterRole(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          value={filterRole}
        >
          <option value="">Tous les rôles</option>
          <option value="eleve">Élève</option>
          <option value="professeur">Professeur</option>
        </select>

        <select
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          value={filterType}
        >
          <option value="">Tous les types</option>
          <option value="simulation">Simulation</option>
          <option value="quiz">Quiz</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Rechercher un nom"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 text-sm flex-1"
        />
      </div>

      {/* 📊 Table des activités */}
      {loading ? (
        <p className="text-gray-600">Chargement...</p>
      ) : currentItems.length === 0 ? (
        <p className="text-gray-600">Aucune activité trouvée.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-gray-700">Nom</th>
                  <th className="px-4 py-2 text-gray-700">Rôle</th>
                  <th className="px-4 py-2 text-gray-700">Type</th>
                  <th className="px-4 py-2 text-gray-700">Durée (min)</th>
                  <th className="px-4 py-2 text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-4 py-2 text-indigo-700 font-medium">
                      {activity.profiles?.name || 'Inconnu'}
                    </td>
                    <td className="px-4 py-2 capitalize">{activity.profiles?.role || '-'}</td>
                    <td className="px-4 py-2">{activity.type}</td>
                    <td className="px-4 py-2">{activity.duree ?? '-'}</td>
                    <td className="px-4 py-2">
                      {new Date(activity.created_at).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📄 Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              ⬅ Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Suivant ➡
            </button>
          </div>
        </>
      )}
    </div>
  );
}
