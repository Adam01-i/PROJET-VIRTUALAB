import * as React from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import UserDialog from "./UserDialog";
import UserFormDialog from "./UserFormDialog";

const PAGE_SIZE = 10;

type AdminEleveProps = {
  embedded?: boolean;
};

export default function AdminEleve({ embedded = false }: AdminEleveProps) {
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [eleves, setEleves] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [assignations, setAssignations] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [classeFiltre, setClasseFiltre] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [sortField, setSortField] = React.useState<"name" | "surname" | "email" | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [dialogOpenId, setDialogOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const { data: elevesData } = await supabase
      .from("profiles")
      .select("id, name, surname, email, avatar_url, role")
      .eq("role", "eleve")
      .order("surname");

    const { data: classesData } = await supabase
      .from("classes")
      .select("id, niveau, lettre");

    const { data: assignData } = await supabase
      .from("eleves_classes")
      .select("classe_id, eleve_id");

    setEleves(elevesData || []);
    setClasses(classesData || []);
    setAssignations(assignData || []);
  };

  const handleSort = (field: "name" | "surname" | "email") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getClasseNom = (eleveId: string) => {
    const assignation = assignations.find((a) => a.eleve_id === eleveId);
    const classe = classes.find((c) => c.id === assignation?.classe_id);
    return classe ? `${classe.niveau} ${classe.lettre}` : "—";
  };

  // Liste unique des classes disponibles dans les assignations
  const classesOptions = React.useMemo(() => {
    return [...new Set(
      assignations
        .map((a) => {
          const c = classes.find((c) => c.id === a.classe_id);
          return c ? `${c.niveau} ${c.lettre}` : null;
        })
        .filter((v): v is string => v !== null)
    )];
  }, [assignations, classes]);

  // Clic sur l’en-tête Classe : cycle dans les options (null -> 1ère classe -> 2ème... -> null)
  const toggleClasseFiltre = () => {
    if (!classeFiltre) {
      setClasseFiltre(classesOptions[0] || null);
    } else {
      const currentIndex = classesOptions.indexOf(classeFiltre);
      if (currentIndex === -1 || currentIndex === classesOptions.length - 1) {
        setClasseFiltre(null); // toutes
      } else {
        setClasseFiltre(classesOptions[currentIndex + 1]);
      }
    }
    setPage(1);
  };

  // Filtrage + tri
  const filtered = eleves
    .filter((e) => {
      const fullText = `${e.name} ${e.surname} ${e.email}`.toLowerCase();
      const classeNom = getClasseNom(e.id).toLowerCase();
      const searchMatch = fullText.includes(search.toLowerCase());
      const classeMatch = !classeFiltre || classeNom === classeFiltre.toLowerCase();
      return searchMatch && classeMatch;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = a[sortField]?.toLowerCase();
      const valB = b[sortField]?.toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmer la suppression de cet élève ?")) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    setLoading(false);
    if (error) {
      toast.error("Erreur lors de la suppression : " + error.message);
    } else {
      toast.success("Élève supprimé");
      fetchAll();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setParsedData(data);
      toast.success("Fichier chargé, prêt à importer.");
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
    const name = (row.name || "").trim();
    const surname = (row.surname || "").trim();
    const email = (row.email || "").trim();
    const avatar_url =
      "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1748565991828.jpg";

    if (!name || !surname || !email) {
      toast.error(`⛔ Données manquantes pour : ${email || "ligne inconnue"}`);
      continue;
    }

    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/import-eleves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, surname, email, avatar_url }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(`❌ ${email} : ${result.error}`);
      } else {
        count++;
        toast.success(`✅ ${email} ajouté`);
      }
    } catch {
      toast.error(`❌ Erreur réseau pour ${email}`);
    }
  }

  await fetchAll();
  setLoading(false);
  if (count > 0) toast.success(`${count} élève(s) importé(s)`);
};


  const handleExport = () => {
    const exportData = filtered.map((e) => ({
      Nom: e.name,
      Prénom: e.surname,
      Email: e.email,
      Classe: getClasseNom(e.id),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Élèves");
    XLSX.writeFile(workbook, "eleves_export.xlsx");
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 px-4 py-10"}>
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
          {/* Filtre select supprimé */}

          <UserFormDialog role="eleve" refresh={fetchAll} />
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

      {/* TABLEAU ÉLÈVES */}
      <div className="overflow-auto border rounded shadow bg-white">
        <table className="w-full table-auto text-sm text-left border-collapse">
          <thead className="bg-indigo-50 text-indigo-700">
            <tr>
              <th className="p-2">Avatar</th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("name")}>
                Nom {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("surname")}>
                Prénom {sortField === "surname" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("email")}>
                Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="p-2 cursor-pointer select-none"
                onClick={toggleClasseFiltre}
                title="Cliquer pour filtrer par classe"
              >
                Classe{" "}
                {classeFiltre ? (
                  <span className="text-indigo-600 font-semibold">({classeFiltre})</span>
                ) : (
                  <span className="text-gray-400">(Toutes)</span>
                )}
              </th>
              <th className="p-2 text-center">Infos</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((eleve) => (
              <tr key={eleve.id} className="hover:bg-gray-50 border-t">
                <td className="p-2">
                  <img
                    src={eleve.avatar_url || "/assets/avatars/default-avatar.png"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                </td>
                <td className="p-2">{eleve.name}</td>
                <td className="p-2">{eleve.surname}</td>
                <td className="p-2">{eleve.email}</td>
                <td className="p-2">{getClasseNom(eleve.id)}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => setDialogOpenId(eleve.id)}
                    className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300"
                  >
                    👁 Voir
                  </button>
                  <UserDialog
                    user={eleve}
                    role="eleve"
                    allClasses={classes}
                    refresh={fetchAll}
                    openExternally={dialogOpenId === eleve.id}
                    setOpenExternally={(v) => {
                      if (!v) setDialogOpenId(null);
                    }}
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    disabled={loading}
                    onClick={() => handleDelete(eleve.id)}
                    className="bg-red-600 px-3 py-1 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Aucun élève trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          Page {page} / {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
        </span>
        <div className="space-x-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
            onClick={() => setPage((p) => p + 1)}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
