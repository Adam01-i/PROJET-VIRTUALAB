import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, surname, email, role');

    if (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } else {
      setUsers(data ?? []);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResetPassword = (email: string) => {
    navigate(`/forgot-password?email=${encodeURIComponent(email)}`);
  };

  const handleDelete = async (userId: string) => {
    const confirm = window.confirm("Supprimer cet utilisateur ?");
    if (!confirm) return;

    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Utilisateur supprimé");
      fetchUsers(); // refresh
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-indigo-700">Gestion des utilisateurs</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-md text-sm">
          <thead className="bg-indigo-100 text-indigo-800">
            <tr>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Prénom</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Rôle</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.surname}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2 text-center flex gap-3 justify-center">
                  <button
                    onClick={() => handleResetPassword(u.email)}
                    className="text-indigo-600 hover:underline"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
