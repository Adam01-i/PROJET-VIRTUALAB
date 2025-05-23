import * as React from "react";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { Input } from "../../../ui/input";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

type Prof = {
  id: string;
  name: string;
  surname: string;
  assigned_at?: string;
};

type Props = {
  classeId: string;
  classeNom: string;
  onChange?: () => void;
};

const GestionProfesseursDialog: React.FC<Props> = ({
  classeId,
  classeNom,
  onChange,
}) => {
  const [allProfs, setAllProfs] = useState<Prof[]>([]);
  const [profsDansClasse, setProfsDansClasse] = useState<Prof[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllProfs();
    fetchProfsDansClasse();
  }, [classeId]);

  const fetchAllProfs = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, surname")
      .eq("role", "professeur");

    if (error) {
      toast.error("Erreur chargement professeurs", { description: error.message });
      return;
    }

    setAllProfs(data);
  };

  const fetchProfsDansClasse = async () => {
    const { data, error } = await supabase
      .from("professeurs_classes")
      .select("assigned_at, prof:professeur_id(id, name, surname)")
      .eq("classe_id", classeId);

    if (error) {
      toast.error("Erreur chargement classe", { description: error.message });
      return;
    }

    const sorted = data
      .map((item: any) => ({ ...item.prof, assigned_at: item.assigned_at }))
      .sort(
        (a, b) =>
          new Date(a.assigned_at!).getTime() - new Date(b.assigned_at!).getTime()
      );

    setProfsDansClasse(sorted);
  };

  const addProfToClasse = async (profId: string) => {
    if (profsDansClasse.length > 0) {
      toast.error("Une classe ne peut avoir qu’un seul professeur.");
      return;
    }

    const { error } = await supabase
      .from("professeurs_classes")
      .insert([{ professeur_id: profId, classe_id: classeId }]);

    if (error) {
      toast.error("Erreur ajout professeur", { description: error.message });
    } else {
      toast.success("Professeur ajouté à la classe");
      await fetchProfsDansClasse();
      onChange?.();
    }
  };

  const removeProfFromClasse = async (profId: string) => {
    const { error } = await supabase
      .from("professeurs_classes")
      .delete()
      .match({ professeur_id: profId, classe_id: classeId });

    if (error) {
      toast.error("Erreur suppression professeur", { description: error.message });
    } else {
      toast.success("Professeur retiré");
      await fetchProfsDansClasse();
      onChange?.();
    }
  };

  const filteredProfs =
    profsDansClasse.length > 0
      ? []
      : allProfs.filter((prof) =>
          `${prof.name} ${prof.surname}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Gérer les professeurs</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl space-y-4">
        <h3 className="text-xl font-bold mb-2">Professeurs de {classeNom}</h3>

        {/* 👨‍🏫 Professeurs actuels */}
        <div>
          <h4 className="font-semibold mb-1">Professeur actuel</h4>
          <ul className="mb-4 max-h-40 overflow-y-auto space-y-1">
            {profsDansClasse.length === 0 && (
              <p className="text-sm">Aucun professeur assigné à cette classe.</p>
            )}
            {profsDansClasse.map((prof, index) => (
              <li
                key={prof.id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  {prof.name} {prof.surname}
                  {index === 0 && (
                    <span className="ml-2 text-xs text-emerald-600 font-medium">
                      👑 Principal
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProfFromClasse(prof.id)}
                >
                  <UserMinus className="w-4 h-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* ➕ Ajouter un professeur */}
        {profsDansClasse.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Cette classe a déjà un professeur. Retirez-le pour en ajouter un autre.
          </p>
        ) : (
          <>
            <h4 className="font-semibold mb-1">Ajouter un professeur</h4>
            <Input
              placeholder="Rechercher par nom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <ul className="max-h-40 overflow-y-auto space-y-1">
              {filteredProfs.length === 0 && (
                <p className="text-sm">Aucun résultat</p>
              )}
              {filteredProfs.map((prof) => (
                <li
                  key={prof.id}
                  className="flex justify-between items-center text-sm"
                >
                  {prof.name} {prof.surname}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addProfToClasse(prof.id)}
                  >
                    <UserPlus className="w-4 h-4 text-green-500" />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GestionProfesseursDialog;
