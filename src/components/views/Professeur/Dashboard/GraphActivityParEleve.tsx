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
  selectedClasse?: string | 'all'; // optionnel si géré localement
  onClasseChange?: (classe: string) => void;
};

export default function GraphActivityParEleve({ data, classes, selectedClasse: externalClasse = 'all', onClasseChange }: Props) {
  const [internalClasse, setInternalClasse] = useState<'all' | string>(externalClasse || 'all');
  const selectedClasse = onClasseChange ? externalClasse : internalClasse;

  const handleClasseChange = (value: string) => {
    if (onClasseChange) {
      onClasseChange(value);
    } else {
      setInternalClasse(value);
    }
  };

  const filtered = selectedClasse === 'all'
    ? data
    : data.filter((e) => e.classe === selectedClasse);

  return (
    <div className="mt-24 mb-20 bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6 text-gray-800">
      {/* 🔖 Titre & Sélecteur */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          Activité par Élève
          {selectedClasse !== 'all' && ` — Classe ${selectedClasse}`}
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Classe :</label>
          <select
            value={selectedClasse}
            onChange={(e) => handleClasseChange(e.target.value)}
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

      {/* 📊 Graphe ou Message */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm italic">Aucune activité enregistrée pour cette classe.</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#4B5563" tick={{ fontSize: 12 }} />
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
