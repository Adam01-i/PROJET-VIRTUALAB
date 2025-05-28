import { Clock, Beaker, ArrowRight } from 'lucide-react';
import type { Experience } from '../../../../types/Experience/experience';

type ExperienceCardProps = {
  experience: Experience;
  onStart: (experienceId: string) => void;
  isLocal?: boolean;
};

export default function ExperienceCard({ experience, onStart, isLocal }: ExperienceCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group relative">
      {isLocal && (
        <div className="absolute top-2 right-2 bg-violet-100 text-violet-700 text-xs font-semibold px-2 py-0.5 rounded-md shadow-sm">
          Locale
        </div>
      )}

      <div className="h-36 relative overflow-hidden">
        <img 
          src={experience.image} 
          alt={experience.titre} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full shadow-sm">
            {experience.niveau}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-1">{experience.titre}</h3>
        <p className="text-gray-600 text-sm mb-2 leading-relaxed line-clamp-2">
          {experience.description}
        </p>

        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Beaker size={14} />
            <span>{experience.materiel.length} éléments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{experience.duree}</span>
          </div>
        </div>

        <button 
          onClick={() => onStart(experience.id)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
        >
          <span>Commencer</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
