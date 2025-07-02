"use client"

import { useState } from "react"
import { CuboidIcon as Cube, Eye, Edit, Trash2 } from "lucide-react"
import Prof3DPreviewModal from "./Prof3DPreviewModal"
import type { lab_items } from "../../../../types/Viewer3D/lab_items"

type Prof3DCardProps = {
  object: lab_items
  classeNoms?: string[]
  classeAffichage?: string
  onEdit: (obj: lab_items) => void
  onDelete: (id: string) => void
}

export default function Prof3DCard({ object, classeNoms = [], onEdit, onDelete }: Prof3DCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition">
        <div className="h-40 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
          <Cube size={48} className="text-indigo-400" />
          {classeNoms.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {classeNoms.map((nom) => (
                <span key={nom} className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded shadow">
                  📘 {nom}
                </span>
              ))}
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-0.5 text-xs rounded shadow ${
                object.category === "molecule" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {object.category === "molecule" ? "🧪 Molécule" : "🔬 Matériel"}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-1">
            <Cube size={14} /> {object.nom}
          </h3>
          <p className="text-gray-600 line-clamp-3">{object.description}</p>

          {object.category === "molecule" && object.formule && (
            <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">Formule: {object.formule}</div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded hover:bg-green-700 flex items-center justify-center gap-1"
              disabled={!object.structure}
            >
              <Eye size={12} /> Visualiser
            </button>
            <button
              onClick={() => onEdit(object)}
              className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-800 flex items-center justify-center gap-1"
            >
              <Edit size={12} /> Modifier
            </button>
            <button
              onClick={() => onDelete(object.id)}
              className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded hover:bg-red-700 flex items-center justify-center gap-1"
            >
              <Trash2 size={12} /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Modal de prévisualisation 3D */}
      {previewOpen && object.structure && (
        <Prof3DPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          glbUrl={object.structure}
          nom={object.nom}
        />
      )}
    </>
  )
}
