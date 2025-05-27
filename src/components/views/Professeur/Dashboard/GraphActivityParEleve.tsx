
'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { EleveActivite } from './types'; // Adjust this import to your project structure

type Props = {
  data: EleveActivite[];
  selectedClasse: string | 'all';
};

export default function GraphActivityParEleve({ data, selectedClasse }: Props) {
  const filtered = selectedClasse === 'all'
    ? data
    : data.filter((e) => e.classe === selectedClasse);

  return (
    <div className="mt-10 bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">
        📊 Activité par élève {selectedClasse !== 'all' && `— Classe ${selectedClasse}`}
      </h2>

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
            <Bar dataKey="simulation" stackId="a" fill="#818CF8" name="Simulations" />
            <Bar dataKey="quiz" stackId="a" fill="#34D399" name="Quiz" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
