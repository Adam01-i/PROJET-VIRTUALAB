import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = new URLSearchParams(window.location.search).get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

  const handleSend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Lien envoyé à ' + email);
      setTimeout(() => navigate('/login'), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">🔐 Réinitialiser le mot de passe</h2>
        <p className="text-sm text-gray-600 mb-4">
          Entrez une adresse email pour recevoir un lien de réinitialisation.
        </p>
        <input
          type="email"
          className="w-full p-3 border rounded-md mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </div>
    </div>
  );
}
