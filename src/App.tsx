import { useState, useEffect} from 'react';
import { FlaskRound as Flask, Brain, Cuboid as Cube, Book, LogIn } from 'lucide-react';
import QuizView from './components/Quiz/QuizView';
import Viewer3DView from './components/Viewer3D/Viewer3DView';
import ExperienceView from './components/Experience/ExperienceView';
import AccueilView from './components/Accueil/AccueilView';

function App() {
  const [activeTab, setActiveTab] = useState<'accueil' | 'experiences' | 'quiz' | '3d'>('accueil');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

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
                
      {/* Gere la page d'Accueil*/}
      {activeTab === 'accueil' && <AccueilView onTabChange={setActiveTab}/>}

      <main className="container mx-auto px-6 py-24">
        {/*Gere la partie Experiences*/}
        {activeTab === 'experiences' && <ExperienceView />}
        
        {/*Gere la partie Quiz*/}
        {activeTab === 'quiz' && <QuizView />}
          
        {/*Gere la partie Affichage des molecules en 3D*/}
        {activeTab === '3d' && <Viewer3DView />}
      </main>
    </div>
  );
}

export default App;