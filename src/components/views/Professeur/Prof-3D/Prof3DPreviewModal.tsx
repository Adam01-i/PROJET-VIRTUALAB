'use client';

import { Dialog, DialogContent } from '../../../ui/Dialog';
import ProfGLBViewer from './ProfGLBViewer';
import { Button } from '../../../ui/button2'; // assure-toi que ce bouton existe
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  glbUrl: string;
  nom: string;
};

export default function Prof3DPreviewModal({ open, onClose, glbUrl, nom }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh] p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-indigo-700">
            🧊 Visualisation 3D – {nom}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
          >
            <X size={16} /> Quitter
          </Button>
        </div>

        <div className="flex-1 border rounded-md overflow-hidden">
          <ProfGLBViewer glbUrl={glbUrl} moleculeName={nom} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
