'use client';

import { Dialog, DialogContent } from '../../../ui/Dialog';
import { Button } from '../../../ui/button2';

export default function QuizFormModal({
  open,
  setOpen,
  formData,
  setFormData,
  onSave,
  onCancel,
  classes,
  handleImageUpload,
  handleQuestionChange,
  handleOptionChange,
  addQuestion,
  removeQuestion,
}: any) {
  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-[50vw] overflow-y-auto">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave(); // ⏳ attendre que toutes les opérations async soient terminées
            setOpen(false);
          }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-indigo-700">
            {formData?.id ? "Modifier" : "Nouveau"} Quiz
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

          <select
            value={formData.duree}
            onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
            className="w-full border p-2 rounded"
          >
            {["10 min", "20 min", "30 min", "45 min"].map((d) => <option key={d}>{d}</option>)}
          </select>

          <div className="space-y-1">
            <p className="text-sm font-semibold">Classes assignées :</p>
            {classes.map((cl: any) => (
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

          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
          {formData.image && (
            <img src={formData.image} className="rounded border w-full mt-2" alt="quiz cover" />
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Questions</h4>
            {(formData.questions || []).map((q: any, idx: number) => (
              <div key={q.id || idx} className="bg-gray-50 p-3 rounded-md border space-y-2 text-sm">
                <input
                  value={q.question}
                  onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Intitulé de la question"
                />
                {q.options.map((opt: string, optIdx: number) => (
                  <input
                    key={optIdx}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder={`Option ${optIdx + 1}`}
                  />
                ))}
                <select
                  value={String(q.correctAnswer)}
                  onChange={(e) => handleQuestionChange(idx, 'correctAnswer', parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {q.options.map((_: string, i: number) => (
                    <option key={i} value={i}>Bonne réponse : Option {i + 1}</option>
                  ))}
                </select>
                <textarea
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Explication (facultatif)"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="text-red-600 text-xs hover:underline"
                >
                  Supprimer
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="text-indigo-700 text-sm hover:underline"
            >
              ➕ Ajouter une question
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit">💾 Enregistrer</Button>
            <Button type="button" variant="outline" onClick={() => {
              onCancel();
              setOpen(false);
            }}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
