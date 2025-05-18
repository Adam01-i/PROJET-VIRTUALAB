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
  email?: string;
  avatar_url?: string;
};

type Props = {
  classeId: string;
  classeNom: string;
};

const GestionElevesDialog: React.FC<Props> = ({ classeId, classeNom }) => {
  const [allEleves, setAllEleves] = useState<Eleve[]>([]);
  const [elevesDansClasse, setElevesDansClasse] = useState<Eleve[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [importedEleves, setImportedEleves] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchAllEleves = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, surname")
      .eq("role", "eleve");

    if (error) {
      toast.error("Erreur chargement élèves", { description: error.message });
      return;
    }

    setAllEleves(data);
  };

  const fetchElevesDansClasse = async () => {
    const { data, error } = await supabase
      .from("eleves_classes")
      .select("eleve:eleve_id(id, name, surname)")
      .eq("classe_id", classeId);

    if (error) {
      toast.error("Erreur chargement classe", { description: error.message });
      return;
    }

    setElevesDansClasse(data.map((ec: any) => ec.eleve));
  };

  useEffect(() => {
    fetchAllEleves();
    fetchElevesDansClasse();
  }, [classeId]);

  const addEleveToClasse = async (eleveId: string) => {
    const { error } = await supabase
      .from("eleves_classes")
      .insert([{ eleve_id: eleveId, classe_id: classeId }]);

    if (error) {
      toast.error("Erreur ajout", { description: error.message });
    } else {
      toast.success("Élève ajouté");
      fetchElevesDansClasse();
    }
  };

  const removeEleveFromClasse = async (eleveId: string) => {
    const { error } = await supabase
      .from("eleves_classes")
      .delete()
      .match({ eleve_id: eleveId, classe_id: classeId });

    if (error) {
      toast.error("Erreur suppression", { description: error.message });
    } else {
      toast.success("Élève retiré");
      fetchElevesDansClasse();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setImportedEleves(json as any[]);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (importedEleves.length === 0) {
      toast.error("Aucun élève à importer.");
      return;
    }

    setImporting(true);
    let count = 0;

    for (const row of importedEleves) {
      const { name, surname, email, avatar_url } = row;
      const role = row.role || "eleve";

      try {
        const response = await fetch("/api/import-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, surname, email, avatar_url, role }),
        });

        const result = await response.json();
        if (response.ok && result.id) {
          await supabase
            .from("eleves_classes")
            .insert([{ eleve_id: result.id, classe_id: classeId }]);
          count++;
        } else {
          toast.error(`Erreur : ${email} — ${result.error}`);
        }
      } catch (err) {
        toast.error(`Erreur réseau pour ${email}`);
      }
    }

    await fetchAllEleves();
    await fetchElevesDansClasse();
    setImporting(false);
    toast.success(`${count} élève(s) importé(s) et ajoutés à la classe.`);
  };

  const filteredEleves = allEleves.filter(
    (eleve) =>
      `${eleve.name} ${eleve.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !elevesDansClasse.some((e) => e.id === eleve.id)
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          Gérer les élèves
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl space-y-4">
        <h2 className="text-lg font-bold">Élèves de {classeNom}</h2>

        {/* 📥 Importer par fichier */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="font-semibold">Importer des élèves (.xlsx)</h4>
          <div className="flex gap-4 items-center">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
            <Button onClick={handleImport} disabled={importing || importedEleves.length === 0}>
              {importing ? "Import..." : "Importer"}
            </Button>
          </div>
          {importedEleves.length > 0 && (
            <ul className="text-sm max-h-24 overflow-y-auto">
              {importedEleves.map((e, i) => (
                <li key={i}>
                  {e.name} {e.surname} - <span className="text-gray-500">{e.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🔄 Liste actuelle */}
        <div>
          <h4 className="font-semibold mb-1">Élèves actuels ({elevesDansClasse.length})</h4>
          <ul className="max-h-40 overflow-y-auto space-y-1">
            {elevesDansClasse.length === 0 && <p className="text-sm">Aucun élève.</p>}
            {elevesDansClasse.map((eleve) => (
              <li key={eleve.id} className="flex justify-between items-center text-sm">
                {eleve.name} {eleve.surname}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEleveFromClasse(eleve.id)}
                >
                  <UserMinus className="w-4 h-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* ➕ Ajouter un élève */}
        <div>
          <h4 className="font-semibold mb-1">Ajouter un élève existant</h4>
          <Input
            placeholder="Rechercher par nom"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <ul className="max-h-40 overflow-y-auto space-y-1">
            {filteredEleves.length === 0 && <p className="text-sm">Aucun résultat</p>}
            {filteredEleves.map((eleve) => (
              <li key={eleve.id} className="flex justify-between items-center text-sm">
                {eleve.name} {eleve.surname}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => addEleveToClasse(eleve.id)}
                >
                  <UserPlus className="w-4 h-4 text-green-500" />
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
