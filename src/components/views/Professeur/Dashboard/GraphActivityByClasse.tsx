import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function GraphActivityByClasse({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Activité par Classe</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="classe" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="simulation" stackId="a" fill="#6366F1" name="Simulations" />
          <Bar dataKey="quiz" stackId="a" fill="#10B981" name="Quiz" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
