// CommonJS style
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

// Charger les variables d'environnement depuis le backend
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const classes = [
  { id: '7d372721-bf47-4fc9-b0d4-dc98361d68a1', nom: 'Classe1' },
  { id: 'b394167c-c417-49e2-9dcd-ae2ac71a9c7d', nom: 'Classe2' },
  { id: 'd06a1aa2-0de9-444a-8206-7987c3090a66', nom: 'Classe3' },
];

const typesActivite = ['quiz', 'simulation', 'objet3d'];

function genererMeta(type, j) {
  const titres = {
    quiz: 'Quiz Maths Niveau 6',
    simulation: 'Chute Libre - Simulation',
    objet3d: 'Molécule H2O - 3D'
  };

  return {
    titre: titres[type],
    score: Math.floor(Math.random() * 100),
    details: `Activité ${j}`,
    niveau: '6e'
  };
}

async function main() {
  for (const classe of classes) {
    for (let i = 1; i <= 15; i++) {
      const email = `eleve_${classe.nom.toLowerCase()}_${i}@demo.com`;
      const password = `Passw0rd!${i}`;

      const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        console.error(`❌ Erreur création utilisateur ${email}:`, error.message);
        continue;
      }

      const eleve_id = user.user.id;
      console.log(`✅ Utilisateur créé : ${email} (id: ${eleve_id})`);

      await new Promise((r) => setTimeout(r, 400));

      const { error: classeError } = await supabase
        .from('eleves_classes')
        .insert({
          id: crypto.randomUUID(),
          eleve_id,
          classe_id: classe.id,
        });

      if (classeError) {
        console.error(`⚠️ Erreur affectation classe pour ${email}:`, classeError.message);
      } else {
        console.log(`📚 Élève affecté à ${classe.nom}`);
      }

      // Générer 15 logs d'activités
      for (let j = 1; j <= 15; j++) {
        const type = typesActivite[Math.floor(Math.random() * typesActivite.length)];
        const meta = genererMeta(type, j);

        const { error: logError } = await supabase
          .from('activity_logs')
          .insert({
            id: crypto.randomUUID(),
            user_id: eleve_id,
            type,
            duree: Math.floor(Math.random() * 180),
            meta,
          });

        if (logError) {
          console.error(`⚠️ Erreur log activité pour ${email} (activité ${j}):`, logError.message);
        }
      }
    }
  }
}

main()
  .then(() => console.log('🎉 Création des élèves + activités terminée !'))
  .catch((err) => console.error('Erreur générale :', err));
