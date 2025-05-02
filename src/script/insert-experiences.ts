import { createClient } from '@supabase/supabase-js';
import { experienceData } from '../data/Experience/experienceData';

// 🔑 Clés Supabase
const SUPABASE_URL = 'https://dviccoqpvhriwxruxjby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWNjb3FwdmhyaXd4cnV4amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjU2ODYsImV4cCI6MjA2MDYwMTY4Nn0.ziHyNM3C5GiNQYqwrjCY7aHV8ACI-Wx_HwBwpwqagaI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  let colonneResultatsExiste = true;

  // Test si la colonne est visible dans le schéma
  const { error: schemaError } = await supabase
    .from('experiences')
    .select('resultatsAttendus')
    .limit(1);

  if (schemaError) {
    colonneResultatsExiste = false;
    console.warn("⚠️ Colonne 'resultatsAttendus' introuvable dans le cache Supabase. Elle sera ignorée.");
  } else {
    console.log("✅ Colonne 'resultatsAttendus' détectée.");
  }

  for (const exp of experienceData) {
    const dataToInsert: any = {
      titre: exp.titre,
      description: exp.description,
      duree: exp.duree,
      niveau: exp.niveau,
      image: exp.image,
      simulationPath: exp.simulationPath,
      objectifs: exp.objectifs,
      materiel: exp.materiel
    };

    if (colonneResultatsExiste) {
      dataToInsert.resultatsAttendus = exp.resultatsAttendus;
    }

    const { error } = await supabase.from('experiences').insert(dataToInsert);

    if (error) {
      console.error(`❌ Erreur insertion: ${exp.titre}`, error.message);
    } else {
      console.log(`✅ Expérience insérée: ${exp.titre}`);
    }
  }

  console.log("🎉 Tous les enregistrements ont été traités.");
  process.exit(0);
})();
