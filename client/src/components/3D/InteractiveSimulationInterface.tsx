"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D,
  Eye,
  Settings,
  Thermometer,
  Timer,
  Beaker,
  Calculator,
  Camera,
  Volume2,
  VolumeX,
  Lightbulb,
  Info,
  BookOpen,
  Award,
  Target,
  Layers,
  Sliders
} from "lucide-react"

interface InteractiveToolProps {
  icon: React.ReactNode
  label: string
  description: string
  active?: boolean
  onClick?: () => void
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  unit?: string
}

// Composant pour un outil interactif
function InteractiveTool({ 
  icon, 
  label, 
  description, 
  active, 
  onClick, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  unit = "" 
}: InteractiveToolProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <div
        className={`
          flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-200
          ${active 
            ? 'bg-indigo-100 border-2 border-indigo-500 shadow-lg' 
            : 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md'
          }
        `}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`mb-2 ${active ? 'text-indigo-600' : 'text-gray-600'}`}>
          {icon}
        </div>
        <span className={`text-xs font-medium ${active ? 'text-indigo-800' : 'text-gray-700'}`}>
          {label}
        </span>
        
        {value !== undefined && onChange && (
          <div className="mt-2 w-full">
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-center mt-1 text-gray-500">
              {value}{unit}
            </div>
          </div>
        )}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {description}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  )
}

// Panneau de contrôle principal
function ControlPanel({ 
  isPlaying, 
  onPlayPause, 
  onReset,
  temperature,
  onTemperatureChange,
  volume,
  onVolumeChange,
  time,
  onTimeChange 
}: {
  isPlaying: boolean
  onPlayPause: () => void
  onReset: () => void
  temperature: number
  onTemperatureChange: (value: number) => void
  volume: number
  onVolumeChange: (value: number) => void
  time: number
  onTimeChange: (value: number) => void
}) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Settings size={18} />
        Contrôles de Simulation
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        <InteractiveTool
          icon={isPlaying ? <Pause size={18} /> : <Play size={18} />}
          label={isPlaying ? "Pause" : "Démarrer"}
          description="Contrôler la simulation"
          active={isPlaying}
          onClick={onPlayPause}
        />
        
        <InteractiveTool
          icon={<RotateCcw size={18} />}
          label="Reset"
          description="Remettre à zéro"
          onClick={onReset}
        />
        
        <InteractiveTool
          icon={<Thermometer size={18} />}
          label="Température"
          description="Ajuster la température"
          value={temperature}
          onChange={onTemperatureChange}
          min={0}
          max={100}
          unit="°C"
        />
        
        <InteractiveTool
          icon={<Beaker size={18} />}
          label="Volume"
          description="Contrôler le volume"
          value={volume}
          onChange={onVolumeChange}
          min={0}
          max={500}
          unit="mL"
        />
        
        <InteractiveTool
          icon={<Timer size={18} />}
          label="Temps"
          description="Vitesse de simulation"
          value={time}
          onChange={onTimeChange}
          min={1}
          max={10}
          unit="x"
        />
      </div>
    </div>
  )
}

// Outils de visualisation
function VisualizationTools({ 
  activeView, 
  onViewChange,
  showLabels,
  onToggleLabels,
  lighting,
  onLightingChange 
}: {
  activeView: string
  onViewChange: (view: string) => void
  showLabels: boolean
  onToggleLabels: () => void
  lighting: number
  onLightingChange: (value: number) => void
}) {
  const views = [
    { id: 'normal', label: 'Normal', icon: <Eye size={18} /> },
    { id: 'molecular', label: 'Moléculaire', icon: <Target size={18} /> },
    { id: 'xray', label: 'Rayons X', icon: <Layers size={18} /> }
  ]

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Eye size={18} />
        Outils de Visualisation
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {views.map((view) => (
          <InteractiveTool
            key={view.id}
            icon={view.icon}
            label={view.label}
            description={`Basculer vers la vue ${view.label.toLowerCase()}`}
            active={activeView === view.id}
            onClick={() => onViewChange(view.id)}
          />
        ))}
        
        <InteractiveTool
          icon={<Info size={18} />}
          label="Étiquettes"
          description="Afficher/masquer les étiquettes"
          active={showLabels}
          onClick={onToggleLabels}
        />
        
        <InteractiveTool
          icon={<Lightbulb size={18} />}
          label="Éclairage"
          description="Contrôler l'éclairage"
          value={lighting}
          onChange={onLightingChange}
          min={0}
          max={100}
          unit="%"
        />
      </div>
    </div>
  )
}

