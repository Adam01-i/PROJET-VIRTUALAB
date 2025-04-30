import { Clock, Beaker, ArrowRight } from 'lucide-react';
import type { Experience } from '../../../../types/Experience/experience';

type ExperienceCardProps = {
  experience: Experience;
  onStart: (experienceId: string) => void;
};

export default function ExperienceCard({ experience, onStart }: ExperienceCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-lg overflow-hidden border border-white/10 hover:shadow-md transition-all duration-200 group">
      <div className="h-44 overflow-hidden relative">
        <img 
          src={experience.image} 
          alt={experience.titre} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="px-2.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
            {experience.niveau}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold mb-1 text-white">{experience.titre}</h3>
        <p className="text-purple-200 mb-3 text-sm line-clamp-2">{experience.description}</p>
        
        <div className="flex items-center justify-between mb-3 text-xs text-purple-300">
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
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>Commencer</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
