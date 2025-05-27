'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import CardStat from '../../../ui/CardStat';

import ActivityByClass from './ActivityByClass';
import ActivityByProf from './ActivityByProf';
import ActivityByEleve from './ActivityByEleve';

type Classe = {
  id: string;
  code_classe: string;
};

type Profile = {
  id: string;
  name: string;
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ professeurs: 0, eleves: 0, classes: 0 });
  const [classes, setClasses] = useState<Classe[]>([]);
  const [professeurs, setProfesseurs] = useState<Profile[]>([]);
  const [eleves, setEleves] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [prof, eleves, cls, profList, eleveList] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professeur'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'eleve'),
        supabase.from('classes').select('id, code_classe'),
        supabase.from('profiles').select('id, name').eq('role', 'professeur'),
        supabase.from('profiles').select('id, name').eq('role', 'eleve'),
      ]);

      setCounts({
        professeurs: prof.count ?? 0,
        eleves: eleves.count ?? 0,
        classes: cls.data?.length ?? 0,
      });

      setClasses(cls.data || []);
      setProfesseurs(profList.data || []);
      setEleves(eleveList.data || []);
    };

    fetchInitialData();
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
      label: 'Classes',
      count: counts.classes,
      icon: <BuildingLibraryIcon className="h-6 w-6 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-10 px-4 py-6">
      <h1 className="text-3xl font-extrabold text-indigo-900 mb-4">🎛️ Tableau de bord pédagogique</h1>

      {/* 🔢 Statistiques de base */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <CardStat key={index} label={card.label} count={card.count} icon={card.icon} />
        ))}
      </div>

      {/* 📊 Activité par professeur */}
      <ActivityByProf professeurs={professeurs} />

      {/* 👨‍🎓 Activité par élève */}
      <ActivityByEleve eleves={eleves} />

      {/* 🏫 Activité par classe */}
      <ActivityByClass classes={classes} />
    </div>
  );
}
