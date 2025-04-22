import { Clock, Beaker, ArrowRight } from 'lucide-react';
import type { Experience } from '../../../../types/Experience/experience';

type ExperienceCardProps = {
  experience: Experience;
  onStart: (experienceId: string) => void;
};

export default function ExperienceCard({ experience, onStart }: ExperienceCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 border border-white/10 group">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={experience.image} 
          alt={experience.titre} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full">
            {experience.niveau}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-white">{experience.titre}</h3>
        <p className="text-purple-200 mb-4 line-clamp-2">{experience.description}</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-purple-300">
            <Beaker size={16} />
            <span>{experience.materiel.length} éléments</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-300">
            <Clock size={16} />
            <span>{experience.duree}</span>
          </div>
        </div>
        <button 
          onClick={() => onStart(experience.id)}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Commencer l'expérience</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}