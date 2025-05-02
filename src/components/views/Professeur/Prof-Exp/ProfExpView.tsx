import { useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import type { Experience } from "../../../../types/Experience/experience";
import { Pencil, Trash2, Beaker } from "lucide-react";

// Fonction pour charger dynamiquement un composant
const loadSimulationComponent = (path: string) => {
  try {
    return lazy(() => import(`../../../../simulations/${path}`));
  } catch {
    return null;
  }
};

export default function ProfExpView() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Experience | null>(null);

  // 🔁 Chargement initial des expériences
  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erreur chargement Supabase:", error.message);
    } else {
      setExperiences(data);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    if (formData.id) {
      const { error } = await supabase
        .from("experiences")
        .update(formData)
        .eq("id", formData.id);
      if (error) console.error("Erreur update:", error.message);
    } else {
      const { error } = await supabase.from("experiences").insert(formData);
      if (error) console.error("Erreur insert:", error.message);
    }

    await fetchExperiences();
    setIsEditing(false);
    setSelectedExperience(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (error) console.error("Erreur delete:", error.message);
    await fetchExperiences();
    setSelectedExperience(null);
  };

  const SimulationPreview = ({ path }: { path: string }) => {
    if (!path) return <p className="italic text-gray-400">Pas de simulation associée</p>;
    const Component = loadSimulationComponent(path);
    return Component ? (
      <Suspense fallback={<p className="text-gray-400">Chargement simulation...</p>}>
        <div className="border rounded p-4 bg-gray-50 mt-4">
          <Component />
        </div>
      </Suspense>
    ) : (
      <p className="text-red-400">Erreur de chargement du composant</p>
    );
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto text-gray-800">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-purple-700">Gestion des expériences</h1>
        <button
          onClick={() => {
            setIsEditing(true);
            setFormData({
              id: "",
              titre: "",
              description: "",
              duree: "",
              niveau: "",
              image: "",
              objectifs: [],
              materiel: [],
              resultatsAttendus: [],
              simulationPath: "",
            });
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouvelle expérience
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* LISTE */}
        <div className="md:w-1/2 space-y-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              onClick={() => {
                setSelectedExperience(exp);
                setIsEditing(false);
              }}
              className={`cursor-pointer p-4 rounded-md border transition ${
                selectedExperience?.id === exp.id
                  ? "bg-purple-100 border-purple-300"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{exp.titre}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{exp.description}</p>
                  <div className="text-xs text-gray-500 flex gap-2 mt-1">
                    <span>{exp.niveau}</span>
                    <span>{exp.duree}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pencil
                    size={16}
                    className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setFormData(exp);
                    }}
                  />
                  <Trash2
                    size={16}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(exp.id);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DÉTAILS + FORM */}
        <div className="md:w-1/2 space-y-4">
          {selectedExperience && !isEditing && (
            <div className="bg-white p-5 rounded-md shadow border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Beaker size={18} />
                {selectedExperience.titre}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{selectedExperience.description}</p>
              <p className="text-sm text-gray-500">
                <strong>Durée :</strong> {selectedExperience.duree} <br />
                <strong>Niveau :</strong> {selectedExperience.niveau}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Simulation :</strong>{" "}
                {selectedExperience.simulationPath || "Aucune"}
              </p>
              <SimulationPreview path={selectedExperience.simulationPath} />
            </div>
          )}

          {isEditing && formData && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-3 bg-white p-5 rounded-md shadow border"
            >
              <div>
                <label className="block text-sm font-medium">Titre</label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full border p-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border p-2 rounded-md"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium">Durée</label>
                  <input
                    type="text"
                    value={formData.duree}
                    onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                    className="w-full border p-2 rounded-md"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium">Niveau</label>
                  <input
                    type="text"
                    value={formData.niveau}
                    onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                    className="w-full border p-2 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Chemin Simulation (ex: TitrageAcidoBasique)</label>
                <input
                  type="text"
                  value={formData.simulationPath}
                  onChange={(e) => setFormData({ ...formData, simulationPath: e.target.value })}
                  className="w-full border p-2 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md">
                  {formData.id ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded-md"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
