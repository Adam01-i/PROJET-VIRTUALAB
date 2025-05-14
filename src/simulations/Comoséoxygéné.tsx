"use client"

import { useState, useEffect, useRef, type SetStateAction } from "react"
import { Flame, ChevronDown, RotateCcw, BookOpen, Info, Beaker } from "lucide-react"

export default function ComposesOxygenes() {
  // Références pour les animations
  const tubeRef = useRef(null)

  // États pour les menus et sélections
  const [alcoholMenu, setAlcoholMenu] = useState(false)
  const [oxidantMenu, setOxidantMenu] = useState(false)

  // États pour les animations de versement
  const [pouringLeft, setPouringLeft] = useState(false)
  const [pouringRight, setPouringRight] = useState(false)

  // États pour la simulation
  const [heating, setHeating] = useState(false)
  const [reactionComplete, setReactionComplete] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const [showResult, setShowResult] = useState(false)

  // Liste des alcools disponibles
  const alcohols = [
    { id: "ethanol", name: "Éthanol (CH₃CH₂OH)", color: "bg-blue-50/80", formula: "CH₃CH₂OH", type: "primaire" },
    { id: "methanol", name: "Méthanol (CH₃OH)", color: "bg-blue-100/80", formula: "CH₃OH", type: "primaire" },
    {
      id: "propanol",
      name: "Propanol (CH₃CH₂CH₂OH)",
      color: "bg-blue-200/80",
      formula: "CH₃CH₂CH₂OH",
      type: "primaire",
    },
    {
      id: "isopropanol",
      name: "Isopropanol ((CH₃)₂CHOH)",
      color: "bg-blue-300/80",
      formula: "(CH₃)₂CHOH",
      type: "secondaire",
    },
    { id: "butanol", name: "Butanol (CH₃(CH₂)₃OH)", color: "bg-blue-400/80", formula: "CH₃(CH₂)₃OH", type: "primaire" },
  ]

  // Liste des oxydants disponibles
  const oxidants = [
    { id: "dichromate", name: "Dichromate de K + H₂SO₄", color: "bg-orange-500/90", formula: "K₂Cr₂O₇ + H₂SO₄" },
    { id: "permanganate", name: "Permanganate de K", color: "bg-purple-500/90", formula: "KMnO₄" },
    { id: "fehling", name: "Liqueur de Fehling", color: "bg-blue-500/90", formula: "Cu²⁺ + tartrate" },
    { id: "tollens", name: "Réactif de Tollens", color: "bg-gray-300/90", formula: "Ag(NH₃)₂⁺" },
  ]

  // États pour les solutions sélectionnées
  const [selectedAlcohol, setSelectedAlcohol] = useState(alcohols[0])
  const [selectedOxidant, setSelectedOxidant] = useState(oxidants[0])

  // États pour les solutions versées
  const [alcoholAdded, setAlcoholAdded] = useState(false)
  const [oxidantAdded, setOxidantAdded] = useState(false)

  // Gestion du chauffage et de la réaction
  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined
    if (heating && alcoholAdded && oxidantAdded) {
      timer = setTimeout(() => {
        setHeating(false)
        setTimeout(() => {
          setReactionComplete(true)
          setShowResult(true)
        }, 2000)
      }, 5000)
    }
    return () => clearTimeout(timer)
  }, [heating, alcoholAdded, oxidantAdded])

  // Couleur de la solution basée sur les réactifs et l'état
  const getSolutionColor = () => {
    if (!alcoholAdded && !oxidantAdded) return "transparent"
    if (alcoholAdded && !oxidantAdded) return selectedAlcohol.color
    if (alcoholAdded && oxidantAdded && !reactionComplete) {
      return heating ? getTransitionColor() : selectedOxidant.color
    }
    if (reactionComplete) return getResultColor()
    return "transparent"
  }

  // Couleur de transition pendant le chauffage
  const getTransitionColor = () => {
    if (selectedOxidant.id === "dichromate") {
      return "bg-gradient-to-b from-orange-500/90 to-green-600/80"
    } else if (selectedOxidant.id === "permanganate") {
      return "bg-gradient-to-b from-purple-500/90 to-pink-300/80"
    } else if (selectedOxidant.id === "fehling") {
      return "bg-gradient-to-b from-blue-500/90 to-red-500/80"
    } else if (selectedOxidant.id === "tollens") {
      return "bg-gradient-to-b from-gray-300/90 to-gray-600/80"
    }
    return selectedOxidant.color
  }

  // Couleur du résultat final
  const getResultColor = () => {
    if (selectedOxidant.id === "dichromate") {
      return "bg-green-600/80"
    } else if (selectedOxidant.id === "permanganate") {
      return "bg-pink-300/80"
    } else if (selectedOxidant.id === "fehling") {
      // Fehling ne réagit qu'avec les aldéhydes (alcools primaires)
      return selectedAlcohol.type === "primaire" ? "bg-red-500/80" : "bg-blue-500/90"
    } else if (selectedOxidant.id === "tollens") {
      // Tollens ne réagit qu'avec les aldéhydes (alcools primaires)
      return selectedAlcohol.type === "primaire" ? "bg-gray-800/90" : "bg-gray-300/90"
    }
    return "bg-gray-400/80"
  }

  // Hauteur de la solution
  const getSolutionHeight = () => {
    let height = 0
    if (alcoholAdded) height += 30
    if (oxidantAdded) height += 20
    return `${height}%`
  }

  // Bulles d'ébullition
  const renderBubbles = () => {
    if (!heating) return null

    return (
      <div className="absolute bottom-0 left-0 w-full">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-full bg-white/70 animate-bubble"
            style={{
              left: `${10 + Math.random() * 80}%`,
              width: `${3 + Math.random() * 4}px`,
              height: `${3 + Math.random() * 4}px`,
              animationDuration: `${1 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    )
  }

  // Verser l'alcool
  const pourAlcohol = () => {
    if (alcoholAdded || pouringLeft) return

    setPouringLeft(true)
    setTimeout(() => {
      setAlcoholAdded(true)
      setPouringLeft(false)
    }, 1500)
  }

  // Verser l'oxydant
  const pourOxidant = () => {
    if (oxidantAdded || pouringRight) return

    setPouringRight(true)
    setTimeout(() => {
      setOxidantAdded(true)
      setPouringRight(false)
    }, 1500)
  }

  // Réinitialisation de la simulation
  const handleReset = () => {
    setHeating(false)
    setReactionComplete(false)
    setShowFormula(false)
    setShowResult(false)
    setAlcoholAdded(false)
    setOxidantAdded(false)
  }

  // Sélection d'un alcool
  const selectAlcohol = (
    alcohol: SetStateAction<{ id: string; name: string; color: string; formula: string; type: string }>,
  ) => {
    setSelectedAlcohol(alcohol)
    setAlcoholMenu(false)
    if (alcoholAdded) {
      setAlcoholAdded(false)
      setReactionComplete(false)
      setShowResult(false)
    }
  }

  // Sélection d'un oxydant
  const selectOxidant = (oxidant: SetStateAction<{ id: string; name: string; color: string; formula: string }>) => {
    setSelectedOxidant(oxidant)
    setOxidantMenu(false)
    if (oxidantAdded) {
      setOxidantAdded(false)
      setReactionComplete(false)
      setShowResult(false)
    }
  }

  // Obtenir l'équation chimique basée sur les réactifs sélectionnés
  const getChemicalEquation = () => {
    if (selectedAlcohol.id === "ethanol" && selectedOxidant.id === "dichromate") {
      return (
        <>
          <p className="mb-2">Oxydation de l'éthanol en éthanal:</p>
          <p>CH₃CH₂OH + Cr₂O₇²⁻ + H⁺ → CH₃CHO + Cr³⁺ + H₂O</p>
          <p className="mt-3 mb-2">Oxydation complète en acide éthanoïque:</p>
          <p>CH₃CH₂OH + 2Cr₂O₇²⁻ + 8H⁺ → CH₃COOH + 4Cr³⁺ + 5H₂O</p>
        </>
      )
    } else if (selectedAlcohol.id === "methanol" && selectedOxidant.id === "dichromate") {
      return (
        <>
          <p className="mb-2">Oxydation du méthanol en méthanal:</p>
          <p>CH₃OH + Cr₂O₇²⁻ + H⁺ → HCHO + Cr³⁺ + H₂O</p>
          <p className="mt-3 mb-2">Oxydation complète en acide formique:</p>
          <p>CH₃OH + 2Cr₂O₇²⁻ + 8H⁺ → HCOOH + 4Cr³⁺ + 5H₂O</p>
        </>
      )
    } else if (selectedOxidant.id === "dichromate") {
      return (
        <>
          <p className="mb-2">Oxydation par le dichromate de potassium:</p>
          <p>{selectedAlcohol.formula} + Cr₂O₇²⁻ + H⁺ → produit oxydé + Cr³⁺ + H₂O</p>
          <p className="mt-3 text-xs text-gray-500">Le dichromate (Cr₂O₇²⁻) orange est réduit en ions Cr³⁺ verts</p>
        </>
      )
    } else if (selectedOxidant.id === "permanganate") {
      return (
        <>
          <p className="mb-2">Oxydation par le permanganate de potassium:</p>
          <p>{selectedAlcohol.formula} + MnO₄⁻ + H⁺ → produit oxydé + Mn²⁺ + H₂O</p>
          <p className="mt-3 text-xs text-gray-500">Le permanganate (MnO₄⁻) violet est réduit en ions Mn²⁺ rose pâle</p>
        </>
      )
    } else if (selectedOxidant.id === "fehling") {
      return (
        <>
          <p className="mb-2">Test de Fehling (spécifique aux aldéhydes):</p>
          <p>R-CHO + 2Cu²⁺ + 5OH⁻ → R-COOH + Cu₂O↓ + 3H₂O</p>
          <p className="mt-3 text-xs text-gray-500">Formation d'un précipité rouge de Cu₂O avec les aldéhydes</p>
        </>
      )
    } else if (selectedOxidant.id === "tollens") {
      return (
        <>
          <p className="mb-2">Test de Tollens (spécifique aux aldéhydes):</p>
          <p>R-CHO + 2Ag(NH₃)₂⁺ + 3OH⁻ → R-COOH + 2Ag↓ + 4NH₃ + 2H₂O</p>
          <p className="mt-3 text-xs text-gray-500">Formation d'un miroir d'argent avec les aldéhydes</p>
        </>
      )
    }

    return (
      <p>
        Réaction d'oxydation: {selectedAlcohol.formula} + {selectedOxidant.formula} → produits oxydés
      </p>
    )
  }

  // Rendu de l'animation de versement
  const renderPouring = (side: string) => {
    const isPouring = side === "left" ? pouringLeft : pouringRight
    const color = side === "left" ? selectedAlcohol.color : selectedOxidant.color

    if (!isPouring) return null

    return (
      <div className="absolute z-10 pointer-events-none">
        <div
          className={`w-2 h-40 ${color} rounded-b-sm`}
          style={{
            position: "absolute",
            top: "30px",
            left: side === "left" ? "20px" : "-20px",
            transformOrigin: "top center",
            transform: `rotate(${side === "left" ? "15deg" : "-15deg"})`,
          }}
        ></div>
        <div
          className={`w-4 h-4 ${color} rounded-full animate-bounce`}
          style={{
            position: "absolute",
            top: "70px",
            left: side === "left" ? "22px" : "-22px",
          }}
        ></div>
      </div>
    )
  }

  // Obtenir le message d'état actuel
  const getStatusMessage = () => {
    if (!alcoholAdded && !oxidantAdded) return "Cliquez sur les béchers pour verser les solutions dans le tube à essai."
    if (alcoholAdded && !oxidantAdded) return "Alcool ajouté. Ajoutez maintenant l'oxydant."
    if (!alcoholAdded && oxidantAdded) return "Oxydant ajouté. Ajoutez maintenant l'alcool."
    if (alcoholAdded && oxidantAdded && !heating) return "Solutions mélangées. Chauffez le mélange."
    if (heating) return "Chauffage en cours... Observez les changements."
    if (reactionComplete) return "Réaction terminée! La couleur a changé, indiquant l'oxydation de l'alcool."
    return ""
  }

  // Obtenir le résultat de la réaction
  const getReactionResult = () => {
    if (!reactionComplete) return null

    if (selectedOxidant.id === "dichromate") {
      if (selectedAlcohol.type === "primaire") {
        return (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat positif:</p>
            <p>L'alcool primaire ({selectedAlcohol.name}) a été oxydé en aldéhyde puis en acide carboxylique.</p>
            <p className="mt-2">
              La couleur orange du dichromate (Cr₂O₇²⁻) est devenue verte (Cr³⁺), confirmant l'oxydation.
            </p>
          </div>
        )
      } else {
        return (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat positif:</p>
            <p>L'alcool secondaire ({selectedAlcohol.name}) a été oxydé en cétone.</p>
            <p className="mt-2">
              La couleur orange du dichromate (Cr₂O₇²⁻) est devenue verte (Cr³⁺), confirmant l'oxydation.
            </p>
          </div>
        )
      }
    } else if (selectedOxidant.id === "permanganate") {
      if (selectedAlcohol.type === "primaire") {
        return (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat positif:</p>
            <p>L'alcool primaire ({selectedAlcohol.name}) a été oxydé en aldéhyde puis en acide carboxylique.</p>
            <p className="mt-2">
              La couleur violette du permanganate (MnO₄⁻) est devenue rose pâle (Mn²⁺), confirmant l'oxydation.
            </p>
          </div>
        )
      } else {
        return (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat positif:</p>
            <p>L'alcool secondaire ({selectedAlcohol.name}) a été oxydé en cétone.</p>
            <p className="mt-2">
              La couleur violette du permanganate (MnO₄⁻) est devenue rose pâle (Mn²⁺), confirmant l'oxydation.
            </p>
          </div>
        )
      }
    } else if (selectedOxidant.id === "fehling") {
      if (selectedAlcohol.type === "primaire") {
        return (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat positif:</p>
            <p>
              L'alcool primaire ({selectedAlcohol.name}) a été oxydé en aldéhyde qui a réduit la liqueur de Fehling.
            </p>
            <p className="mt-2">La formation d'un précipité rouge brique (Cu₂O) confirme la présence d'un aldéhyde.</p>
          </div>
        )
      } else {
        return (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat négatif:</p>
            <p>
              L'alcool secondaire ({selectedAlcohol.name}) s'oxyde en cétone, qui ne réagit pas avec la liqueur de
              Fehling.
            </p>
            <p className="mt-2">La solution reste bleue, indiquant l'absence d'aldéhyde.</p>
          </div>
        )
      }
    } else if (selectedOxidant.id === "tollens") {
      if (selectedAlcohol.type === "primaire") {
        return (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat positif:</p>
            <p>
              L'alcool primaire ({selectedAlcohol.name}) a été oxydé en aldéhyde qui a réduit le réactif de Tollens.
            </p>
            <p className="mt-2">
              La formation d'un miroir d'argent sur les parois du tube confirme la présence d'un aldéhyde.
            </p>
          </div>
        )
      } else {
        return (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-black">
            <p className="font-medium mb-1">Résultat négatif:</p>
            <p>
              L'alcool secondaire ({selectedAlcohol.name}) s'oxyde en cétone, qui ne réagit pas avec le réactif de
              Tollens.
            </p>
            <p className="mt-2">La solution reste incolore, indiquant l'absence d'aldéhyde.</p>
          </div>
        )
      }
    }

    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-black">
        <p>Réaction terminée. Observez le changement de couleur.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg w-full h-full relative">
      <style>{`
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) scale(1.2);
            opacity: 0;
          }
        }
        
        @keyframes pour {
          0% {
            height: 0;
          }
          100% {
            height: 100px;
          }
        }
      `}</style>

      {/* Menus de sélection en haut à gauche */}
      <div className="absolute top-4 left-4 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 z-20">
        {/* Menu des alcools */}
        <div className="relative">
          <div className="flex items-center mb-1 text-xs text-gray-300">
            <span>Alcool:</span>
          </div>
          <button
            onClick={() => setAlcoholMenu(!alcoholMenu)}
            className="flex items-center justify-between w-40 px-2 py-1.5 bg-white/10 rounded-md border border-white/20 shadow-sm text-white text-sm"
          >
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${selectedAlcohol.color}`}></div>
              <span>{selectedAlcohol.name}</span>
            </div>
            <ChevronDown size={16} />
          </button>

          {alcoholMenu && (
            <div className="absolute top-full left-0 w-full mt-1 bg-indigo-900/90 rounded-md shadow-lg z-30 border border-white/20 max-h-60 overflow-y-auto">
              {alcohols.map((alcohol) => (
                <button
                  key={alcohol.id}
                  onClick={() => selectAlcohol(alcohol)}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center text-white text-sm"
                >
                  <div className={`w-4 h-4 rounded-full mr-2 ${alcohol.color}`}></div>
                  <div>
                    <span>{alcohol.name}</span>
                    <span className="text-xs text-gray-300 block">Alcool {alcohol.type}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu des oxydants */}
        <div className="relative">
          <div className="flex items-center mb-1 text-xs text-gray-300">
            <span>Oxydant:</span>
          </div>
          <button
            onClick={() => setOxidantMenu(!oxidantMenu)}
            className="flex items-center justify-between w-40 px-2 py-1.5 bg-white/10 rounded-md border border-white/20 shadow-sm text-white text-sm"
          >
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${selectedOxidant.color}`}></div>
              <span>{selectedOxidant.name}</span>
            </div>
            <ChevronDown size={16} />
          </button>

          {oxidantMenu && (
            <div className="absolute top-full left-0 w-full mt-1 bg-indigo-900/90 rounded-md shadow-lg z-30 border border-white/20 max-h-60 overflow-y-auto">
              {oxidants.map((oxidant) => (
                <button
                  key={oxidant.id}
                  onClick={() => selectOxidant(oxidant)}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center text-white text-sm"
                >
                  <div className={`w-4 h-4 rounded-full mr-2 ${oxidant.color}`}></div>
                  {oxidant.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone des béchers et du tube à essai */}
      <div className="absolute inset-0 pt-24 pb-24">
        <div className="relative h-full w-full flex justify-center items-start">
          {/* Bécher gauche (alcool) */}
          <div
            className={`absolute left-1/4 transform -translate-x-1/2 top-10 ${alcoholAdded ? "opacity-50" : "cursor-pointer hover:scale-105 transition-transform"}`}
            onClick={pourAlcohol}
            style={{
              transform: pouringLeft ? "rotate(45deg)" : "translateX(-50%)",
              transformOrigin: "bottom right",
              transition: "transform 0.5s ease-out",
            }}
          >
            <div className="relative w-24 h-32">
              <div className="absolute bottom-0 w-full h-full border-2 border-gray-400 rounded-md overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 w-full transition-all duration-300 ${selectedAlcohol.color}`}
                  style={{ height: pouringLeft ? "40%" : "80%" }}
                ></div>
                <div className="absolute top-2 left-3 w-2 h-16 bg-white/30 rounded-full"></div>
              </div>
              {renderPouring("left")}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white/20 px-2 py-1 rounded text-white">
                {selectedAlcohol.name.split(" ")[0]}
              </div>
              {!alcoholAdded && !pouringLeft && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 bg-white/10 px-2 py-1 rounded flex items-center">
                  <Beaker size={12} className="mr-1" />
                  <span>Cliquer pour verser</span>
                </div>
              )}
            </div>
          </div>

          {/* Tube à essai au centre et plus bas */}
          <div className="relative top-2/3 -translate-y-1/2">
            {/* Support de tube à essai */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-6 bg-gray-700 rounded-md"></div>

            {/* Tube à essai */}
            <div
              ref={tubeRef}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-52 bg-white/20 backdrop-blur-sm rounded-b-full border-2 border-gray-300 overflow-hidden"
            >
              {/* Solution */}
              <div
                className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${getSolutionColor()}`}
                style={{
                  height: getSolutionHeight(),
                  boxShadow: heating ? "inset 0 0 10px rgba(255,255,255,0.5)" : "none",
                }}
              >
                {renderBubbles()}
              </div>

              {/* Reflet */}
              <div className="absolute top-5 left-3 w-4 h-40 bg-white/30 rounded-full transform rotate-12"></div>
            </div>

            {/* Bec bunsen */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-10 bg-gray-700 rounded-md relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-900"></div>
                {heating && (
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 w-10 h-14">
                    <div className="w-full h-full relative">
                      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-orange-500 to-yellow-300 rounded-t-full animate-pulse"></div>
                      <div className="absolute bottom-0 left-1/4 w-1/2 h-14 bg-gradient-to-t from-blue-500/40 to-transparent rounded-t-full animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de chauffage sous le tube à essai */}
            <button
              onClick={() => setHeating(!heating)}
              disabled={!(alcoholAdded && oxidantAdded)}
              className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-md ${
                alcoholAdded && oxidantAdded
                  ? heating
                    ? "bg-red-500 text-white"
                    : "bg-red-100 hover:bg-red-200 text-red-800"
                  : "bg-gray-600/50 text-gray-300 cursor-not-allowed"
              }`}
            >
              <Flame size={20} />
              <span>{heating ? "Arrêter" : "Chauffer"}</span>
            </button>
          </div>

          {/* Bécher droit (oxydant) */}
          <div
            className={`absolute right-1/4 transform translate-x-1/2 top-10 ${oxidantAdded ? "opacity-50" : "cursor-pointer hover:scale-105 transition-transform"}`}
            onClick={pourOxidant}
            style={{
              transform: pouringRight ? "rotate(-45deg)" : "translateX(50%)",
              transformOrigin: "bottom left",
              transition: "transform 0.5s ease-out",
            }}
          >
            <div className="relative w-24 h-32">
              <div className="absolute bottom-0 w-full h-full border-2 border-gray-400 rounded-md overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 w-full transition-all duration-300 ${selectedOxidant.color}`}
                  style={{ height: pouringRight ? "40%" : "80%" }}
                ></div>
                <div className="absolute top-2 left-3 w-2 h-16 bg-white/30 rounded-full"></div>
              </div>
              {renderPouring("right")}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white/20 px-2 py-1 rounded text-white">
                {selectedOxidant.name.split(" ")[0]}
              </div>
              {!oxidantAdded && !pouringRight && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 bg-white/10 px-2 py-1 rounded flex items-center">
                  <Beaker size={12} className="mr-1" />
                  <span>Cliquer pour verser</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de contrôle en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-indigo-900/80 rounded-b-lg shadow-md p-4 flex flex-col">
        {/* Message d'état */}
        <div className="flex items-start mb-3">
          <Info size={18} className="text-purple-300 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-white">{getStatusMessage()}</p>
        </div>

        {/* Résultat de la réaction */}
        {showResult && <div className="mb-3">{getReactionResult()}</div>}

        {/* Boutons de contrôle */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-sm"
          >
            <RotateCcw size={16} />
            <span>Réinitialiser</span>
          </button>

          <button
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-3 py-1.5 rounded-md text-sm"
          >
            <BookOpen size={16} />
            <span>{showFormula ? "Masquer" : "Afficher"} l'équation</span>
          </button>
        </div>
      </div>

      {/* Équation chimique */}
      {showFormula && (
        <div className="absolute left-0 right-0 bottom-24 mx-4 bg-indigo-900/80 p-4 rounded-lg shadow-md">
          <div className="p-3 bg-indigo-800/50 rounded-md font-mono text-sm overflow-x-auto text-white">
            {getChemicalEquation()}
          </div>
        </div>
      )}
    </div>
  )
}
