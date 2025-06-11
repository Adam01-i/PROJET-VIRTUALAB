'use client';

import { Beaker } from 'lucide-react';
import type { Experience } from '../../../../types/Experience/experience';

type ProfExpCardProps = {
  experience: Experience;
  classeNoms?: string[];
  classeAffichage?: string;
  onEdit: (exp: Experience) => void;
  onDelete: (id: string) => void;
};

export default function ProfExpCard({
  experience,
  classeNoms = [],
  onEdit,
  onDelete,
}: ProfExpCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition">
      <div className="h-40 relative overflow-hidden">
        <img
          src={experience.image || '/default-experience.jpg'}
          alt={experience.titre}
          className="w-full h-full object-cover"
        />
        {classeNoms.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {classeNoms.map((nom) => (
              <span
                key={nom}
                className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded shadow"
              >
                📘 {nom}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-800 flex items-center gap-1">
          <Beaker size={14} /> {experience.titre}
        </h3>
        <p className="text-gray-600 line-clamp-3">{experience.description}</p>

        <div className="flex justify-between text-xs text-gray-500">
          <span>⏱ {experience.duree}</span>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
            {experience.niveau}
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEdit(experience)}
            className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-800"
          >
            ✏️ Modifier
          </button>
          <button
            onClick={() => onDelete(experience.id)}
            className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded hover:bg-red-700"
          >
            🗑 Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
