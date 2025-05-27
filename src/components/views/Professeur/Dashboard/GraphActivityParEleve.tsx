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

type EleveActivite = {
  id: string;
  name: string;
  classe: string;
  quiz: number;
  simulation: number;
  objet3d: number;
  total_score: number;
};

type Classe = {
  id: string;
  code_classe: string;
};

type Props = {
  data: EleveActivite[];
  classes: Classe[];
  selectedClasse: string | 'all';
  onClasseChange: (classe: string) => void;
};


export default function GraphActivityParEleve({ data, classes }: Props) {
  const [selectedClasse, setSelectedClasse] = useState<'all' | string>('all');

  const filtered = selectedClasse === 'all'
    ? data
    : data.filter((e) => e.classe === selectedClasse);

  return (
    <div className="mt-12 bg-white rounded-xl shadow p-6 space-y-6">
      {/* 📌 Titre + filtre */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">
          📊 Activité par Élève
          {selectedClasse !== 'all' && ` — Classe ${selectedClasse}`}
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Classe :</label>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="border px-2 py-1 rounded text-sm text-indigo-700"
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

      {/* 📈 Graphe */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">Aucune activité enregistrée pour cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#4B5563" />
            <YAxis stroke="#4B5563" allowDecimals={false} />
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
