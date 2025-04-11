import { useState } from 'react';
import { Book, Plus, Clock, Beaker, ListChecks } from 'lucide-react';
import { experienceData } from '../../data/Experience/experienceData';  // Correction ici
import type { Experience } from '../../types/Experience/experience';

export default function ExperienceView() {
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  return (
    <div className="grid grid-cols-12 gap-3 h-[calc(100vh-8rem)]">
      <div className="col-span-3 bg-white/5 backdrop-blur-lg rounded-xl p-6  border border-white/10 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Expériences</h2>
          <button className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-all duration-200">
            <Plus size={20} />
          </button>
        </div>
        <div className="space-y-3">
          {experienceData.map((exp) => (  // Utilisez experienceData ici
            <button
              key={exp.id}
              onClick={() => setSelectedExperience(exp)}
              className={`w-full p-4 rounded-lg transition-all duration-200 text-left ${
                selectedExperience?.id === exp.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-purple-200 hover:bg-white/10'
              }`}
            >
              <h3 className="font-medium mb-2">{exp.titre}</h3>
              <div className="flex items-center justify-between text-sm opacity-80">
                <div className="flex items-center space-x-2">
                  <Clock size={14} />
                  <span>{exp.duree}</span>
                </div>
                <span>{exp.niveau}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
        {selectedExperience ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedExperience.titre}</h2>
              <div className="flex items-center space-x-4 text-purple-300">
                <div className="flex items-center space-x-2">
                  <Clock size={16} />
                  <span>{selectedExperience.duree}</span>
                </div>
                <span>{selectedExperience.niveau}</span>
              </div>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center text-purple-200">
                <Beaker size={48} className="mx-auto mb-4" />
                <p>Zone de manipulation de l'expérience</p>
                <p className="text-sm mt-2">Interface interactive en développement</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-purple-200">
            <p>Sélectionnez une expérience pour commencer</p>
          </div>
        )}
      </div>

      <div className="col-span-3 space-y-6">
        {selectedExperience ? (
          <>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Book size={20} />
                <span>Explications</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-purple-300 font-medium mb-2">Description</h4>
                  <p className="text-purple-200">{selectedExperience.description}</p>
                </div>
                <div>
                  <h4 className="text-purple-300 font-medium mb-2">Objectifs</h4>
                  <ul className="space-y-2">
                    {selectedExperience.objectifs.map((obj, index) => (
                      <li key={index} className="flex items-start space-x-2 text-purple-200">
                        <div className="w-1.5 h-1.5 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-purple-300 font-medium mb-2">Matériel nécessaire</h4>
                  <ul className="space-y-2">
                    {selectedExperience.materiel.map((mat, index) => (
                      <li key={index} className="flex items-start space-x-2 text-purple-200">
                        <div className="w-1.5 h-1.5 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
                        <span>{mat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <ListChecks size={20} />
                <span>Résultats Attendus</span>
              </h3>
              <ul className="space-y-3">
                {selectedExperience.resultatsAttendus.map((resultat, index) => (
                  <li key={index} className="flex items-start space-x-3 text-purple-200">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
                    <span>{resultat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center text-purple-200">
            <Book size={40} className="mx-auto mb-4 text-purple-300" />
            <p>Sélectionnez une expérience pour voir les détails</p>
          </div>
        )}
      </div>
    </div>
  );
}
