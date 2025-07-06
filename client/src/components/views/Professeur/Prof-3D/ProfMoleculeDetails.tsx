import type { lab_items } from "../../../../types/Viewer3D/lab_items"
import { FlaskRoundIcon as Flask, GraduationCap, Info } from "lucide-react"
import { ChemicalFormula } from "../../../ui/ChemicalFormula"

type MoleculeWithClasse = lab_items & {
  classes?: {
    code_classe: string
  }
}

type Props = {
  molecule: MoleculeWithClasse
}

export default function ProfMoleculeDetails({ molecule }: Props) {
  return (
    <div className="bg-white rounded-md p-4 border border-gray-200 shadow-sm text-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">{molecule.nom}</h3>

      <div className="space-y-3 text-gray-700">
        {/* Formule */}
        {molecule.formule && (
          <div className="flex items-center gap-2">
            <Flask size={16} />
            <ChemicalFormula formula={molecule.formule} className="text-lg font-mono" />
          </div>
        )}

        {/* Niveau (code_classe) */}
        {molecule.classes?.code_classe && (
          <div className="flex items-center gap-2">
            <GraduationCap size={16} />
            <span className="text-purple-700 font-medium">{molecule.classes.code_classe}</span>
          </div>
        )}

        {/* Description */}
        <div className="border-t border-gray-200 pt-3">
          <p>{molecule.description}</p>
        </div>

        {/* Importance */}
        {molecule.importance && (
          <div className="bg-purple-100 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-purple-600 mt-1" />
              <p>{molecule.importance}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
