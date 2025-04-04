import type { Molecule } from '../../types/Viewer3D/molecule-equipment';

export const molecules: Molecule[] = [
  {
    id: '1',
    nom: 'Eau (H₂O)',
    formule: 'H₂O',
    description: 'Molécule essentielle à la vie, composée d\'un atome d\'oxygène et deux atomes d\'hydrogène. Solvant universel en chimie.',
    structure: 'https://models.r-eg.net/models/h2o.pdb',
    category: 'molecule',
    niveau: 'Première',
    importance: 'Comprendre la géométrie coudée et la polarité de la molécule.'
  },
  {
    id: '2',
    nom: 'Méthane (CH₄)',
    formule: 'CH₄',
    description: 'Le plus simple des hydrocarbures, composé d\'un atome de carbone et quatre atomes d\'hydrogène. Structure tétraédrique.',
    structure: 'https://models.r-eg.net/models/ch4.pdb',
    category: 'molecule',
    niveau: 'Première',
    importance: 'Exemple parfait de la géométrie tétraédrique.'
  },
  {
    id: '3',
    nom: 'Dioxyde de carbone (CO₂)',
    formule: 'CO₂',
    description: 'Molécule linéaire composée d\'un atome de carbone et deux atomes d\'oxygène. Important dans l\'effet de serre.',
    structure: 'https://models.r-eg.net/models/co2.pdb',
    category: 'molecule',
    niveau: 'Première',
    importance: 'Comprendre la géométrie linéaire et les liaisons doubles.'
  },
  {
    id: '4',
    nom: 'Éthanol (C₂H₅OH)',
    formule: 'C₂H₅OH',
    description: 'Alcool simple, important dans les réactions d\'oxydoréduction.',
    structure: 'https://models.r-eg.net/models/ethanol.pdb',
    category: 'molecule',
    niveau: 'Première',
    importance: 'Étude des groupes fonctionnels et des alcools.'
  }
];