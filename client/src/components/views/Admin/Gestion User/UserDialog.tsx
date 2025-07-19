import * as React from "react";
import { Dialog, DialogTrigger, DialogContent } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";

type Classe = {
  id: string;
  niveau: string;
  lettre: string;
  code_classe?: string;
};

type User = {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatar_url?: string;
};

type Props = {
  user: User | null;
  role: "eleve" | "professeur";
  allClasses?: Classe[];
  refresh?: () => void;
  openExternally?: boolean;
  setOpenExternally?: (open: boolean) => void;
};

const UserDialog: React.FC<Props> = ({
  user,
  role,
  allClasses = [],
  refresh,
  openExternally,
  setOpenExternally,
}) => {
  const [assignedClasses, setAssignedClasses] = React.useState<Classe[]>([]);
  const [availableClasses, setAvailableClasses] = React.useState<Classe[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // ✅ Mode contrôlé ou non ?
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = openExternally !== undefined;

  const isOpen = isControlled ? openExternally : internalOpen;
  const setOpen = isControlled ? setOpenExternally! : setInternalOpen;

  const isNew = user === null;

  const fetchClasses = async () => {
    if (role === "eleve") {
      const { data, error } = await supabase.from("classes").select("*");
      if (!error) setAvailableClasses(data || []);
    } else {
      setAvailableClasses(allClasses);
    }
  };

  const fetchAssignedClasses = async () => {
    if (!user) return;

    const table = role === "eleve" ? "eleves_classes" : "professeurs_classes";
    const idKey = role === "eleve" ? "eleve_id" : "professeur_id";

    const { data, error } = await supabase
      .from(table)
      .select("classe:classe_id(id, niveau, lettre, code_classe)")
      .eq(idKey, user.id);

    if (!error) {
      setAssignedClasses(data.map((d: any) => d.classe));
    }
  };

  const checkIfClassAlreadyHasProf = async (classeId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("professeurs_classes")
      .select("id")
      .eq("classe_id", classeId);

    if (error) {
      toast.error("Erreur vérification classe", { description: error.message });
      return true; // Par précaution, bloquer l'action
    }

    return data.length > 0;
  };


  React.useEffect(() => {
    fetchClasses();
    if (!isNew) fetchAssignedClasses();
  }, [user]);

  const assignClasse = async () => {
    if (!selectedClassId || !user) return;

    // ✅ Vérification spécifique aux professeurs
    if (role === "professeur") {
      const alreadyAssigned = await checkIfClassAlreadyHasProf(selectedClassId);
      if (alreadyAssigned) {
        toast.error("Cette classe a déjà un professeur assigné.");
        return;
      }
    }

    const table = role === "eleve" ? "eleves_classes" : "professeurs_classes";
    const idKey = role === "eleve" ? "eleve_id" : "professeur_id";

    setLoading(true);
    const { error } = await supabase.from(table).insert([
      {
        [idKey]: user.id,
        classe_id: selectedClassId,
      },
    ]);

    if (error) {
      toast.error("Erreur assignation", { description: error.message });
    } else {
      toast.success("Classe assignée !");
      fetchAssignedClasses();
      setSelectedClassId("");
      refresh?.();
    }
    setLoading(false);
  };


  const removeClasse = async (classeId: string) => {
    if (!user) return;

    const table = role === "eleve" ? "eleves_classes" : "professeurs_classes";
    const idKey = role === "eleve" ? "eleve_id" : "professeur_id";

    const { error } = await supabase
      .from(table)
      .delete()
      .match({ [idKey]: user.id, classe_id: classeId });

    if (error) {
      toast.error("Erreur suppression", { description: error.message });
    } else {
      toast.success("Classe retirée !");
      fetchAssignedClasses();
      refresh?.();
    }
  };

  const filteredAvailableClasses = availableClasses.filter(
    (c) => !assignedClasses.find((a) => a.id === c.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {/* ✅ Seulement si non-contrôlé, on montre le bouton interne */}
      {!isControlled && (
        <DialogTrigger>
          <Button variant="outline">👁 Voir</Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-xl space-y-6">
        {user ? (
          <>
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url || "/assets/avatars/default-avatar.png"}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div>
                <h2 className="text-xl font-semibold">
                  {user.name} {user.surname}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs mt-1 text-gray-400 uppercase tracking-widest">{role}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📚 Classes assignées</h4>
              {assignedClasses.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune classe assignée.</p>
              ) : (
                <ul className="space-y-1">
                  {assignedClasses.map((classe) => (
                    <li key={classe.id} className="flex justify-between text-sm items-center">
                      <span>
                        📘 {classe.niveau} {classe.lettre}{" "}
                        {classe.code_classe && `(${classe.code_classe})`}
                      </span>
                      <Button
                        variant="ghost"
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

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">➕ Assigner une classe</h4>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded p-2 flex-1"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Sélectionner une classe</option>
                  {filteredAvailableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.niveau} {c.lettre} {c.code_classe && `(${c.code_classe})`}
                    </option>
                  ))}
                </select>
                <Button onClick={assignClasse} disabled={!selectedClassId || loading}>
                  Ajouter
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 italic">
            Utilisez <strong>UserFormDialog</strong> pour créer un utilisateur.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
