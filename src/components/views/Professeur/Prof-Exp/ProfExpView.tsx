'use client';

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import type { Experience } from "../../../../types/Experience/experience";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import ProfExpCard from "./ProfExpCard";

const DUREE_OPTIONS = ["15 min", "30 min", "45 min", "60 min"];
const NIVEAU_OPTIONS = ["Débutant", "Intermédiaire", "Avancé"];

export default function ProfExpView() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [formData, setFormData] = useState<Experience | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [, setUploading] = useState(false);
  const [classes, setClasses] = useState<{ id: string, code_classe: string }[]>([]);
  const [classeFilter, setClasseFilter] = useState<string>('all');
  const totalExperiences = experiences.length;
  const getClasseNom = (id: string | null | undefined) => {
  if (!id) return '—';
  const classe = classes.find((c) => c.id === id);
  return classe?.code_classe || '—';
};


useEffect(() => {
  const fetchClasses = async () => {
    const { data, error } = await supabase.from('mes_classes').select('id, code_classe');
    if (error) {
      console.error("❌ Erreur récupération classes :", error);
    } else {
      setClasses(data);
    }
  };

  fetchClasses();
}, []);

  useEffect(() => {
    fetchExperiences();
  }, [classeFilter]);

  const fetchExperiences = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    let query = supabase.from("experiences").select("*").eq("auteur_id", userId).order("created_at", { ascending: false });

    if (classeFilter !== 'all') {
      query = query.eq("classe_id", classeFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erreur chargement expériences");
    } else {
      setExperiences(data || []);
    }
  };

  const handleSave = async () => {
    if (!formData?.titre || !formData.description || !formData.classe_id) {
      toast.error("Titre, description et classe sont requis.");
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const isNew = !formData.id;

    await toast.promise(
      (async () => {
        if (isNew) {
          const { data: inserted, error } = await supabase
            .from("experiences")
            .insert([{
              ...formData,
              id: uuidv4(),
              auteur_id: userId,
            }])
            .select();
          if (error || !inserted || !inserted[0]) throw new Error("Erreur lors de l'ajout.");
        } else {
          await supabase.from("experiences").update(formData).eq("id", formData.id);
        }
      })(),
      {
        loading: "Enregistrement...",
        success: isNew ? "Ajoutée !" : "Modifiée !",
        error: "Échec de l'enregistrement.",
      }
    );

    fetchExperiences();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette expérience ?")) return;

    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (error) toast.error("Erreur suppression");
    else {
      toast.success("Expérience supprimée");
      fetchExperiences();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData(null);
    setFormData(null);
    setIsEditing(false);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `simulations/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("simulations").upload(filePath, file);
    if (error) toast.error("Upload échoué");
    else {
      const { data } = supabase.storage.from("simulations").getPublicUrl(filePath);
      if (formData) setFormData({ ...formData, simulationPath: data.publicUrl });
    }
    setUploading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("images-sim").upload(filePath, file);
    if (error) toast.error("Upload image échoué");
    else {
      const { data } = supabase.storage.from("images-sim").getPublicUrl(filePath);
      if (formData) setFormData({ ...formData, image: data.publicUrl });
    }
    setUploading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-indigo-600">🧪 Mes simulations</h2>
        <button
          onClick={() => {
            setFormData({
              id: '',
              titre: '',
              description: '',
              duree: DUREE_OPTIONS[0],
              niveau: NIVEAU_OPTIONS[0],
              image: '',
              simulationPath: '',
              classe_id: '',
              objectifs: [],
              materiel: [],
              resultatsAttendus: [],
            });
            setIsEditing(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-900 text-white px-4 py-2 rounded shadow text-sm"
        >
          ➕ Nouvelle simulation
        </button>
      </div>

      {/* 🔍 Filtre par classe */}
      <div>
        <label className="text-sm font-medium text-gray-600 mr-2">Classe :</label>
        <select
          className="border px-3 py-1 rounded text-sm"
          onChange={(e) => {
            setClasseFilter(e.target.value);
          }}
          value={classeFilter}
        >
          <option value="all">Toutes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.code_classe}</option>
          ))}
        </select>
        <span className="ml-3 text-sm text-gray-500 font-normal">| Total :  {totalExperiences}  Simulations </span>

      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {experiences.length === 0 ? (
            <p className="text-gray-500 italic">Aucune simulation trouvée.</p>
          ) : (
            experiences.map((exp) => (
              <ProfExpCard
                key={exp.id}
                experience={exp}
                classeNom={getClasseNom(exp.classe_id)} // 👈 ici
                onEdit={(e) => {
                  setFormData(e);
                  setIsEditing(true);
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* 🎯 Formulaire */}
        {isEditing && formData && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="bg-white border p-4 rounded shadow space-y-4 overflow-hidden"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <h3 className="text-lg font-semibold text-indigo-700">
              {formData.id ? "Modifier" : "Nouvelle"} simulation
            </h3>

            <input
              required
              placeholder="Titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <textarea
              rows={3}
              required
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <div className="flex gap-3">
              <select
                value={formData.duree}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                className="flex-1 border p-2 rounded"
              >
                {DUREE_OPTIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select
                value={formData.niveau}
                onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                className="flex-1 border p-2 rounded"
              >
                {NIVEAU_OPTIONS.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>

            <select
              value={formData.classe_id}
              onChange={(e) => setFormData({ ...formData, classe_id: e.target.value })}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((cl) => (
                <option key={cl.id} value={cl.id}>{cl.code_classe}</option>
              ))}
            </select>

            <input type="file" onChange={handleFileUpload} className="text-sm" />
            {formData.simulationPath && <a href={formData.simulationPath} className="text-blue-600 underline text-sm">Voir simulation</a>}

            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            {formData.image && <img src={formData.image} className="rounded border w-full mt-2" alt="preview" />}

            {["objectifs", "materiel", "resultatsAttendus"].map((field) => (
              <div key={field}>
                <label className="text-sm block capitalize">{field}</label>
                <textarea
                  rows={5}
                  value={(formData as any)[field]?.join("\n") || ""}
                  onChange={(e) =>
                    setFormData({ ...formData!, [field]: e.target.value.split("\n") })
                  }
                  className="w-full border p-2 rounded text-sm"
                />
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">💾 Enregistrer</button>
              <button type="button" onClick={resetForm} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
