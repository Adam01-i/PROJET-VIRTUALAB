import { Molecule } from '../../../types/Viewer3D/molecule-equipment';
import { FlaskRound as Flask, GraduationCap, Info } from 'lucide-react';

type MoleculeDetailsProps = {
  molecule: Molecule;
};

export default function MoleculeDetails({ molecule }: MoleculeDetailsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">{molecule.nom}</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-purple-300">
          <Flask size={18} />
          <span className="text-lg">{molecule.formule}</span>
        </div>
        
        {molecule.niveau && (
          <div className="flex items-center space-x-2 text-purple-300">
            <GraduationCap size={18} />
            <span>{molecule.niveau}</span>
          </div>
        )}
        
        <div className="border-t border-white/10 pt-4">
          <p className="text-purple-200">{molecule.description}</p>
        </div>
        
        {molecule.importance && (
          <div className="bg-purple-500/10 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <Info size={18} className="text-purple-300 flex-shrink-0 mt-1" />
              <p className="text-purple-200">{molecule.importance}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}