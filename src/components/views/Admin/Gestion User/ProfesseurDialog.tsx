import * as React from "react";
import { DialogContent } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import { Dialog, DialogTrigger } from "../../../ui/Dialog";

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
  prof: Prof;
  allClasses: Classe[];
  refresh: () => void;
};

const ProfesseurDetailsDialog: React.FC<Props> = ({ prof, allClasses, refresh }) => {
  const [classesAffectees, setClassesAffectees] = React.useState<Classe[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchAffectations = async () => {
    const { data, error } = await supabase
      .from("professeurs_classes")
      .select("classe:classe_id(id, niveau, lettre)")
      .eq("professeur_id", prof.id);

    if (error) {
      toast.error("Erreur chargement classes", { description: error.message });
    } else {
      setClassesAffectees(data.map((d: any) => d.classe));
    }
  };

  React.useEffect(() => {
    fetchAffectations();
  }, []);

  const assignClasse = async (classeId: string) => {
    if (!classeId) return;
    setLoading(true);

    const { error } = await supabase
      .from("professeurs_classes")
      .insert([{ professeur_id: prof.id, classe_id: classeId }]);

    if (error) {
      toast.error("Erreur assignation", { description: error.message });
    } else {
      toast.success("Classe assignée !");
      await fetchAffectations();
      refresh();
    }

    setLoading(false);
  };

  const removeClasse = async (classeId: string) => {
    const { error } = await supabase
      .from("professeurs_classes")
      .delete()
      .match({ professeur_id: prof.id, classe_id: classeId });

    if (error) {
      toast.error("Erreur suppression", { description: error.message });
    } else {
      toast.success("Classe retirée !");
      await fetchAffectations();
      refresh();
    }
  };

  const classesDisponibles = allClasses.filter(
    (c) => !classesAffectees.find((a) => a.id === c.id)
  );

  return (
    <Dialog>
      {/* 🔍 Voir bouton qui ouvre le dialog */}
      <DialogTrigger asChild>
        <Button variant="outline">👁 Voir</Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={prof.avatar_url}
            alt={`${prof.name} ${prof.surname}`}
            className="w-16 h-16 rounded-full border object-cover"
          />
          <div>
            <h2 className="text-lg font-bold">{prof.name} {prof.surname}</h2>
            <p className="text-sm text-gray-600">{prof.email}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Classes assignées</h4>
          {classesAffectees.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune classe assignée.</p>
          ) : (
            <ul className="space-y-1">
              {classesAffectees.map((classe) => (
                <li key={classe.id} className="flex justify-between items-center text-sm">
                  📘 {classe.niveau} {classe.lettre}
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => removeClasse(classe.id)}
                    className="text-red-500"
                  >
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Assigner une classe</h4>
          <div className="flex items-center gap-2">
          <select
            className="border rounded p-2 flex-1"
            defaultValue=""
            onChange={(e) => assignClasse(e.target.value)}
            disabled={loading}
          >
            <option value="">Sélectionner une classe</option>
            {classesDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.niveau} {c.lettre}
              </option>
            ))}
          </select>
          
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfesseurDetailsDialog;
