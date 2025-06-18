import type { Experience } from '../../types/Experience/experience';

export const experienceData: Experience[] = [
  {
    id: "1",
    classe_id: "",
    titre: "Réactions d'oxydo-réduction avec le fer",
    description:
      "Explorez les réactions redox en observant l'interaction entre le fer métallique et différents sels métalliques en solution. Découvrez la série électrochimique à travers des expériences interactives.",
    duree: "35 min",
    niveau: "Première",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    simulationPath: "RedoxReaction",
    objectifs: [
      "Comprendre le principe des réactions d'oxydo-réduction",
      "Identifier les espèces oxydantes et réductrices selon la série électrochimique",
      "Observer les changements de couleur et la formation de dépôts métalliques",
      "Analyser l'influence du type de réactif sur la réaction",
      "Distinguer les réactions complètes, incomplètes et impossibles",
      "Interpréter les résultats selon les potentiels standard",
    ],
    materiel: [
      "Solution de sulfate de cuivre (II) CuSO₄ - 0,1M - 250mL",
      "Solution de nitrate d'argent AgNO₃ - 0,1M - 250mL",
      "Solution de sulfate de zinc ZnSO₄ - 0,1M - 250mL",
      "Barre de fer métallique (Fe) - 55,8 g/mol",
      "Bécher en verre gradué - 250mL avec graduations",
      "Robinet doseur avec réservoir et contrôle de débit",
      "Agitateur magnétique avec barreau",
      "Thermomètre digital",
      "pH-mètre ou papier pH",
      "Gants de protection nitrile",
      "Lunettes de sécurité",
    ],
    resultatsAttendus: [
      "Avec CuSO₄ : Formation d'un dépôt rouge-brun de cuivre métallique sur le fer",
      "Avec CuSO₄ : Changement de couleur de bleu vers vert (formation de FeSO₄)",
      "Avec CuSO₄ : Équation Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)",
      "Avec AgNO₃ : Formation d'un dépôt gris argenté d'argent métallique",
      "Avec AgNO₃ : Décoloration progressive de la solution violette",
      "Avec AgNO₃ : Équation Fe(s) + 2AgNO₃(aq) → Fe(NO₃)₂(aq) + 2Ag(s)",
      "Avec ZnSO₄ : Aucune réaction observable (fer moins réactif que le zinc)",
      "Avec ZnSO₄ : Solution reste bleue claire, pas de dépôt",
      "Mesure de l'efficacité de réaction : 85% (CuSO₄), 75% (AgNO₃), 0% (ZnSO₄)",
      "Analyse quantitative : masse de métal déposé, concentration finale",
    ]
  },
  {
    id: '2',
    classe_id: '',
    titre: 'Équilibre chimique et Le Chatelier',
    description: 'Comprendre les réactions réversibles et le principe de Le Chatelier à travers une expérience visuelle.',
    duree: '60 min',
    niveau: 'Première',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    simulationPath: '',
    objectifs: [
      'Définir un équilibre chimique',
      'Comprendre le principe de Le Chatelier',
      'Étudier l\'influence de la concentration sur l\'équilibre',
      'Observer les changements de couleur liés au déplacement d\'équilibre'
    ],
    materiel: [
      'Solution de chlorure de fer (III) - 25mL',
      'Solution de thiocyanate de potassium - 25mL',
      'Eau distillée',
      '3 tubes à essai',
      'Support pour tubes à essai',
      'Pipettes graduées'
    ],
    resultatsAttendus: [
      'Formation du complexe rouge sang [Fe(SCN)]2+',
      'Variation de l\'intensité de la couleur selon les concentrations',
      'Déplacement de l\'équilibre visible par changement de couleur',
      'Vérification expérimentale du principe de Le Chatelier'
    ]
  },
  {
    id: "3",
    classe_id: "",
    titre: "Titrage acido-basique avec indicateur coloré",
    description:
      "Réalisez un titrage acido-basique précis en utilisant différents indicateurs colorés pour déterminer le point d'équivalence. Maîtrisez les techniques de dosage et l'analyse quantitative.",
    duree: "45 min",
    niveau: "Première",
    image: "https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?auto=format&fit=crop&w=800&q=80",
    simulationPath: "TitrageAcidoBasique",
    objectifs: [
      "Comprendre le principe du titrage acido-basique",
      "Utiliser différents indicateurs colorés appropriés",
      "Déterminer précisément le point d'équivalence",
      "Calculer la concentration de la solution titrée",
      "Analyser les courbes de pH et les zones de virage",
      "Évaluer la précision et l'incertitude des mesures",
    ],
    materiel: [
      "Solutions d'acides : HCl (0,1M), CH₃COOH (0,1M), H₂SO₄ (0,05M)",
      "Solutions de bases : NaOH (0,1M), NH₄OH (0,1M), KOH (0,1M)",
      "Indicateurs : Phénolphtaléine, Bleu de bromothymol, Hélianthine",
      "Burette graduée automatique - 50mL avec robinet de précision",
      "Erlenmeyer gradué - 150mL avec agitateur magnétique",
      "Système de contrôle de débit variable (0,1-2,0 mL/s)",
      "pH-mètre numérique avec sonde",
      "Thermomètre intégré",
      "Support universel avec pince",
    ],
    resultatsAttendus: [
      "Virage net de l'indicateur au point d'équivalence",
      "Détermination précise du volume équivalent (±0,1 mL)",
      "Calcul exact de la concentration de l'acide ou de la base",
      "Courbe de pH caractéristique selon le type de titrage",
      "Reproduction des résultats avec marge d'erreur < 2%",
      "Efficacité de titrage > 95% pour les couples acide fort/base forte",
      "Analyse des zones de virage des différents indicateurs",
      "Rapport détaillé avec calculs d'incertitude",
    ],
  },
{
  id: '4',
  classe_id: '',
  titre: 'Calorimétrie : mesure d\'énergie thermique',
  description: 'Mesurez la quantité de chaleur échangée lors d\'une réaction acide-base exothermique en utilisant un calorimètre.',
  duree: '45 min',
  niveau: 'Première',
  image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  simulationPath: 'Calorimétrie',
  objectifs: [
    'Comprendre le principe de la calorimétrie et les réactions exothermiques',
    'Utiliser un calorimètre pour mesurer la variation de température',
    'Calculer l\'enthalpie de réaction avec la formule ΔH = mcΔT/n',
    'Analyser les résultats et comparer aux valeurs théoriques'
  ],
  materiel: [
    'Calorimètre isolé avec couvercle',
    'Thermomètre numérique de précision',
    'Solutions d\'acide chlorhydrique (HCl 1M)',
    'Solutions d\'hydroxyde de sodium (NaOH 1M)',
    'Béchers de 100 mL',
    'Agitateur magnétique',
    'Balance de précision'
  ],
  resultatsAttendus: [
    'Augmentation de température de 13-14°C pour HCl + NaOH',
    'Calcul de ΔH ≈ -57 kJ/mol (neutralisation)',
    'Formation de chlorure de sodium et d\'eau',
    'Validation du caractère exothermique de la réaction'
  ]
},
  {
    id: "5",
    classe_id: "",
    titre: "Oxydation des composés oxygénés",
    description:
      "Étudiez l'oxydation sélective des alcools primaires et secondaires avec différents oxydants. Observez les changements de couleur caractéristiques et identifiez les produits formés.",
    duree: "50 min",
    niveau: "Première",
    image: "https://images.unsplash.com/photo-1622489461232-e451cc7fcf3e?auto=format&fit=crop&w=800&q=80",
    simulationPath: "ComposésOxygénés",
    objectifs: [
      "Différencier les alcools primaires et secondaires par leurs réactions d'oxydation",
      "Identifier les produits : aldéhydes, cétones, acides carboxyliques",
      "Utiliser les oxydants spécifiques : dichromate K₂Cr₂O₇, permanganate KMnO₄",
      "Appliquer les tests de Fehling et Tollens pour les alcools primaires",
      "Observer et interpréter les changements de couleur spécifiques",
      "Analyser les mécanismes d'oxydation et les rendements",
    ],
    materiel: [
      "Alcools testés : Éthanol (CH₃CH₂OH), Méthanol (CH₃OH), Isopropanol ((CH₃)₂CHOH)",
      "Alcools supplémentaires : Propanol (CH₃CH₂CH₂OH), Butanol (CH₃(CH₂)₃OH)",
      "Oxydants : Dichromate de potassium K₂Cr₂O₇ + H₂SO₄",
      "Permanganate de potassium KMnO₄ en solution",
      "Réactif de Fehling (Cu²⁺ + tartrate)",
      "Réactif de Tollens (Ag(NH₃)₂⁺)",
      "Tubes à essai gradués avec support chauffant",
      "Bec Bunsen avec contrôle de température",
      "Béchers pour préparation des solutions",
      "Pipettes graduées et éprouvettes de précision",
      "Thermomètre et chronomètre intégrés",
    ],
    resultatsAttendus: [
      "Dichromate + alcools primaires : Orange → Vert (Cr⁶⁺ → Cr³⁺), formation d'aldéhyde puis acide",
      "Dichromate + alcools secondaires : Orange → Vert, formation de cétone uniquement",
      "Permanganate + alcools primaires : Violet → Rose pâle/incolore, oxydation complète",
      "Permanganate + alcools secondaires : Violet → Rose, formation de cétone",
      "Test de Fehling : Bleu → Précipité rouge brique (positif pour alcools primaires)",
      "Test de Tollens : Formation de miroir d'argent (positif pour alcools primaires)",
      "Alcools tertiaires : Aucune réaction avec tous les oxydants",
      "Rendements typiques : 85-95% (primaires), 90-98% (secondaires)",
      "Analyse quantitative des produits formés",
      "Temps de réaction : 3-8 secondes selon l'oxydant et l'alcool",
    ],
  },
  {
    id: "6",
    classe_id: "",
    titre: "Calorimétrie : capacité thermique massique de l'eau",
    description: "Déterminez la capacité thermique massique de l'eau en mesurant l'énergie nécessaire pour élever sa température. Cette expérience met en pratique les principes fondamentaux de la thermochimie.",
    duree: "40 min",
    niveau: "Première",
    image: "https://images.unsplash.com/photo-1581092918360-5d28c1ea1b72?auto=format&fit=crop&w=800&q=80",
    simulationPath: "ChaleurEau",
    objectifs: [
      "Comprendre la notion de capacité thermique massique",
      "Utiliser un calorimètre pour mesurer un transfert d'énergie thermique",
      "Calculer l'énergie absorbée par l'eau à l'aide de la formule Q = mcΔT",
      "Comparer la valeur expérimentale avec la valeur théorique (4,18 J/g·°C)"
    ],
    materiel: [
      "Calorimètre simple avec couvercle",
      "Thermomètre numérique ou sonde de température",
      "Chauffe-eau ou plaque chauffante contrôlée",
      "Eau distillée (100 mL)",
      "Balance électronique de précision",
      "Chronomètre",
      "Agitateur manuel ou magnétique"
    ],
    resultatsAttendus: [
      "Augmentation progressive de température de l'eau",
      "Calcul de Q en joules à partir des mesures prises",
      "Obtention d'une valeur proche de 4,18 J/g·°C",
      "Analyse des sources d'erreurs : pertes thermiques, mesure de masse, précision de température"
    ]
  }  
];
