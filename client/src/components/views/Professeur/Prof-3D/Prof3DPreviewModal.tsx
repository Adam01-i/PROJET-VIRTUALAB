"use client"

import { Dialog, DialogContent } from "../../../ui/Dialog"
import ProfGLBViewer from "./ProfGLBViewer"
import { Button } from "../../../ui/button2"
import { X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  glbUrl: string
  nom: string
}

export default function Prof3DPreviewModal({ open, onClose, glbUrl, nom }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header fixe */}
        <div className="flex justify-between items-center p-4 border-b bg-white flex-shrink-0">
          <h2 className="text-lg font-semibold text-indigo-700">🧊 Visualisation 3D – {nom}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
          >
            <X size={16} /> Fermer
          </Button>
        </div>

        {/* Zone de visualisation 3D - occupe tout l'espace restant */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <ProfGLBViewer glbUrl={glbUrl} moleculeName={nom} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
