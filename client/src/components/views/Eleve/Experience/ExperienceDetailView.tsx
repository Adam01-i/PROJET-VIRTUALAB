"use client";

import {
  FlaskRound as Flask,
  Clock,
  Maximize2,
  ArrowLeft,
  Book,
  ListChecks,
} from "lucide-react";
import { useCallback, useRef, useState, lazy, Suspense } from "react";
import type { Experience } from "../../../../types/Experience/experience";

const simulationModules = import.meta.glob("../../../../simulations/*.tsx");

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
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const toggleFullscreen = useCallback(async () => {
    const elem = containerRef.current;
    if (!elem) return;

    const requestFullscreen =
      elem.requestFullscreen ||
      (elem as any).webkitRequestFullscreen ||
      (elem as any).mozRequestFullScreen ||
      (elem as any).msRequestFullscreen;

    const exitFullscreen =
      document.exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).mozCancelFullScreen ||
      (document as any).msExitFullscreen;

    if (!document.fullscreenElement && requestFullscreen) {
      await requestFullscreen.call(elem);
      setIsFullscreen(true);

      // 🎯 Orientation paysage sur Chrome Android
      if (
        isMobile &&
        screen.orientation &&
        (screen.orientation as any).lock
      ) {
        try {
          await (screen.orientation as any).lock("landscape");
        } catch (err) {
          console.warn("Orientation lock non supportée :", err);
        }
      }
    } else if (document.fullscreenElement && exitFullscreen) {
      await exitFullscreen.call(document);
      setIsFullscreen(false);

      // 🔁 Revenir à l'orientation portrait
      if (isMobile && screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (err) {
          console.warn("Impossible de débloquer l'orientation :", err);
        }
      }
    } else if (isMobile && !requestFullscreen) {
      alert("⚠️ Le mode plein écran n'est pas supporté sur ce navigateur mobile (iOS/Safari).");
    }
  }, [isMobile]);

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
    <div className={`relative w-full ${height} bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden rounded-b-md`}>
      {renderSimulation()}
    </div>
  );

  // ✅ Mode plein écran
  if (isFullscreen) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 bg-white overflow-hidden">
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-full shadow"
          >
            Exit X
          </button>
        </div>

        <SimulationContainer height="h-full" />
      </div>
    );
  }

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
    <div className="max-w-[1280px] mx-auto py-4 mt-14 space-y-24">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-5">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm" ref={containerRef}>
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
