import { lab_items } from '../../../../types/Viewer3D/lab_items';
import { PenTool as Tool } from 'lucide-react';

type EquipmentDetailsProps = {
  equipment: lab_items;
};

export default function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{equipment.nom}</h3>

      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex items-center space-x-2">
          <Tool size={16} className="text-indigo-500" />
          <span>Matériel de laboratoire</span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <p>{equipment.description}</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4">
          <h4 className="text-sm font-medium text-indigo-700 mb-2">Utilisation</h4>
          <p className="text-gray-800">{equipment.usage}</p>
        </div>
      </div>
    </div>
  );
}
