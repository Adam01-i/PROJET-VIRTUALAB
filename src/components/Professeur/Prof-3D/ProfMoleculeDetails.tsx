import { Molecule } from '../../../types/Viewer3D/molecule-equipment';
import { FlaskRound as Flask, GraduationCap, Info } from 'lucide-react';

type Props = {
  molecule: Molecule;
};

export default function ProfMoleculeDetails({ molecule }: Props) {
  return (
<div className="bg-white rounded-xl p-6 border border-gray-200 shadow">
  <h3 className="text-xl font-bold text-gray-800 mb-4">{molecule.nom}</h3>

  <div className="space-y-3 text-gray-700">
    <div className="flex items-center space-x-2">
      <Flask size={18} />
      <span className="text-lg">{molecule.formule}</span>
    </div>

    {molecule.niveau && (
      <div className="flex items-center space-x-2">
        <GraduationCap size={18} />
        <span>{molecule.niveau}</span>
      </div>
    )}

    <div className="border-t border-gray-200 pt-4 text-sm">
      <p>{molecule.description}</p>
    </div>

    {molecule.importance && (
      <div className="bg-purple-100 rounded-lg p-4 mt-3">
        <div className="flex items-start space-x-3">
          <Info size={18} className="text-purple-600 mt-1" />
          <p className="text-gray-800">{molecule.importance}</p>
        </div>
      </div>
    )}
  </div>
</div>

  );
}
