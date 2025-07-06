'use client';

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRole: 'professeur' | 'eleve' | 'admin';
};

export default function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      // Cas invité (non connecté)
      if (!user) {
        if (allowedRole === 'eleve' ) {
          setAuthorized(true); // invité autorisé sur /
        } else {
          navigate('/'); // sinon redirection vers racine
        }
        setLoading(false);
        return;
      }

      // Récupération du rôle dans le profil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile?.role) {
        navigate('/'); // fallback
        setLoading(false);
        return;
      }

      const userRole = profile.role;

      if (userRole === allowedRole) {
        setAuthorized(true); // ✅ accès autorisé
      } else {
        // 🔐 Redirection vers la bonne interface en cas de mismatch
        switch (userRole) {
          case 'professeur':
            navigate('/professeur');
            break;
          case 'eleve':
            navigate('/');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/');
        }
      }

      setLoading(false);
    };

    checkRole();
  }, [navigate, location.pathname, allowedRole]);

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return authorized ? <>{children}</> : null;
}
