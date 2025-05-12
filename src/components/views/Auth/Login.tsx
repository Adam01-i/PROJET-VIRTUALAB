import * as React from 'react';
import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
  
      if (!userId) return; // pas connecté
  
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
  }, []);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    const { email, password } = formData;
  
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
    console.log("Sign in result:", data, error);
  
    if (error) {
      toast.error(`Erreur : ${error.message}`);
      setLoading(false);
      return;
    }
  
    const user = data?.user;
    if (!user) {
      toast.error('Utilisateur introuvable après connexion.');
      console.log("No user returned");
      setLoading(false);
      return;
    }
  
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single();
  
    console.log("Profile result:", profile, profileError);
  
    if (profileError) {
      toast.error(`Erreur profil : ${profileError.message}`);
      setLoading(false);
      return;
    }
  
    if (!profile) {
      toast.error("Aucun profil trouvé pour cet utilisateur.");
      setLoading(false);
      return;
    }
  
    if (profile.must_change_password) {
      toast('Veuillez changer votre mot de passe.', { icon: '🔒' });
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
          toast.error("Rôle utilisateur inconnu.");
          navigate('/');
      }
    }
  
    setLoading(false);
  };
  

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-3 font-sans">
      {/* ✅ Section gauche immersive */}
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
              Connectez-vous pour explorer vos expériences, visualiser des molécules 3D et suivre votre progression.
            </p>
            <div className="w-20 h-1 bg-yellow-400 rounded"></div>
          </div>
        </div>
      </div>

      {/* ✅ Section droite - Formulaire de connexion */}
      <div className="col-span-1 flex items-center justify-center bg-white px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-indigo-100"
        >
          <h2 className="text-3xl font-bold text-indigo-700 text-center mb-6">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                required
                className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                required
                className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
