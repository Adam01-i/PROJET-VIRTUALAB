'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import CardStat from '../../../ui/CardStat';
import GraphActivityByClasse from './GraphActivityByClasse';
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import GraphActivityParEleve from './GraphActivityParEleve';

type Classe = { id: string; code_classe: string };
type EleveActivite = {
  id: string;
  name: string;
  classe: string;
  quiz: number;
  simulation: number;
  total: number;
};
type ActiviteClasse = { classe: string; quiz: number; simulation: number };

export default function ProfesseurDashboard() {
  const [period, setPeriod] = useState<'7j' | '30j'>('7j');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasse, setSelectedClasse] = useState<string | 'all'>('all');
  const [parClasse, setParClasse] = useState<ActiviteClasse[]>([]);
  const [parEleve, setParEleve] = useState<EleveActivite[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    const since = new Date();
    since.setDate(since.getDate() - (period === '7j' ? 7 : 30));

    const [{ data: mesClasses, error: err1 }, { data: elevesClasses, error: err2 }] = await Promise.all([
      supabase.from('mes_classes').select('*'),
      supabase.from('eleves_classes').select('eleve_id, classe_id'),
    ]);

    if (err1 || !mesClasses) return console.error('Erreur chargement classes', err1);
    if (err2 || !elevesClasses) return console.error('Erreur chargement élèves', err2);

    setClasses(mesClasses);

    // 🧠 Mapper élève_id → code_classe
    const classeMap: Record<string, string> = {};
    const eleveIds: string[] = [];
    elevesClasses.forEach(({ eleve_id, classe_id }) => {
      const classe = mesClasses.find((c) => c.id === classe_id);
      if (classe) {
        classeMap[eleve_id] = classe.code_classe;
        eleveIds.push(eleve_id);
      }
    });

    const [{ data: profils, error: err3 }, { data: logs, error: err4 }] = await Promise.all([
      supabase.from('profiles').select('id, name, surname').in('id', eleveIds),
      supabase
        .from('activity_logs')
        .select('user_id, created_at, type')
        .in('user_id', eleveIds)
        .gte('created_at', since.toISOString()),
    ]);

    if (err3 || !profils) return console.error('Erreur chargement profils', err3);
    if (err4 || !logs) return console.error('Erreur chargement logs', err4);

    // 🎯 Initialiser structure élève
    const eleveMap: Record<string, EleveActivite> = {};
    for (const e of profils) {
      eleveMap[e.id] = {
        id: e.id,
        name: `${e.name ?? ''} ${e.surname ?? ''}`.trim(),
        classe: classeMap[e.id] || 'Inconnue',
        quiz: 0,
        simulation: 0,
        total: 0,
      };
    }

    // 📊 Compter les activités
    logs.forEach(({ user_id, type }) => {
      const el = eleveMap[user_id];
      if (!el) return;
      if (type === 'quiz') el.quiz++;
      if (type === 'simulation') el.simulation++;
      el.total++;
    });

    // 📈 Agrégation par classe
    const classeAgg: Record<string, ActiviteClasse> = {};
    Object.values(eleveMap).forEach(({ classe, quiz, simulation }) => {
      if (!classeAgg[classe]) {
        classeAgg[classe] = { classe, quiz: 0, simulation: 0 };
      }
      classeAgg[classe].quiz += quiz;
      classeAgg[classe].simulation += simulation;
    });

    setParEleve(Object.values(eleveMap));
    setParClasse(Object.values(classeAgg));
  }

  const totalActivites = parEleve.reduce((acc, e) => acc + e.total, 0);
  const filteredClasseData = selectedClasse === 'all'
    ? parClasse
    : parClasse.filter((c) => c.classe === selectedClasse);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo-800">Tableau de bord </h1>

      {/* 🔄 Sélecteurs */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <span className="mr-2 text-x font-semibold text-gray-600">Période :</span>
          {['7j', '30j'].map((opt) => (
            <button
              key={opt}
              onClick={() => setPeriod(opt as '7j' | '30j')}
              className={`px-3 py-1 text-sm rounded-full mr-2 border ${
                period === opt
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {opt === '7j' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>

        <div>
          <span className="mr-2 text-x font-semibold text-gray-600">Classe :</span>
          <select
            onChange={(e) => setSelectedClasse(e.target.value)}
            value={selectedClasse}
            className="border rounded px-2 py-1 font-semibold text-x bg-white text-indigo-600"
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

      {/* 📊 Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardStat
          label="Mes classes"
          count={classes.length}
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
        <CardStat
          label="Élèves suivis"
          count={parEleve.length}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <CardStat
          label="Activités"
          count={totalActivites}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
      </div>

      {/* 📈 Graphe */}
      <GraphActivityByClasse data={filteredClasseData} />
      <GraphActivityParEleve data={parEleve} selectedClasse={selectedClasse} />
    </div>
  );
}
