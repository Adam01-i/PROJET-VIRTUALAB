import { Molecule } from '../../../../types/Viewer3D/molecule-equipment';
import { FlaskRound as Flask, GraduationCap, Info } from 'lucide-react';

type MoleculeDetailsProps = {
  molecule: Molecule;
};

export default function MoleculeDetails({ molecule }: MoleculeDetailsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-3">{molecule.nom}</h3>
      
      <div className="space-y-3 text-sm text-purple-300">
        <div className="flex items-center space-x-2">
          <Flask size={16} />
          <span>{molecule.formule}</span>
        </div>
        
        {molecule.niveau && (
          <div className="flex items-center space-x-2">
            <GraduationCap size={16} />
            <span>{molecule.niveau}</span>
          </div>
        )}
        
        <div className="border-t border-white/10 pt-3 text-purple-200">
          <p>{molecule.description}</p>
        </div>
        
        {molecule.importance && (
          <div className="bg-purple-500/10 rounded-md p-3 mt-3">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-purple-300 flex-shrink-0 mt-0.5" />
              <p className="text-purple-200 text-sm">{molecule.importance}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
