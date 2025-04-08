import { LabEquipment } from '../../types/Viewer3D/molecule-equipment';
import { PenTool as Tool} from 'lucide-react';

type EquipmentDetailsProps = {
  equipment: LabEquipment;
};

export default function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">{equipment.nom}</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-purple-300">
          <Tool size={18} />
          <span>Matériel de laboratoire</span>
        </div>
        
        <div className="border-t border-white/10 pt-4">
          <p className="text-purple-200">{equipment.description}</p>
        </div>
        
        <div className="bg-purple-500/10 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Utilisation</h4>
          <p className="text-purple-200">{equipment.usage}</p>
        </div>        
      </div>
    </div>
  );
}