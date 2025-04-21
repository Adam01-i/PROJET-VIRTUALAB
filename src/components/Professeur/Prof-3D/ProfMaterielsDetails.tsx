import { Info, AlertTriangle } from 'lucide-react';
import type { LabEquipment } from '../../../types/Viewer3D/molecule-equipment';

type Props = {
  equipment: LabEquipment;
};

export default function ProfMaterielsDetails({ equipment }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{equipment.nom}</h3>

      <div className="space-y-3 text-gray-700">
        <div className="border-t border-gray-200 pt-4 text-sm">
          <p>{equipment.description}</p>
        </div>

        {equipment.usage && (
          <div className="bg-blue-50 rounded-lg p-4 mt-3">
            <div className="flex items-start space-x-3">
              <Info size={18} className="text-blue-600 mt-1" />
              <p className="text-gray-800">{equipment.usage}</p>
            </div>
          </div>
        )}

        {equipment.precautions && (
          <div className="bg-yellow-100 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={18} className="text-yellow-600 mt-1" />
              <p className="text-gray-800">{equipment.precautions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
