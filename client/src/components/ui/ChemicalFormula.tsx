"use client"

import * as React from "react"

type ChemicalFormulaProps = {
  formula: string
  className?: string
}

export function ChemicalFormula({ formula, className = "" }: ChemicalFormulaProps) {
  // Fonction pour convertir une formule chimique en JSX avec des indices
  const parseFormula = (formula: string) => {
    // Regex pour détecter les éléments chimiques et leurs nombres
    const regex = /([A-Z][a-z]?)(\d*)/g
    const parts: React.ReactNode[] = []
    let match
    let lastIndex = 0

    while ((match = regex.exec(formula)) !== null) {
      // Ajouter le texte avant le match (parenthèses, etc.)
      if (match.index > lastIndex) {
        const beforeText = formula.slice(lastIndex, match.index)
        parts.push(beforeText)
      }

      const element = match[1] // L'élément chimique (ex: C, H, O, Na, Cl)
      const number = match[2] // Le nombre (ex: 2, 3, 12)

      parts.push(
        <span key={match.index}>
          {element}
          {number && <sub>{number}</sub>}
        </span>,
      )

      lastIndex = regex.lastIndex
    }

    // Ajouter le reste de la formule
    if (lastIndex < formula.length) {
      parts.push(formula.slice(lastIndex))
    }

    return parts
  }

  return <span className={`chemical-formula ${className}`}>{parseFormula(formula)}</span>
}

// Composant d'aide pour saisir des formules chimiques
export function ChemicalFormulaInput({
  value,
  onChange,
  placeholder = "Ex: H2SO4, C6H12O6, NaCl",
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [preview, setPreview] = React.useState(value)

  React.useEffect(() => {
    setPreview(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setPreview(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full p-2 border rounded ${className}`}
      />
      {preview && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Aperçu : </span>
          <ChemicalFormula formula={preview} className="text-lg" />
        </div>
      )}
      <div className="text-xs text-gray-500">
        💡 Tapez normalement (ex: H2SO4) - les indices seront automatiquement formatés
      </div>
    </div>
  )
}
