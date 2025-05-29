import { Routes, Route, Navigate } from 'react-router-dom';

import { Toaster } from 'sonner';

import Login from './components/views/Auth/Login';
import RedirectMe from './components/views/Auth/RedirectMe';
import ForgotPassword from './components/views/Auth/ForgotPassword';
import ResetPassword from './components/views/Auth/ResetPassword';
import ChangePassword from './components/views/Auth/ChangePassword';
import UserAccount from './components/views/Account/UserAccount';

import EleveLayout from './components/layouts/EleveLayout';
import AccueilView from './components/views/Eleve/Accueil/AccueilView';
import ExperienceView from './components/views/Eleve/Experience/ExperienceView';
import QuizView from './components/views/Eleve/Quiz/QuizView';
import Viewer3DView from './components/views/Eleve/Viewer3D/Viewer3DView';

import ProfesseurLayout from './components/layouts/ProfesseurLayout';
import DashboardProfesseur from './components/views/Professeur/Dashboard/ProfesseurDashboard';
import ProfClasseView from './components/views/Professeur/Prof-Classe/ProfClasseView';
import ProfExpView from './components/views/Professeur/Prof-Exp/ProfExpView';
import ProfQuizView from './components/views/Professeur/Prof-Quiz/ProfQuizView';
import Prof3DView from './components/views/Professeur/Prof-3D/Prof3DView';
import ProfesseurGuard from './components/views/Professeur/ProfesseurGuard';

import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './components/views/Admin/Dashboard/AdminDashboard';
import AdminUser from './components/views/Admin/Gestion User/AdminUser';
import AdminClasse from './components/views/Admin/Gestion Classe/AdminClasse';
import AdminGuard from './components/views/Admin/AdminGuard';

import useFullscreenOnLoad from './hooks/useFullscreenOnLoad'; // Assuming this is a custom hook for fullscreen mode

function App() {
   useFullscreenOnLoad();
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>
        
        {/*Interface Login */}
        <Route path="/login" element={<Login />} />
        {/* Interface Changer Mot de Passe */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        {/* Interface de Redirection */}
        <Route path="/me" element={<RedirectMe />} />        
        <Route path="account/UserAccount" element={<UserAccount />} />

        {/* Interface Élève */}
        <Route path="/" element={<EleveLayout />}>
          <Route index element={<AccueilView />} />
          <Route path="eleve" element={<Navigate to="/" replace />} />
          <Route path="eleve/experiences" element={<ExperienceView />} />
          <Route path="eleve/quiz" element={<QuizView />} />
          <Route path="eleve/3d" element={<Viewer3DView />} />
        </Route>

        {/* Interface Admin */}
        <Route path="/admin/*" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route path="AdminDashboard" element={<AdminDashboard />} />
          <Route path="AdminUser" element={<AdminUser />} />
          <Route path="AdminClasse" element={<AdminClasse />} />
        </Route>

        {/* Interface Professeur */}
        <Route path="/professeur" element={<ProfesseurGuard><ProfesseurLayout /></ProfesseurGuard>}>
          <Route index element={<Navigate to="/professeur/dashboard" replace />} />
          <Route path="/professeur/dashboard" element={<DashboardProfesseur />} />
          <Route path="classes" element={<ProfClasseView />} />
          <Route path="experiences" element={<ProfExpView />} />
          <Route path="quiz" element={<ProfQuizView />} />
          <Route path="3D" element={<Prof3DView />} />
          
        </Route>
      </Routes>
    </>
  );
}

export default App;
