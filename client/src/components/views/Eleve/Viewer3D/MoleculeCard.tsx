import { Info } from 'lucide-react';
import type { lab_items } from '../../../../types/Viewer3D/lab_items';
import { ChemicalFormula } from '../../../ui/ChemicalFormula';

type MoleculeCardProps = {
  molecule: lab_items;
  isSelected: boolean;
  onSelect: (molecule: lab_items) => void;
};

export default function MoleculeCard({ molecule, isSelected, onSelect }: MoleculeCardProps) {
  return (
    <button
      onClick={() => onSelect(molecule)}
      className={`w-full p-4 rounded-md border transition-all duration-200 text-left text-sm shadow-sm ${isSelected
        ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
        }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold mb-0 text-base">{molecule.nom}</h4>
          {/* <div className="text-gray-500 text-sm">{molecule.formule}</div> */}
          <ChemicalFormula formula={molecule.formule ?? ''} className="text-lg font-mono" />
        </div>
        <Info size={16} className="text-gray-400" />
      </div>
    </button>
  );
}
