import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Assure-toi que ton supabaseClient est bien configuré
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Récupérer les tokens de l'URL
    const token = params.get('access_token');
    const refresh = params.get('refresh_token');

    if (!token || !refresh) {
      toast.error('Lien invalide ou expiré.');
      navigate('/login');
      return;
    }

    const autoReset = async () => {
      // Essayer de valider la session avec les tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refresh,
      });

      if (sessionError) {
        toast.error('Session expirée ou lien invalide.');
        navigate('/login');
        return;
      }

      // Mise à jour du mot de passe
      const { error } = await supabase.auth.updateUser({
        password: 'virtualab2025', // Nouveau mot de passe temporaire
      });

      if (error) {
        toast.error('Erreur lors du changement du mot de passe.');
        return;
      }

      // Mise à jour du profil utilisateur pour forcer le changement de mot de passe
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (userId) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ must_change_password: true })
          .eq('id', userId);

        if (profileUpdateError) {
          toast.warning("Mot de passe changé, mais le profil n’a pas été mis à jour.");
        }
      }

      toast.success('Mot de passe réinitialisé. Vous devez le modifier après connexion.');
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    };

    autoReset();
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">🔐 Réinitialisation</h2>
        {done ? (
          <p className="text-gray-700">Mot de passe défini à <b>virtualab2025</b>.<br />Redirection...</p>
        ) : (
          <p className="text-gray-500">Traitement du lien de réinitialisation...</p>
        )}
      </div>
    </div>
  );
}
