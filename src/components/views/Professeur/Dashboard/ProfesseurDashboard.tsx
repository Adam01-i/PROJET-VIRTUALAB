'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import CardStat from '../../../ui/CardStat';
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import GraphActivityByClasse from './GraphActivityByClasse';
import GraphActivityParEleve from './GraphActivityParEleve';

type Classe = { id: string; code_classe: string };
type EleveActivite = {
  id: string;
  name: string;
  classe: string;
  quiz: number;
  simulation: number;
  objet3d: number;
  total_score: number;
};
type ActiviteClasse = {
  classe: string;
  quiz: number;
  simulation: number;
  objet3d: number;
};

export default function ProfesseurDashboard() {
  const [period] = useState<'7j' | '30j'>('7j');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseEleve, setSelectedClasseEleve] = useState<string | 'all'>('all');

  const [parClasse, setParClasse] = useState<ActiviteClasse[]>([]);
  const [parEleve, setParEleve] = useState<EleveActivite[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    const since = new Date();
    since.setDate(since.getDate() - (period === '7j' ? 7 : 30));

    const [{ data: mesClasses }, { data: elevesClasses }] = await Promise.all([
      supabase.from('mes_classes').select('*'),
      supabase.from('eleves_classes').select('eleve_id, classe_id'),
    ]);

    if (!mesClasses || !elevesClasses) return;

    setClasses(mesClasses);

    const classeMap: Record<string, string> = {};
    const eleveIds: string[] = [];

    elevesClasses.forEach(({ eleve_id, classe_id }) => {
      const cl = mesClasses.find((c) => c.id === classe_id);
      if (cl) {
        classeMap[eleve_id] = cl.code_classe;
        eleveIds.push(eleve_id);
      }
    });

    const [{ data: profils }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('id, name, surname').in('id', eleveIds),
      supabase
        .from('activity_logs')
        .select('user_id, created_at, type')
        .in('user_id', eleveIds)
        .gte('created_at', since.toISOString()),
    ]);

    if (!profils || !logs) return;

    const eleveMap: Record<string, EleveActivite> = {};
    for (const e of profils) {
      eleveMap[e.id] = {
        id: e.id,
        name: `${e.name ?? ''} ${e.surname ?? ''}`.trim(),
        classe: classeMap[e.id] || 'Inconnue',
        quiz: 0,
        simulation: 0,
        objet3d: 0,
        total_score: 0,
      };
    }

    logs.forEach(({ user_id, type }) => {
      const el = eleveMap[user_id];
      if (!el) return;
      if (type === 'quiz') el.quiz++;
      if (type === 'simulation') el.simulation++;
      if (type === 'objet3d') el.objet3d++;
      el.total_score++;
    });

    const classeAgg: Record<string, ActiviteClasse> = {};
    Object.values(eleveMap).forEach(({ classe, quiz, simulation, objet3d }) => {
      if (!classeAgg[classe]) {
        classeAgg[classe] = { classe, quiz: 0, simulation: 0, objet3d: 0 };
      }
      classeAgg[classe].quiz += quiz;
      classeAgg[classe].simulation += simulation;
      classeAgg[classe].objet3d += objet3d;
    });

    setParClasse(Object.values(classeAgg));
    setParEleve(Object.values(eleveMap));
  }

  const totalActivites = parEleve.reduce((acc, e) => acc + e.total_score, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-indigo-800">Tableau de bord Professeur</h1>

      {/* 📊 Statistiques */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardStat label="Mes classes" count={classes.length} icon={<AcademicCapIcon className="h-6 w-6" />} />
        <CardStat label="Élèves suivis" count={parEleve.length} icon={<UserGroupIcon className="h-6 w-6" />} />
        <CardStat label="Activités" count={totalActivites} icon={<ChartBarIcon className="h-6 w-6" />} />
      </div>

      {/* 📈 Graphes */}
      <GraphActivityByClasse data={parClasse} classes={classes} />

      <GraphActivityParEleve
        data={parEleve}
        classes={classes}
        selectedClasse={selectedClasseEleve}
        onClasseChange={setSelectedClasseEleve}
      />
    </div>
  );
}
