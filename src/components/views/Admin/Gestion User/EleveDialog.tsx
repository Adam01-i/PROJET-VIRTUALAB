import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";

type Eleve = {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatar_url?: string;
};

type Props = {
  eleve: Eleve;
};

const EleveDialog: React.FC<Props> = ({ eleve }) => {
  const [classes, setClasses] = React.useState<any[]>([]);
  const [eleveClasses, setEleveClasses] = React.useState<any[]>([]);
  const [newClasseId, setNewClasseId] = React.useState("");

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, niveau, lettre, code_classe");

    if (!error) setClasses(data || []);
  };

  const fetchEleveClasses = async () => {
    const { data, error } = await supabase
      .from("eleves_classes")
      .select("classe:classe_id(id, niveau, lettre, code_classe)")
      .eq("eleve_id", eleve.id);

    if (!error) {
      setEleveClasses(data.map((d) => d.classe));
    }
  };

  React.useEffect(() => {
    fetchClasses();
    fetchEleveClasses();
  }, []);

  const assignClasse = async () => {
    if (!newClasseId) return;

    const { error } = await supabase
      .from("eleves_classes")
      .insert([{ eleve_id: eleve.id, classe_id: newClasseId }]);

    if (error) {
      toast.error("Erreur assignation", { description: error.message });
    } else {
      toast.success("Classe assignée !");
      fetchEleveClasses();
      setNewClasseId("");
    }
  };

  const removeClasse = async (classeId: string) => {
    const { error } = await supabase
      .from("eleves_classes")
      .delete()
      .match({ eleve_id: eleve.id, classe_id: classeId });

    if (error) {
      toast.error("Erreur suppression", { description: error.message });
    } else {
      toast.success("Classe retirée !");
      fetchEleveClasses();
    }
  };

  const availableClasses = classes.filter(
    (c) => !eleveClasses.some((ec) => ec.id === c.id)
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">👁 Voir</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={eleve.avatar_url}
            alt="avatar"
            className="w-16 h-16 rounded-full border object-cover"
          />
          <div>
            <h3 className="text-xl font-semibold">
              {eleve.name} {eleve.surname}
            </h3>
            <p className="text-sm text-gray-500">{eleve.email}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Classes assignées</h4>
          {eleveClasses.length === 0 && (
            <p className="text-sm text-gray-500">Aucune classe assignée.</p>
          )}
          <ul className="space-y-1">
            {eleveClasses.map((classe) => (
              <li
                key={classe.id}
                className="flex justify-between items-center text-sm"
              >
                <span>
                  📘 {classe.niveau} {classe.lettre || ""} ({classe.code_classe})
                </span>
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
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Assigner une classe</h4>
          <div className="flex items-center gap-2">
            <select
              className="border rounded p-2 flex-1"
              value={newClasseId}
              onChange={(e) => setNewClasseId(e.target.value)}
            >
              <option value="">Sélectionner une classe</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.niveau} {c.lettre} ({c.code_classe})
                </option>
              ))}
            </select>
            <Button onClick={assignClasse} disabled={!newClasseId}>
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EleveDialog;
