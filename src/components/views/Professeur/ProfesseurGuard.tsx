import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

export default function ProfesseurGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'professeur') {
        setAuthorized(true);
      } else {
        navigate('/login');
      }

      setLoading(false);
    };

    checkRole();
  }, [navigate]);

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return authorized ? <>{children}</> : null;
}

