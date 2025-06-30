import * as React from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import ProfesseurDialog from "./ProfesseurDialog";

const PAGE_SIZE = 10;

type AdminProfesseurProps = {
  embedded?: boolean;
};

export default function AdminProfesseur({ embedded = false }: AdminProfesseurProps) {
  const [professeurs, setProfesseurs] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [assignations, setAssignations] = React.useState<any[]>([]);
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedClasse, setSelectedClasse] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const [sortField, setSortField] = React.useState<"name" | "surname" | "email" | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  React.useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      fetchProfesseurs(),
      fetchClasses(),
      fetchAssignations(),
    ]);
  };

  const fetchProfesseurs = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, surname, email, avatar_url, role, created_at")
      .eq("role", "professeur")
      .order("surname");

    if (error) {
      toast.error("Erreur chargement professeurs", { description: error.message });
    } else {
      setProfesseurs(data || []);
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, niveau, lettre")
      .order("niveau");

    if (error) {
      toast.error("Erreur chargement classes", { description: error.message });
    } else {
      setClasses(data || []);
    }
  };

  const fetchAssignations = async () => {
    const { data, error } = await supabase
      .from("professeurs_classes")
      .select("professeur_id, classe_id");

    if (error) {
      toast.error("Erreur chargement assignations", { description: error.message });
    } else {
      setAssignations(data || []);
    }
  };

  const handleSort = (field: "name" | "surname" | "email") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
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
      toast.error(`Erreur lors de la suppression du professeur: ${error.message}`);
    } else {
      toast.success("Professeur supprimé avec succès");
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
      const avatar_url = "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars//1747523215141.png";

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
        if (!res.ok) {
          toast.error(`❌ ${email} : ${result.error}`);
        } else {
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

  const filtered = professeurs
    .filter((p) => {
      const textMatch = `${p.name} ${p.surname} ${p.email}`.toLowerCase().includes(search.toLowerCase());
      const classesOfProf = assignations.filter(a => a.professeur_id === p.id).map(a => a.classe_id);
      const matchClasse = selectedClasse ? classesOfProf.includes(selectedClasse) : true;
      return textMatch && matchClasse;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const fieldA = a[sortField].toLowerCase();
      const fieldB = b[sortField].toLowerCase();
      if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-10"}>
      
      {/* === BARRE D’ACTIONS COMPACTE === */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher (nom, prénom, email)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-1.5 rounded text-sm w-full sm:w-64"
          />
          <select
            value={selectedClasse}
            onChange={(e) => {
              setSelectedClasse(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-1.5 rounded text-sm w-full sm:w-48"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.niveau} {c.lettre}
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
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleImport}
            disabled={loading || parsedData.length === 0}
            className="bg-indigo-500 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "Import..." : "Valider Import"}
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* === TABLEAU DES PROFESSEURS === */}
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
              {classes.map((c) => (
                <th key={c.id} className="p-2 text-center whitespace-nowrap">
                  {c.niveau} {c.lettre}
                </th>
              ))}
              <th className="p-2 text-center">Info</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((prof) => {
              const assignedClasseIds = assignations.filter((a) => a.professeur_id === prof.id).map((a) => a.classe_id);
              return (
                <tr key={prof.id} className="hover:bg-gray-50 border-t">
                  <td className="p-2">
                    <img src={prof.avatar_url || "/assets/avatars/default-avatar.png"} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                  </td>
                  <td className="p-2">{prof.name}</td>
                  <td className="p-2">{prof.surname}</td>
                  <td className="p-2">{prof.email}</td>
                  {classes.map((classe) => (
                    <td key={classe.id} className="p-2 text-center">
                      {assignedClasseIds.includes(classe.id) ? (
                        <span className="text-green-600 font-bold">✅</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <ProfesseurDialog
                      prof={prof}
                      allClasses={classes}
                      refresh={fetchAssignations}
                      onClose={() => setAddDialogOpen(false)}
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

      {/* === PAGINATION === */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-2 sm:gap-0">
        <span className="text-sm text-gray-600">
          {filtered.length} professeur{filtered.length > 1 ? "s" : ""} trouvé
        </span>
        <div className="space-x-2">
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded text-sm">
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

      {/* === DIALOG AJOUT === */}
      {addDialogOpen && (
        <ProfesseurDialog
          prof={null}
          allClasses={classes}
          openExternally={addDialogOpen}
          setOpenExternally={setAddDialogOpen}
          onAdd={(newProf) => {
            setProfesseurs((prev) => [...prev, newProf]);
          }}
        />
      )}
    </div>
  );
}
