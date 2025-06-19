'use client';

import { useState } from 'react';
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

type Classe = {
  id: string;
  code_classe: string;
};

type ActiviteClasse = {
  classe: string;
  quiz: number;
  simulation: number;
  objet3d: number;
  created_at?: string;
};

type Props = {
  data: ActiviteClasse[];
  classes: Classe[];
};

export default function GraphActivityByClasse({ data, classes }: Props) {
  const [selectedClasse, setSelectedClasse] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState<'1j' | '7j' | '30j' | 'tout'>('tout');

  const getSinceDate = (range: typeof dateRange) => {
    if (range === 'tout') return null;
    const d = new Date();
    const days = range === '1j' ? 1 : range === '7j' ? 7 : 30;
    d.setDate(d.getDate() - days);
    return d;
  };

  const sinceDate = getSinceDate(dateRange);

  const filteredLogs = data.filter((d) => {
    const matchClasse = selectedClasse === 'all' || d.classe === selectedClasse;
    const matchDate = !sinceDate || (d.created_at && new Date(d.created_at) >= sinceDate);
    return matchClasse && matchDate;
  });

  // ✅ Agréger les activités par classe
  const aggregatedData = Object.values(
    filteredLogs.reduce<Record<string, ActiviteClasse>>((acc, curr) => {
      if (!acc[curr.classe]) {
        acc[curr.classe] = {
          classe: curr.classe,
          quiz: 0,
          simulation: 0,
          objet3d: 0,
        };
      }
      acc[curr.classe].quiz += curr.quiz;
      acc[curr.classe].simulation += curr.simulation;
      acc[curr.classe].objet3d += curr.objet3d;
      return acc;
    }, {})
  );

  return (
    <div className="mt-12 bg-white p-6 sm:p-8 rounded-xl shadow-md space-y-6 text-gray-800">
      {/* 🧭 Filtres */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Activité par Classe</h2>

        <div className="flex flex-wrap gap-4 items-center">
          {/* 🎓 Filtre classe */}
          <div className="flex items-center gap-2">
            <label htmlFor="classe" className="text-sm text-gray-600">
              Classe :
            </label>
            <select
              id="classe"
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              className="border px-3 py-1.5 rounded-md text-sm text-indigo-700"
            >
              <option value="all">Toutes</option>
              {classes.map((cl) => (
                <option key={cl.id} value={cl.code_classe}>
                  {cl.code_classe}
                </option>
              ))}
            </select>
          </div>

          {/* 📅 Filtre période */}
          <div className="flex items-center gap-2">
            <label htmlFor="periode" className="text-sm text-gray-600">
              Période :
            </label>
            <select
              id="periode"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="border px-3 py-1.5 rounded-md text-sm text-indigo-700"
            >
              <option value="1j">Aujourd'hui</option>
              <option value="7j">7 derniers jours</option>
              <option value="30j">30 derniers jours</option>
              <option value="tout">Tout</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📊 Graphe ou message */}
      {aggregatedData.length === 0 ? (
        <p className="text-sm text-gray-500 italic mt-4">
          Aucune activité enregistrée pour cette sélection.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aggregatedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="classe" stroke="#4B5563" tick={{ fontSize: 12 }} />
            <YAxis stroke="#4B5563" allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="simulation" stackId="a" fill="#6366F1" name="Simulations" />
            <Bar dataKey="quiz" stackId="a" fill="#10B981" name="Quiz" />
            <Bar dataKey="objet3d" stackId="a" fill="#F59E0B" name="Objets 3D" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
