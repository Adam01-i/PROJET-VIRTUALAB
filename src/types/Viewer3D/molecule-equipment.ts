export type Molecule = {
    id: string;
    nom: string;
    formule: string;
    description: string;
    structure: string;
    category: 'molecule' | 'equipment';
    niveau?: string;
    importance?: string;
  };
  
  export type LabEquipment = {
    id: string;
    nom: string;
    description: string;
    structure: string;
    mtl: string;
    resourcePath: string;
    category: 'molecule' | 'equipment';
    usage: string;
    precautions: string;
  };