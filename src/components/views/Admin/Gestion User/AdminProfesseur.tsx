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
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

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
      .select("id, niveau, lettre");

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
      const { name, surname, email } = row;
      const role = row.role || "professeur";
      const avatar_url = "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars//1747523215141.png";

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

  const filtered = professeurs.filter((p) =>
    `${p.name} ${p.surname} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 px-8 py-10"}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Gestion des Professeurs</h1>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="text-sm text-gray-700"
          />
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
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full md:w-1/3 border px-4 py-2 rounded text-sm mb-4"
      />

      {paginated.map((prof) => {
        const classesProf = assignations
          .filter((a) => a.professeur_id === prof.id)
          .map((a) => classes.find((c) => c.id === a.classe_id))
          .filter(Boolean);

        return (
          <div key={prof.id} className="mb-6 border rounded p-4 bg-white shadow flex gap-4 items-center">
            <img
              src={prof.avatar_url || "/assets/avatars/default-avatar.png"}
              alt={`${prof.name} ${prof.surname}`}
              className="w-14 h-14 rounded-full object-cover border"
            />

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{prof.name} {prof.surname}</p>
                  <p className="text-sm text-gray-600">{prof.email}</p>
                </div>

                <ProfesseurDialog
                  prof={prof}
                  allClasses={classes}
                  refresh={fetchAssignations}
                />
              </div>

              {classesProf.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-gray-700">Classes assignées :</p>
                  <ul className="list-disc pl-5 mt-1">
                    {classesProf.map((classe: any) => (
                      <li key={classe.id} className="text-sm mt-1">
                        {classe.niveau} {classe.lettre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          {filtered.length} professeur{filtered.length > 1 ? "s" : ""} trouvé
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