// Outils de mesure et d'analyse
function MeasurementTools({ 
  onMeasure,
  onCalculate,
  onAnalyze,
  onCapture 
}: {
  onMeasure: () => void
  onCalculate: () => void
  onAnalyze: () => void
  onCapture: () => void
}) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Calculator size={18} />
        Outils d'Analyse
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <InteractiveTool
          icon={<Calculator size={18} />}
          label="Calculer"
          description="Effectuer des calculs"
          onClick={onCalculate}
        />
        
        <InteractiveTool
          icon={<Target size={18} />}
          label="Mesurer"
          description="Prendre des mesures"
          onClick={onMeasure}
        />
        
        <InteractiveTool
          icon={<BookOpen size={18} />}
          label="Analyser"
          description="Analyser les résultats"
          onClick={onAnalyze}
        />
        
        <InteractiveTool
          icon={<Camera size={18} />}
          label="Capturer"
          description="Prendre une capture d'écran"
          onClick={onCapture}
        />
      </div>
    </div>
  )
}

// Panneau de progression et objectifs
function ProgressPanel({ 
  progress, 
  objectives,
  completedObjectives 
}: {
  progress: number
  objectives: string[]
  completedObjectives: string[]
}) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Award size={18} />
        Progression & Objectifs
      </h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progression</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              completedObjectives.includes(objective)
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300'
            }`}>
              {completedObjectives.includes(objective) && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <span className={`text-sm ${
              completedObjectives.includes(objective) 
                ? 'text-green-700 line-through' 
                : 'text-gray-700'
            }`}>
              {objective}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Interface principale
export default function InteractiveSimulationInterface({
  children,
  onStateChange
}: {
  children?: React.ReactNode
  onStateChange?: (state: any) => void
}) {
  // États pour tous les contrôles
  const [isPlaying, setIsPlaying] = useState(false)
  const [temperature, setTemperature] = useState(25)
  const [volume, setVolume] = useState(100)
  const [time, setTime] = useState(1)
  const [activeView, setActiveView] = useState('normal')
  const [showLabels, setShowLabels] = useState(true)
  const [lighting, setLighting] = useState(75)
  const [progress, setProgress] = useState(15)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Objectifs de l'expérience
  const objectives = [
    "Observer la réaction chimique",
    "Mesurer la température",
    "Calculer les concentrations",
    "Analyser les résultats",
    "Comprendre le mécanisme"
  ]
  
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([
    "Observer la réaction chimique"
  ])

  // Gestionnaires d'événements
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (onStateChange) {
      onStateChange({ isPlaying: !isPlaying })
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setTemperature(25)
    setVolume(100)
    setTime(1)
    setProgress(0)
    setCompletedObjectives([])
    if (onStateChange) {
      onStateChange({ reset: true })
    }
  }

  const handleMeasure = () => {
    console.log("Outil de mesure activé")
    if (!completedObjectives.includes("Mesurer la température")) {
      setCompletedObjectives([...completedObjectives, "Mesurer la température"])
      setProgress(Math.min(progress + 20, 100))
    }
  }

  const handleCalculate = () => {
    console.log("Calculatrice activée")
    if (!completedObjectives.includes("Calculer les concentrations")) {
      setCompletedObjectives([...completedObjectives, "Calculer les concentrations"])
      setProgress(Math.min(progress + 20, 100))
    }
  }

  const handleAnalyze = () => {
    console.log("Outil d'analyse activé")
    if (!completedObjectives.includes("Analyser les résultats")) {
      setCompletedObjectives([...completedObjectives, "Analyser les résultats"])
      setProgress(Math.min(progress + 20, 100))
    }
  }

  const handleCapture = () => {
    console.log("Capture d'écran effectuée")
    // Simule une capture d'écran
    alert("📸 Capture d'écran sauvegardée !")
  }

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isPlaying,
        temperature,
        volume,
        time,
        activeView,
        showLabels,
        lighting,
        progress,
        completedObjectives
      })
    }
  }, [isPlaying, temperature, volume, time, activeView, showLabels, lighting, progress, completedObjectives, onStateChange])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Contenu principal (simulation 3D) */}
      <div className="w-full h-full pointer-events-auto">
        {children}
      </div>

      {/* Interface utilisateur en overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Panneau de contrôle principal - En haut à gauche */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <ControlPanel
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            volume={volume}
            onVolumeChange={setVolume}
            time={time}
            onTimeChange={setTime}
          />
        </div>

        {/* Outils de visualisation - En haut à droite */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <VisualizationTools
            activeView={activeView}
            onViewChange={setActiveView}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(!showLabels)}
            lighting={lighting}
            onLightingChange={setLighting}
          />
        </div>

        {/* Outils de mesure - En bas à gauche */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <MeasurementTools
            onMeasure={handleMeasure}
            onCalculate={handleCalculate}
            onAnalyze={handleAnalyze}
            onCapture={handleCapture}
          />
        </div>

        {/* Panneau de progression - En bas à droite */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <ProgressPanel
            progress={progress}
            objectives={objectives}
            completedObjectives={completedObjectives}
          />
        </div>

        {/* Contrôles audio - Coin supérieur droit */}
        <div className="absolute top-4 right-80 pointer-events-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border hover:bg-gray-50 transition-colors"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* Indicateur de mode d'interaction - Centre bas */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <div className="flex items-center gap-2">
              <Move3D size={16} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                Mode: {activeView === 'normal' ? 'Navigation 3D' : activeView}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}