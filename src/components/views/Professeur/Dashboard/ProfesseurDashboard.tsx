'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import CardStat from '../../../ui/CardStat';
import GraphActivityByClasse from './GraphActivityByClasse';
import TopEleves from './TopEleves';
import InactiveEleves from './InactiveEleves';
import EleveDetail from './EleveDetail';
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type Classe = { id: string; code_classe: string; };
type EleveActivite = {
  id: string; name: string; classe: string;
  quiz: number; simulation: number; total: number;
};
type ActiviteClasse = { classe: string; quiz: number; simulation: number; };

export default function ProfesseurDashboard() {
  const [period, setPeriod] = useState<'7j' | '30j'>('7j');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasse, setSelectedClasse] = useState<string | 'all'>('all');
  const [parClasse, setParClasse] = useState<ActiviteClasse[]>([]);
  const [parEleve, setParEleve] = useState<EleveActivite[]>([]);
  const [selectedEleve, setSelectedEleve] = useState<EleveActivite | null>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    const since = new Date();
    since.setDate(since.getDate() - (period === '7j' ? 7 : 30));

    // Récupérer les classes du prof
    const { data: mesClasses, error: err1 } = await supabase.from('mes_classes').select('*');
    if (err1 || !mesClasses) return console.error("Classes error:", err1);
    setClasses(mesClasses);

    // Récupérer les liens élèves ↔ classes
    const { data: elevesClasses, error: err2 } = await supabase
      .from('eleves_classes')
      .select('eleve_id, classe_id')
      .in('classe_id', mesClasses.map((c) => c.id));
    if (err2 || !elevesClasses) return console.error("eleves_classes error:", err2);

    const eleveIds = elevesClasses.map(e => e.eleve_id);
    const classeMap: Record<string, string> = {};
    elevesClasses.forEach(e => {
      const cl = mesClasses.find(c => c.id === e.classe_id);
      if (cl) classeMap[e.eleve_id] = cl.code_classe;
    });

    // Récupérer les profils
    const { data: profils, error: err3 } = await supabase
      .from('profiles')
      .select('id, name, surname')
      .in('id', eleveIds);
    if (err3 || !profils) return console.error("Profils error:", err3);

    // Récupérer les logs
    const { data: logs, error: err4 } = await supabase
      .from('activity_logs')
      .select('user_id, created_at, type')
      .in('user_id', eleveIds)
      .gte('created_at', since.toISOString());
    if (err4 || !logs) return console.error("Logs error:", err4);

    // Préparer les activités par élève
    const eleveMap: Record<string, EleveActivite> = {};
    for (let e of profils) {
      const classe = classeMap[e.id] || 'Inconnue';
      eleveMap[e.id] = {
        id: e.id,
        name: `${e.name ?? ''} ${e.surname ?? ''}`.trim(),
        classe,
        quiz: 0,
        simulation: 0,
        total: 0,
      };
    }

    logs.forEach((log) => {
      const el = eleveMap[log.user_id];
      if (el) {
        if (log.type === 'quiz') el.quiz++;
        if (log.type === 'simulation') el.simulation++;
        el.total++;
      }
    });

    // Agrégation par classe
    const classeAgg: Record<string, ActiviteClasse> = {};
    Object.values(eleveMap).forEach((e) => {
      if (!classeAgg[e.classe]) {
        classeAgg[e.classe] = { classe: e.classe, quiz: 0, simulation: 0 };
      }
      classeAgg[e.classe].quiz += e.quiz;
      classeAgg[e.classe].simulation += e.simulation;
    });

    setParClasse(Object.values(classeAgg));
    setParEleve(Object.values(eleveMap));
  }

  const totalActivites = parEleve.reduce((acc, e) => acc + e.total, 0);
  const filteredClasseData = selectedClasse === 'all'
    ? parClasse
    : parClasse.filter(c => c.classe === selectedClasse);

  return (
    <div className="space-y-10 p-6">
      <h1 className="text-3xl font-bold text-indigo-900">🎓 Tableau de bord professeur</h1>

      {/* 🔄 Sélecteur de période */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <span className="mr-2 text-sm text-gray-600">Période :</span>
          {['7j', '30j'].map(opt => (
            <button key={opt} onClick={() => setPeriod(opt as '7j' | '30j')}
              className={`px-3 py-1 text-sm rounded-full mr-2 border ${period === opt
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}>
              {opt === '7j' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>

        {/* 📌 Filtrer une classe */}
        <div>
          <span className="mr-2 text-sm text-gray-600">Classe :</span>
          <select
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">Toutes</option>
            {classes.map((cl) => (
              <option key={cl.id} value={cl.code_classe}>
                {cl.code_classe}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardStat label="Mes classes" count={classes.length} icon={<AcademicCapIcon className="h-6 w-6" />} />
        <CardStat label="Élèves suivis" count={parEleve.length} icon={<UserGroupIcon className="h-6 w-6" />} />
        <CardStat label="Activités" count={totalActivites} icon={<ChartBarIcon className="h-6 w-6" />} />
      </div>

      {/* 📈 Graphe activité */}
      <GraphActivityByClasse data={filteredClasseData} />

      {/* 🏅 Top élèves */}
      <TopEleves data={parEleve} onSelectEleve={setSelectedEleve} />

      {/* 😴 Élèves inactifs */}
      <InactiveEleves data={parEleve} onSelectEleve={setSelectedEleve} />

      {/* 🔍 Vue détaillée */}
      {selectedEleve && <EleveDetail eleve={selectedEleve} onClose={() => setSelectedEleve(null)} />}
    </div>
  );
}
