import { Routes, Route, Navigate } from 'react-router-dom';

import QuizView from './components/views/Eleve/Quiz/QuizView';
import Viewer3DView from './components/views/Eleve/Viewer3D/Viewer3DView';
import ExperienceView from './components/views/Eleve/Experience/ExperienceView';
import AccueilView from './components/views/Eleve/Accueil/AccueilView';

import ProfesseurLayout from './components/layouts/ProfesseurLayout';
import ProfExpView from './components/views/Professeur/Prof-Exp/ProfExpView';
import ProfQuizView from './components/views/Professeur/Prof-Quiz/ProfQuizView';
import ProfElevView from './components/views/Professeur/Prof-Elev/ProfElevView';
import Prof3DView from './components/views/Professeur/Prof-3D/Prof3DView';

import EleveLayout from './components/layouts/EleveLayout';
import { Toaster} from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* Interface Élève */}
        <Route path="/" element={<EleveLayout />}>
          <Route index element={<AccueilView />} />
          <Route path="eleve" element={<Navigate to="/" replace />} />
          <Route path="eleve/experiences" element={<ExperienceView />} />
          <Route path="eleve/quiz" element={<QuizView />} />
          <Route path="eleve/3d" element={<Viewer3DView />} />
        </Route>
        {/* Interface Professeur */}
        <Route path="/professeur" element={<ProfesseurLayout />}>
          <Route index element={<Navigate to="/professeur/experiences" replace />} />
          <Route path="experiences" element={<ProfExpView />} />
          <Route path="quiz" element={<ProfQuizView />} />
          <Route path="suivi-eleve" element={<ProfElevView />} />
          <Route path="3D" element={<Prof3DView />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
