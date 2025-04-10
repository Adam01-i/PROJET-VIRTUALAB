import type { LabEquipment } from '../../types/Viewer3D/molecule-equipment';

export const labEquipment: LabEquipment[] = [
  {
    id: 'eq1',
    nom: 'Bécher',
    description: 'Récipient cylindrique gradué utilisé pour contenir, mesurer et mélanger des solutions.',
    structure: '/materiels/beaker.glb',
    category: 'equipment',
    usage: 'Mesure approximative de volumes, mélanges, chauffage de solutions',
    precautions: 'Attention à la température lors du chauffage'
  },
  {
    id: 'eq2',
    nom: 'Erlenmeyer',
    description: 'Flacon conique utilisé pour les titrages et les mélanges.',
    structure: '/materiels/erlenmeyer.glb',
    category: 'equipment',
    usage: 'Titrage, mélange de solutions, chauffage',
    precautions: 'Bien fermer lors d\'agitation'
  },
  {
    id: 'eq3',
    nom: 'Burette',
    description: 'Tube gradué utilisé pour le dosage précis de solutions.',
    structure: '/materiels/burette.glb',
    category: 'equipment',
    usage: 'Dosage précis, titrage',
    precautions: 'Vérifier l\'absence de bulles d\'air'
  },
  {
    id: 'eq4',
    nom: 'Tube à essai',
    description: 'Petit tube en verre pour tester des réactions à petite échelle.',
    structure: '/materiels/tube_a_essai.glb',
    category: 'equipment',
    usage: 'Tests préliminaires, petites réactions',
    precautions: 'Manipuler avec précaution, utiliser un support'
  }
];