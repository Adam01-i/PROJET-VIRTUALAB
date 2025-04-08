import type { Molecule } from '../../types/Viewer3D/molecule-equipment';

export const molecules: Molecule[] = [
        {
          id: '1',
          nom: 'Dioxyde de Carbone',
          formule: 'CO₂',
          description: 'Le dioxyde de carbone est un gaz à effet de serre produit par la respiration et la combustion.',
          structure: '/molecules/co2.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Étudier le cycle du carbone et les effets sur le climat.'
        },
        {
          id: '2',
          nom: 'Acide Acétique',
          formule: 'CH₃COOH',
          description: 'L’acide acétique est l’ingrédient principal du vinaigre, un acide faible.',
          structure: '/molecules/acetic_acid.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Utilisé pour étudier les réactions acide-base et l’estérification.'
        },
        {
          id: '3',
          nom: 'Acide Sulfurique',
          formule: 'H₂SO₄',
          description: 'L’acide sulfurique est un acide fort couramment utilisé dans l’industrie chimique.',
          structure: '/molecules/sulfuric_acid.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Utilisé pour étudier les acides forts et leurs propriétés.'
        },
        {
          id: '4',
          nom: 'D-Glucose',
          formule: 'C₆H₁₂O₆',
          description: 'Le glucose est un sucre simple essentiel pour la respiration cellulaire.',
          structure: '/molecules/d_glucose.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Étudier la chimie des sucres et leur rôle dans la biochimie.'
        },
        {
          id: '5',
          nom: 'Aspirine',
          formule: 'C₉H₈O₄',
          description: 'L’aspirine est un médicament anti-inflammatoire couramment utilisé.',
          structure: '/molecules/aspirin.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Illustrer les propriétés des molécules organiques et les médicaments.'
        },
        {
          id: '6',
          nom: 'Caféine',
          formule: 'C₈H₁₀N₄O₂',
          description: 'La caféine est un stimulant présent dans le café, le thé et certaines boissons énergétiques.',
          structure: '/molecules/caffeine.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Étudier les effets physiologiques et la structure des stimulants.'
        },
        {
          id: '7',
          nom: 'Éthanol',
          formule: 'C₂H₅OH',
          description: 'L’éthanol est l’alcool présent dans les boissons alcoolisées et utilisé comme solvant.',
          structure: '/molecules/ethanol.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Étudier les propriétés des alcools et leur utilisation.'
        },
        {
          id: '8',
          nom: 'Chlore',
          formule: 'Cl₂',
          description: 'Le chlore est un gaz toxique utilisé dans l’industrie pour produire des plastiques et des désinfectants.',
          structure: '/molecules/chlorine.pdb', // Exemple de chemin pour PDB
          category: 'molecule',
          niveau: 'Première',
          importance: 'Illustrer les propriétés des gaz et des molécules diatomiques.'
        }
      ];