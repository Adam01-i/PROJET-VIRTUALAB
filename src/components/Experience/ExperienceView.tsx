import { useState } from 'react';
import { experienceData } from '../../data/Experience/experienceData';
import ExperienceCard from './ExperienceCard';
import ExperienceDetailView from './ExperienceDetailView';

export default function ExperienceView() {
  const [activeExperience, setActiveExperience] = useState<string | null>(null);

  const handleStartExperience = (experienceId: string) => {
    setActiveExperience(experienceId);
  };

  const currentExperience = activeExperience 
    ? experienceData.find(e => e.id === activeExperience) 
    : null;

  if (currentExperience) {
    return (
      <ExperienceDetailView
        experience={currentExperience}
        onBack={() => setActiveExperience(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-white">Expériences disponibles</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experienceData.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            onStart={handleStartExperience}
          />
        ))}
      </div>
    </div>
  );
}