import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error('Veuillez entrer une adresse email.');
      return;
    }
  
    setLoading(true);
  
    // 🔎 Vérifier si l'email existe dans Supabase
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email);
  
    if (userError || !users || users.length === 0) {
      toast.error('Aucun utilisateur trouvé avec cette adresse email.');
      setLoading(false);
      return;
    }
  
    // ✅ Email existe → envoyer le lien
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?email=${email}`,
    });
  
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Un lien a été envoyé à ' + email);
    }
  
    setLoading(false);
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">🔑 Réinitialisation</h2>
        <p className="text-sm text-gray-600 mb-4">
          Entrez votre email pour recevoir un lien de réinitialisation. Le mot de passe sera remplacé automatiquement par : <b>virtualab2025</b>.
          Verifier dans vos messages Spam
        </p>
        <input
          type="email"
          className="w-full p-3 border rounded-md mb-4"
          placeholder="exemple@virtualab.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </div>
    </div>
  );
}
