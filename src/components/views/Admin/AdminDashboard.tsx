import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    professeurs: 0,
    eleves: 0,
    admins: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'professeur');

      const { data: eleves } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'eleve');

      const { data: admins } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'admin');

      setCounts({
        professeurs: profs?.length ?? 0,
        eleves: eleves?.length ?? 0,
        admins: admins?.length ?? 0,
      });
    };

    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-indigo-800">Dashboard Administrateur</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-500">Professeurs</h3>
          <p className="text-3xl font-semibold text-indigo-600">{counts.professeurs}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-500">Élèves</h3>
          <p className="text-3xl font-semibold text-indigo-600">{counts.eleves}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-500">Administrateurs</h3>
          <p className="text-3xl font-semibold text-indigo-600">{counts.admins}</p>
        </div>
      </div>

      <div className="text-gray-600 mt-6">
        👋 Bienvenue sur votre interface d'administration.  
        Vous pouvez importer des comptes, suivre les utilisateurs et modifier les configurations du système.
      </div>
    </div>
  );
}
