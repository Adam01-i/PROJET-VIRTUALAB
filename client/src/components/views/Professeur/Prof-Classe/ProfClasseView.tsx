'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  Users,
  Atom,
  FlaskConical,
  FileText,
} from 'lucide-react';
import CardStat from '../../../ui/CardStat';
import TopEleves from './TopEleves';
import EleveDetail from './EleveDetail';

type Classe = { id: string; code_classe: string; niveau: string };
type Eleve = { id: string; name: string; surname: string; email: string; classe_id: string };
type EleveActivite = {
  id: string;
  name: string;
  classe: string;
  quiz: number;
  simulation: number;
  total_score: number;
};

export default function ProfClasseView() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string>('all');
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [lab3DCount, setLab3DCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
  const [elevesCount, setElevesCount] = useState(0);
  const [parEleve, setParEleve] = useState<EleveActivite[]>([]);
  const [selectedEleve, setSelectedEleve] = useState<EleveActivite | null>(null);

  // 🧮 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentEleves = eleves.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(eleves.length / itemsPerPage);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('mes_classes').select('*');
      if (error || !Array.isArray(data)) {
        toast.error("❌ Impossible de charger les classes", {
          description: error?.message || "Erreur inconnue",
        });
        return;
      }
      setClasses(data);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (classes.length === 0) return;

    const fetchDetails = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const classeIds = classes.map((c) => c.id);

      const { data: elevesData } = await supabase
        .from('eleves_classes')
        .select('eleve_id, classe_id, profiles(id, name, surname, email)')
        .in('classe_id', selectedClasseId === 'all' ? classeIds : [selectedClasseId]);

      const mappedEleves = elevesData?.map((e: any) => ({
        id: e.profiles.id,
        name: e.profiles.name,
        surname: e.profiles.surname,
        email: e.profiles.email,
        classe_id: e.classe_id,
      })) || [];

      setEleves(mappedEleves);
      setCurrentPage(1); // reset page

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('user_id, type, created_at')
        .in('user_id', mappedEleves.map((e) => e.id))
        .gte('created_at', since.toISOString());

      const eleveMap: Record<string, EleveActivite> = {};
      for (let el of mappedEleves) {
        const classe = classes.find(c => c.id === el.classe_id);
        eleveMap[el.id] = {
          id: el.id,
          name: `${el.name} ${el.surname}`,
          classe: classe?.code_classe || 'Inconnue',
          quiz: 0,
          simulation: 0,
          total_score: 0,
        };
      }

      logs?.forEach((log) => {
        const el = eleveMap[log.user_id];
        if (el) {
          if (log.type === 'quiz') el.quiz++;
          if (log.type === 'simulation') el.simulation++;
          el.total_score++;
        }
      });

      setParEleve(Object.values(eleveMap));
    };

    fetchDetails();
  }, [selectedClasseId, classes]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      let elevesQuery = supabase
        .from('vue_eleves_classes')
        .select('eleve_id', { count: 'exact', head: true })
        .eq('professeur_id', userId);

      if (selectedClasseId !== 'all') {
        elevesQuery = elevesQuery.eq('classe_id', selectedClasseId);
      }

      let quizQuery = supabase
        .from('vue_quiz_details')
        .select('*', { count: 'exact', head: true })
        .eq('auteur_id', userId);

      let labQuery = supabase
        .from('vue_lab_items_details')
        .select('*', { count: 'exact', head: true })
        .eq('auteur_id', userId);

      let expQuery = supabase
        .from('vue_experience_details')
        .select('*', { count: 'exact', head: true })
        .eq('auteur_id', userId);

      if (selectedClasseId !== 'all') {
        quizQuery = quizQuery.contains('classe_ids', [selectedClasseId]);
        labQuery = labQuery.contains('classe_ids', [selectedClasseId]);
        expQuery = expQuery.contains('classe_ids', [selectedClasseId]);
      }

      const [{ count: quizCount }, { count: labCount }, { count: expCount }, { count: eleveCount }] = await Promise.all([
        quizQuery,
        labQuery,
        expQuery,
        elevesQuery
      ]);

      setQuizCount(quizCount || 0);
      setLab3DCount(labCount || 0);
      setExperienceCount(expCount || 0);
      setElevesCount(eleveCount || 0);
    };

    fetchStats();
  }, [selectedClasseId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-indigo-800">Mes Classes</h1>

      <div>
        <label className="text-sm font-semibold text-gray-600">Classe :</label>
        <select
          onChange={(e) => setSelectedClasseId(e.target.value)}
          value={selectedClasseId}
          className="mt-1 px-3 py-2 border rounded-md text-sm font-medium bg-white text-indigo-700"
        >
          <option value="all">🧩 Toutes mes classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code_classe}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardStat label="Élèves" count={elevesCount} icon={<Users className="h-6 w-6" />} />
        <CardStat label="Expériences" count={experienceCount} icon={<FlaskConical className="h-6 w-6" />} />
        <CardStat label="Quiz" count={quizCount} icon={<FileText className="h-6 w-6" />} />
        <CardStat label="Objets 3D" count={lab3DCount} icon={<Atom className="h-6 w-6" />} />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">👥 Liste des élèves</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">N°</th>
                <th className="text-left px-4 py-2">Nom</th>
                <th className="text-left px-4 py-2">Prénom</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Classe</th>
              </tr>
            </thead>
            <tbody>
              {currentEleves.map((el, index) => {
                const classe = classes.find((c) => c.id === el.classe_id);
                const numero = indexOfFirst + index + 1;
                return (
                  <tr key={el.id} className="bg-white shadow-sm rounded-md">
                    <td className="px-4 py-2 text-gray-500">{numero}</td>
                    <td className="px-4 py-2">{el.name}</td>
                    <td className="px-4 py-2">{el.surname}</td>
                    <td className="px-4 py-2">{el.email}</td>
                    <td className="px-4 py-2 font-medium text-indigo-600">{classe?.code_classe || 'Inconnue'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500">
            Page {currentPage} / {totalPages || 1}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <TopEleves data={parEleve} onSelectEleve={setSelectedEleve} />
      {selectedEleve && <EleveDetail eleve={selectedEleve} onClose={() => setSelectedEleve(null)} />}
    </div>
  );
}
