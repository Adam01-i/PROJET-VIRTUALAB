import type { LabEquipment } from '../../types/Viewer3D/molecule-equipment';

export const labEquipment: LabEquipment[] = [
  {
    id: 'eq1',
    nom: 'Bécher',
    description: 'Récipient cylindrique gradué utilisé pour contenir, mesurer et mélanger des solutions.',
    structure: 'materiels/beaker.obj',
    mtl: '/materiels/beaker/beaker.mtl',
    resourcePath: '/materiels/beaker/',
    category: 'equipment',
    usage: 'Mesure approximative de volumes, mélanges, chauffage de solutions',
    precautions: 'Attention à la température lors du chauffage'
  },
  {
    id: 'eq2',
    nom: 'Erlenmeyer',
    description: 'Flacon conique utilisé pour les titrages et les mélanges.',
    structure: '/models/erlenmeyer.obj',
    mtl: '/models/erlenmeyer.mtl',
    resourcePath: '/models/',
    category: 'equipment',
    usage: 'Titrage, mélange de solutions, chauffage',
    precautions: 'Bien fermer lors d\'agitation'
  },
  {
    id: 'eq3',
    nom: 'Burette',
    description: 'Tube gradué utilisé pour le dosage précis de solutions.',
    structure: '/models/burette.obj',
    mtl: '/models/burette.mtl',
    resourcePath: '/models/',
    category: 'equipment',
    usage: 'Dosage précis, titrage',
    precautions: 'Vérifier l\'absence de bulles d\'air'
  },
  {
    id: 'eq4',
    nom: 'Ballon à fond rond',
    description: 'Récipient sphérique utilisé pour le chauffage et les réactions chimiques.',
    structure: '/models/round_bottom_flask.obj',
    mtl: '/models/round_bottom_flask.mtl',
    resourcePath: '/models/',
    category: 'equipment',
    usage: 'Chauffage, distillation, réactions chimiques',
    precautions: 'Utiliser un support adapté, attention à la chaleur'
  },
  {
    id: 'eq5',
    nom: 'Tube à essai',
    description: 'Petit tube en verre pour tester des réactions à petite échelle.',
    structure: '/models/test_tube.obj',
    mtl: '/models/test_tube.mtl',
    resourcePath: '/models/',
    category: 'equipment',
    usage: 'Tests préliminaires, petites réactions',
    precautions: 'Manipuler avec précaution, utiliser un support'
  }
];