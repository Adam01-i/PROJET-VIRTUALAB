import { createClient } from '@supabase/supabase-js';
import { experienceData } from '../data/Experience/experienceData';

// 🔑 Clés Supabase (veille à ne pas exposer la clé publiquement en production)
const SUPABASE_URL = 'https://dviccoqpvhriwxruxjby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWNjb3FwdmhyaXd4cnV4amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjU2ODYsImV4cCI6MjA2MDYwMTY4Nn0.ziHyNM3C5GiNQYqwrjCY7aHV8ACI-Wx_HwBwpwqagaI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  // Vérifie si la table existe
  const { error: tableError } = await supabase
    .from('experiences')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error("❌ La table 'experiences' est introuvable ou inaccessible :", tableError.message);
    process.exit(1);
  }

  // Traitement des données
  for (const exp of experienceData) {
    const dataToInsert: Record<string, any> = {
      titre: exp.titre,
      description: exp.description,
      duree: exp.duree,
      niveau: exp.niveau,
      image: exp.image,
      resultatsAttendus: exp.resultatsAttendus,    
      objectifs: exp.objectifs,
      materiel: exp.materiel,
      simulationPath: exp.simulationPath,
    };

    const { error } = await supabase.from('experiences').insert([dataToInsert]);

    if (error) {
      console.error(`❌ Erreur lors de l'insertion de "${exp.titre}" :`, error.message);
    } else {
      console.log(`✅ Expérience insérée : "${exp.titre}"`);
    }
  }

  console.log("🎉 Insertion terminée !");
  process.exit(0);
})();
