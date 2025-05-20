import { Dialog } from '@headlessui/react';

export default function EleveDetail({ eleve, onClose }: { eleve: any; onClose: () => void }) {
  return (
    <Dialog open={!!eleve} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <Dialog.Panel className="bg-white rounded-lg shadow-lg max-w-md p-6">
        <Dialog.Title className="text-xl font-semibold mb-4 text-indigo-700">
          Détails de {eleve.name}
        </Dialog.Title>
        <ul className="text-gray-700 space-y-2">
          <li><strong>Classe :</strong> {eleve.classe}</li>
          <li><strong>Quiz :</strong> {eleve.quiz}</li>
          <li><strong>Simulations :</strong> {eleve.simulation}</li>
          <li><strong>Total :</strong> {eleve.total}</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700">
            Fermer
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
