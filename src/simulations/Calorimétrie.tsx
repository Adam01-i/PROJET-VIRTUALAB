"use client"

import { useState, useEffect, useRef, type TouchEvent } from "react"
import { RotateCcw, ClipboardList, LineChart, Info } from "lucide-react"
// Suppression des imports de composants shadcn UI

// Définition des solutions disponibles avec des données scientifiques précises
const SOLUTIONS = {
  // Acides
  hcl: {
    name: "Acide chlorhydrique",
    formula: "HCl",
    type: "acid",
    color: "bg-blue-200",
    concentration: 1, // mol/L
    density: 1.02, // g/mL
    molarMass: 36.46, // g/mol
  },
  h2so4: {
    name: "Acide sulfurique",
    formula: "H₂SO₄",
    type: "acid",
    color: "bg-blue-300",
    concentration: 1, // mol/L
    density: 1.07, // g/mL
    molarMass: 98.08, // g/mol
  },
  ch3cooh: {
    name: "Acide acétique",
    formula: "CH₃COOH",
    type: "acid",
    color: "bg-blue-100",
    concentration: 1, // mol/L
    density: 1.01, // g/mL
    molarMass: 60.05, // g/mol
  },

  // Bases
  naoh: {
    name: "Hydroxyde de sodium",
    formula: "NaOH",
    type: "base",
    color: "bg-green-100",
    concentration: 1, // mol/L
    density: 1.04, // g/mL
    molarMass: 40.0, // g/mol
  },
  koh: {
    name: "Hydroxyde de potassium",
    formula: "KOH",
    type: "base",
    color: "bg-green-200",
    concentration: 1, // mol/L
    density: 1.05, // g/mL
    molarMass: 56.11, // g/mol
  },
  "ca(oh)2": {
    name: "Hydroxyde de calcium",
    formula: "Ca(OH)₂",
    type: "base",
    color: "bg-green-300",
    concentration: 0.5, // mol/L (moins soluble)
    density: 1.03, // g/mL
    molarMass: 74.09, // g/mol
  },

  // Autres
  na2co3: {
    name: "Carbonate de sodium",
    formula: "Na₂CO₃",
    type: "salt",
    color: "bg-yellow-100",
    concentration: 1, // mol/L
    density: 1.05, // g/mL
    molarMass: 105.99, // g/mol
  },
}

// Définition des réactions et leurs chaleurs de réaction (valeurs expérimentales précises)
const REACTIONS = {
  "hcl-naoh": {
    name: "HCl + NaOH → NaCl + H₂O",
    heatOfReaction: -57.3, // kJ/mol (valeur expérimentale)
    ratio: 1, // 1 mol HCl : 1 mol NaOH
    products: "NaCl + H₂O",
    expectedDeltaT: 13.7, // °C pour 50mL + 50mL à 1M
  },
  "hcl-koh": {
    name: "HCl + KOH → KCl + H₂O",
    heatOfReaction: -57.6, // kJ/mol
    ratio: 1, // 1 mol HCl : 1 mol KOH
    products: "KCl + H₂O",
    expectedDeltaT: 13.8, // °C pour 50mL + 50mL à 1M
  },
  "hcl-ca(oh)2": {
    name: "2 HCl + Ca(OH)₂ → CaCl₂ + 2 H₂O",
    heatOfReaction: -118.2, // kJ/mol de Ca(OH)2
    ratio: 2, // 2 mol HCl : 1 mol Ca(OH)2
    products: "CaCl₂ + 2 H₂O",
    expectedDeltaT: 14.1, // °C pour 50mL + 50mL (avec Ca(OH)2 à 0.5M)
  },
  "h2so4-naoh": {
    name: "H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O",
    heatOfReaction: -130.2, // kJ/mol de H2SO4
    ratio: 0.5, // 1 mol H2SO4 : 2 mol NaOH
    products: "Na₂SO₄ + 2 H₂O",
    expectedDeltaT: 15.6, // °C pour 50mL + 50mL à 1M
  },
  "h2so4-koh": {
    name: "H₂SO₄ + 2 KOH → K₂SO₄ + 2 H₂O",
    heatOfReaction: -131.5, // kJ/mol de H2SO4
    ratio: 0.5, // 1 mol H2SO4 : 2 mol KOH
    products: "K₂SO₄ + 2 H₂O",
    expectedDeltaT: 15.7, // °C pour 50mL + 50mL à 1M
  },
  "h2so4-ca(oh)2": {
    name: "H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2 H₂O",
    heatOfReaction: -128.6, // kJ/mol
    ratio: 1, // 1 mol H2SO4 : 1 mol Ca(OH)2
    products: "CaSO₄↓ + 2 H₂O",
    expectedDeltaT: 15.4, // °C pour 50mL + 50mL (avec Ca(OH)2 à 0.5M)
  },
  "ch3cooh-naoh": {
    name: "CH₃COOH + NaOH → CH₃COONa + H₂O",
    heatOfReaction: -55.8, // kJ/mol
    ratio: 1, // 1 mol CH3COOH : 1 mol NaOH
    products: "CH₃COONa + H₂O",
    expectedDeltaT: 13.3, // °C pour 50mL + 50mL à 1M
  },
  "ch3cooh-koh": {
    name: "CH₃COOH + KOH → CH₃COOK + H₂O",
    heatOfReaction: -56.1, // kJ/mol
    ratio: 1, // 1 mol CH3COOH : 1 mol KOH
    products: "CH₃COOK + H₂O",
    expectedDeltaT: 13.4, // °C pour 50mL + 50mL à 1M
  },
  "hcl-na2co3": {
    name: "2 HCl + Na₂CO₃ → 2 NaCl + H₂O + CO₂",
    heatOfReaction: -63.5, // kJ/mol de Na2CO3
    ratio: 2, // 2 mol HCl : 1 mol Na2CO3
    products: "2 NaCl + H₂O + CO₂↑",
    expectedDeltaT: 7.6, // °C pour 50mL + 50mL à 1M
  },
  "h2so4-na2co3": {
    name: "H₂SO₄ + Na₂CO₃ → Na₂SO₄ + H₂O + CO₂",
    heatOfReaction: -68.7, // kJ/mol
    ratio: 1, // 1 mol H2SO4 : 1 mol Na2CO3
    products: "Na₂SO₄ + H₂O + CO₂↑",
    expectedDeltaT: 8.2, // °C pour 50mL + 50mL à 1M
  },
}

