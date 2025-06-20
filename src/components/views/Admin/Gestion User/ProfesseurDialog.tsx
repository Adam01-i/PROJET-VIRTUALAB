// components/ProfesseurDialog.tsx

import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";

type Prof = {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatar_url?: string;
};

type Classe = {
  id: string;
  niveau: string;
  lettre: string;
};

type Props = {
  prof: Prof | null;
  allClasses: Classe[];
  onAdd?: (prof: Prof) => void;
  refresh?: () => void;
  onClose?: () => void;
  openExternally?: boolean;
  setOpenExternally?: (value: boolean) => void;
};

const ProfesseurDialog: React.FC<Props> = ({
  prof,
  allClasses,
  onAdd,
  refresh,
  openExternally,
  setOpenExternally
}) => {
  const [open, setOpen] = React.useState(false);
  const [classesAffectees, setClassesAffectees] = React.useState<Classe[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newSurname, setNewSurname] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');

  React.useEffect(() => {
    if (!prof) return;
    const fetchAffectations = async () => {
      const { data, error } = await supabase
        .from("professeurs_classes")
        .select("classe:classe_id(id, niveau, lettre)")
        .eq("professeur_id", prof.id);
      if (!error) setClassesAffectees(data.map((d: any) => d.classe));
    };
    fetchAffectations();
  }, [prof]);

  const assignClasse = async (classeId: string) => {
    if (!classeId || !prof) return;
    setLoading(true);
    const { error } = await supabase
      .from("professeurs_classes")
      .insert([{ professeur_id: prof.id, classe_id: classeId }]);
    if (!error) {
      toast.success("Classe assignée !");
      refresh?.();
    }
    setLoading(false);
  };

  const removeClasse = async (classeId: string) => {
    if (!prof) return;
    const { error } = await supabase
      .from("professeurs_classes")
      .delete()
      .match({ professeur_id: prof.id, classe_id: classeId });
    if (!error) {
      toast.success("Classe retirée !");
      refresh?.();
    }
  };

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const handleCreate = async () => {
  const name = newName.trim();
  const surname = newSurname.trim();
  const email = newEmail.trim();
  const role = "professeur";
  const avatar_url = "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars//1747523215141.png";

  if (!name || !surname || !email) {
    toast.error("Tous les champs sont requis");
    return;
  }

  if (!isValidEmail(email)) {
    toast.error("Email invalide. Veuillez corriger l’adresse.");
    return;
  }

  const body = { name, surname, email, avatar_url, role };
  console.log("📤 Envoi POST :", body);

  try {
    const res = await fetch("/api/import-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("❌ Erreur serveur :", result);
      toast.error(result.error || "Erreur inconnue");
    } else {
      toast.success("Professeur créé !");
      onAdd?.(result.user);
      setOpenExternally?.(false);
    }
  } catch (err) {
    console.error("❌ Erreur réseau :", err);
    toast.error("Erreur de connexion au serveur");
  }
};


  const classesDisponibles = allClasses.filter(
    (c) => !classesAffectees.find((a) => a.id === c.id)
  );

  const internalOpen = openExternally ?? open;
  const setInternalOpen = setOpenExternally ?? setOpen;

  return (
    <Dialog open={internalOpen} onOpenChange={setInternalOpen}>
      {prof && (
        <DialogTrigger>
          <Button variant="outline">👁 Voir</Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-xl space-y-4">
        {prof === null ? (
          <>
            <h2 className="text-lg font-bold">Ajouter un nouveau professeur</h2>
            <input type="text" placeholder="Prénom" value={newName} onChange={(e) => setNewName(e.target.value)} className="border p-2 rounded w-full" />
            <input type="text" placeholder="Nom" value={newSurname} onChange={(e) => setNewSurname(e.target.value)} className="border p-2 rounded w-full" />
            <input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="border p-2 rounded w-full" />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setInternalOpen(false)}>Annuler</Button>
              <Button className="bg-indigo-600 text-white" onClick={handleCreate}>Valider</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-4 items-center">
              <img src={prof.avatar_url} alt={`${prof.name}`} className="w-16 h-16 rounded-full object-cover border" />
              <div>
                <h2 className="font-bold text-lg">{prof.name} {prof.surname}</h2>
                <p className="text-sm text-gray-600">{prof.email}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Classes assignées</h4>
              <ul className="space-y-1">
                {classesAffectees.map((classe) => (
                  <li key={classe.id} className="flex justify-between text-sm">
                    📘 {classe.niveau} {classe.lettre}
                    <Button variant="ghost" onClick={() => removeClasse(classe.id)} className="text-red-500">Retirer</Button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Assigner une classe</h4>
              <select className="border rounded p-2 w-full" defaultValue="" onChange={(e) => assignClasse(e.target.value)} disabled={loading}>
                <option value="">Sélectionner une classe</option>
                {classesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.niveau} {c.lettre}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfesseurDialog;
