import { Molecule } from '../../../../types/Viewer3D/molecule-equipment';
import { FlaskRound as Flask, GraduationCap, Info } from 'lucide-react';

type Props = {
  molecule: Molecule;
};

export default function ProfMoleculeDetails({ molecule }: Props) {
  return (
    <div className="bg-white rounded-md p-4 border border-gray-200 shadow-sm text-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">{molecule.nom}</h3>

      <div className="space-y-3 text-gray-700">
        <div className="flex items-center gap-2">
          <Flask size={16} />
          <span>{molecule.formule}</span>
        </div>

        {molecule.niveau && (
          <div className="flex items-center gap-2">
            <GraduationCap size={16} />
            <span>{molecule.niveau}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <p>{molecule.description}</p>
        </div>

        {molecule.importance && (
          <div className="bg-purple-100 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-purple-600 mt-1" />
              <p>{molecule.importance}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
