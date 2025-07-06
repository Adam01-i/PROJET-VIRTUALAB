import { Info, AlertTriangle } from 'lucide-react';
import type { lab_items } from '../../../../types/Viewer3D/lab_items';

// ✅ Extension du type pour inclure la relation à la classe
type LabItemWithClasse = lab_items & {
  classes?: {
    code_classe: string;
  };
};

type Props = {
  equipment: LabItemWithClasse;
};

export default function ProfMaterielsDetails({ equipment }: Props) {
  return (
    <div className="bg-white rounded-md p-4 border border-gray-200 shadow-sm text-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">{equipment.nom}</h3>

      <div className="space-y-3 text-gray-700">
        {/* Description */}
        <div className="border-t border-gray-200 pt-3">
          <p>{equipment.description}</p>
        </div>

        {/* Niveau (code_classe) */}
        {equipment.classes?.code_classe && (
          <div className="text-sm text-purple-700 bg-purple-50 rounded-md p-2 border border-purple-200">
            🎓 Niveau : <strong>{equipment.classes.code_classe}</strong>
          </div>
        )}

        {/* Usage */}
        {equipment.usage && (
          <div className="bg-blue-50 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 mt-1" />
              <p>{equipment.usage}</p>
            </div>
          </div>
        )}

        {/* Précautions */}
        {equipment.precautions && (
          <div className="bg-yellow-100 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 mt-1" />
              <p>{equipment.precautions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
