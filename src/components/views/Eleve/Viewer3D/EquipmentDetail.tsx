import { LabEquipment } from '../../../../types/Viewer3D/molecule-equipment';
import { PenTool as Tool } from 'lucide-react';

type EquipmentDetailsProps = {
  equipment: LabEquipment;
};

export default function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-3">{equipment.nom}</h3>

      <div className="space-y-3 text-sm text-purple-300">
        <div className="flex items-center space-x-2">
          <Tool size={16} />
          <span>Matériel de laboratoire</span>
        </div>

        <div className="border-t border-white/10 pt-3 text-purple-200">
          <p>{equipment.description}</p>
        </div>

        <div className="bg-purple-500/10 rounded-md p-3">
          <h4 className="text-white font-medium mb-2">Utilisation</h4>
          <p className="text-purple-200 text-sm">{equipment.usage}</p>
        </div>
      </div>
    </div>
  );
}
