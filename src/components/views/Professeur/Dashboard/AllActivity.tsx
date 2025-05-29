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
    surname: string;
    role: string;
  } | null;
};

type Classe = {
  id: string;
  code_classe: string;
};

export default function AllActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filtered, setFiltered] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeMap, setClasseMap] = useState<Record<string, string>>({});

  // Filtres
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterResults();
  }, [activities, selectedClasse, selectedType, filterDate, searchQuery]);

  function resetPage() {
    setCurrentPage(1);
  }

  async function fetchActivities() {
    setLoading(true);

    const [{ data: mesClasses }, { data: elevesClasses }] = await Promise.all([
      supabase.from('mes_classes').select('id, code_classe'),
      supabase.from('eleves_classes').select('eleve_id, classe_id'),
    ]);

    if (!mesClasses || !elevesClasses) return;

    setClasses(mesClasses);

    const eleveIds = elevesClasses.map((e) => e.eleve_id);
    const map: Record<string, string> = {};
    elevesClasses.forEach(({ eleve_id, classe_id }) => {
      const found = mesClasses.find((c) => c.id === classe_id);
      if (found) map[eleve_id] = found.code_classe;
    });
    setClasseMap(map);

    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        type,
        duree,
        created_at,
        meta,
        profiles (name, surname, role)
      `)
      .in('user_id', eleveIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement:', error.message);
    } else {
      setActivities(
        (data || []).map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0] || null
            : item.profiles ?? null,
        }))
      );
    }

    setLoading(false);
  }

  function filterResults() {
    let result = [...activities];

    if (selectedClasse) {
      result = result.filter((a) => classeMap[a.user_id] === selectedClasse);
    }

    if (selectedType) {
      result = result.filter((a) => a.type === selectedType);
    }

    if (filterDate) {
      result = result.filter((a) =>
        new Date(a.created_at).toISOString().startsWith(filterDate)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => {
        const fullName = `${a.profiles?.name ?? ''} ${a.profiles?.surname ?? ''}`.toLowerCase();
        return fullName.includes(q);
      });
    }

    setFiltered(result);
    resetPage();
  }

  return (
    <div className="mt-36">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Activités des élèves</h2>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
        <select
          value={selectedClasse}
          onChange={(e) => setSelectedClasse(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.code_classe}>
              {c.code_classe}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="simulation">Simulation</option>
          <option value="quiz">Quiz</option>
          <option value="objet3d">Objet 3D</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Rechercher un élève"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 text-sm flex-1"
        />
      </div>

      {/* Tableau */}
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
                  <th className="px-4 py-2 text-gray-700">Classe</th>
                  <th className="px-4 py-2 text-gray-700">Type</th>
                  <th className="px-4 py-2 text-gray-700">Durée</th>
                  <th className="px-4 py-2 text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 text-indigo-700 font-medium">
                      {`${a.profiles?.name ?? ''} ${a.profiles?.surname ?? ''}`}
                    </td>
                    <td className="px-4 py-2">{classeMap[a.user_id] ?? '-'}</td>
                    <td className="px-4 py-2 capitalize">{a.type}</td>
                    <td className="px-4 py-2">{a.duree ?? '-'}</td>
                    <td className="px-4 py-2">
                      {new Date(a.created_at).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              ⬅ Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
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
