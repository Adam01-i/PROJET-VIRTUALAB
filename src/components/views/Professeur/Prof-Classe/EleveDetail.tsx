import { Dialog } from '@headlessui/react';
import { EleveActivite } from '../../../../types/Eleve/EleveActivite';

type Props = {
  eleve: EleveActivite | null;
  onClose: () => void;
};

export default function EleveDetail({ eleve, onClose }: Props) {
  if (!eleve) return null;

  return (
    <Dialog open={!!eleve} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <Dialog.Panel className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <Dialog.Title className="text-xl font-semibold mb-4 text-indigo-700">
          👤 Détails de {eleve.name}
        </Dialog.Title>

        <div className="space-y-2 text-gray-700 text-sm">
          <p><strong>📚 Classe :</strong> {eleve.classe}</p>
          <p><strong>📝 Quiz complétés :</strong> {eleve.quiz}</p>
          <p><strong>🧪 Simulations :</strong> {eleve.simulation}</p>
          <p><strong>📊 Activités totales :</strong> {eleve.total}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Fermer
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
