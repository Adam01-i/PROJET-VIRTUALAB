import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../ui/card";
import { Button } from "../../../ui/button2";
import { Dialog, DialogTrigger } from "../../../ui/Dialog";
import { Trash2, Plus } from "lucide-react";
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
  const [openDialog, setOpenDialog] = useState(false);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select(`
        id, code_classe, created_at,
        professeur_principal:professeur_principal_id (id, name, surname),
        students:eleves_classes(count),
        teachers:professeurs_classes(count)
      `);

    if (error) {
      toast.error("Erreur de chargement des classes", {
        description: error.message,
      });
      return;
    }

    const formatted: Classe[] = data.map((c: any) => ({
      id: c.id,
      code_classe: c.code_classe,
      created_at: c.created_at,
      professeur_principal: c.professeur_principal,
      students_count: c.students?.[0]?.count || 0,
      teachers_count: c.teachers?.[0]?.count || 0,
    }));

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
      fetchClasses();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des classes</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle classe
            </Button>
          </DialogTrigger>
          {openDialog && (
            <GestionClasseDialog
              onClose={() => setOpenDialog(false)}
              onSuccess={fetchClasses}
            />
          )}
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {classes.map((classe) => (
          <Card key={classe.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{classe.code_classe}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClasse(classe.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                {classe.students_count} élève(s) – {classe.teachers_count} professeur(s)
              </p>

              {classe.professeur_principal && (
                <p className="text-sm">
                  👨‍🏫 Prof : {classe.professeur_principal.name}{" "}
                  {classe.professeur_principal.surname}
                </p>
              )}

              <p className="text-xs text-gray-400">
                Créée le {new Date(classe.created_at).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                <GestionElevesDialog
                  classeId={classe.id}
                  classeNom={classe.code_classe}
                />
                <GestionProfesseursDialog
                  classeId={classe.id}
                  classeNom={classe.code_classe}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminClasse;
    