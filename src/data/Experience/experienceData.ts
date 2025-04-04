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
        'Écrire les demi-équations électroniques'
      ],
      materiel: [
        'Solution de sulfate de cuivre',
        'Lame de zinc',
        'Bécher',
        'Pipette'
      ],
      resultatsAttendus: [
        'Formation d\'un dépôt de cuivre métallique sur la lame de zinc',
        'Décoloration progressive de la solution de sulfate de cuivre',
        'Augmentation de la concentration en ions Zn2+'
      ]
    },
    {
      id: '2',
      titre: 'Équilibre chimique',
      description: 'Comprendre les réactions réversibles et le principe de Le Chatelier.',
      duree: '60 min',
      niveau: 'Première',
      image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
      objectifs: [
        'Définir un équilibre chimique',
        'Comprendre le principe de Le Chatelier',
        'Étudier l\'influence des paramètres sur l\'équilibre'
      ],
      materiel: [
        'Solutions d\'acide et de base',
        'pH-mètre',
        'Burette graduée',
        'Agitateur magnétique'
      ],
      resultatsAttendus: [
        'Variation du pH en fonction de la concentration des réactifs',
        'Déplacement de l\'équilibre selon les conditions',
        'Retour à l\'équilibre après perturbation'
      ]
    }
  ];