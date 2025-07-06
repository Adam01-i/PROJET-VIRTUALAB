export type lab_items = { 
  id: string;
  nom: string;
  description: string;
  structure: string;
  category: 'molecule' | 'equipment';
  formule?: string;
  importance?: string;
  usage?: string;
  precautions?: string;
  auteur_id?: string;  
  classe_id?: string;  
};
