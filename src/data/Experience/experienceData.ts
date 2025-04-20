import type { Experience } from '../../types/Experience/experience';

export const experienceData: Experience[] = [
  {
    id: '1',
    titre: 'Réactions d\'oxydo-réduction',
    description: 'Découvrez les transferts d\'électrons et leurs applications dans la vie quotidienne.',
    duree: '45 min',
    niveau: 'Première',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    objectifs: [
      'Comprendre le principe des réactions d\'oxydo-réduction',
      'Identifier les espèces oxydantes et réductrices',
      'Écrire les demi-équations électroniques',
      'Observer les changements de couleur caractéristiques'
    ],
    materiel: [
      'Solution de sulfate de cuivre (II) - 50mL',
      'Lame de zinc',
      'Bécher en verre - 100mL',
      'Pipette graduée',
      'Gants de protection',
      'Lunettes de sécurité'
    ],
    resultatsAttendus: [
      'Formation d\'un dépôt de cuivre métallique rouge sur la lame de zinc',
      'Décoloration progressive de la solution bleue de sulfate de cuivre',
      'Augmentation de la concentration en ions Zn2+',
      'Équation bilan : Cu2+ + Zn → Cu + Zn2+'
    ]
  },
  {
    id: '2',
    titre: 'Équilibre chimique et Le Chatelier',
    description: 'Comprendre les réactions réversibles et le principe de Le Chatelier à travers une expérience visuelle.',
    duree: '60 min',
    niveau: 'Première',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
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
    titre: 'Titrage acido-basique avec indicateur coloré',
    description: 'Réalisez un titrage acido-basique en utilisant un indicateur coloré pour déterminer le point d\'équivalence.',
    duree: '45 min',
    niveau: 'Première',
    image: 'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?auto=format&fit=crop&w=800&q=80',
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
  }
];
