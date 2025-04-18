import { Routes, Route, Navigate } from 'react-router-dom';

import QuizView from './components/Eleve/Quiz/QuizView';
import Viewer3DView from './components/Eleve/Viewer3D/Viewer3DView';
import ExperienceView from './components/Eleve/Experience/ExperienceView';
import AccueilView from './components/Eleve/Accueil/AccueilView';
import ProfesseurLayout from './components/Professeur/ProfesseurLayout';
import ProfExpView from './components/Professeur/Prof-Exp/ProfExpView';
import ProfQuizView from './components/Professeur/Prof-Quiz/ProfQuizView';
import ProfElevView from './components/Professeur/Prof-Elev/ProfElevView';
import Prof3DView from './components/Professeur/Prof-3D/Prof3DView';
import EleveLayout from './components/Eleve/EleveLayout';

function App() {
  return (
    <Routes>
      {/* Professeur */}
      <Route path="/professeur" element={<ProfesseurLayout />}>
        <Route index element={<Navigate to="/professeur/experiences" replace />} />
        <Route path="experiences" element={<ProfExpView />} />
        <Route path="quiz" element={<ProfQuizView />} />
        <Route path="suivi-eleve" element={<ProfElevView />} />
        <Route path="3D" element={<Prof3DView />} />
      </Route>

      {/* Élève */}
      <Route path="/" element={<EleveLayout />}>
        <Route index element={<AccueilView />} />
        <Route path="eleve" element={<Navigate to="/" replace />} />
        <Route path="eleve/experiences" element={<ExperienceView />} />
        <Route path="eleve/quiz" element={<QuizView />} />
        <Route path="eleve/3d" element={<Viewer3DView />} />
      </Route>
    </Routes>
  );
}

export default App;
