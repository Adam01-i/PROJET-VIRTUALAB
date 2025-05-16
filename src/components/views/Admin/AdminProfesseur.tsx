import * as React from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 10;

export default function AdminProfesseur() {
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [professeurs, setProfesseurs] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [assignations, setAssignations] = React.useState<any[]>([]);
  const [eleves, setEleves] = React.useState<{ [key: string]: any[] }>({});
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchProfesseurs();
    fetchClasses();
    fetchAssignations();
  }, []);

  const fetchProfesseurs = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, surname, email, avatar_url, role, created_at')
      .eq('role', 'professeur')
      .order('surname');
    setProfesseurs(data || []);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, nom, niveau');
    setClasses(data || []);
  };

  const fetchAssignations = async () => {
    const { data } = await supabase.from('professeurs_classes').select('professeur_id, classe_id');
    setAssignations(data || []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setParsedData(json as any[]);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("⚠️ Aucun professeur à importer.");
      return;
    }
  
    setLoading(true);
    let count = 0;
  
    for (const row of parsedData) {
      const { name, surname, email, avatar_url } = row;
      const role = row.role || 'professeur';
  
      try {
        const response = await fetch('/api/import-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, surname, email, avatar_url, role }),
        });
  
        const result = await response.json();
        if (!response.ok) toast.error(`❌ ${email} : ${result.error}`);
        else {
          count++;
          toast.success(`✅ ${email} ajouté`);
        }
      } catch (err) {
        toast.error(`❌ Erreur réseau pour ${email}`);
      }
    }
  
    await fetchProfesseurs();
    setLoading(false);
    if (count > 0) toast.success(`${count} professeur(s) importé(s) avec succès`);
  };
  

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(professeurs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Professeurs");
    XLSX.writeFile(workbook, "professeurs.xlsx");
  };

  const assignClasse = async (profId: string, classeId: string) => {
    const { error } = await supabase
      .from('professeurs_classes')
      .upsert({ professeur_id: profId, classe_id: classeId }, { onConflict: 'professeur_id,classe_id' });
  
    if (error) toast.error("❌ Erreur lors de l’assignation.");
    else {
      toast.success("✅ Classe assignée !");
      await fetchAssignations();
      await fetchProfesseurs(); // Ajouté pour forcer la mise à jour si besoin
    }
  };
  
  const removeClasse = async (profId: string, classeId: string) => {
    const { error } = await supabase
      .from('professeurs_classes')
      .delete()
      .match({ professeur_id: profId, classe_id: classeId });
  
    if (error) toast.error("❌ Erreur lors de la suppression.");
    else {
      toast.success("✅ Classe retirée !");
      await fetchAssignations();
      await fetchProfesseurs(); // Ajouté pour actualiser la vue
    }
  };
  

  const toggleEleves = async (classeId: string) => {
    if (eleves[classeId]) {
      setEleves((prev) => {
        const copy = { ...prev };
        delete copy[classeId];
        return copy;
      });
    } else {
      const { data } = await supabase
        .from('eleves_classes')
        .select('eleve_id, profiles(name, surname)')
        .eq('classe_id', classeId);
      setEleves((prev) => ({ ...prev, [classeId]: data || [] }));
    }
  };

  const filtered = professeurs.filter((p) =>
    `${p.name} ${p.surname} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Gestion des Professeurs</h1>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="text-sm text-gray-700" />
          <button
            onClick={handleImport}
            disabled={loading || parsedData.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
          >
            {loading ? "Import..." : "Importer"}
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            Exporter Excel
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher par nom, prénom ou email"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full md:w-1/3 border px-4 py-2 rounded text-sm mb-4"
      />

      {paginated.map((prof) => {
        const classesProf = assignations
          .filter((a) => a.professeur_id === prof.id)
          .map((a) => classes.find((c) => c.id === a.classe_id))
          .filter(Boolean);

        return (
          <div key={prof.id} className="mb-6 border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{prof.name} {prof.surname}</p>
                <p className="text-sm text-gray-600">{prof.email}</p>
              </div>
              <select
                defaultValue=""
                onChange={(e) => assignClasse(prof.id, e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">➕ Assigner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.niveau} - {c.nom}</option>
                ))}
              </select>
            </div>

            {classesProf.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-gray-700">Classes assignées :</p>
                <ul className="list-disc pl-5 mt-1">
                  {classesProf.map((classe: any) => (
                    <li key={classe.id} className="flex items-center justify-between text-sm mt-1">
                      <span>{classe.niveau} - {classe.nom}</span>
                      <div className="space-x-2">
                        <button
                          onClick={() => toggleEleves(classe.id)}
                          className="text-indigo-600 hover:underline text-xs"
                        >
                          {eleves[classe.id] ? 'Masquer élèves' : 'Voir élèves'}
                        </button>
                        <button
                          onClick={() => removeClasse(prof.id, classe.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Retirer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {classesProf.map((classe) => eleves[classe.id] && (
                  <div key={classe.id} className="mt-2 ml-6 text-xs text-gray-700">
                    <p className="font-semibold mb-1">Élèves :</p>
                    <ul className="list-disc pl-4">
                      {eleves[classe.id].map((e, idx) => (
                        <li key={idx}>{e.profiles?.name} {e.profiles?.surname}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          {filtered.length} professeur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
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
