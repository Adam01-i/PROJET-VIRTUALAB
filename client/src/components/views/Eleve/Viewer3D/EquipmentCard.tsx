import { PenTool as Tool } from 'lucide-react';
import type { lab_items } from '../../../../types/Viewer3D/lab_items';

type EquipmentCardProps = {
  equipment: lab_items;
  isSelected: boolean;
  onSelect: (equipment: lab_items) => void;
};

export default function EquipmentCard({ equipment, isSelected, onSelect }: EquipmentCardProps) {
  return (
    <button
      onClick={() => onSelect(equipment)}
      className={`w-full p-4 rounded-md border transition-all duration-200 text-left text-sm shadow-sm ${isSelected
          ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
        }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-base mb-1">{equipment.nom}</h4>
          <div className="text-gray-500 text-sm">{equipment.usage}</div>
        </div>
        <Tool size={16} className="text-gray-400" />
      </div>
    </button>
  );
}
