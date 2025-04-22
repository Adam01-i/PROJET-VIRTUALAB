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
      className={`w-full p-4 rounded-lg transition-all duration-200 text-left ${
        isSelected
          ? 'bg-purple-500 text-white'
          : 'bg-white/5 text-purple-200 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold mb-1">{equipment.nom}</h4>
          <div className="text-sm opacity-80">{equipment.usage}</div>
        </div>
        <Tool size={18} className="opacity-60" />
      </div>
    </button>
  );
}