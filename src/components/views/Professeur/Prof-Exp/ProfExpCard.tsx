import { Beaker, Pencil, Trash2 } from 'lucide-react';
import type { Experience } from '../../../../types/Experience/experience';

type ProfExpCardProps = {
  experience: Experience;
  onEdit: (exp: Experience) => void;
  onDelete: (id: string) => void;
  onSelect?: () => void; // ✅ Ajout ici
};

export default function ProfExpCard({
  experience,
  onEdit,
  onDelete,
}: ProfExpCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
      <div className="h-40 overflow-hidden relative">
        <img
          src={experience.image}
          alt={experience.titre}
          className="w-full h-full object-cover transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs rounded-full shadow">
            {experience.niveau}
          </span>
        </div>
      </div>

      <div className="p-4 text-sm text-gray-800">
        <h3 className="text-base font-semibold mb-1 flex items-center gap-1">
          <Beaker size={14} />
          {experience.titre}
        </h3>
        <p className="text-gray-600 mb-2">{experience.description}</p>

        <div className="flex justify-between text-gray-500 text-xs mb-4">
          <span>{experience.duree}</span>
          <span>{experience.simulationPath ? "🧩 Simulation liée" : "–"}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(experience)}
            className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center justify-center gap-1"
          >
            <Pencil size={14} />
            Modifier
          </button>
          <button
            onClick={() => onDelete(experience.id)}
            className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md flex items-center justify-center gap-1"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
