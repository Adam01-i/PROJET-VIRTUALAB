import * as React from 'react';

export default function CardStat({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-300">
      <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="text-sm text-gray-500">{label}</h3>
        <p className="text-3xl font-bold text-indigo-700 transition-all duration-500">{count}</p>
      </div>
    </div>
  );
}
