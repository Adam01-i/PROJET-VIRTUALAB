import * as React from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { supabase } from '../../../../lib/supabaseClient';
import EleveDialog from './EleveDialog';

const PAGE_SIZE = 10;

type AdminEleveProps = {
  embedded?: boolean;
};

export default function AdminEleve({ embedded = false }: AdminEleveProps) {
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [eleves, setEleves] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchEleves();
  }, []);

  const fetchEleves = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, surname, email, avatar_url, role, created_at')
      .eq('role', 'eleve')
      .order('surname');
    setEleves(data || []);
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
      toast.error("⚠️ Aucun élève à importer.");
      return;
    }

    setLoading(true);
    let count = 0;

    for (const row of parsedData) {
      const { name, surname, email } = row;
      const role = row.role || 'eleve';
      const avatar_url = row.avatar_url || 'default-avatar.png'; // 🎯 valeur par défaut

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
      } catch {
        toast.error(`❌ Erreur réseau pour ${email}`);
      }
    }

    await fetchEleves();
    setLoading(false);
    if (count > 0) toast.success(`${count} élève(s) importé(s) avec succès`);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(eleves);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');
    XLSX.writeFile(workbook, 'eleves.xlsx');
  };

  const filtered = eleves.filter((e) =>
    `${e.name} ${e.surname} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 px-8 py-10'}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Gestion des Élèves</h1>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="text-sm text-gray-700" />
          <button
            onClick={handleImport}
            disabled={loading || parsedData.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
          >
            {loading ? 'Import...' : 'Importer'}
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
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full md:w-1/3 border px-4 py-2 rounded text-sm mb-4"
      />

      {paginated.map((eleve) => (
        <div key={eleve.id} className="mb-4 border rounded p-4 bg-white shadow flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <img
              src={`/assets/avatars/${eleve.avatar_url || 'default-avatar.png'}`}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover border"
            />
            <div>
              <p className="font-semibold text-lg">
                {eleve.name} {eleve.surname}
              </p>
              <p className="text-sm text-gray-600">{eleve.email}</p>
            </div>
          </div>
          <EleveDialog eleve={eleve} />
        </div>
      ))}

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
