// src/components/ui/UserMenu.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, User2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserMenu() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
    if (!confirmed) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion.");
    } else {
      toast.success("Déconnecté avec succès 👋");
      navigate('/login');
    }
  };

  if (!profile) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-gray-700">
      <div className="flex items-center gap-2">
        <User2 size={18} className="text-indigo-600" />
        <span className="font-semibold text-indigo-700">{profile.name}</span>
        <span className="text-gray-500">({profile.role})</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 hover:text-red-800 transition text-sm"
      >
        <LogOut size={16} />
        Déconnexion
      </button>
    </div>
  );
}
