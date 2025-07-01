import * as React from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { Input } from "../../../ui/input";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import * as XLSX from "xlsx";

type Eleve = {
  id: string;
  name: string;
  surname: string;
};

type ImportedEleve = {
  name: string;
  surname: string;
  email: string;
  avatar_url?: string;
};

type Props = {
  classeId: string;
  classeNom: string;
  onChange?: () => void;
};

const GestionElevesDialog: React.FC<Props> = ({ classeId, classeNom, onChange }) => {
  const [allEleves, setAllEleves] = useState<Eleve[]>([]);
  const [elevesDansClasse, setElevesDansClasse] = useState<Eleve[]>([]);
  const [elevesDansAutresClasses, setElevesDansAutresClasses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [importedEleves, setImportedEleves] = useState<ImportedEleve[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchAllEleves();
    fetchElevesDansClasse();
    fetchElevesDansAutresClasses();
  }, [classeId]);

  const fetchAllEleves = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, surname")
      .eq("role", "eleve");

    if (!error && data) setAllEleves(data);
  };

  const fetchElevesDansClasse = async () => {
    const { data, error } = await supabase
      .from("eleves_classes")
      .select("eleve:eleve_id(id, name, surname)")
      .eq("classe_id", classeId);

    if (!error && data) {
      setElevesDansClasse(data.map((ec: any) => ec.eleve));
    }
  };

  const fetchElevesDansAutresClasses = async () => {
    const { data } = await supabase
      .from("eleves_classes")
      .select("eleve_id")
      .neq("classe_id", classeId);

    if (data) setElevesDansAutresClasses(data.map((e) => e.eleve_id));
  };

  const addEleveToClasse = async (eleveId: string) => {
    const { data: existing } = await supabase
      .from("eleves_classes")
      .select("classe_id")
      .eq("eleve_id", eleveId);

    if (existing && existing.length > 0) {
      return toast.error("Élève déjà assigné à une classe.");
    }

    const { error } = await supabase
      .from("eleves_classes")
      .insert([{ eleve_id: eleveId, classe_id: classeId, assigned_at: new Date().toISOString() }]);

    if (error) {
      toast.error("Erreur lors de l'ajout", { description: error.message });
    } else {
      toast.success("Élève ajouté !");
      fetchElevesDansClasse();
      fetchElevesDansAutresClasses();
      onChange?.();
    }
  };

  const removeEleveFromClasse = async (eleveId: string) => {
    const { error } = await supabase
      .from("eleves_classes")
      .delete()
      .match({ eleve_id: eleveId, classe_id: classeId });

    if (error) {
      toast.error("Erreur lors de la suppression", { description: error.message });
    } else {
      toast.success("Élève retiré !");
      fetchElevesDansClasse();
      fetchElevesDansAutresClasses();
      onChange?.();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target?.result, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet) as ImportedEleve[];
      setImportedEleves(json);
      toast.success(`${json.length} élève(s) chargé(s).`);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (importedEleves.length === 0) return toast.error("Aucun élève à importer.");

    setImporting(true);
    let count = 0;

    for (const eleve of importedEleves) {
      try {
        const response = await fetch("http://localhost:3001/api/import-eleves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...eleve,
            role: "eleve",
            avatar_url:
              eleve.avatar_url ||
              "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1748565991828.jpg",
          }),
        });

        const result = await response.json();

        if (response.ok && result.user?.id) {
          await supabase
            .from("eleves_classes")
            .insert([{ eleve_id: result.user.id, classe_id: classeId }]);

          count++;
        } else {
          toast.error(`❌ Erreur pour ${eleve.email} : ${result.error}`);
        }

      } catch {
        toast.error(`Erreur réseau pour ${eleve.email}`);
      }
    }

    setImporting(false);
    fetchAllEleves();
    fetchElevesDansClasse();
    fetchElevesDansAutresClasses();

    toast.success(`${count} élève(s) importé(s) !`);
    onChange?.();
  };

  const filteredEleves = allEleves.filter(
    (eleve) =>
      ` ${eleve.surname} ${eleve.name}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !elevesDansClasse.some((e) => e.id === eleve.id) &&
      !elevesDansAutresClasses.includes(eleve.id)
  );

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline">Gérer les élèves</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl space-y-5">
        <h3 className="text-xl font-bold">🎒 Élèves de {classeNom}</h3>

        {/* 🗂 Import fichier */}
        <div>
          <h4 className="font-semibold">Importer des élèves (.xlsx)</h4>
          <div className="flex items-center gap-4 mt-2">
            <label className="cursor-pointer flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-200">
              📂 Importer
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
            <Button onClick={handleImport} disabled={importing || importedEleves.length === 0}>
              {importing ? "Importation..." : "Valider Import"}
            </Button>
          </div>
        </div>

        {importedEleves.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-semibold text-sm mb-2">Élèves détectés ({importedEleves.length})</h4>
            <ul className="text-sm max-h-24 overflow-y-auto space-y-1">
              {importedEleves.map((e, i) => (
                <li key={i} className="flex justify-between">
                  {e.surname} {e.name}
                  <span className="text-gray-500">{e.email}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 👨‍🎓 Élèves existants */}
        <div>
          <h4 className="font-semibold">Ajouter un élève existant</h4>
          <Input
            placeholder="Rechercher par nom"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <ul className="max-h-40 overflow-y-auto space-y-1 text-sm">
            {filteredEleves.length === 0 && <p>Aucun résultat.</p>}
            {filteredEleves.map((eleve) => (
              <li key={eleve.id} className="flex justify-between items-center">
                {eleve.surname} {eleve.name}
                <Button variant="ghost" size="icon" onClick={() => addEleveToClasse(eleve.id)}>
                  <UserPlus className="w-4 h-4 text-green-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Liste actuelle */}
        <div>
          <h4 className="font-semibold mt-4">Élèves actuels ({elevesDansClasse.length})</h4>
          <ul className="max-h-40 overflow-y-auto space-y-1 text-sm">
            {elevesDansClasse.length === 0 && <p>Aucun élève assigné.</p>}
            {elevesDansClasse.map((eleve) => (
              <li key={eleve.id} className="flex justify-between items-center">
                {eleve.name} {eleve.surname}
                <Button variant="ghost" size="icon" onClick={() => removeEleveFromClasse(eleve.id)}>
                  <UserMinus className="w-4 h-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GestionElevesDialog;
