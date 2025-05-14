import * as React from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

// ✅ Initialisation Supabase (clé publique uniquement)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 10;

export default function AdminEleve() {
  // ========================
  // 🧠 État local React
  // ========================
  const [eleves, setEleves] = React.useState<any[]>([]);
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [assignations, setAssignations] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // ========================
  // 📥 Chargement initial
  // ========================
  React.useEffect(() => {
    fetchEleves();
    fetchClasses();
    fetchAssignations();
  }, []);

  const fetchEleves = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, surname, email, role, avatar_url')
      .eq('role', 'eleve')
      .order('surname');
    setEleves(data || []);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*');
    setClasses(data || []);
  };

  const fetchAssignations = async () => {
    const { data } = await supabase.from('eleves_classes').select('eleve_id, classe_id');
    setAssignations(data || []);
  };

  // ========================
  // 📤 Import Excel
  // ========================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setParsedData(json as any[]);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("⚠️ Aucun élève à importer.");
      return;
    }

    setLoading(true);
    let count = 0;

    for (const row of parsedData) {
      const { name, surname, email } = row;

      try {
        const response = await fetch('/api/import-eleves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, surname, email }),
        });

        const result = await response.json();
        if (!response.ok) toast.error(`❌ ${email} : ${result.error}`);
        else {
          count++;
          toast.success(`✅ ${email} importé`);
        }
      } catch {
        toast.error(`Erreur pour ${email}`);
      }
    }

    await fetchEleves();
    setLoading(false);
    toast.success(`${count} élève(s) importé(s)`);
  };

  // ========================
  // 🔁 Assignation / Suppression classe
  // ========================
  const assignClasse = async (eleveId: string, classeId: string) => {
    const { error } = await supabase
      .from('eleves_classes')
      .upsert({ eleve_id: eleveId, classe_id: classeId }, { onConflict: 'eleve_id,classe_id' });

    if (error) toast.error("❌ Échec assignation");
    else {
      toast.success("✅ Classe assignée");
      await fetchAssignations();
      await fetchEleves();
    }
  };

  const removeClasse = async (eleveId: string, classeId: string) => {
    const { error } = await supabase
      .from('eleves_classes')
      .delete()
      .match({ eleve_id: eleveId, classe_id: classeId });

    if (error) toast.error("❌ Échec suppression");
    else {
      toast.success("✅ Classe retirée");
      await fetchAssignations();
      await fetchEleves();
    }
  };

  const filtered = eleves.filter((e) =>
    `${e.name} ${e.surname} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ========================
  // 🖥️ Rendu UI
  // ========================
  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Gestion des Élèves</h1>
        <div className="flex gap-3 mt-4 md:mt-0">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="text-sm" />
          <button
            onClick={handleImport}
            disabled={loading || parsedData.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
          >
            {loading ? "Import..." : "Importer"}
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Rechercher un élève"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full md:w-1/3 border px-4 py-2 rounded text-sm mb-4"
      />

      {paginated.map((eleve) => {
        const classesEleve = assignations
          .filter((a) => a.eleve_id === eleve.id)
          .map((a) => classes.find((c) => c.id === a.classe_id))
          .filter(Boolean);

        return (
          <div key={eleve.id} className="mb-6 border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{eleve.name} {eleve.surname}</p>
                <p className="text-sm text-gray-600">{eleve.email}</p>
              </div>
              <select
                defaultValue=""
                onChange={(e) => assignClasse(eleve.id, e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">➕ Assigner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.niveau} - {c.nom}</option>
                ))}
              </select>
            </div>

            {classesEleve.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-gray-700">Classes assignées :</p>
                <ul className="list-disc pl-5 mt-1">
                  {classesEleve.map((classe: any) => (
                    <li key={classe.id} className="flex justify-between items-center text-sm mt-1">
                      <span>{classe.niveau} - {classe.nom}</span>
                      <button
                        onClick={() => removeClasse(eleve.id, classe.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          {filtered.length} élève{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
          >
            Précédent
          </button>
          <button
            onClick={() => setPage((p) => (p * PAGE_SIZE < filtered.length ? p + 1 : p))}
            disabled={page * PAGE_SIZE >= filtered.length}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
