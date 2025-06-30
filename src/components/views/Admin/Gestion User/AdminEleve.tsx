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
  const [classes, setClasses] = React.useState<any[]>([]);
  const [assignations, setAssignations] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [classeFiltre, setClasseFiltre] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  

  const [sortField, setSortField] = React.useState<'name' | 'surname' | 'email' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  React.useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const { data: elevesData } = await supabase
      .from('profiles')
      .select('id, name, surname, email, avatar_url, role, created_at')
      .eq('role', 'eleve')
      .order('surname');

    const { data: classesData } = await supabase
      .from('classes')
      .select('id, niveau, lettre');

    const { data: assignData } = await supabase
      .from('eleves_classes')
      .select('classe_id, eleve_id');

    setEleves(elevesData || []);
    setClasses(classesData || []);
    setAssignations(assignData || []);
  };

  const handleSort = (field: 'name' | 'surname' | 'email') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getClasseNom = (eleveId: string) => {
    const assignation = assignations.find((a) => a.eleve_id === eleveId);
    const classe = classes.find((c) => c.id === assignation?.classe_id);
    return classe ? `${classe.niveau} ${classe.lettre}` : '—';
  };

  const filtered = eleves
    .filter((e) => {
      const fullText = `${e.name} ${e.surname} ${e.email}`.toLowerCase();
      const classeNom = getClasseNom(e.id).toLowerCase();
      return (
        fullText.includes(search.toLowerCase()) &&
        (!classeFiltre || classeNom === classeFiltre.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = a[sortField]?.toLowerCase();
      const valB = b[sortField]?.toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const classesOptions = [...new Set(
    assignations
      .map((a) => {
        const c = classes.find((c) => c.id === a.classe_id);
        return c ? `${c.niveau} ${c.lettre}` : null;
      })
      .filter((v): v is string => v !== null && v !== undefined)
  )];

  const handleDelete = async (eleveId: string) => {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cet élève ?");
    if (!confirmation) return;

    const { error } = await supabase.rpc('delete_eleve_with_assignation', { p_eleve_id: eleveId });

    if (error) {
      toast.error(`❌ Erreur lors de la suppression de l'élève : ${error.message}`);
    } else {
      toast.success('✅ Élève supprimé avec succès');
      await fetchAll();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data as string, { type: 'binary' });
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
      const avatar_url = 'https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1747586536054.jpg';

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

    await fetchAll();
    setLoading(false);
    if (count > 0) toast.success(`${count} élève(s) importé(s) avec succès`);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(eleves);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');
    XLSX.writeFile(workbook, 'eleves.xlsx');
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-10'}>
      {/* BARRE D’ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher un élève"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-1.5 rounded text-sm w-full sm:w-64"
          />
          <select
            className="border px-3 py-1.5 rounded text-sm w-full sm:w-48"
            value={classeFiltre}
            onChange={(e) => {
              setClasseFiltre(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toutes les classes</option>
            {classesOptions.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700"
          >
            + Ajouter
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-200">
            📂 Importer
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleImport}
            disabled={loading || parsedData.length === 0}
            className="bg-indigo-500 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Import...' : 'Valider Import'}
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* TABLEAU ÉLÈVES */}
      <div className="overflow-auto border rounded shadow bg-white">
        <table className="w-full table-auto text-sm text-left border-collapse">
          <thead className="bg-indigo-50 text-indigo-700">
            <tr>
              <th className="p-2">Avatar</th>
              <th className="p-2 cursor-pointer select-none" onClick={() => handleSort("name")}>
                Nom {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-2 cursor-pointer select-none" onClick={() => handleSort("surname")}>
                Prénom {sortField === "surname" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-2 cursor-pointer select-none" onClick={() => handleSort("email")}>
                Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-2">Classe</th>
              <th className="p-2 text-center">Info</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((eleve) => (
              <tr key={eleve.id} className="hover:bg-gray-50 border-t">
                <td className="p-2">
                  <img src={eleve.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                </td>
                <td className="p-2">{eleve.name}</td>
                <td className="p-2">{eleve.surname}</td>
                <td className="p-2">{eleve.email}</td>
                <td className="p-2">{getClasseNom(eleve.id)}</td>
                <td className="p-2 text-center">
                  <EleveDialog eleve={eleve} />
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleDelete(eleve.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          {filtered.length} élève{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            onClick={() => setPage((p) => (p * PAGE_SIZE < filtered.length ? p + 1 : p))}
            disabled={page * PAGE_SIZE >= filtered.length}
            className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
