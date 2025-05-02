import { useCallback, useState } from "react";
import {
  FlaskRound as Flask,
  Clock,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Book,
  ListChecks,
} from "lucide-react";
import type { Experience } from "../../../../types/Experience/experience";
import { lazy, Suspense } from "react";




// Fonction pour charger dynamiquement une simulation
const loadSimulationComponent = (fileName: string) => {
  return lazy(() => import(`../../../../simulations/${fileName}`));
};

type ExperienceDetailViewProps = {
  experience: Experience;
  onBack: () => void;
};

export default function ExperienceDetailView({
  experience,
  onBack,
}: ExperienceDetailViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const renderSimulation = () => {
    if (!experience.simulationPath) {
      return (
        <div className="text-center text-purple-200">
          <Flask size={40} className="mx-auto mb-2" />
          <p className="text-base font-medium">Zone de simulation interactive</p>
        </div>
      );
    }
  
    // Charger dynamiquement le composant simulation depuis le chemin indiqué
    const SimulationComponent = loadSimulationComponent(experience.simulationPath);
  
    return (
      <Suspense fallback={<div className="text-white">Chargement de la simulation...</div>}>
        <SimulationComponent />
      </Suspense>
    );
  };
  
  const SimulationContainer = ({ height }: { height: string }) => (
    <div
      className={`relative ${height} bg-indigo-900/50 rounded-md flex items-center justify-center`}
    >
      {renderSimulation()}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex flex-col">
        <div className="flex-1 flex flex-col space-y-4">
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-md border border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">{experience.titre}</h2>
                  <div className="flex items-center gap-4 text-purple-300 text-sm mt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{experience.duree}</span>
                    </div>
                    <span>{experience.niveau}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleFullscreen}
                className="bg-white/5 hover:bg-white/10 text-purple-200 px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
              >
                <Minimize2 size={16} />
                <span>Quitter</span>
              </button>
            </div>
            <SimulationContainer height="h-[calc(100%-4rem)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-0 py-0">
      <div className="grid grid-cols-4 gap-5">
        {/* Simulation */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white/5 backdrop-blur-md rounded-md p-4 border border-white/10 h-[650px]">
            <div className="p-1 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">{experience.titre}</h2>
                  <div className="flex items-center gap-4 text-purple-300 text-sm mt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{experience.duree}</span>
                    </div>
                    <span>{experience.niveau}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleFullscreen}
                className="bg-white/5 hover:bg-white/10 text-purple-200 px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
              >
                <Maximize2 size={16} />
                <span>Plein écran</span>
              </button>
            </div>
            <SimulationContainer height="h-[570px]" />
          </div>
        </div>

        {/* Explications */}
        <div className="col-span-1 space-y-5">
          <div className="bg-white/5 backdrop-blur-md rounded-md p-4 border border-white/10 max-h-[400px] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Book size={18} />
              <span>Explications</span>
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-purple-300 font-medium mb-1">Description</h4>
                <p className="text-purple-200">{experience.description}</p>
              </div>
              <div>
                <h4 className="text-purple-300 font-medium mb-1">Objectifs</h4>
                <ul className="space-y-1.5">
                  {experience.objectifs.map((obj, index) => (
                    <li key={index} className="flex gap-2 text-purple-200">
                      <div className="w-1.5 h-1.5 mt-1 rounded-full bg-purple-500 flex-shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-purple-300 font-medium mb-1">Matériel nécessaire</h4>
                <ul className="space-y-1.5">
                  {experience.materiel.map((mat, index) => (
                    <li key={index} className="flex gap-2 text-purple-200">
                      <div className="w-1.5 h-1.5 mt-1 rounded-full bg-purple-500 flex-shrink-0" />
                      <span>{mat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Résultats attendus */}
          <div className="bg-white/5 backdrop-blur-md rounded-md p-4 border border-white/10 max-h-[250px] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <ListChecks size={18} />
              <span>Résultats Attendus</span>
            </h3>
            <ul className="space-y-2 text-sm text-purple-200">
              {experience.resultatsAttendus.map((resultat, index) => (
                <li key={index} className="flex gap-2">
                  <div className="w-1.5 h-1.5 mt-1 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>{resultat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
