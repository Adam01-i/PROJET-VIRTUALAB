import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RedirectMe() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        navigate('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        toast.error('Profil introuvable');
        navigate('/');
        return;
      }

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

    checkRoleAndRedirect();
  }, [navigate]);

  return <div className="text-center mt-10 text-gray-600">Redirection...</div>;
}
