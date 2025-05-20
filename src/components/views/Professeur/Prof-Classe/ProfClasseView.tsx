'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  PlusCircle,
  Users,
  BarChart3,
  FlaskConical,
  Trash2,
  Loader2,
} from 'lucide-react';
import CardStat from '../../../ui/CardStat';

type Classe = { id: string; code_classe: string };
type Eleve = { id: string; name: string; surname: string; email: string };
type Experience = { id: string; titre: string; niveau: string };

export default function ManageClasse() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [loading, setLoading] = useState(false);

  // Récupération des classes du professeur
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('mes_classes').select('*');
      if (error) return toast.error("Erreur récupération classes");
      setClasses(data);
      if (data.length) setSelectedClasseId(data[0].id);
    };
    fetchClasses();
  }, []);

  // Chargement des élèves & expériences de la classe sélectionnée
  useEffect(() => {
    if (!selectedClasseId) return;

    const fetchDetails = async () => {
      const { data: elevesData, error: err1 } = await supabase
        .from('eleves_classes')
        .select('eleve_id, profiles(id, name, surname, email)')
        .eq('classe_id', selectedClasseId);

      const { data: expData, error: err2 } = await supabase
        .from('experiences')
        .select('id, titre, niveau')
        .eq('classe_id', selectedClasseId);

      if (err1 || err2) {
        toast.error("Erreur chargement élèves ou expériences");
        return;
      }

      const mappedEleves = elevesData.map((e: any) => ({
        id: e.profiles.id,
        name: e.profiles.name,
        surname: e.profiles.surname,
        email: e.profiles.email,
      }));

      setEleves(mappedEleves);
      setExperiences(expData);
    };

    fetchDetails();
  }, [selectedClasseId]);

  // Ajouter un élève à une classe via email
  const handleAddEleve = async () => {
    if (!emailToAdd.trim()) return;

    setLoading(true);
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailToAdd.trim())
      .single();

    if (error || !user) {
      toast.error("Élève introuvable avec cet email.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('eleves_classes').insert({
      eleve_id: user.id,
      classe_id: selectedClasseId,
    });

    if (insertError) {
      toast.error("Échec de l'ajout. Élève déjà affecté ?");
    } else {
      toast.success("Élève ajouté !");
      setEmailToAdd('');
    }

    setLoading(false);
    // recharge la liste
    const { data: updated } = await supabase
      .from('eleves_classes')
      .select('eleve_id, profiles(id, name, surname, email)')
      .eq('classe_id', selectedClasseId);
    setEleves(
      updated
        ? updated.map((e: any) => ({
            id: e.profiles.id,
            name: e.profiles.name,
            surname: e.profiles.surname,
            email: e.profiles.email,
          }))
        : []
    );
  };

  // Supprimer un élève de la classe
  const handleRemoveEleve = async (eleveId: string) => {
    const { error } = await supabase
      .from('eleves_classes')
      .delete()
      .eq('eleve_id', eleveId)
      .eq('classe_id', selectedClasseId);

    if (error) {
      toast.error("Erreur suppression");
    } else {
      toast.success("Élève retiré de la classe");
      setEleves((prev) => prev.filter((e) => e.id !== eleveId));
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-indigo-800">🎓 Gestion de mes classes</h1>

      {/* Sélecteur de classe */}
      <div>
        <label className="text-sm font-semibold text-gray-600">Sélectionner une classe :</label>
        <select
          onChange={(e) => setSelectedClasseId(e.target.value)}
          value={selectedClasseId ?? ''}
          className="mt-1 px-4 py-2 border rounded text-sm"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code_classe}
            </option>
          ))}
        </select>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardStat label="Élèves" count={eleves.length} icon={<Users className="h-6 w-6" />} />
        <CardStat label="Expériences" count={experiences.length} icon={<FlaskConical className="h-6 w-6" />} />
        <CardStat label="Activités" count={0} icon={<BarChart3 className="h-6 w-6" />} />
      </div>

      {/* Liste des élèves */}
      <div className="bg-white shadow rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-indigo-700">👥 Élèves de la classe</h2>
        </div>

        {eleves.length === 0 ? (
          <p className="text-gray-500">Aucun élève pour l’instant.</p>
        ) : (
          <ul className="divide-y text-sm">
            {eleves.map((el) => (
              <li key={el.id} className="py-2 flex justify-between items-center">
                <div>
                  {el.name} {el.surname} <span className="text-gray-400 italic">({el.email})</span>
                </div>
                <button
                  onClick={() => handleRemoveEleve(el.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Retirer l’élève"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Ajouter élève */}
        <div className="mt-6 flex items-center gap-3">
          <input
            type="email"
            placeholder="Email de l’élève"
            value={emailToAdd}
            onChange={(e) => setEmailToAdd(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
          <button
            onClick={handleAddEleve}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Expériences */}
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">🔬 Expériences liées</h2>
        {experiences.length === 0 ? (
          <p className="text-gray-500">Aucune expérience liée.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm space-y-2">
            {experiences.map((exp) => (
              <li key={exp.id}>
                {exp.titre} <span className="text-xs text-gray-400">(niveau : {exp.niveau})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
