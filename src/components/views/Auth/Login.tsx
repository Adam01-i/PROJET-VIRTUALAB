import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  // 🔁 Redirection automatique si connecté
  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) return;

      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'professeur':
          navigate('/professeur/dashboard');
          break;
        case 'eleve':
          navigate('/eleve/dashboard');
          break;
        default:
          navigate('/');
      }
    };

    redirectIfLoggedIn();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = formData;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(`Erreur : ${error.message}`);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      toast.error('Utilisateur introuvable après connexion.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      toast.error("Profil introuvable.");
      setLoading(false);
      return;
    }

    if (profile.must_change_password) {
      toast('Veuillez changer votre mot de passe.', { icon: '🔐' });
      navigate('/change-password');
    } else {
      toast.success('Connexion réussie 🎉');
      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'professeur':
          navigate('/professeur/dashboard');
          break;
        case 'eleve':
          navigate('/eleve/dashboard');
          break;
        default:
          toast.error("Rôle non reconnu.");
          navigate('/');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-3 font-sans">
      {/* 🎨 Partie gauche immersive */}
      <div className="col-span-2 relative hidden md:block">
        <img
          src="/assets/img1.png"
          alt="Laboratoire Virtuel"
          className="object-cover h-full w-full"
        />
        <div className="absolute inset-0 bg-indigo-900/70 backdrop-blur-sm flex items-center justify-center text-white p-12">
          <div className="max-w-xl text-left space-y-6 animate-fade-in">
            <h1 className="text-5xl font-extrabold leading-snug tracking-tight">
              Bienvenue dans le <span className="text-yellow-300">Laboratoire Virtuel</span>
            </h1>
            <p className="text-lg text-indigo-100 font-light leading-relaxed">
              Connectez-vous pour accéder à vos expériences, quiz et simulations 3D de chimie.
            </p>
            <div className="w-20 h-1 bg-yellow-400 rounded"></div>
          </div>
        </div>
      </div>

      {/* 🔐 Formulaire de connexion */}
      <div className="col-span-1 flex items-center justify-center bg-white px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-indigo-100"
        >
          <h2 className="text-3xl font-bold text-indigo-700 text-center mb-6">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Adresse email</label>
              <input
                type="email"
                name="email"
                placeholder="exemple@virtualab.com"
                onChange={handleChange}
                required
                className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••••"
                onChange={handleChange}
                required
                className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
              />

              {/* 👁 Bouton afficher/masquer mot de passe */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-gray-500 hover:text-indigo-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a10.05 10.05 0 01.175-1.875M9.88 9.88a3 3 0 014.24 4.24M6.1 6.1l11.8 11.8" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-right mt-1">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-semibold shadow transition duration-300"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
