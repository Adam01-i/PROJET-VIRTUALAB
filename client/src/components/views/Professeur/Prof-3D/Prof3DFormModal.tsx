"use client"

import { Dialog, DialogContent } from "../../../ui/Dialog"
import { Button } from "../../../ui/button2"
import { Textarea } from "../../../ui/Textarea"
import { Label } from "../../../ui/Label"
import { ChemicalFormulaInput } from "../../../ui/ChemicalFormula"

type Prof3DFormModalProps = {
  open: boolean
  setOpen: (val: boolean) => void
  formData: any
  setFormData: (val: any) => void
  isEditing: boolean
  setIsEditing: (val: boolean) => void
  onSubmit: () => void
  onCancel: () => void
  classes: { id: string; code_classe: string }[]
  viewMode: "molecule" | "equipment"
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Prof3DFormModal({
  open,
  setOpen,
  formData,
  setFormData,
  setIsEditing,
  onSubmit,
  onCancel,
  classes,
  viewMode,
  handleFileUpload,
}: Prof3DFormModalProps) {
  if (!formData) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-indigo-700">
            {formData.id ? "Modifier" : "Ajouter"} {viewMode === "molecule" ? "une Molécule" : "un Matériel"}
          </h2>

          <input
            required
            placeholder="Nom"
            value={formData.nom || ""}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className="w-full border p-2 rounded"
          />

          <Textarea
            required
            placeholder="Description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <Label className="block">Structure (.glb)</Label>
          <label className="cursor-pointer flex items-center gap-2 text-sm bg-gray-100 w-1/3 px-1 py-2 rounded border border-gray-300 hover:bg-gray-200">
            📂 importer Structure (.glb)
          <input type="file" accept=".glb" onChange={handleFileUpload} className="hidden" />
          </label>
            <div className="space-y-1">
            <p className="text-sm font-semibold">Classes assignées :</p>
            {classes.map((cl) => (
              <label key={cl.id} className="block text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.selectedClasseIds?.includes(cl.id) || false}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...(formData.selectedClasseIds || []), cl.id]
                      : (formData.selectedClasseIds || []).filter((id: string) => id !== cl.id)
                    setFormData({ ...formData, selectedClasseIds: updated })
                  }}
                />
                {cl.code_classe}
              </label>
            ))}
          </div>

          {viewMode === "molecule" && (
            <>
              <div>
                <Label className="block mb-2">Formule chimique</Label>
                <ChemicalFormulaInput
                  value={formData.formule || ""}
                  onChange={(value) => setFormData({ ...formData, formule: value })}
                  placeholder="Ex: H2SO4, C6H12O6, NaCl"
                  className="border-gray-300"
                />
              </div>
              <Textarea
                placeholder="Importance"
                value={formData.importance || ""}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                rows={2}
              />
              <Textarea
                placeholder="Précautions"
                value={formData.precautions || ""}
                onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
                rows={2}
              />
            </>
          )}

          {viewMode === "equipment" && (
            <>
              <Textarea
                placeholder="Utilisation"
                value={formData.usage || ""}
                onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                rows={2}
              />
              <Textarea
                placeholder="Précautions"
                value={formData.precautions || ""}
                onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
                rows={2}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit">💾 {formData.id ? "Modifier" : "Ajouter"}</Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onCancel()
                setOpen(false)
                setIsEditing(false)
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
