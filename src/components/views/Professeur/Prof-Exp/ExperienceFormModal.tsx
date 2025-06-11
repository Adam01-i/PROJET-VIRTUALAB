'use client';

import { Dialog, DialogContent } from '../../../ui/Dialog';
import { Button } from '../../../ui/button';

type ExperienceFormModalProps = {
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  classes: { id: string; code_classe: string }[];
  DUREE_OPTIONS: string[];
  NIVEAU_OPTIONS: string[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ExperienceFormModal({
  formData,
  setFormData,
  modalOpen,
  setModalOpen,
  onSave,
  onCancel,
  classes,
  DUREE_OPTIONS,
  NIVEAU_OPTIONS,
  handleFileUpload,
  handleImageUpload,
}: ExperienceFormModalProps) {
  if (!formData) return null;

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-indigo-700">
            {formData?.id ? 'Modifier' : 'Nouvelle'} simulation
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

          <div className="space-y-1">
            <p className="text-sm font-semibold">Classes assignées :</p>
            {classes.map((cl) => (
              <label key={cl.id} className="block text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.selectedClasseIds?.includes(cl.id)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...formData.selectedClasseIds, cl.id]
                      : formData.selectedClasseIds.filter((id: string) => id !== cl.id);
                    setFormData({ ...formData, selectedClasseIds: updated });
                  }}
                />
                {cl.code_classe}
              </label>
            ))}
          </div>

          <input type="file" onChange={handleFileUpload} className="text-sm" />
          {formData.simulationPath && (
            <a href={formData.simulationPath} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm block">
              Voir simulation
            </a>
          )}

          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
          {formData.image && (
            <img src={formData.image} className="rounded border w-full mt-2" alt="preview" />
          )}

          {['objectifs', 'materiel', 'resultatsAttendus'].map((field) => (
            <div key={field}>
              <label className="text-sm block capitalize">{field}</label>
              <textarea
                rows={5}
                value={(formData as any)[field]?.join('\n') || ''}
                onChange={(e) =>
                  setFormData({ ...formData, [field]: e.target.value.split('\n') })
                }
                className="w-full border p-2 rounded text-sm"
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button className="bg-indigo-600" type="submit">💾 Enregistrer</Button>
            <Button variant="outline" type="button" onClick={onCancel}>Annuler</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
