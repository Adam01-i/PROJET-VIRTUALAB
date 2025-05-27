import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserMenu() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    name: string;
    surname: string;
    role: string;
    avatar_url?: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        toast.error("Erreur de session.");
        return;
      }

      const userId = session?.session?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('name, surname, role, avatar_url')
        .eq('id', userId)
        .single();


      if (error) {
        toast.error("Erreur chargement profil");
      } else {
        setProfile(data);
      }
    };


    fetchProfile();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion.");
    } else {
      toast.success("Déconnecté avec succès 👋");
      navigate('/');
    }
  };

  const handleAccount = () => {
    setIsOpen(false);
    navigate('/account/UserAccount');
  };

  if (!profile) {
    return (
      <div className="text-white text-sm italic">
        Chargement utilisateur...
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <User2 size={20} className="text-white" />
        )}
        <div className="flex items-center">
          <span className="font-medium">{profile.surname} {profile.name} </span>
        </div>

        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border ">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User2 size={32} className="text-indigo-600" />
            )}
            <div className="text-sm">              
              <div className="font-semibold text-gray-500">{profile.surname}</div>
              <div className="font-semibold text-gray-500">{profile.name}</div>
              <div className="text-xs text-gray-500">{profile.role}</div>
            </div>
          </div>

          <ul className="text-sm py-1">
            <li>
              <button
                onClick={handleAccount}
                className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                <Settings size={16} />
                Mon compte
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                <LogOut size={16} />
                Se déconnecter
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
