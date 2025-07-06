import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../ui/card";
import { Button } from "../../../ui/button2";
import { Dialog, DialogTrigger } from "../../../ui/Dialog";
import { Trash2, Plus, Users, BookOpenCheck, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import GestionElevesDialog from "./GestionElevesDialog";
import GestionProfesseursDialog from "./GestionProfesseursDialog";
import GestionClasseDialog from "./GestionClasseDialog";

type Profile = {
  id: string;
  name: string;
  surname: string;
};

type Classe = {
  id: string;
  code_classe: string;
  created_at: string;
  professeur_principal?: Profile;
  students_count: number;
  teachers_count: number;
};

const AdminClasse: React.FC = () => {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("vue_classes_completes")
      .select("*");

    if (error || !Array.isArray(data)) {
      toast.error("Erreur de chargement des classes", {
        description: error?.message || "Aucune donnée reçue.",
      });
      return;
    }

    const principalProfIds = data
      .map((classe) => classe.professeur_principal_id)
      .filter((id): id is string => !!id);

    const { data: profsData, error: profError } = await supabase
      .from("profiles")
      .select("id, name, surname")
      .in("id", principalProfIds);

    if (profError) {
      toast.error("Erreur chargement des professeurs", {
        description: profError.message,
      });
      return;
    }

    const profMap = Object.fromEntries(
      (profsData || []).map((p) => [p.id, p])
    );

    const formatted: Classe[] = data.map((c: any) => {
      const profPrincipal = c.professeur_principal_id
        ? profMap[c.professeur_principal_id] || null
        : null;

      return {
        id: c.id,
        code_classe: c.code_classe,
        created_at: c.created_at,
        professeur_principal: profPrincipal,
        students_count: c.students_count,
        teachers_count: c.teachers_count,
      };
    });

    setClasses(formatted);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDeleteClasse = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
    } else {
      toast.success("Classe supprimée");
      await fetchClasses();
    }
  };

  return (
    <div className="mt-15 px-4 sm:px-6 md:px-8 py-10 space-y-8 max-w-screen-xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-800">
          🎓 Gestion des classes
        </h2>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              onClick={() => setDialogOpen(true)}
              className="flex gap-2 items-center"
            >
              <Plus className="w-4 h-4" />
              Nouvelle classe
            </Button>
          </DialogTrigger>

          {dialogOpen && (
            <GestionClasseDialog
              onClose={() => setDialogOpen(false)}
              onSuccess={fetchClasses}
            />
          )}
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <div className="text-center text-gray-500 italic">
          Aucune classe enregistrée.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classe) => (
            <Card
              key={classe.id}
              className="bg-white shadow-md hover:shadow-xl transition-shadow border border-gray-200"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-blue-700">
                    🏷️ {classe.code_classe}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClasse(classe.id)}
                    title="Supprimer la classe"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 hover:text-red-800" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>{classe.students_count} élève(s)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <BookOpenCheck className="w-4 h-4" />
                  <span>{classe.teachers_count} professeur(s)</span>
                </div>

                {classe.professeur_principal ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <UserCircle className="w-4 h-4" />
                    Professeur principal :{" "}                    
                    {classe.professeur_principal.surname}
                    {classe.professeur_principal.name}{" "}
                  </div>
                ) : (
                  <div className="text-sm text-orange-500 flex items-center gap-1">
                    <UserCircle className="w-4 h-4" />
                    Aucun professeur principal assigné
                  </div>
                )}

                <p className="text-xs text-gray-400 italic">
                  Créée le {new Date(classe.created_at).toLocaleDateString()}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <GestionElevesDialog
                    classeId={classe.id}
                    classeNom={classe.code_classe}
                    onChange={fetchClasses}
                  />
                  <GestionProfesseursDialog
                    classeId={classe.id}
                    classeNom={classe.code_classe}
                    onChange={fetchClasses}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClasse;
