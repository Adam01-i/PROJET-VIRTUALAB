import { Beaker } from 'lucide-react';
import type { Experience } from '../../../../types/Experience/experience';

type ProfExpCardProps = {
  experience: Experience;
  classeNom?: string; // ✅ Ajout
  onEdit: (exp: Experience) => void;
  onDelete: (id: string) => void;
};

export default function ProfExpCard({
  experience,
  classeNom,
  onEdit,
  onDelete,
}: ProfExpCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition">
      <div className="h-40 relative overflow-hidden">
        <img
          src={experience.image}
          alt={experience.titre}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 flex gap-2">
          {classeNom && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">
              📘 {classeNom}
            </span>
          )}

        </div>
      </div>

      <div className="p-4 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-800 flex items-center gap-1">
          <Beaker size={14} /> {experience.titre}
        </h3>
        <p className="text-gray-600">{experience.description}</p>

        <div className="flex justify-between text-xs text-gray-500">
          <span>⏱ {experience.duree}</span>
          <span className="px-2 py-0.5 text-indigo-700 text-sm rounded">
            {experience.niveau}
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEdit(experience)}
            className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-900"
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
