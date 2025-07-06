// insertLabItems.ts
import { createClient } from '@supabase/supabase-js';
import { molecules } from '../data/Viewer3D/moleculeData';
import { labEquipment } from '../data/Viewer3D/labEquipmentData';
import type { Molecule, LabEquipment } from '../types/Viewer3D/lab_items';

// 🔑 Clés Supabase
const SUPABASE_URL = 'https://dviccoqpvhriwxruxjby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWNjb3FwdmhyaXd4cnV4amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjU2ODYsImV4cCI6MjA2MDYwMTY4Nn0.ziHyNM3C5GiNQYqwrjCY7aHV8ACI-Wx_HwBwpwqagaI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertMolecules() {
    for (const mol of molecules) {
      const { id, ...fields } = mol; // ignore l'id
      const { error } = await supabase
        .from('lab_items')
        .insert([{ ...fields }]); // Supabase génère automatiquement l'UUID
  
      if (error) {
        console.error(`❌ Erreur insertion molécule "${fields.nom}":`, error.message);
      } else {
        console.log(`✅ Molécule "${fields.nom}" insérée.`);
      }
    }
  }
  

  async function insertEquipments() {
    for (const eq of labEquipment) {
      const { id, ...fields } = eq;
  
      const { error } = await supabase
        .from('lab_items')
        .insert([{ ...fields }]);
  
      if (error) {
        console.error(`❌ Erreur insertion matériel "${fields.nom}":`, error.message);
      } else {
        console.log(`✅ Matériel "${fields.nom}" inséré.`);
      }
    }
  }
  
async function insertAll() {
  console.log('🚀 Insertion des molécules...');
  await insertMolecules();
  console.log('🚀 Insertion des équipements...');
  await insertEquipments();
  console.log('✅ Tous les éléments ont été insérés dans lab_items.');
}

insertAll().catch((err) => {
  console.error('🔥 Erreur globale du script :', err);
});