export default function CalorimetrieSimulation() {
  // États pour les différentes étapes et valeurs de l'expérience
  const [step, setStep] = useState(0)
  const [temperature, setTemperature] = useState(25.0)
  const [initialTemp, setInitialTemp] = useState(25.0)
  const [finalTemp, setFinalTemp] = useState<number | null>(null)
  const [isPouring, setIsPouring] = useState(false)
  const [pourProgress, setPourProgress] = useState(0)
  const [solution1Volume, setSolution1Volume] = useState(50) // mL
  const [solution2Volume, setSolution2Volume] = useState(50) // mL
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [stirring, setStirring] = useState(false)
  const [reactionEquation, setReactionEquation] = useState("")
  const [heatOfReaction, setHeatOfReaction] = useState(0)
  const [reactionRatio, setReactionRatio] = useState(1)
  const [expectedDeltaT, setExpectedDeltaT] = useState(0)
  const [products, setProducts] = useState("")

  // Données pour le graphique de température
  const [tempData, setTempData] = useState([{ time: 0, temp: 25.0 }])
  const [showTempGraph, setShowTempGraph] = useState(false)

  // Effet visuel de changement de température
  const [tempChangeEffect, setTempChangeEffect] = useState(false)

  // Animation de versement
  const [pouringBeaker, setPouringBeaker] = useState<string | null>(null)
  const [pouringAngle, setPouringAngle] = useState(0)
  const [streamVisible, setStreamVisible] = useState(false)

  // Sélection des solutions
  const [solution1, setSolution1] = useState<keyof typeof SOLUTIONS>("hcl")
  const [solution2, setSolution2] = useState<keyof typeof SOLUTIONS>("naoh")

  // Gestion du glisser-déposer tactile
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 })
  const calorimeter = useRef<HTMLDivElement>(null)
  const beaker1Ref = useRef(null)
  const beaker2Ref = useRef(null)

  const animationRef = useRef<number | null>(null)
  const thermometerRef = useRef(null)
  const graphRef = useRef<HTMLCanvasElement>(null)

  // Constantes pour les calculs
  const SPECIFIC_HEAT_CAPACITY = 4.18 // J/g/°C

  // Effet pour mettre à jour les informations de réaction lorsque les solutions changent
  useEffect(() => {
    const reactionKey = `${solution1}-${solution2}` as keyof typeof REACTIONS
    const reverseReactionKey = `${solution2}-${solution1}` as keyof typeof REACTIONS

    if (reactionKey in REACTIONS) {
      setReactionEquation(REACTIONS[reactionKey].name)
      setHeatOfReaction(REACTIONS[reactionKey].heatOfReaction)
      setReactionRatio(REACTIONS[reactionKey].ratio)
      setExpectedDeltaT(REACTIONS[reactionKey].expectedDeltaT)
      setProducts(REACTIONS[reactionKey].products)
    } else if (REACTIONS[reverseReactionKey]) {
      setReactionEquation(REACTIONS[reverseReactionKey].name)
      setHeatOfReaction(REACTIONS[reverseReactionKey].heatOfReaction)
      setReactionRatio(1 / REACTIONS[reverseReactionKey].ratio)
      setExpectedDeltaT(REACTIONS[reverseReactionKey].expectedDeltaT)
      setProducts(REACTIONS[reverseReactionKey].products)
    } else {
      setReactionEquation("Réaction non définie")
      setHeatOfReaction(0)
      setReactionRatio(1)
      setExpectedDeltaT(0)
      setProducts("")
    }
  }, [solution1, solution2])

  const handleTouchStart = (item: string, e: TouchEvent<HTMLDivElement>) => {
    console.log(`Touch start on ${item}, current step: ${step}, isPouring: ${isPouring}`)

    if ((item === "solution1" && step !== 0) || (item === "solution2" && step !== 1) || isPouring) {
      console.log("Touch start ignored due to conditions")
      return
    }

    const touch = e.touches[0]
    setDraggedItem(item)
    setOriginalPosition({
      x: touch.clientX,
      y: touch.clientY,
    })
    setDragPosition({
      x: 0,
      y: 0,
    })
    console.log(`Dragging started for ${item}`)
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!draggedItem) return
    e.preventDefault()

    const touch = e.touches[0]
    setDragPosition({
      x: touch.clientX - originalPosition.x,
      y: touch.clientY - originalPosition.y,
    })
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!draggedItem || !calorimeter.current) {
      console.log("Touch end ignored: no dragged item or calorimeter ref")
      return
    }

    const calorimeterRect = calorimeter.current.getBoundingClientRect()
    const touch = e.changedTouches[0]

    console.log(`Touch end at x:${touch.clientX}, y:${touch.clientY}`)
    console.log(
      `Calorimeter bounds: left:${calorimeterRect.left}, right:${calorimeterRect.right}, top:${calorimeterRect.top}, bottom:${calorimeterRect.bottom}`,
    )

    // Élargir légèrement la zone de détection pour faciliter le dépôt
    const dropPadding = 20
    const isOverCalorimeter =
      touch.clientX >= calorimeterRect.left - dropPadding &&
      touch.clientX <= calorimeterRect.right + dropPadding &&
      touch.clientY >= calorimeterRect.top - dropPadding &&
      touch.clientY <= calorimeterRect.bottom + dropPadding

    console.log(`Is over calorimeter: ${isOverCalorimeter}`)

    if (isOverCalorimeter) {
      if (draggedItem === "solution1" && step === 0) {
        console.log("Pouring solution 1")
        pourSolution1()
      } else if (draggedItem === "solution2" && step === 1) {
        console.log("Pouring solution 2")
        pourSolution2()
      }
    }

    setDraggedItem(null)
    setDragPosition({ x: 0, y: 0 })
  }

  // Réinitialiser l'expérience
  const resetExperiment = () => {
    setStep(0)
    setTemperature(25.0)
    setInitialTemp(25.0)
    setFinalTemp(null)
    setIsPouring(false)
    setPourProgress(0)
    setSolution1Volume(50)
    setSolution2Volume(50)
    setIsSimulationRunning(false)
    setShowResults(false)
    setStirring(false)
    setDraggedItem(null)
    setDragPosition({ x: 0, y: 0 })
    setTempData([{ time: 0, temp: 25.0 }])
    setShowTempGraph(false)
    setTempChangeEffect(false)
    setPouringBeaker(null)
    setPouringAngle(0)
    setStreamVisible(false)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // Animation de versement réaliste
  const animatePouringBeaker = (beakerType: string | null, callback: () => void) => {
    setPouringBeaker(beakerType)
    let angle = 0
    let volumeRemaining = beakerType === "solution1" ? solution1Volume : solution2Volume

    const animate = () => {
      // Augmenter progressivement l'angle d'inclinaison
      if (angle < 75) {
        angle += 3
        setPouringAngle(angle)
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Maintenir l'angle et commencer à diminuer le volume
        const pourInterval = setInterval(() => {
          volumeRemaining -= 2

          if (beakerType === "solution1") {
            setSolution1Volume(volumeRemaining)
          } else {
            setSolution2Volume(volumeRemaining)
          }

          setPourProgress(100 - volumeRemaining * 2)

          if (volumeRemaining <= 0) {
            clearInterval(pourInterval)

            // Animation de retour à la position normale
            let returnAngle = 75
            const returnAnimation = () => {
              if (returnAngle > 0) {
                returnAngle -= 5
                setPouringAngle(returnAngle)
                animationRef.current = requestAnimationFrame(returnAnimation)
              } else {
                setPouringBeaker(null)
                setPouringAngle(0)
                if (callback) callback()
              }
            }

            animationRef.current = requestAnimationFrame(returnAnimation)
          }
        }, 50)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  // Fonction pour verser la première solution dans le calorimètre
  const pourSolution1 = () => {
    if (step !== 0) return
    setIsPouring(true)
    setStep(1)

    animatePouringBeaker("solution1", () => {
      setIsPouring(false)
      setPourProgress(0)
    })
  }

  // Fonction pour verser la deuxième solution dans le calorimètre
  const pourSolution2 = () => {
    if (step !== 1) return
    setIsPouring(true)
    setStep(2)

    animatePouringBeaker("solution2", () => {
      setIsPouring(false)
      setPourProgress(0)
      startReaction()
    })
  }

  // Ajouter cette fonction après pourSolution2
  const handleBeakerClick = (beakerType: string) => {
    console.log(`Beaker ${beakerType} clicked, current step: ${step}`)
    if (beakerType === "solution1" && step === 0 && !isPouring) {
      pourSolution1()
    } else if (beakerType === "solution2" && step === 1 && !isPouring) {
      pourSolution2()
    }
  }

  // Démarrer la réaction chimique
  const startReaction = () => {
    setIsSimulationRunning(true)
    setStirring(true)
    setShowTempGraph(true)

    // Réinitialiser les données de température
    setTempData([{ time: 0, temp: initialTemp }])

    // Récupération des données des solutions
    const sol1 = SOLUTIONS[solution1]
    const sol2 = SOLUTIONS[solution2]

    // Calcul de l'augmentation de température basé sur la chaleur de réaction
    const totalVolume = solution1Volume + solution2Volume // mL
    const totalMass = solution1Volume * sol1.density + solution2Volume * sol2.density // g

    // Calcul des moles (en tenant compte du ratio stœchiométrique)
    const moles1 = (solution1Volume * sol1.concentration) / 1000 // moles de solution 1
    const moles2 = (solution2Volume * sol2.concentration) / 1000 // moles de solution 2

    // Détermination du réactif limitant
    const effectiveMoles1 = moles1
    const effectiveMoles2 = moles2 / reactionRatio
    const limitingReagent = Math.min(effectiveMoles1, effectiveMoles2)

    // Calcul de la chaleur libérée
    const heatReleased = limitingReagent * heatOfReaction * 1000 // J
    const deltaT = -heatReleased / (totalMass * SPECIFIC_HEAT_CAPACITY) // °C

    // Utiliser la valeur attendue pour une simulation plus précise
    // Mais ajouter une légère variation aléatoire pour simuler des conditions réelles
    const randomFactor = 0.95 + Math.random() * 0.1 // Entre 0.95 et 1.05
    const targetTemp = initialTemp + expectedDeltaT * randomFactor

    let currentTemp = initialTemp
    const startTime = Date.now()
    // Augmenter la durée pour rendre l'évolution plus visible
    const duration = 10000 // 10 secondes pour la réaction complète

    const updateTemperature = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Fonction sigmoïde pour une transition plus naturelle
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-10 * (x - 0.5)))
      const factor = sigmoid(progress)

      // Calculer la nouvelle température
      const newTemp = initialTemp + (targetTemp - initialTemp) * factor
      const roundedTemp = Number.parseFloat(newTemp.toFixed(2))

      // Mettre à jour la température
      setTemperature(roundedTemp)

      // Ajouter un point au graphique toutes les 500ms
      if (elapsed % 500 < 50) {
        setTempData((prev) => [...prev, { time: elapsed / 1000, temp: roundedTemp }])
      }

      // Effet visuel de changement de température
      if (Math.abs(roundedTemp - currentTemp) > 0.5) {
        setTempChangeEffect(true)
        setTimeout(() => setTempChangeEffect(false), 300)
        currentTemp = roundedTemp
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateTemperature)
      } else {
        setFinalTemp(roundedTemp)
        setIsSimulationRunning(false)
        setStirring(false)
        setStep(3)
      }
    }

    animationRef.current = requestAnimationFrame(updateTemperature)
  }

  // Calculer les résultats
  const calculateResults = () => {
    if (step !== 3) return
    setShowResults(true)
    setStep(4)
  }

  // Nettoyer l'animation lors du démontage du composant
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Récupération des données des solutions
  const sol1 = SOLUTIONS[solution1]
  const sol2 = SOLUTIONS[solution2]

  // Calculer les résultats scientifiques
  const totalVolume = 100 // mL (volume total après mélange)
  const totalMass = 50 * sol1.density + 50 * sol2.density // g
  const deltaT = finalTemp ? finalTemp - initialTemp : 0
  const heatReleased = totalMass * SPECIFIC_HEAT_CAPACITY * deltaT // J

  // Calcul des moles (en tenant compte du ratio stœchiométrique)
  const moles1 = (50 * sol1.concentration) / 1000 // moles de solution 1
  const moles2 = (50 * sol2.concentration) / 1000 // moles de solution 2

  // Détermination du réactif limitant
  const effectiveMoles1 = moles1
  const effectiveMoles2 = moles2 / reactionRatio
  const limitingReagent = Math.min(effectiveMoles1, effectiveMoles2)

  // Chaleur par mole du réactif limitant
  const heatPerMole = heatReleased / limitingReagent // J/mol

  // Déterminer la couleur du mélange
  const getMixColor = () => {
    if (step === 0) return "bg-transparent"
    if (step === 1) return sol1.color

    // Mélange des couleurs (simplification)
    if (step >= 2) {
      if (sol1.type === "acid" && sol2.type === "base") return "bg-blue-50" // Solution neutre
      if (sol1.type === "base" && sol2.type === "acid") return "bg-blue-50" // Solution neutre
      if (sol1.type === "acid" && sol2.type === "salt") return "bg-orange-100" // Réaction acide-sel
      if (sol1.type === "salt" && sol2.type === "acid") return "bg-orange-100" // Réaction sel-acide
      return "bg-purple-100" // Couleur par défaut pour les autres mélanges
    }

    return "bg-transparent"
  }

  // Fonction pour dessiner le graphique de température
  const drawTemperatureGraph = () => {
    if (!graphRef.current || tempData.length < 2) return

    const canvas = graphRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height)

    // Définir les marges
    const margin = { top: 10, right: 10, bottom: 20, left: 30 }
    const graphWidth = width - margin.left - margin.right
    const graphHeight = height - margin.top - margin.bottom

    // Trouver les valeurs min et max
    const timeMax = Math.max(...tempData.map((d) => d.time))
    const tempMin = Math.min(...tempData.map((d) => d.temp)) - 1
    const tempMax = Math.max(...tempData.map((d) => d.temp)) + 1

    // Fonctions d'échelle
    const xScale = (time: number) => margin.left + (time / timeMax) * graphWidth
    const yScale = (temp: number) => margin.top + graphHeight - ((temp - tempMin) / (tempMax - tempMin)) * graphHeight

    // Dessiner les axes
    ctx.beginPath()
    ctx.strokeStyle = "#888"
    ctx.lineWidth = 1

    // Axe X
    ctx.moveTo(margin.left, margin.top + graphHeight)
    ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight)

    // Axe Y
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + graphHeight)
    ctx.stroke()

    // Étiquettes des axes
    ctx.fillStyle = "#fff"
    ctx.font = "8px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Temps (s)", margin.left + graphWidth / 2, height - 5)

    ctx.save()
    ctx.translate(8, margin.top + graphHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText("Temp. (°C)", 0, 0)
    ctx.restore()

    // Graduations sur l'axe Y
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    for (let temp = Math.ceil(tempMin); temp <= Math.floor(tempMax); temp++) {
      const y = yScale(temp)
      ctx.beginPath()
      ctx.moveTo(margin.left - 5, y)
      ctx.lineTo(margin.left, y)
      ctx.stroke()
      ctx.fillText(temp.toString(), margin.left - 8, y)
    }

    // Graduations sur l'axe X
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    const timeStep = Math.ceil(timeMax / 5)
    for (let time = 0; time <= timeMax; time += timeStep) {
      const x = xScale(time)
      ctx.beginPath()
      ctx.moveTo(x, margin.top + graphHeight)
      ctx.lineTo(x, margin.top + graphHeight + 5)
      ctx.stroke()
      ctx.fillText(time.toString(), x, margin.top + graphHeight + 8)
    }

    // Dessiner la courbe de température
    ctx.beginPath()
    ctx.strokeStyle = "#e11d48"
    ctx.lineWidth = 2
    ctx.moveTo(xScale(tempData[0].time), yScale(tempData[0].temp))

    for (let i = 1; i < tempData.length; i++) {
      ctx.lineTo(xScale(tempData[i].time), yScale(tempData[i].temp))
    }

    ctx.stroke()

    // Dessiner les points
    tempData.forEach((point, i) => {
      if (i % 3 === 0) {
        // Réduire le nombre de points pour plus de clarté
        ctx.beginPath()
        ctx.fillStyle = "#e11d48"
        ctx.arc(xScale(point.time), yScale(point.temp), 2, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  // Mettre à jour le graphique lorsque les données changent
  useEffect(() => {
    if (showTempGraph) {
      drawTemperatureGraph()
    }
  }, [tempData, showTempGraph])

  // Calculer l'erreur relative entre la valeur mesurée et la valeur théorique
  const calculateError = () => {
    if (!finalTemp || expectedDeltaT === 0) return 0
    const measuredDeltaT = finalTemp - initialTemp
    return Math.abs((measuredDeltaT - expectedDeltaT) / expectedDeltaT) * 100
  }

  // Obtenir la précision des résultats
  const getAccuracy = () => {
    const error = calculateError()
    if (error < 3) return "Excellente"
    if (error < 7) return "Bonne"
    if (error < 15) return "Acceptable"
    return "Faible"
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Zone principale de l'expérience avec tout intégré */}
        <div
          className="relative w-full h-full bg-transparent rounded-lg overflow-hidden"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Sélection des solutions - positionnée en haut à gauche, taille réduite */}
          <div className="absolute top-2 left-2 w-[200px] z-10 bg-white/40 p-3 rounded-lg shadow-sm border border-white/30">
            <h2 className="text-sm font-semibold mb-1 text-gray-900">Solutions</h2>
            <div className="space-y-1">
              <div>
                <label className="block text-xs font-medium text-gray-900">Solution 1:</label>
                {/* Remplacement du composant Select par un select HTML standard */}
                <select
                  value={solution1}
                  onChange={(e) => {
                    if (step === 0) setSolution1(e.target.value as keyof typeof SOLUTIONS)
                  }}
                  disabled={step !== 0}
                  className="w-full h-6 text-xs bg-white/10 text-purple-100 border border-white/20 rounded px-2"
                >
                  <option value="hcl">HCl (Acide chlorhydrique)</option>
                  <option value="h2so4">H₂SO₄ (Acide sulfurique)</option>
                  <option value="ch3cooh">CH₃COOH (Acide acétique)</option>
                  <option value="na2co3">Na₂CO₃ (Carbonate de sodium)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900">Solution 2:</label>
                {/* Remplacement du composant Select par un select HTML standard */}
                <select
                  value={solution2}
                  onChange={(e) => {
                    if (step === 0) setSolution2(e.target.value as keyof typeof SOLUTIONS)
                  }}
                  disabled={step !== 0}
                  className="w-full h-6 text-xs bg-white/10 text-purple-100 border border-white/20 rounded px-2"
                >
                  <option value="naoh">NaOH (Hydroxyde de sodium)</option>
                  <option value="koh">KOH (Hydroxyde de potassium)</option>
                  <option value="ca(oh)2">Ca(OH)₂ (Hydroxyde de calcium)</option>
                  <option value="na2co3">Na₂CO₃ (Carbonate de sodium)</option>
                </select>
              </div>
            </div>

            {/* Affichage de la réaction actuelle - version compacte */}
            <div className="mt-1 p-1 bg-indigo-900/30 rounded-md text-[10px] text-gray-900">
              <p className="font-semibold">Réaction: {reactionEquation}</p>
              <p>ΔH: {heatOfReaction} kJ/mol</p>
            </div>
          </div>

          {/* Contrôles - positionnés en haut à droite, taille réduite */}
          <div className="absolute top-2 right-2 w-[160px] z-10 bg-white/40 p-3 rounded-lg shadow-sm border border-white/30">
            <h2 className="text-sm font-semibold mb-1 text-gray-900">Contrôles</h2>
            <div className="space-y-1">
              {/* Remplacement du composant Button par un bouton HTML standard */}
              <button
                onClick={calculateResults}
                disabled={step !== 3}
                className="w-full h-6 text-[10px] flex items-center justify-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ClipboardList className="h-3 w-3" />
                Résultats
              </button>
              <button
                onClick={resetExperiment}
                className="w-full h-6 text-[10px] flex items-center justify-center gap-1 border border-white/20 text-gray-900 hover:bg-white/20 rounded"
              >
                <RotateCcw className="h-3 w-3" />
                Réinitialiser
              </button>
            </div>

            {/* Instructions dans le panneau de contrôle - version compacte */}
            <div className="mt-1 p-1 bg-indigo-900/30 text-[10px] rounded text-gray-900">
              <p className="font-semibold">Étape {step + 1}/5:</p>
              {step === 0 && <p>Glissez le 1er bécher</p>}
              {step === 1 && <p>Glissez le 2nd bécher</p>}
              {step === 2 && <p>Réaction en cours</p>}
              {step === 3 && <p>Calculez résultats</p>}
              {step === 4 && <p>Analyse terminée</p>}
            </div>
          </div>

          {/* Mesures de température - positionnées en bas à droite, taille réduite */}
          <div
            className={`absolute bottom-2 right-2 w-[160px] z-10 ${tempChangeEffect ? "bg-yellow-900/50 transition-colors duration-300" : "bg-white/40"} p-3 rounded-lg shadow-sm border border-white/30`}
          >
            <h2 className="text-sm font-semibold mb-1 flex items-center justify-between text-gray-900">
              Mesures
              {isSimulationRunning && (
                <span className="text-[8px] px-1 py-0.5 bg-red-900/50 text-red-200 rounded-full animate-pulse">
                  En cours
                </span>
              )}
            </h2>
            <div className="space-y-0.5 text-xs text-gray-900">
              <div className="flex justify-between items-center">
                <span>Temp:</span>
                <span className={`font-mono ${isSimulationRunning ? "text-red-300 font-bold" : ""}`}>
                  {temperature.toFixed(1)} °C
                </span>
              </div>
              <div className="flex justify-between">
                <span>Initiale:</span>
                <span className="font-mono">{initialTemp.toFixed(1)} °C</span>
              </div>
              {finalTemp && (
                <div className="flex justify-between">
                  <span>Finale:</span>
                  <span className="font-mono">{finalTemp.toFixed(1)} °C</span>
                </div>
              )}
              {finalTemp && (
                <div className="flex justify-between">
                  <span>ΔT:</span>
                  <span className={`font-mono ${deltaT > 0 ? "text-red-300" : "text-blue-300"}`}>
                    {deltaT.toFixed(1)} °C
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Graphique de température - en bas à gauche, taille réduite */}
          {showTempGraph && (
            <div className="absolute bottom-2 left-2 w-[200px] bg-white/40 rounded-lg p-3 shadow-sm border border-white/30">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-xs font-semibold text-gray-900">Évolution température</h3>
                <LineChart className="h-3 w-3 text-red-300" />
              </div>
              <canvas ref={graphRef} width={500} height={200} className="w-full h-24"></canvas>
            </div>
          )}

          {/* Calorimètre - centré dans la zone d'expérience */}
          {/* Calorimètre - centré dans la zone d'expérience avec design plus réaliste */}
          <div
            ref={calorimeter}
            className="absolute bottom-[80px] left-1/2 transform -translate-x-1/2 w-52 h-64"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => {
              e.preventDefault()
              const data = e.dataTransfer.getData("text/plain")
              if (data === "solution1" && step === 0) {
                pourSolution1()
              } else if (data === "solution2" && step === 1) {
                pourSolution2()
              }
            }}
          >
            <div className="relative w-full h-full">
              {/* Calorimètre extérieur - aspect métallique */}
              <div className="absolute bottom-0 left-0 w-full h-56 rounded-b-lg rounded-t-sm overflow-hidden">
                {/* Couche externe métallique */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400/80 to-gray-600/80 border-2 border-gray-700 backdrop-blur-sm"></div>

                {/* Reflets métalliques */}
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-r from-gray-300/20 via-gray-100/40 to-gray-300/20 transform -skew-y-12"></div>
                <div className="absolute bottom-0 right-0 w-1/4 h-full bg-gradient-to-t from-gray-700/30 to-transparent"></div>

                {/* Bord supérieur */}
                <div className="absolute top-0 left-0 w-full h-3 bg-gray-800 rounded-t-sm"></div>

                {/* Poignées latérales */}
                <div className="absolute top-1/4 -left-3 w-2 h-12 bg-gray-800 rounded-l-md"></div>
                <div className="absolute top-1/4 -right-3 w-2 h-12 bg-gray-800 rounded-r-md"></div>
              </div>

              {/* Gobelet intérieur isolé */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] h-48 bg-gradient-to-br from-gray-200/70 to-gray-300/70 rounded-b-lg rounded-t-sm border border-gray-400 overflow-hidden backdrop-blur-sm">
                {/* Ombre intérieure */}
                <div className="absolute inset-0 shadow-inner"></div>

                {/* Graduations */}
                <div className="absolute left-2 top-0 h-full w-1 flex flex-col justify-between items-start">
                  <div className="relative h-full w-full">
                    {[0, 20, 40, 60, 80, 100].map((mark, i) => (
                      <div key={i} className="absolute flex items-center" style={{ bottom: `${mark}%` }}>
                        <div className="w-2 h-0.5 bg-gray-600"></div>
                        <span className="text-[7px] text-gray-600 ml-1">{mark}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Liquide dans le calorimètre */}
              <div
                className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] rounded-b-lg transition-all duration-500 ease-in-out ${getMixColor()}`}
                style={{
                  height: step === 0 ? "0" : step === 1 ? "15%" : "30%",
                  transition: "height 1s, background-color 2s",
                }}
              >
                {/* Surface du liquide avec reflet */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/30"></div>

                {/* Bulles pour l'effet de réaction */}
                {isSimulationRunning && (
                  <>
                    <div
                      className="absolute w-2 h-2 bg-white/80 rounded-full animate-bubble1"
                      style={{ left: "20%", bottom: "70%" }}
                    ></div>
                    <div
                      className="absolute w-3 h-3 bg-white/80 rounded-full animate-bubble2"
                      style={{ left: "50%", bottom: "60%" }}
                    ></div>
                    <div
                      className="absolute w-2 h-2 bg-white/80 rounded-full animate-bubble3"
                      style={{ left: "70%", bottom: "80%" }}
                    ></div>

                    {/* Bulles de CO2 pour les réactions avec carbonate */}
                    {(solution1 === "na2co3" || solution2 === "na2co3") && (
                      <>
                        <div
                          className="absolute w-3 h-3 bg-white/80 rounded-full animate-bubble4"
                          style={{ left: "30%", bottom: "50%" }}
                        ></div>
                        <div
                          className="absolute w-4 h-4 bg-white/80 rounded-full animate-bubble5"
                          style={{ left: "60%", bottom: "40%" }}
                        ></div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Thermomètre avec animation améliorée */}
              <div
                ref={thermometerRef}
                className="absolute top-0 right-4 w-6 h-40 bg-white border-2 border-gray-400 rounded-full overflow-hidden"
                style={{ transform: "translateY(20%)" }}
              >
                <div
                  className={`absolute bottom-0 left-0 w-full transition-all duration-300 ${isSimulationRunning ? "animate-pulse-subtle" : ""}`}
                  style={{
                    height: `${Math.min(100, Math.max(0, (temperature - 20) * 8))}%`,
                    background: "linear-gradient(to top, #ef4444, #f87171, #fca5a5)",
                  }}
                ></div>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between items-center p-1">
                  <span className="text-[8px] font-bold">50°C</span>
                  <span className="text-[8px] font-bold">35°C</span>
                  <span className="text-[8px] font-bold">20°C</span>
                </div>

                {/* Affichage numérique de la température sur le thermomètre */}
                <div className="absolute bottom-2 left-0 w-full text-center">
                  <span className="text-[8px] font-bold bg-white px-1 rounded">{temperature.toFixed(1)}°C</span>
                </div>
              </div>

              {/* Agitateur plus réaliste */}
              {step >= 2 && (
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2">
                  <div
                    className="w-1 h-24 bg-gradient-to-b from-gray-300 to-gray-400"
                    style={{
                      transformOrigin: "top",
                      animation: stirring ? "stir 1s infinite alternate" : "none",
                    }}
                  >
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Béchers de réactifs avec animation de versement - repositionnés pour meilleure visibilité */}

          <div
            ref={beaker1Ref}
            className={`absolute top-[250px] left-[100px] w-24 h-32 cursor-grab ${isPouring && step === 1 ? "opacity-50" : ""} ${draggedItem === "solution1" ? "z-50" : ""} group`}
            draggable={step === 0 && !isPouring}
            onClick={() => handleBeakerClick("solution1")}
            onDragStart={(e) => {
              if (step !== 0 || isPouring) return
              e.dataTransfer.setData("text/plain", "solution1")
              e.dataTransfer.effectAllowed = "move"
            }}
            onTouchStart={(e) => handleTouchStart("solution1", e)}
            style={{
              touchAction: "none",
              transform:
                draggedItem === "solution1"
                  ? `translate(${dragPosition.x}px, ${dragPosition.y}px)`
                  : pouringBeaker === "solution1"
                    ? `rotate(${pouringAngle}deg) translate(40px, 20px)`
                    : "none",
              transformOrigin: "bottom right",
              transition: draggedItem === "solution1" ? "none" : "transform 0.3s ease-out",
            }}
          >
            {/* Info bulle simple */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {sol1.name}
            </div>

            <div className="relative w-full h-full">
              {/* Bécher avec effet de verre */}
              <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden">
                {/* Corps du bécher */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-gray-300/50 backdrop-blur-sm border border-gray-400 rounded-sm"></div>

                {/* Reflets de verre */}
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-r from-white/30 via-white/50 to-white/30"></div>
                <div className="absolute bottom-0 right-0 w-1/4 h-full bg-gradient-to-t from-gray-400/20 to-transparent"></div>

                {/* Bec verseur */}
                <div className="absolute top-0 right-2 w-4 h-2 bg-gradient-to-br from-gray-200/80 to-gray-300/80 border-r border-t border-gray-400 rounded-tr-sm"></div>

                {/* Graduations */}
                <div className="absolute left-2 top-0 h-full w-1 flex flex-col justify-between items-start">
                  <div className="relative h-full w-full">
                    {[0, 10, 20, 30, 40, 50].map((mark, i) => (
                      <div key={i} className="absolute flex items-center" style={{ bottom: `${mark * 2}%` }}>
                        <div className="w-2 h-0.5 bg-gray-600/70"></div>
                        <span className="text-[6px] text-gray-600/90 ml-0.5">{mark}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Liquide dans le bécher avec effet de ménisque */}
              <div
                className={`absolute bottom-0 left-0 w-full transition-height duration-500 ${sol1.color}`}
                style={{ height: `${(solution1Volume / 50) * 70}%` }}
              >
                {/* Surface du liquide avec ménisque */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/30 rounded-[100%]"></div>
              </div>

              <div className="absolute top-0 left-0 w-full text-center text-xs font-semibold text-gray-700 bg-white/40 backdrop-blur-sm rounded-t-sm">
                {sol1.formula} {sol1.concentration}M
              </div>

              {step === 0 && !isPouring && (
                <div className="absolute -bottom-6 left-0 w-full text-center text-xs text-purple-300 bg-indigo-700/50 p-1 rounded animate-pulse">
                  Cliquez ou glissez pour verser
                </div>
              )}

              {/* Effet de flux lors du versement */}
              {pouringBeaker === "solution1" && pouringAngle > 45 && (
                <div className="absolute -top-1 right-0 w-1 h-0 overflow-visible">
                  <div
                    className={`w-2 ${sol1.color} animate-flow rounded-b-sm`}
                    style={{
                      height: "70px",
                      transformOrigin: "top",
                      transform: `rotate(${90 - pouringAngle}deg)`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div
            ref={beaker2Ref}
            className={`absolute top-[250px] right-[100px] w-24 h-32 cursor-grab ${isPouring && step === 2 ? "opacity-50" : ""} ${draggedItem === "solution2" ? "z-50" : ""} group`}
            draggable={step === 1 && !isPouring}
            onClick={() => handleBeakerClick("solution2")}
            onDragStart={(e) => {
              if (step !== 1 || isPouring) return
              e.dataTransfer.setData("text/plain", "solution2")
              e.dataTransfer.effectAllowed = "move"
            }}
            onTouchStart={(e) => handleTouchStart("solution2", e)}
            style={{
              touchAction: "none",
              transform:
                draggedItem === "solution2"
                  ? `translate(${dragPosition.x}px, ${dragPosition.y}px)`
                  : pouringBeaker === "solution2"
                    ? `rotate(-${pouringAngle}deg) translate(-40px, 20px)`
                    : "none",
              transformOrigin: "bottom left",
              transition: draggedItem === "solution2" ? "none" : "transform 0.3s ease-out",
            }}
          >
            {/* Info bulle simple */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {sol2.name}
            </div>

            <div className="relative w-full h-full">
              {/* Bécher avec effet de verre */}
              <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden">
                {/* Corps du bécher */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-gray-300/50 backdrop-blur-sm border border-gray-400 rounded-sm"></div>

                {/* Reflets de verre */}
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-r from-white/30 via-white/50 to-white/30"></div>
                <div className="absolute bottom-0 right-0 w-1/4 h-full bg-gradient-to-t from-gray-400/20 to-transparent"></div>

                {/* Bec verseur */}
                <div className="absolute top-0 left-2 w-4 h-2 bg-gradient-to-br from-gray-200/80 to-gray-300/80 border-l border-t border-gray-400 rounded-tl-sm"></div>

                {/* Graduations */}
                <div className="absolute right-2 top-0 h-full w-1 flex flex-col justify-between items-end">
                  <div className="relative h-full w-full">
                    {[0, 10, 20, 30, 40, 50].map((mark, i) => (
                      <div key={i} className="absolute flex items-center" style={{ bottom: `${mark * 2}%` }}>
                        <span className="text-[6px] text-gray-600/90 mr-0.5">{mark}</span>
                        <div className="w-2 h-0.5 bg-gray-600/70"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Liquide dans le bécher avec effet de ménisque */}
              <div
                className={`absolute bottom-0 left-0 w-full transition-height duration-500 ${sol2.color}`}
                style={{ height: `${(solution2Volume / 50) * 70}%` }}
              >
                {/* Surface du liquide avec ménisque */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/30 rounded-[100%]"></div>
              </div>

              <div className="absolute top-0 left-0 w-full text-center text-xs font-semibold text-gray-700 bg-white/40 backdrop-blur-sm rounded-t-sm">
                {sol2.formula} {sol2.concentration}M
              </div>

              {step === 1 && !isPouring && (
                <div className="absolute -bottom-6 left-0 w-full text-center text-xs text-purple-300 bg-indigo-700/50 p-1 rounded animate-pulse">
                  Cliquez ou glissez pour verser
                </div>
              )}

              {/* Effet de flux lors du versement */}
              {pouringBeaker === "solution2" && pouringAngle > 45 && (
                <div className="absolute -top-1 left-0 w-1 h-0 overflow-visible">
                  <div
                    className={`w-2 ${sol2.color} animate-flow rounded-b-sm`}
                    style={{
                      height: "70px",
                      transformOrigin: "top",
                      transform: `rotate(-${90 - pouringAngle}deg)`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Résultats et calculs - modal qui apparaît au centre */}
          {showResults && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-indigo-900/90 rounded-lg p-4 max-w-xl max-h-[500px] overflow-y-auto border border-purple-500/30">
                <h2 className="text-xl font-bold mb-4 text-white">Résultats de l'expérience</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-800/50 p-3 rounded-lg">
                    <h3 className="text-base font-semibold mb-2 text-purple-200">Données mesurées</h3>
                    <ul className="space-y-1 text-sm text-purple-200">
                      <li>
                        <span className="font-semibold">Solution 1:</span> {sol1.name} ({sol1.formula})
                      </li>
                      <li>
                        <span className="font-semibold">Solution 2:</span> {sol2.name} ({sol2.formula})
                      </li>
                      <li>
                        <span className="font-semibold">Volume total:</span> {totalVolume} mL
                      </li>
                      <li>
                        <span className="font-semibold">Masse du mélange:</span> {totalMass.toFixed(2)} g
                      </li>
                      <li>
                        <span className="font-semibold">Température initiale:</span> {initialTemp.toFixed(2)} °C
                      </li>
                      <li>
                        <span className="font-semibold">Température finale:</span> {(finalTemp ?? 0).toFixed(2)} °C
                      </li>
                      <li>
                        <span className="font-semibold">Variation de température (ΔT):</span> {deltaT.toFixed(2)} °C
                      </li>
                    </ul>
                  </div>

                  <div className="bg-indigo-800/50 p-3 rounded-lg">
                    <h3 className="text-base font-semibold mb-2 text-purple-200">Calculs</h3>
                    <div className="space-y-2 text-sm text-purple-200">
                      <div>
                        <p className="font-semibold">Chaleur dégagée (Q):</p>
                        <p className="ml-2">Q = m × c × ΔT</p>
                        <p className="ml-2">
                          Q = {totalMass.toFixed(2)} g × 4,18 J/(g·°C) × {deltaT.toFixed(2)} °C
                        </p>
                        <p className="ml-2">Q = {heatReleased.toFixed(2)} J</p>
                      </div>

                      <div>
                        <p className="font-semibold">Nombre de moles:</p>
                        <p className="ml-2">
                          n₁ = {moles1.toFixed(3)} mol de {sol1.formula}
                        </p>
                        <p className="ml-2">
                          n₂ = {moles2.toFixed(3)} mol de {sol2.formula}
                        </p>
                        <p className="ml-2">Réactif limitant: {limitingReagent.toFixed(3)} mol</p>
                      </div>

                      <div>
                        <p className="font-semibold">Chaleur molaire de réaction:</p>
                        <p className="ml-2">ΔH = Q / n</p>
                        <p className="ml-2">
                          ΔH = {heatReleased.toFixed(2)} J / {limitingReagent.toFixed(3)} mol
                        </p>
                        <p className="ml-2">ΔH = {heatPerMole.toFixed(2)} J/mol</p>
                        <p className="ml-2">ΔH = {(heatPerMole / 1000).toFixed(2)} kJ/mol</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-800/50 rounded-lg">
                  <h3 className="text-base font-semibold mb-2 text-purple-200">Conclusion</h3>
                  <p className="text-sm text-purple-200">
                    La réaction entre {sol1.formula} et {sol2.formula}{" "}
                    {deltaT > 0 ? "est endothermique" : "est exothermique"},{deltaT > 0 ? " absorbant" : " libérant"}{" "}
                    environ {Math.abs(Number((heatPerMole / 1000).toFixed(2)))} kJ/mol de chaleur.
                  </p>
                  <p className="mt-1 text-sm text-purple-200">Équation de la réaction: {reactionEquation}</p>
                  <p className="mt-1 text-sm text-purple-200">Produits formés: {products}</p>

                  {/* Précision des résultats */}
                  <div className="mt-3 p-2 bg-indigo-700/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-300 mt-0.5" />
                      <div className="text-sm text-purple-200">
                        <p className="font-semibold">Analyse des résultats:</p>
                        <p>Valeur théorique attendue: {Math.abs(heatOfReaction)} kJ/mol</p>
                        <p>Valeur mesurée: {Math.abs(Number((heatPerMole / 1000).toFixed(2)))} kJ/mol</p>
                        <p>Écart relatif: {calculateError().toFixed(1)}%</p>
                        <p>
                          <span className="font-semibold">Précision de la mesure: </span>
                          <span
                            className={`${
                              getAccuracy() === "Excellente"
                                ? "text-green-400"
                                : getAccuracy() === "Bonne"
                                  ? "text-blue-400"
                                  : getAccuracy() === "Acceptable"
                                    ? "text-amber-400"
                                    : "text-red-400"
                            } font-semibold`}
                          >
                            {getAccuracy()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observations spécifiques selon les réactions */}
                  {(solution1 === "na2co3" || solution2 === "na2co3") &&
                    (solution1 === "hcl" || solution2 === "hcl" || solution1 === "h2so4" || solution2 === "h2so4") && (
                      <p className="mt-2 text-sm text-purple-200">
                        <span className="font-semibold">Observation:</span> Des bulles de CO₂ se forment pendant la
                        réaction, indiquant la décomposition de l'acide carbonique formé.
                      </p>
                    )}

                  {((solution1 === "h2so4" && solution2 === "ca(oh)2") ||
                    (solution1 === "ca(oh)2" && solution2 === "h2so4")) && (
                    <p className="mt-2 text-sm text-purple-200">
                      <span className="font-semibold">Observation:</span> Un précipité blanc de sulfate de calcium
                      (CaSO₄) se forme pendant la réaction.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowResults(false)}
                    className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes stir {
          0% { transform: translateX(-1.5rem) rotate(-5deg); }
          100% { transform: translateX(1.5rem) rotate(5deg); }
        }
        
        @keyframes bubble1 {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-20px) scale(1.5); opacity: 0; }
        }
        
        @keyframes bubble2 {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-30px) scale(2); opacity: 0; }
        }
        
        @keyframes bubble3 {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-25px) scale(1.2); opacity: 0; }
        }
        
        @keyframes bubble4 {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translateY(-35px) scale(1.8); opacity: 0; }
        }
        
        @keyframes bubble5 {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          40% { opacity: 0.8; }
          100% { transform: translateY(-40px) scale(2.2); opacity: 0; }
        }
        
        @keyframes pulse-subtle {
          0% { opacity: 0.9; }
          50% { opacity: 1; }
          100% { opacity: 0.9; }
        }
        
        @keyframes flow {
          0% { opacity: 0.7; height: 70px; }
          50% { opacity: 0.9; height: 85px; }
          100% { opacity: 0.7; height: 75px; }
        }
        
        .transition-height {
          transition: height 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
