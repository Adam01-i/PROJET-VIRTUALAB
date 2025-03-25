import { useState, useEffect, useRef } from 'react';
import { FlaskRound as Flask, Brain, Cuboid as Cube, Book, Plus, Clock, Award, Search, ChevronRight } from 'lucide-react';

type Experience = {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  image: string;
  objectifs: string[];
  materiel: string[];
};

type Quiz = {
  id: string;
  titre: string;
  questions: number;
  difficulte: string;
  image: string;
};

type Molecule = {
  id: string;
  nom: string;
  formule: string;
  description: string;
  structure: string;
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
  const [selectedMolecule, setSelectedMolecule] = useState<Molecule | null>(null);
  const viewerRef = useRef<any>(null);

  const molecules: Molecule[] = [
    {
      id: '1',
      nom: 'Eau',
      formule: 'H2O',
      description: 'Molécule essentielle à la vie, composée d\'un atome d\'oxygène et deux atomes d\'hydrogène.',
      structure: 'https://models.r-eg.net/models/h2o.pdb'
    },
    {
      id: '2',
      nom: 'Méthane',
      formule: 'CH4',
      description: 'Le plus simple des hydrocarbures, composé d\'un atome de carbone et quatre atomes d\'hydrogène.',
      structure: 'https://models.r-eg.net/models/ch4.pdb'
    },
    {
      id: '3',
      nom: 'Méthane',
      formule: 'CH4',
      description: 'Le plus simple des hydrocarbures, composé d\'un atome de carbone et quatre atomes d\'hydrogène.',
      structure: 'https://models.r-eg.net/models/ch4.pdb'
    },
    {
      id: '4',
      nom: 'Méthane',
      formule: 'CH4',
      description: 'Le plus simple des hydrocarbures, composé d\'un atome de carbone et quatre atomes d\'hydrogène.',
      structure: 'https://models.r-eg.net/models/ch4.pdb'
    },
    {
      id: '5',
      nom: 'Méthane',
      formule: 'CH4',
      description: 'Le plus simple des hydrocarbures, composé d\'un atome de carbone et quatre atomes d\'hydrogène.',
      structure: 'https://models.r-eg.net/models/ch4.pdb'
    }
  ];

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
      ]
    },
    {
      id: '3',
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
      ]
    },
    {
      id: '4',
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
      ]
    },
    {
      id: '5',
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
      ]
    }
  ]);

  const [quiz] = useState<Quiz[]>([
    {
      id: '1',
      titre: 'Les solutions aqueuses',
      questions: 10,
      difficulte: 'Intermédiaire',
      image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '2',
      titre: 'Acides et bases',
      questions: 15,
      difficulte: 'Avancé',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '3',
      titre: 'Acides et bases',
      questions: 15,
      difficulte: 'Avancé',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '4',
      titre: 'Acides et bases',
      questions: 15,
      difficulte: 'Avancé',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '5',
      titre: 'Acides et bases',
      questions: 15,
      difficulte: 'Avancé',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
    }
  ]);

  useEffect(() => {
    // Particles.js initialization
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.async = true;
    script.onload = () => {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 120, density: { enable: true, value_area: 800 } },
          color: { value: '#ffffff' },
          shape: {
            type: 'circle',
            stroke: { width: 0, color: '#000000' },
            polygon: { nb_sides: 5 }
          },
          opacity: {
            value: 0.5,
            random: false,
            anim: { enable: false }
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: false }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1
          },
          move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: true, mode: 'push' },
            resize: true
          }
        },
        retina_detect: true
      });
    };
    document.body.appendChild(script);

    // 3Dmol.js initialization
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

  useEffect(() => {
    if (selectedMolecule && viewerRef.current) {
      const viewer = window.$3Dmol.createViewer(viewerRef.current, {
        backgroundColor: 'black',
      });
      
      fetch(selectedMolecule.structure)
      .then(response => response.text()) // Convertit la réponse en texte (format PDB)
      .then(data => {
      viewer.addModel(data, "pdb"); // Ajoute la molécule au viewer
      viewer.setStyle({}, {stick: {}}); // Applique un style "stick" (représentation en bâtons)
      viewer.zoomTo(); // Zoom automatique sur la molécule
      viewer.render(); // Affiche la molécule
  });

    }
  }, [selectedMolecule]);





  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      {/* Navigation fixe */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-indigo-900/95 shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Flask size={28} className="text-purple-300" />
              <span className="text-white font-bold text-xl">VirtualLaB</span>
            </div>
            <div className="flex space-x-1">
              {[
                { id: 'accueil', icon: Book, label: 'Accueil' },
                { id: 'experiences', icon: Flask, label: 'Expériences' },
                { id: 'quiz', icon: Brain, label: 'Quiz' },
                { id: '3d', icon: Cube, label: 'Visualisation 3D' }
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

      {/* Page d'accueil avec fond animé */}
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
                    className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    <Flask size={24} />
                    <span className="text-lg font-medium">Commencer une expérience</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('quiz')}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200"
                  >
                    <Brain size={24} />
                    <span className="text-lg font-medium">Tester mes connaissances</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section des fonctionnalités */}
          <div className="container mx-auto px-6 py-24">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
                <Flask size={40} className="text-purple-300 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">Expériences Virtuelles</h3>
                <p className="text-purple-200">
                  Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
                <Brain size={40} className="text-purple-300 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">Quiz Interactifs</h3>
                <p className="text-purple-200">
                  Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
                <Cube size={40} className="text-purple-300 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">Visualisation 3D</h3>
                <p className="text-purple-200">
                  Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contenu des autres onglets */}
      <main className="container mx-auto px-6 py-24">
        {activeTab === 'experiences' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold text-white">Expériences disponibles</h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher une expérience..."
                    className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Search className="absolute left-3 top-2.5 text-purple-300" size={20} />
                </div>
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200">
                  <Plus size={20} />
                  <span>Nouvelle expérience</span>
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 border border-white/10">
                  <div className="h-48 overflow-hidden">
                    <img src={exp.image} alt={exp.titre} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-white">{exp.titre}</h3>
                    <p className="text-purple-200 mb-4">{exp.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-2">Objectifs :</h4>
                      <ul className="list-disc list-inside text-sm text-purple-200 space-y-1">
                        {exp.objectifs.map((obj, index) => (
                          <li key={index}>{obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-2">Matériel nécessaire :</h4>
                      <ul className="list-disc list-inside text-sm text-purple-200 space-y-1">
                        {exp.materiel.map((mat, index) => (
                          <li key={index}>{mat}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-sm text-purple-300 mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock size={16} />
                        <span>{exp.duree}</span>
                      </div>
                      <span className="text-purple-300 font-medium">{exp.niveau}</span>
                    </div>

                    <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
                      <span>Commencer l'expérience</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold text-white">Quiz disponibles</h2>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200">
                <Plus size={20} />
                <span>Nouveau quiz</span>
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quiz.map((q) => (
                <div key={q.id} className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 border border-white/10">
                  <div className="h-48 overflow-hidden">
                    <img src={q.image} alt={q.titre} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-white">{q.titre}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-purple-300">
                        <Brain size={16} />
                        <span>{q.questions} questions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award size={16} className="text-purple-300" />
                        <span className="text-purple-300">{q.difficulte}</span>
                      </div>
                    </div>
                    <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-medium transition-colors duration-200">
                      Commencer le quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === '3d' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white mb-8">Visualisation Moléculaire 3D</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Sélectionnez une molécule</h3>
                  <div className="space-y-4">
                    {molecules.map((molecule) => (
                      <button
                        key={molecule.id}
                        onClick={() => setSelectedMolecule(molecule)}
                        className={`w-full p-4 rounded-lg transition-all duration-200 text-left ${
                          selectedMolecule?.id === molecule.id
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold">{molecule.nom}</div>
                        <div className="text-sm opacity-80">{molecule.formule}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
                {selectedMolecule ? (
                  <div ref={viewerRef} style={{ width: '100%', height: '550px' }} />
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-purple-200">
                    <div className="text-center">
                      <Cube size={48} className="mx-auto mb-4 text-purple-300" />
                      <p>Sélectionnez une molécule pour commencer</p>
                    </div>
                  </div>
                )}   
                {selectedMolecule && (
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/1">
                    <h3 className="text-xl font-semibold text-white mb-4">Description de la molécule</h3>
                    <h3 className="text-xl font-semibold text-white mb-2">{selectedMolecule.nom}</h3>
                    <div className="text-lg text-purple-300 mb-4">{selectedMolecule.formule}</div>
                    <p className="text-purple-200">{selectedMolecule.description}</p>
                  </div>
                )}
                               
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;