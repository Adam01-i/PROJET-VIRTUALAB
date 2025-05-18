import * as React from "react";
import { useEffect, useState } from "react";
import { DialogContent } from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { supabase } from "../../../../lib/supabaseClient";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const niveaux = ['6e', '5e', '4e', '3e', '2ndeS', '2ndeL', '1èreS2', '1èreL2', 'TLeS2', 'TLeL2'];
const lettres = ['A', 'B', 'C', 'D'];

type Profile = {
  id: string;
  name: string;
  surname: string;
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

  // 📦 Élèves importés localement (avant validation)
  const [importedEleves, setImportedEleves] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfesseurs = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, surname")
        .eq("role", "professeur");

      if (!error) setProfesseurs(data);
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

    const { data, error } = await supabase.from("classes").insert([
      {
        niveau: selectedNiveau,
        lettre: selectedLettre,
        professeur_principal_id: selectedProfId,
      },
    ]).select("id");

    if (error || !data) {
      toast.error("Erreur création classe", { description: error?.message });
      setChecking(false);
      return;
    }

    const newClasseId = data[0].id;

    // 👥 Associer les élèves à la classe (locaux seulement, pas dans profiles)
    for (const eleve of importedEleves) {
      const { email, name, surname, avatar_url } = eleve;
      const role = 'eleve';

      try {
        const response = await fetch("/api/import-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, surname, email, avatar_url, role }),
        });

        const result = await response.json();

        if (response.ok && result.id) {
          // Associer l'élève à la classe
          await supabase.from("eleves_classes").insert([
            { eleve_id: result.id, classe_id: newClasseId },
          ]);
        } else {
          toast.error(`Erreur import ${email}: ${result.error || "inconnue"}`);
        }
      } catch (err) {
        toast.error(`Erreur réseau pour ${email}`);
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
      const json = XLSX.utils.sheet_to_json(worksheet);
      setImportedEleves(json as any[]);
      toast.success(`📥 ${json.length} élève(s) importé(s).`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <DialogContent className="max-w-3xl space-y-4">
      <h3 className="text-xl font-bold">Créer une classe</h3>

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
              <option key={n} value={n}>{n}</option>
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
              <option key={l} value={l}>{l}</option>
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
                {p.name} {p.surname}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <label className="text-sm font-medium">Importer fichier (.xlsx)</label>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      </div>

      {importedEleves.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-md font-semibold mb-2">Élèves importés ({importedEleves.length})</h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
            {importedEleves.map((e, idx) => (
              <li key={idx} className="flex justify-between border-b py-1">
                <span>{e.name} {e.surname}</span>
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
          {checking ? "Vérification..." : "Créer la classe"}
        </Button>
      </div>
    </DialogContent>
  );
};

export default GestionClasseDialog;
