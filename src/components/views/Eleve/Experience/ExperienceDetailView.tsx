'use client';

import {
  FlaskRound as Flask,
  Clock,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Book,
  ListChecks,
} from 'lucide-react';
import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import type { Experience } from '../../../../types/Experience/experience';

const simulationModules = import.meta.glob('../../../../simulations/*.tsx');

const loadSimulationComponent = (fileName: string) => {
  const modulePath = `../../../../simulations/${fileName}.tsx`;
  const importer = simulationModules[modulePath];

  if (!importer) throw new Error(`Fichier simulation non trouvé : ${modulePath}`);
  return lazy(importer as any);
};

type ExperienceDetailViewProps = {
  experience: Experience;
  onBack: () => void;
};

export default function ExperienceDetailView({ experience, onBack }: ExperienceDetailViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (e: MouseEvent) => {
      setShowControls(e.clientY < 50);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen]);

  const renderSimulation = () => {
    if (!experience.simulationPath) {
      return (
        <div className="text-center text-indigo-400">
          <Flask size={40} className="mx-auto mb-2" />
          <p className="text-base font-medium">Zone de simulation interactive</p>
        </div>
      );
    }

    try {
      const SimulationComponent = loadSimulationComponent(experience.simulationPath);
      return (
        <Suspense fallback={<div className="text-gray-600">Chargement de la simulation...</div>}>
          <SimulationComponent />
        </Suspense>
      );
    } catch (error) {
      return <div className="text-center text-red-500">Erreur : {String(error)}</div>;
    }
  };

  const SimulationContainer = ({ height }: { height: string }) => (
    <div className={`relative w-full ${height} bg-blue-900 flex items-center justify-center`}>
      {renderSimulation()}
    </div>
  );

  // MODE PLEIN ÉCRAN
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-hidden">
        {/* Header flottant uniquement au survol haut */}
        <div
          className={`absolute top-0 right-0  flex justify-end px-6 py-4 z-50 
          bg-gradient-to-b from-white/90 to-transparent backdrop-blur-sm 
          ${showControls ? '' : 'opacity-0 pointer-events-none'}`}
        >
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow"
          >
            <Minimize2 size={16} />
            Quitter le plein écran
          </button>
        </div>

        {/* Simulation 100% écran */}
        <SimulationContainer height="h-full" />
      </div>
    );
  }

  // MODE NORMAL
  const Header = () => (
    <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-md">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 mt-1">
          <ArrowLeft size={20} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-gray-900">{experience.titre}</h2>
          <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm mt-1">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{experience.duree}</span>
            </div>
            <span className="text-indigo-600 font-semibold">{experience.niveau}</span>
          </div>
        </div>
      </div>

      <button
        onClick={toggleFullscreen}
        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded-md text-sm border border-indigo-200 flex items-center gap-2"
      >
        <Maximize2 size={16} />
        Plein écran
      </button>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-5">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm">
            <Header />
            <SimulationContainer height="h-[550px]" />
          </div>
        </div>

        {/* Explications & Résultats */}
        <div className="md:col-span-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm max-h-[400px] overflow-y-auto">
            <h3 className="text-base font-semibold text-indigo-700 flex items-center gap-2 mb-3">
              <Book size={18} />
              <span>Explications</span>
            </h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="text-indigo-600 font-medium mb-1">Description</h4>
                <p>{experience.description}</p>
              </div>
              <div>
                <h4 className="text-indigo-600 font-medium mb-1">Objectifs</h4>
                <ul className="space-y-1.5">
                  {experience.objectifs.map((obj, index) => (
                    <li key={index} className="flex gap-2">
                      <div className="w-1.5 h-1.5 mt-1 rounded-full bg-indigo-400 flex-shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-indigo-600 font-medium mb-1">Matériel nécessaire</h4>
                <ul className="space-y-1.5">
                  {experience.materiel.map((mat, index) => (
                    <li key={index} className="flex gap-2">
                      <div className="w-1.5 h-1.5 mt-1 rounded-full bg-indigo-400 flex-shrink-0" />
                      <span>{mat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm max-h-[200px] overflow-y-auto">
            <h3 className="text-base font-semibold text-indigo-700 flex items-center gap-2 mb-3">
              <ListChecks size={18} />
              <span>Résultats Attendus</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {experience.resultatsAttendus.map((resultat, index) => (
                <li key={index} className="flex gap-2">
                  <div className="w-1.5 h-1.5 mt-1 rounded-full bg-indigo-400 flex-shrink-0" />
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
