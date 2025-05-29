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

type Props = {
  data: {
    classe: string;
    simulation: number;
    quiz: number;
    objet3d: number;
  }[];
  classes: { id: string; code_classe: string }[];
};

export default function GraphActivityByClasse({ data, classes }: Props) {
  const [selectedClasse, setSelectedClasse] = useState<'all' | string>('all');

  const filteredData =
    selectedClasse === 'all'
      ? data
      : data.filter((d) => d.classe === selectedClasse);

  return (
    <div className="mt-12 bg-white p-6 sm:p-8 rounded-xl shadow-md space-y-6 text-gray-800">
      {/* 🧭 Titre + Sélecteur */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Activité par Classe</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="classe" className="text-sm text-gray-600">
            Classe :
          </label>
          <select
            id="classe"
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="border px-3 py-1.5 rounded-md text-sm text-indigo-700 focus:ring-indigo-500 focus:border-indigo-500"
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

      {/* 📊 Graphe en colonnes empilées */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredData}>
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
    </div>
  );
}
