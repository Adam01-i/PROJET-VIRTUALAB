import { lab_items } from '../../../../types/Viewer3D/lab_items';
import { FlaskRound as Flask } from 'lucide-react';

type MoleculeDetailsProps = {
  molecule: lab_items;
};

export default function MoleculeDetails({ molecule }: MoleculeDetailsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{molecule.nom}</h3>
      
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center space-x-2">
          <Flask size={16} className="text-indigo-500" />
          <span>{molecule.formule}</span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <p>{molecule.description}</p>
        </div>

        {molecule.importance && (
          <div className="bg-indigo-50 rounded-md p-4 mt-3 border border-indigo-100">
              <h4 className="text-sm font-medium text-indigo-700 mb-2">Importance</h4>
              <p className="text-sm text-gray-800">{molecule.importance}</p>
          </div>
        )}
      </div>
    </div>
  );
}
