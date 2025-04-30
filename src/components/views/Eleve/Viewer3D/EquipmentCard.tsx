import { PenTool as Tool } from 'lucide-react';
import type { LabEquipment } from '../../../../types/Viewer3D/molecule-equipment';

type EquipmentCardProps = {
  equipment: LabEquipment;
  isSelected: boolean;
  onSelect: (equipment: LabEquipment) => void;
};

export default function EquipmentCard({ equipment, isSelected, onSelect }: EquipmentCardProps) {
  return (
    <button
      onClick={() => onSelect(equipment)}
      className={`w-full p-3 rounded-md transition-all duration-200 text-left text-sm ${
        isSelected
          ? 'bg-purple-500 text-white'
          : 'bg-white/5 text-purple-200 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold mb-0 text-base">{equipment.nom}</h4>
          <div className="opacity-80">{equipment.usage}</div>
        </div>
        <Tool size={16} className="opacity-60" />
      </div>
    </button>
  );
}
