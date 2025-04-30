import { Info } from 'lucide-react';
import type { Molecule } from '../../../../types/Viewer3D/molecule-equipment';

type MoleculeCardProps = {
  molecule: Molecule;
  isSelected: boolean;
  onSelect: (molecule: Molecule) => void;
};

export default function MoleculeCard({ molecule, isSelected, onSelect }: MoleculeCardProps) {
  return (
    <button
      onClick={() => onSelect(molecule)}
      className={`w-full p-3 rounded-md transition-all duration-200 text-left text-sm ${
        isSelected
          ? 'bg-purple-500 text-white'
          : 'bg-white/5 text-purple-200 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold mb-0 text-base">{molecule.nom}</h4>
          <div className="opacity-80">{molecule.formule}</div>
        </div>
        <Info size={16} className="opacity-60" />
      </div>
    </button>
  );
}
