import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function MustChangePasswordBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', userId)
        .single();

      if (profile?.must_change_password) {
        setShow(true);
      }
    };

    checkStatus();
  }, []);

  if (!show) return null;

  return (
    <div className="bg-yellow-100 text-yellow-900 px-4 py-2 text-sm text-center">
      🔐 Veuillez changer votre mot de passe pour sécuriser votre compte.{' '}
      <a href="/change-password" className="underline font-semibold hover:text-yellow-700">
        Changer maintenant
      </a>
    </div>
  );
}
