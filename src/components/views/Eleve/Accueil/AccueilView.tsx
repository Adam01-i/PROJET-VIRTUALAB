import { FlaskRound as Flask, Brain, Cuboid as Cube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccueilView() {
  return (
    <>
      <div className="relative min-h-screen">
        <div id="particles-js" className="absolute inset-0" />
        
        {/* Section principale centrée */}
        <div className="relative min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-[1280px] mx-auto">
            
            {/* Icône centrale */}
            <div className="mb-6">
              <Flask size={48} className="text-purple-300 mx-auto" />
            </div>
            
            {/* Titre */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Laboratoire de Chimie Virtuel
            </h1>

            {/* Sous-texte */}
            <p className="text-base text-purple-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Explorez la chimie de manière interactive et immersive. 
              Réalisez des expériences, testez vos connaissances et visualisez les molécules en 3D.
            </p>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/eleve/experiences"
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 shadow hover:shadow-purple-500/20 text-sm font-medium"
              >
                <Flask size={18} />
                <span>Commencer une expérience</span>
              </Link>
              <Link
                to="/eleve/quiz"
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Brain size={18} />
                <span>Tester mes connaissances</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section cartes */}
      <div className="max-w-[1280px] mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/eleve/experiences"
            className="bg-white/5 hover:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/10 text-left"
          >
            <Flask size={28} className="text-purple-300 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-3">Expériences Virtuelles</h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions.
            </p>
          </Link>

          <Link
            to="/eleve/quiz"
            className="bg-white/5 hover:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/10 text-left"
          >
            <Brain size={28} className="text-purple-300 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-3">Quiz Interactifs</h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme.
            </p>
          </Link>

          <Link
            to="/eleve/3d"
            className="bg-white/5 hover:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/10 text-left"
          >
            <Cube size={28} className="text-purple-300 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-3">Visualisation 3D</h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés.
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
