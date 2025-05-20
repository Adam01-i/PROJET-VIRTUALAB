'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export default function UserAccount() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Nouveau champ pour changer le mot de passe
  const [newPassword, setNewPassword] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const { data } = await supabase
      .from('profiles')
      .select('name, surname, role, avatar_url')
      .eq('id', userId)
      .single();

    if (data) {
      setName(data.name || '');
      setSurname(data.surname || '');
      setRole(data.role || '');
      setAvatarUrl(data.avatar_url);
    } else {
      toast.error('Erreur lors du chargement du profil.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const { error } = await supabase
      .from('profiles')
      .update({ name, surname })
      .eq('id', userId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Profil mis à jour !");
      await fetchProfile();
    }

    // ✅ Mise à jour du mot de passe si renseigné
    if (newPassword.trim().length >= 6) {
      const { error: passError } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });
      if (passError) {
        toast.error("Erreur modification mot de passe");
      } else {
        toast.success("Mot de passe modifié ✅");
        setNewPassword('');
      }
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      toast.error("Échec de l'envoi de l'avatar.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    setAvatarUrl(publicUrl);

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    toast.success("Avatar mis à jour !");
  };

  const roleLabel = {
    eleve: 'Élève',
    professeur: 'Professeur',
    admin: 'Administrateur',
  }[role] || 'Utilisateur';

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8 mt-6 space-y-4 px-40">
      <h2 className="text-2xl font-bold text-indigo-700 mb-2">Mon Profil {roleLabel}</h2>
      <p className="text-gray-500 text-sm">Visualisez et mettez à jour vos informations personnelles.</p>

      <hr className="my-4 border-gray-200" />

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover shadow border border-gray-200"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-3xl shadow">
              ?
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600 font-medium">Changer l'avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="text-sm file:mr-2 file:py-1 file:px-3 file:border file:rounded file:bg-indigo-50 file:text-indigo-700 file:border-indigo-200"
          />
        </div>
      </div>

      <hr className="my-4 border-gray-200" />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Surnom</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Rôle</label>
          <input
            type="text"
            value={roleLabel}
            disabled
            className="mt-1 block w-full bg-gray-100 text-gray-600 rounded-md border-gray-300 shadow-sm text-sm px-3 py-2"
          />
        </div>

        {/* 🔐 Nouveau champ mot de passe */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Laisser vide pour ne pas modifier"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
        </div>
      </div>

      <div className="pt-4 flex gap-4">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded shadow-sm transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save size={18} />
              Mettre à jour
            </>
          )}
        </button>

        {/* 🔙 Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm px-4 py-2 text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded shadow-sm"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
      </div>
    </div>
  );
}
