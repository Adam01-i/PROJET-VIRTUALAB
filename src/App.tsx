import { useState, useEffect, useRef } from 'react';
import { FlaskRound as Flask, Brain, Cuboid as Cube, Book, Plus, Clock, Beaker, ListChecks, LogIn } from 'lucide-react';
import QuizView from './components/Quiz/QuizView';
import Viewer3DView from './components/Viewer3D/Viewer3DView';

type Experience = {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  image: string;
  objectifs: string[];
  materiel: string[];
  resultatsAttendus: string[];
};

declare global {
  interface Window {
    particlesJS: any;
    $3Dmol: any;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<'accueil' | 'experiences' | 'quiz' | '3d'>('accueil');
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const viewerRef = useRef<any>(null);

  const [experiences] = useState<Experience[]>([
    {
      id: '1',
      titre: 'Réactions d\'oxydo-réduction',
      description: 'Découvrez les transferts d\'électrons et leurs applications dans la vie quotidienne.',
      duree: '45 min',
      niveau: 'Première',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
      objectifs: [
        'Comprendre le principe des réactions d\'oxydo-réduction',
        'Identifier les espèces oxydantes et réductrices',
        'Écrire les demi-équations électroniques'
      ],
      materiel: [
        'Solution de sulfate de cuivre',
        'Lame de zinc',
        'Bécher',
        'Pipette'
      ],
      resultatsAttendus: [
        'Formation d\'un dépôt de cuivre métallique sur la lame de zinc',
        'Décoloration progressive de la solution de sulfate de cuivre',
        'Augmentation de la concentration en ions Zn2+'
      ]
    },
    {
      id: '2',
      titre: 'Équilibre chimique',
      description: 'Comprendre les réactions réversibles et le principe de Le Chatelier.',
      duree: '60 min',
      niveau: 'Première',
      image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
      objectifs: [
        'Définir un équilibre chimique',
        'Comprendre le principe de Le Chatelier',
        'Étudier l\'influence des paramètres sur l\'équilibre'
      ],
      materiel: [
        'Solutions d\'acide et de base',
        'pH-mètre',
        'Burette graduée',
        'Agitateur magnétique'
      ],
      resultatsAttendus: [
        'Variation du pH en fonction de la concentration des réactifs',
        'Déplacement de l\'équilibre selon les conditions',
        'Retour à l\'équilibre après perturbation'
      ]
    }
  ]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.async = true;
    script.onload = () => {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: '#ffffff' },
          shape: {type: 'circle',stroke: { width: 0, color: '#000000' },polygon: { nb_sides: 5 }},
          opacity: {value: 0.5,random: false,anim: { enable: false }},
          size: {value: 3,random: true,anim: { enable: false }},
          line_linked: {enable: true,distance: 150,color: '#ffffff',opacity: 0.4,width: 1},
          move: {enable: true,speed: 2,direction: 'none',random: false,straight: false,out_mode: 'out',bounce: false}
        },
        interactivity: {
          detect_on: 'canvas',
          events: {onhover: { enable: true, mode: 'repulse' },
          onclick: { enable: true, mode: 'push' },resize: true}
        },
        retina_detect: true
      });
    };
    document.body.appendChild(script);

    const script3D = document.createElement('script');
    script3D.src = 'https://3dmol.org/build/3Dmol-min.js';
    script3D.async = true;
    document.body.appendChild(script3D);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.removeChild(script);
      document.body.removeChild(script3D);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-indigo-900/95 shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Flask size={28} className="text-purple-300" />
              <span className="text-white font-bold text-xl">VirtuaLab</span>
            </div>
            <div className="flex space-x-1">
              {[
                { id: 'accueil', icon: Book, label: 'Accueil' },
                { id: 'experiences', icon: Flask, label: 'Expériences' },
                { id: 'quiz', icon: Brain, label: 'Quiz' },
                { id: '3d', icon: Cube, label: 'Visualisation 3D' },
                {id: 'login', icon: LogIn, label: 'Se Connecter'}
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-white/10 text-white'
                      : 'text-purple-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {activeTab === 'accueil' && (
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
      )}

      <main className="container mx-auto px-6 py-24">
        {activeTab === 'experiences' && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-6rem)]">
            <div className="col-span-3 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Expériences</h2>
                <button className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-all duration-200">
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {experiences.map((exp) => (
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
        )}
        
        {/*Gere la partie Quiz*/}
        {activeTab === 'quiz' && <QuizView />}
          
        {/*Gere la partie Affichage des molecules en 3D*/}
        {activeTab === '3d' && <Viewer3DView />}

      </main>
    </div>
  );
}

export default App;