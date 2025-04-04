import { useState } from 'react';
import { FlaskRound as Flask, Brain, Cuboid as Cube } from 'lucide-react';

export default function AccueilView() {
  const [activeTab, setActiveTab] = useState<'accueil' | 'experiences' | 'quiz' | '3d'>('accueil');

  return (
    <>
       <div className="relative min-h-screen">
            <div id="particles-js" className="absolute inset-0" />
            <div className="relative min-h-screen flex items-center justify-center px-6">
              <div className="text-center">
                <div className="mb-8 animate-bounce">
                  <Flask size={80} className="text-purple-300 mx-auto" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                  Laboratoire de Chimie Virtuel
                </h1>
                <p className="text-xl md:text-2xl text-purple-200 mb-12 max-w-3xl mx-auto">
                  Explorez la chimie de manière interactive et immersive. 
                  Réalisez des expériences, testez vos connaissances et visualisez les molécules en 3D.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setActiveTab('experiences')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-purple-500/25">
                    <Flask size={24} />
                    <span className="text-lg font-medium">Commencer une expérience</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('quiz')}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200">
                    <Brain size={24} />
                    <span className="text-lg font-medium">Tester mes connaissances</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-24">
            <div className="grid md:grid-cols-3 gap-8">
              <button 
                onClick={() => setActiveTab('experiences')} 
                className="bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-left">  
                <div>
                  <Flask size={40} className="text-purple-300 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Expériences Virtuelles</h3>
                  <p className="text-purple-200">
                    Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions.
                  </p>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className="bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-left"> 
                <div>
                  <Brain size={40} className="text-purple-300 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Quiz Interactifs</h3>
                  <p className="text-purple-200">
                    Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme.
                  </p>
                </div>
              </button> 
              <button
                onClick={() => setActiveTab('3d')}
                className="bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-left">  
                <div>
                  <Cube size={40} className="text-purple-300 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Visualisation 3D</h3>
                  <p className="text-purple-200">
                    Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés.
                  </p>
                </div>
              </button>
            </div>
          </div>
    </>
  );
}
