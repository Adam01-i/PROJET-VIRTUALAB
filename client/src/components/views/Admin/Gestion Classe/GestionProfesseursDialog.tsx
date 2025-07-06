import * as React from "react";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { Input } from "../../../ui/input";
import { toast } from "sonner";
import { UserMinus, Crown } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

type Prof = {
  id: string;
  name: string;
  surname: string;
};

type Props = {
  classeId: string;
  classeNom: string;
  onChange?: () => void;
};

const GestionProfesseurPrincipalDialog: React.FC<Props> = ({
  classeId,
  classeNom,
  onChange,
}) => {
  const [allProfs, setAllProfs] = useState<Prof[]>([]);
  const [profPrincipal, setProfPrincipal] = useState<Prof | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllProfs();
    fetchProfPrincipal();
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

    setAllProfs(data || []);
  };

  const fetchProfPrincipal = async () => {
    const { data, error } = await supabase
      .from("professeurs_classes")
      .select("prof:professeur_id(id, name, surname)")
      .eq("classe_id", classeId)
      .eq("is_principal", true)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Erreur chargement professeur principal", { description: error.message });
      return;
    }

    if (data && data.prof) {
      const prof = Array.isArray(data.prof) ? data.prof[0] : data.prof;
      setProfPrincipal({
        id: prof.id,
        name: prof.name,
        surname: prof.surname,
      });
    } else {
      setProfPrincipal(null);
    }
  };

 const remplacerProfesseur = async (profId: string) => {
  const { error } = await supabase.rpc("remplacer_professeur_principal", {
    classe: classeId,
    prof: profId,
  });

  if (error) {
    toast.error("Erreur remplacement professeur", {
      description: error.message,
    });
  } else {
    toast.success("Professeur principal défini");
    await fetchProfPrincipal();
    onChange?.();
  }
};




  const retirerProfesseur = async () => {
    const { error } = await supabase
      .from("professeurs_classes")
      .delete()
      .eq("classe_id", classeId);

    if (error) {
      toast.error("Erreur suppression", { description: error.message });
    } else {
      toast.success("Professeur retiré");
      setProfPrincipal(null);
      onChange?.();
    }
  };

  const filteredProfs = allProfs.filter(
    (prof) =>
      `${prof.name} ${prof.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Gérer le professeur principal</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg space-y-4">
        <h3 className="text-xl font-bold mb-2">Professeur principal de {classeNom}</h3>

        {/* Professeur actuel */}
        <div>
          <h4 className="font-semibold mb-1">Actuel</h4>
          {profPrincipal ? (
            <div className="flex justify-between items-center text-sm border p-2 rounded">
              <div>
                {profPrincipal.name} {profPrincipal.surname}
                <span className="ml-2 text-xs text-emerald-600 font-medium">
                  👑 Professeur principal
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                title="Retirer"
                onClick={retirerProfesseur}
              >
                <UserMinus className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <p className="text-sm">Aucun professeur principal pour cette classe.</p>
          )}
        </div>

        {/* Choisir un nouveau professeur */}
        <div>
          <h4 className="font-semibold mb-1">Remplacer / Ajouter</h4>
          <Input
            placeholder="Rechercher par nom"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <ul className="max-h-40 overflow-y-auto space-y-1">
            {filteredProfs.map((prof) => (
              <li
                key={prof.id}
                className="flex justify-between items-center text-sm"
              >
                {prof.name} {prof.surname}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Définir comme principal"
                  onClick={() => remplacerProfesseur(prof.id)}
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GestionProfesseurPrincipalDialog;
