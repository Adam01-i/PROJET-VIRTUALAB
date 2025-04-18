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
import type { Experience } from "../../types/Experience/experience";
import TitrageAcidoBasiqueSimulation from "../../Simulations/TitrageAcidoBasiqueSimulation";
// Import d'autres simulations si nécessaire

// Déclaration du mappage des expériences vers leurs simulations
const simulationComponents: Record<string, React.FC> = {
  "3": TitrageAcidoBasiqueSimulation,
  // Ajoute ici d'autres expériences et leurs simulations
  // "4": AutreSimulation,
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
    const SimulationComponent = simulationComponents[experience.id];
    if (SimulationComponent) {
      return <SimulationComponent />;
    }

    return (
      <div className="text-center text-purple-200">
        <Flask size={48} className="mx-auto mb-4" />
        <p className="text-lg font-medium">Zone de simulation interactive</p>
      </div>
    );
  };

  const SimulationContainer = ({ height }: { height: string }) => (
    <div
      className={`relative ${height} bg-indigo-900/50 rounded-lg flex items-center justify-center`}
    >
      {renderSimulation()}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex flex-col">
        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex-1 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={24} />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {experience.titre}
                  </h2>
                  <div className="flex items-center space-x-4 text-purple-300 mt-1">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} />
                      <span>{experience.duree}</span>
                    </div>
                    <span>{experience.niveau}</span>
                  </div>
                </div>
                </button>
              </div>
              <button
                onClick={toggleFullscreen}
                className="bg-white/5 hover:bg-white/10 text-purple-200 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Minimize2 size={18} />
                <span>Quitter le plein écran</span>
              </button>
            </div>
            <SimulationContainer height="h-[calc(100%-4rem)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 h-[830px]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={24} />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {experience.titre}
                  </h2>
                  <div className="flex items-center space-x-4 text-purple-300 mt-1">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} />
                      <span>{experience.duree}</span>
                    </div>
                    <span>{experience.niveau}</span>
                  </div>
                </div>
                </button>

              </div>
              <button
                onClick={toggleFullscreen}
                className="bg-white/5 hover:bg-white/10 text-purple-200 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Maximize2 size={18} />
                <span>Plein écran</span>
              </button>
            </div>
            <SimulationContainer height="h-[670px]" />
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 max-h-[500px] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Book size={20} />
              <span>Explications</span>
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-purple-300 font-medium mb-2">Description</h4>
                <p className="text-purple-200">{experience.description}</p>
              </div>
              <div>
                <h4 className="text-purple-300 font-medium mb-2">Objectifs</h4>
                <ul className="space-y-2">
                  {experience.objectifs.map((obj, index) => (
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
                  {experience.materiel.map((mat, index) => (
                    <li key={index} className="flex items-start space-x-2 text-purple-200">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
                      <span>{mat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 max-h-[305px] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <ListChecks size={20} />
              <span>Résultats Attendus</span>
            </h3>
            <ul className="space-y-3">
              {experience.resultatsAttendus.map((resultat, index) => (
                <li key={index} className="flex items-start space-x-3 text-purple-200">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>{resultat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-1" />
      </div>
    </div>
  );
}
