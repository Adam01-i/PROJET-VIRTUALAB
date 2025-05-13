import { FlaskRound as Flask, Brain, Cuboid as Cube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccueilView() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-20 bg-white">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Carte 1 */}
        <Link
          to="/eleve/experiences"
          className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-5 transition-transform group-hover:scale-110">
            <Flask size={28} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Expériences Virtuelles</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions.
          </p>
        </Link>

        {/* Carte 2 */}
        <Link
          to="/eleve/quiz"
          className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-5 transition-transform group-hover:scale-110">
            <Brain size={28} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Quiz Interactifs</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme.
          </p>
        </Link>

        {/* Carte 3 */}
        <Link
          to="/eleve/3d"
          className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-5 transition-transform group-hover:scale-110">
            <Cube size={28} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Visualisation 3D</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés.
          </p>
        </Link>
      </div>


      
      <section className="py-40 bg-white">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* 🧠 Avantages (4 cartes = grid 2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Carte 1 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <h4 className="text-lg font-semibold text-indigo-600 mb-2">Autonomie & Pratique</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Répétez les expériences à volonté, avancez à votre rythme et maîtrisez les notions à votre façon.
              </p>
            </div>

            {/* Carte 2 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <h4 className="text-lg font-semibold text-indigo-600 mb-2">Approche Pédagogique Moderne</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Des contenus visuels et interactifs, alignés avec le programme officiel pour apprendre efficacement.
              </p>
            </div>

            {/* Carte 3 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <h4 className="text-lg font-semibold text-indigo-600 mb-2">Accessibilité Permanente</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Accédez à votre espace élève où que vous soyez, sur tout appareil connecté, 24h/24.
              </p>
            </div>

            {/* Carte 4 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <h4 className="text-lg font-semibold text-indigo-600 mb-2">Apprentissage Ludique</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Vivez une expérience motivante grâce aux quiz, animations 3D et éléments interactifs intégrés.
              </p>
            </div>
          </div>

          {/* 🏛️ Section descriptive */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 shadow-md h-full flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-bold text-indigo-700 mb-6">Notre Laboratoire Virtuel</h3>
              <p className="text-gray-700 text-base leading-relaxed mb-4">
                Conçu pour stimuler la curiosité scientifique, notre laboratoire numérique permet à chaque élève de s’immerger dans l’apprentissage expérimental.
              </p>
              <p className="text-gray-700 text-base leading-relaxed">
                Grâce à une combinaison de simulations, visualisations 3D, évaluations interactives et suivi personnalisé, vous progressez de façon active et engageante.
              </p>
            </div>
            <div className="mt-8">
              <Link
                to="/eleve/experiences"
                className="inline-block px-6 py-3 bg-indigo-600 text-white text-base font-medium rounded-md shadow hover:bg-indigo-700 transition"
              >
                Explorer le laboratoire
              </Link>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
