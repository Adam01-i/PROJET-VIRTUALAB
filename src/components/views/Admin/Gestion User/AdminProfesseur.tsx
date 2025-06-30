import * as React from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import UserDialog from "./UserDialog";
import UserFormDialog from "./UserFormDialog";

const PAGE_SIZE = 10;

type AdminProfesseurProps = {
  embedded?: boolean;
};

type Classe = {
  id: string;
  niveau: string;
  lettre: string;
};

export default function AdminProfesseur({ embedded = true }: AdminProfesseurProps) {
  const [professeurs, setProfesseurs] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<Classe[]>([]);
  const [assignations, setAssignations] = React.useState<any[]>([]);
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [sortField, setSortField] = React.useState<"name" | "surname" | "email" | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [dialogOpenId, setDialogOpenId] = React.useState<string | null>(null);
  const [filteredClasses, setFilteredClasses] = React.useState<string[]>([]);

  const toggleClasseFilter = (classeId: string) => {
    setFilteredClasses((prev) =>
      prev.includes(classeId) ? prev.filter((id) => id !== classeId) : [...prev, classeId]
    );
    setPage(1);
  };


  React.useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchProfesseurs(), fetchClasses(), fetchAssignations()]);
  };

  const fetchProfesseurs = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, surname, email, avatar_url, role")
      .eq("role", "professeur")
      .order("surname");

    if (!error && data) setProfesseurs(data);
    else toast.error("Erreur chargement professeurs", { description: error?.message });
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase.from("classes").select("id, niveau, lettre").order("niveau");

    if (!error && data) setClasses(data);
    else toast.error("Erreur chargement classes", { description: error?.message });
  };

  const fetchAssignations = async () => {
    const { data, error } = await supabase
      .from("professeurs_classes")
      .select("professeur_id, classe_id");

    if (!error && data) setAssignations(data);
    else toast.error("Erreur chargement assignations", { description: error?.message });
  };

  const handleSort = (field: "name" | "surname" | "email") => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (professeur_id: string) => {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer ce professeur ?");
    if (!confirmation) return;

    const { error } = await supabase.rpc('delete_professeur_with_assignation', { p_professeur_id: professeur_id });

    if (error) {
      toast.error(`Erreur suppression : ${error.message}`);
    } else {
      toast.success("Professeur supprimé !");
      await fetchAll();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data as string, { type: "binary" });
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
      const name = (row.name || "").trim();
      const surname = (row.surname || "").trim();
      const email = (row.email || "").trim();
      const role = (row.role || "professeur").trim();
      const avatar_url = "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1747523215141.png";

      if (!name || !surname || !email) {
        toast.error(`⛔ Données manquantes pour : ${email || "ligne inconnue"}`);
        continue;
      }

      try {
        const res = await fetch("/api/import-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, surname, email, avatar_url, role }),
        });

        const result = await res.json();
        if (!res.ok) toast.error(`❌ ${email} : ${result.error}`);
        else {
          count++;
          toast.success(`✅ ${email} ajouté`);
        }
      } catch {
        toast.error(`❌ Erreur réseau pour ${email}`);
      }
    }

    await fetchProfesseurs();
    setLoading(false);
    if (count > 0) toast.success(`${count} professeur(s) importé(s)`);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(professeurs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Professeurs");
    XLSX.writeFile(workbook, "professeurs.xlsx");
  };

  const filtered = professeurs
    .filter((p) => {
      const fullText = `${p.name} ${p.surname} ${p.email}`.toLowerCase();
      const matchText = fullText.includes(search.toLowerCase());
      const assignedClasseIds = assignations.filter(a => a.professeur_id === p.id).map(a => a.classe_id);

      const matchClasse =
        filteredClasses.length === 0 ||
        filteredClasses.some((cls) => assignedClasseIds.includes(cls));

      return matchText && matchClasse;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const fieldA = a[sortField]?.toLowerCase?.() || "";
      const fieldB = b[sortField]?.toLowerCase?.() || "";
      return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
    });


  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={embedded ? "" :  "min-h-screen bg-gray-50"}>
      {/* BARRE D’ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher un professeur"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-1.5 rounded text-sm w-full sm:w-64"
          />
          <UserFormDialog role="professeur" refresh={fetchAll} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-200">
            📂 Importer
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={handleImport} disabled={loading || parsedData.length === 0} className="bg-indigo-500 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-600 disabled:opacity-50">
            {loading ? "Import..." : "Valider Import"}
          </button>
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">
            Export Excel
          </button>
        </div>
      </div>

      {/* TABLEAU PROFESSEURS */}
      <div className="overflow-auto border rounded shadow bg-white">
        <table className="w-full table-auto text-sm text-left border-collapse">
          <thead className="bg-indigo-50 text-indigo-700">
            <tr>
              <th className="p-2">Avatar</th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("name")}>Nom {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}</th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("surname")}>Prénom {sortField === "surname" && (sortDirection === "asc" ? "↑" : "↓")}</th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("email")}>Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}</th>
              {classes.map(classe => {
                const isActive = filteredClasses.includes(classe.id);
                return (
                  <th
                    key={classe.id}
                    className={`p-2 text-center whitespace-nowrap cursor-pointer select-none ${isActive ? "bg-indigo-200" : ""}`}
                    onClick={() => toggleClasseFilter(classe.id)}
                  >
                    {classe.niveau} {classe.lettre} {isActive ? "🔽" : "🔼"}
                  </th>
                );
              })}

              <th className="p-2 text-center">Infos</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((prof) => {
              const assignedIds = assignations.filter(a => a.professeur_id === prof.id).map(a => a.classe_id);
              return (
                <tr key={prof.id} className="hover:bg-gray-50 border-t">
                  <td className="p-2">
                    <img src={prof.avatar_url || "/assets/avatars/default-avatar.png"} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                  </td>
                  <td className="p-2">{prof.name}</td>
                  <td className="p-2">{prof.surname}</td>
                  <td className="p-2">{prof.email}</td>
                  {classes.map(classe => (
                    <td key={classe.id} className="p-2 text-center">
                      {assignedIds.includes(classe.id) ? "✅" : "❌"}
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => setDialogOpenId(prof.id)}
                      className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300"
                    >
                      👁 Voir
                    </button>
                    <UserDialog
                      user={prof}
                      role="professeur"
                      allClasses={classes}
                      refresh={fetchAssignations}
                      openExternally={dialogOpenId === prof.id}
                      setOpenExternally={(open) => !open && setDialogOpenId(null)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDelete(prof.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">{filtered.length} professeur(s) trouvé(s)</span>
        <div className="space-x-2">
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50">Précédent</button>
          <button onClick={() => setPage((p) => (p * PAGE_SIZE < filtered.length ? p + 1 : p))} disabled={page * PAGE_SIZE >= filtered.length} className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50">Suivant</button>
        </div>
      </div>
    </div>
  );
}
