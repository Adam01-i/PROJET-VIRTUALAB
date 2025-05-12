import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setUserId(sessionData?.session?.user?.id ?? null);
    };
    fetchUserId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    const { error: pwdError } = await supabase.auth.updateUser({
      password,
    });

    if (pwdError) {
      toast.error(pwdError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success('Mot de passe mis à jour 🎉');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-300 px-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8">
        <h2 className="text-2xl font-bold text-indigo-700 text-center mb-4">
          🔒 Changer le mot de passe
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Pour continuer, veuillez définir un nouveau mot de passe sécurisé.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-semibold transition"
          >
            {loading ? 'Mise à jour...' : 'Changer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
