import type { Experience } from '../../types/Experience/experience';

export const experienceData: Experience[] = [
{
  id: '1',
  classe_id: '',
  titre: 'Réactions d\'oxydo-réduction avec le fer',
  description: 'Explorez les réactions redox en observant l\'interaction entre le fer métallique et différents sels métalliques en solution.',
  duree: '30 min',
  niveau: 'Première',
  image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
  simulationPath: 'RedoxReaction',
  objectifs: [
    'Comprendre le principe des réactions d\'oxydo-réduction',
    'Identifier les espèces oxydantes et réductrices selon la série électrochimique',
    'Observer les changements de couleur et la formation de dépôts métalliques',
    'Analyser l\'influence du type de réactif sur la réaction',
    'Distinguer les réactions complètes, incomplètes et impossibles'
  ],
  materiel: [
    'Solution de sulfate de cuivre (II) CuSO₄ - 0,1M - 250mL',
    'Solution de nitrate d\'argent AgNO₃ - 0,1M - 250mL', 
    'Solution de sulfate de zinc ZnSO₄ - 0,1M - 250mL',
    'Barre de fer métallique',
    'Bécher en verre gradué - 250mL',
    'Robinet doseur avec réservoir',
    'Gants de protection',
    'Lunettes de sécurité'
  ],
  resultatsAttendus: [
    'Avec CuSO₄ : Formation d\'un dépôt rouge-brun de cuivre métallique sur le fer',
    'Avec CuSO₄ : Changement de couleur de bleu vers vert (formation de FeSO₄)',
    'Avec AgNO₃ : Formation d\'un dépôt gris argenté d\'argent métallique',
    'Avec AgNO₃ : Décoloration de la solution violette',
    'Avec ZnSO₄ : Aucune réaction observable (fer moins réactif que le zinc)',
    'Équations : Fe + CuSO₄ → FeSO₄ + Cu | Fe + 2AgNO₃ → Fe(NO₃)₂ + 2Ag | Fe + ZnSO₄ → Pas de réaction'
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
    id: '3',
    classe_id: '',
    titre: 'Titrage acido-basique avec indicateur coloré',
    description: 'Réalisez un titrage acido-basique en utilisant un indicateur coloré pour déterminer le point d\'équivalence.',
    duree: '45 min',
    niveau: 'Première',
    image: 'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?auto=format&fit=crop&w=800&q=80',
    simulationPath: 'TitrageAcidoBasique',
    objectifs: [
      'Comprendre le principe du titrage',
      'Utiliser un indicateur coloré approprié',
      'Déterminer le point d\'équivalence',
      'Calculer la concentration de la solution titrée'
    ],
    materiel: [
      'Solution d\'acide chlorhydrique à titrer',
      'Solution d\'hydroxyde de sodium titrante',
      'Phénolphtaléine',
      'Burette graduée de 25mL',
      'Erlenmeyer de 100mL',
      'Pipette jaugée de 10mL'
    ],
    resultatsAttendus: [
      'Virage de l\'indicateur au point d\'équivalence',
      'Détermination précise du volume équivalent',
      'Calcul de la concentration de l\'acide',
      'Reproduction des résultats avec une marge d\'erreur acceptable'
    ]
  },
  {
  id: '4',
  classe_id: '',
  titre: 'Calorimétrie : mesure d\'énergie thermique',
  description: 'Mesurez la quantité de chaleur échangée lors d\'une réaction chimique ou d\'un changement d\'état.',
  duree: '45 min',
  niveau: 'Première',
  image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  simulationPath: 'Calorimétrie',
  objectifs: [
    'Comprendre le principe de la calorimétrie',
    'Utiliser un calorimètre pour mesurer une variation d\'énergie thermique',
    'Calculer la quantité de chaleur échangée à l\'aide de la formule Q = mcΔT',
    'Analyser les erreurs expérimentales potentielles'
  ],
  materiel: [
    'Calorimètre en plastique isolé',
    'Thermomètre numérique',
    'Bécher de 100 mL',
    'Eau chaude et eau froide',
    'Balance de précision',
    'Agitateur',
    'Chronomètre'
  ],
  resultatsAttendus: [
    'Changement mesurable de température après mélange',
    'Calcul de la quantité de chaleur échangée (Q)',
    'Validation expérimentale de la conservation de l\'énergie',
    'Compréhension du rôle de la capacité thermique massique'
  ]
},
{
  id: '5',
  classe_id: '',
  titre: 'Oxydation des composés oxygénés',
  description: 'Étudiez l\'oxydation des alcools primaires et secondaires en laboratoire, et observez les produits formés.',
  duree: '50 min',
  niveau: 'Première',
  image: 'https://images.unsplash.com/photo-1622489461232-e451cc7fcf3e?auto=format&fit=crop&w=800&q=80',
  simulationPath: 'Comoséoxygéné',
  objectifs: [
    'Différencier un alcool primaire, secondaire et tertiaire',
    'Identifier les produits d\'oxydation d\'un alcool',
    'Utiliser un oxydant adapté (dichromate, liqueur de Fehling...)',
    'Observer les changements de couleur ou de précipité'
  ],
  materiel: [
    'Alcool éthylique (éthanol)',
    'Alcool secondaire (ex. propan-2-ol)',
    'Réactif de Fehling ou liqueur de Tollens',
    'Bec Bunsen ou plaque chauffante',
    'Tube à essai, éprouvette',
    'Support et pinces'
  ],
  resultatsAttendus: [
    'Changement de couleur du réactif oxydant',
    'Apparition d\'un précipité (argent ou oxyde de cuivre)',
    'Oxydation de l\'éthanol en acide éthanoïque',
    'Oxydation d\'un alcool secondaire en cétone',
    'Aucun changement avec un alcool tertiaire'
  ]
}
];
