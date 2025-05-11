import { FlaskRound as Flask, Brain, Cuboid as Cube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccueilView() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-24 bg-white">
      <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
        Bienvenue sur votre espace élève
      </h2>
      <div className="grid md:grid-cols-3 gap-10">
        {/* Carte 1 */}
        <Link
          to="/eleve/experiences"
          className="group bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 group-hover:rotate-6 transition-transform duration-300">
            <Flask size={32} className="text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Expériences Virtuelles</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions.
          </p>
        </Link>

        {/* Carte 2 */}
        <Link
          to="/eleve/quiz"
          className="group bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 group-hover:rotate-6 transition-transform duration-300">
            <Brain size={32} className="text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Quiz Interactifs</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme.
          </p>
        </Link>

        {/* Carte 3 */}
        <Link
          to="/eleve/3d"
          className="group bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 group-hover:rotate-6 transition-transform duration-300">
            <Cube size={32} className="text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Visualisation 3D</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés.
          </p>
        </Link>
      </div>
    </div>
  );
}
