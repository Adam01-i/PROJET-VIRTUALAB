import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import type { Experience } from "../../../../types/Experience/experience";
import { v4 as uuidv4 } from "uuid";
import {toast} from 'sonner'; // ✅ Toast import
import ProfExpCard from "./ProfExpCard"; // ajuste le chemin


const DUREE_OPTIONS = ["15 min", "30 min", "45 min", "60 min"];
const NIVEAU_OPTIONS = ["Seconde", "Première", "Terminale"];

export default function ProfExpView() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [formData, setFormData] = useState<Experience | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Erreur de chargement :", error.message);
    else {
      setExperiences(data);
      console.log("📦 Expériences mises à jour :", data); // debug
    }
  };

  const handleSave = async () => {
    if (!formData?.titre || !formData.description) {
      toast.error("Le titre et la description sont requis.");
      return;
    }

    const isNew = !formData.id;

    await toast.promise(
      (async () => {
        if (formData.id) {
          await supabase
            .from("experiences")
            .update({
              titre: formData.titre,
              description: formData.description,
              duree: formData.duree,
              niveau: formData.niveau,
              image: formData.image,
              simulationPath: formData.simulationPath,
              objectifs: formData.objectifs ?? [],
              materiel: formData.materiel ?? [],
              resultatsAttendus: formData.resultatsAttendus ?? [],
            })
            .eq("id", formData.id);
        } else {
          const { data: inserted, error } = await supabase
            .from("experiences")
            .insert([
              {
                id: uuidv4(),
                titre: formData.titre,
                description: formData.description,
                duree: formData.duree,
                niveau: formData.niveau,
                image: formData.image,
                simulationPath: formData.simulationPath,
                objectifs: formData.objectifs ?? [],
                materiel: formData.materiel ?? [],
                resultatsAttendus: formData.resultatsAttendus ?? [],
              },
            ])
            .select();

          if (error || !inserted || !inserted[0]) {
            throw new Error("Erreur lors de l'ajout.");
          }
        }
      })(),
      {
        loading: "⏳ Enregistrement en cours...",
        success: isNew ? "✅ Expérience ajoutée !" : "✅ Modifications enregistrées !",
        error: "❌ Échec de l'enregistrement.",
      }
    );

    await fetchExperiences(); // ← Rafraîchit après ajout/modif
    resetForm();              // ← Réinitialise l’état
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette expérience ?")) return;

    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (error) {
      console.error("❌ Erreur suppression :", error.message);
      toast.error("Suppression échouée");
    } else {
      toast.success("🗑️ Supprimée !");
      await fetchExperiences(); // ← Rafraîchit après suppression
      resetForm();              // ← Nettoie l’affichage
    }
  };

  const resetForm = () => {
    setFormData(null);
    setIsEditing(false);
    setSelectedExperience(null);
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `simulations/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("simulations").upload(filePath, file);

    if (error) {
      alert("❌ Upload échoué : " + error.message);
    } else {
      const { data } = supabase.storage.from("simulations").getPublicUrl(filePath);
      if (formData) setFormData({ ...formData, simulationPath: data.publicUrl });
    }

    setUploading(false);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setUploading(true);
  
    // ✅ Correction ici
    const filePath = `${Date.now()}_${file.name}`;
  
    const { error } = await supabase.storage.from("images-sim").upload(filePath, file);
  
    if (error) {
      console.error("Upload error:", error.message);
      toast.error("❌ Upload image échoué");
    } else {
      const { data } = supabase.storage.from("images-sim").getPublicUrl(filePath);
      if (formData) {
        setFormData({ ...formData, image: data.publicUrl });
      }
    }
  
    setUploading(false);
  };
  

  return (
    <div className="p-4 bg-gray-100 text-gray-800 min-h-screen max-w-[1280px] mx-auto text-base">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-purple-700">Gestion des expériences</h2>
        <button
          onClick={() => {
            setFormData({
              id: '',
              titre: '',
              description: '',
              duree: DUREE_OPTIONS[0],
              niveau: NIVEAU_OPTIONS[0],
              image: '',
              objectifs: [],
              materiel: [],
              resultatsAttendus: [],
              simulationPath: '',
            });
            setSelectedExperience(null);
            setIsEditing(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
        >
          ➕ Nouvelle expérience
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 👉 Liste des expériences (Gauche) */}
        <div className="md:w-[60%] space-y-4 max-h-[84vh] overflow-auto">
          {experiences.length === 0 ? (
            <p className="text-gray-500">Aucune expérience trouvée.</p>
          ) : (
            experiences.map((exp) => (
              <div
                key={exp.id}
                className={`cursor-pointer p-4 rounded-md shadow-sm border transition ${selectedExperience?.id === exp.id
                    ? 'bg-purple-100 border-purple-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                onClick={() => {
                  setSelectedExperience(exp);
                  setIsEditing(false);
                }}
              >
                <h3 className="text-base font-semibold text-gray-800 mb-1">{exp.titre}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{exp.description}</p>
                <div className="text-sm text-gray-500 flex gap-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full">{exp.niveau}</span>
                  <span>{exp.duree}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🧾 Détails ou Formulaire (Droite) */}
        <div className="md:w-[40%] space-y-6 max-h-[84vh] overflow-auto">
          {/* 👉 Carte ProfExpCard à droite */}
          {selectedExperience && (
            <ProfExpCard
              experience={selectedExperience}
              onEdit={(exp) => {
                setFormData(exp);
                setIsEditing(true);
              }}
              onDelete={handleDelete}
            />
          )}

          {/* 🛠️ Formulaire juste après la carte */}
          {isEditing && formData && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="bg-white rounded-md p-4 shadow-sm border space-y-4"
            >
              <h3 className="text-lg font-semibold text-purple-700">
                {formData.id ? "✏️ Modifier" : "➕ Ajouter"} une expérience
              </h3>

              <input
                type="text"
                placeholder="Titre"
                required
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <textarea
                rows={3}
                placeholder="Description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex gap-4">
                <select
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  className="w-1/2 border border-gray-300 p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {DUREE_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>

                <select
                  value={formData.niveau}
                  onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                  className="w-1/2 border border-gray-300 p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {NIVEAU_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 🎯 Upload simulation */}
              <div className="relative flex flex-col gap-1">
                <label
                  className={`inline-block ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-md w-fit`}
                >
                  📁 Télécharger simulation
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {formData.simulationPath && (
                  <a
                    href={formData.simulationPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Voir fichier
                  </a>
                )}
                {uploading && (
                  <p className="text-sm text-gray-500 animate-pulse">⏳ Upload en cours...</p>
                )}
              </div>

              {/* 🖼️ Upload image */}
              <div className="relative flex flex-col gap-1 mt-4">
                <label
                  className={`inline-block ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md w-fit`}
                >
                  🖼️ Télécharger image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="preview"
                    className="mt-2 w-full rounded-md border"
                  />
                )}
                {uploading && (
                  <p className="text-sm text-gray-500 animate-pulse">⏳ Upload en cours...</p>
                )}
              </div>


              {/* 🔠 Textareas dynamiques */}
              {[
                { label: "Objectifs", field: "objectifs" },
                { label: "Matériel", field: "materiel" },
                { label: "Résultats attendus", field: "resultatsAttendus" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <textarea
                    rows={2}
                    placeholder="Une ligne par élément"
                    value={(formData as any)[field]?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData!,
                        [field]: e.target.value.split("\n"),
                      })
                    }
                    className="w-full border border-gray-300 p-3 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  💾 Enregistrer
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md"
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