import * as React from "react";
import { useEffect, useState } from "react";
import { DialogContent } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { supabase } from "../../../../lib/supabaseClient";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const niveaux = ["1èreS2"];
const lettres = ["A", "B", "C", "D", "E"];

type Profile = {
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
  onClose: () => void;
  onSuccess: () => void;
};

const GestionClasseDialog: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [professeurs, setProfesseurs] = useState<Profile[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState("");
  const [selectedLettre, setSelectedLettre] = useState("");
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [importedEleves, setImportedEleves] = useState<ImportedEleve[]>([]);

  useEffect(() => {
    const fetchProfesseurs = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, surname")
        .eq("role", "professeur");

      if (!error && data) setProfesseurs(data);
    };
    fetchProfesseurs();
  }, []);

  const checkClasseExist = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id")
      .eq("niveau", selectedNiveau)
      .eq("lettre", selectedLettre);

    return data && data.length > 0;
  };

  const handleAddClasse = async () => {
    if (!selectedNiveau || !selectedLettre || !selectedProfId) return;

    setChecking(true);

    const exists = await checkClasseExist();
    if (exists) {
      toast.error(`❌ La classe ${selectedNiveau} ${selectedLettre} existe déjà.`);
      setChecking(false);
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .insert([{ niveau: selectedNiveau, lettre: selectedLettre }])
      .select("id");

    if (error || !data) {
      toast.error("Erreur création classe", { description: error?.message });
      setChecking(false);
      return;
    }

    const newClasseId = data[0].id;

    // ➕ Utilise la fonction PostgreSQL sécurisée pour insérer le prof principal
    const { error: profError } = await supabase.rpc("remplacer_professeur_principal", {
      classe: newClasseId,
      prof: selectedProfId,
    });

    if (profError) {
      toast.error("Erreur assignation professeur principal", {
        description: profError.message,
      });
      setChecking(false);
      return;
    }

    // 👥 Importer les élèves (via API -> insert in profiles -> insert in eleves_classes)
    for (const eleve of importedEleves) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/import-eleves`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...eleve, role: "eleve" }),
        });

        const result = await response.json();
        if (response.ok && result.user?.id) {
          await supabase
            .from("eleves_classes")
            .insert([{ eleve_id: result.user.id, classe_id: newClasseId }]);
        } else {
          toast.error(`❌ Erreur pour ${eleve.email} : ${result.error}`);
        }
      } catch {
        toast.error(`Erreur réseau pour ${eleve.email}`);
      }
    }

    toast.success("✅ Classe et élèves importés avec succès !");
    onSuccess();
    onClose();
    setChecking(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet) as ImportedEleve[];
      setImportedEleves(json);
      toast.success(`📥 ${json.length} élève(s) importé(s).`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <DialogContent className="max-w-3xl space-y-6">
      <h3 className="text-xl font-bold">Créer une nouvelle classe</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Niveau</label>
          <select
            className="w-full border p-2 rounded mt-1"
            value={selectedNiveau}
            onChange={(e) => setSelectedNiveau(e.target.value)}
          >
            <option value="">Sélectionner</option>
            {niveaux.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Lettre</label>
          <select
            className="w-full border p-2 rounded mt-1"
            value={selectedLettre}
            onChange={(e) => setSelectedLettre(e.target.value)}
          >
            <option value="">Sélectionner</option>
            {lettres.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Professeur principal</label>
          <select
            className="w-full border p-2 rounded mt-1"
            value={selectedProfId ?? ""}
            onChange={(e) => setSelectedProfId(e.target.value)}
          >
            <option value="">Sélectionner</option>
            {professeurs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.surname} {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <label className="cursor-pointer flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-200">
          📂 Importer elèves(.xlsx)
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {importedEleves.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-md font-semibold mb-2">
            Élèves importés ({importedEleves.length})
          </h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
            {importedEleves.map((e, idx) => (
              <li key={idx} className="flex justify-between border-b py-1">
                <span>
                  {e.surname} {e.name}
                </span>
                <span className="text-gray-500">{e.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <Button
          onClick={handleAddClasse}
          disabled={!selectedNiveau || !selectedLettre || !selectedProfId || checking}
        >
          {checking ? "Création en cours..." : "Créer la classe"}
        </Button>
      </div>
    </DialogContent>
  );
};

export default GestionClasseDialog;
