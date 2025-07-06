import { useEffect, useState } from 'react';
import { FlaskRound as Flask, Brain, Cuboid as Cube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';

export default function AccueilView() {
  const [prenom, setPrenom] = useState('');
  const [classe, setClasse] = useState('');
  const [isEleve, setIsEleve] = useState(false);

  useEffect(() => {
    const fetchUserInfos = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (!user) return;

      // Étape 1 : Profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'eleve') {
        setIsEleve(true);
        setPrenom(profile.name || '');

        // Étape 2 : Classe
        const { data: ec } = await supabase
          .from('eleves_classes')
          .select('classe_id')
          .eq('eleve_id', user.id)
          .single();

        if (ec?.classe_id) {
          const { data: classeInfo } = await supabase
            .from('classes')
            .select('niveau, lettre')
            .eq('id', ec.classe_id)
            .single();

          if (classeInfo) {
            setClasse(`${classeInfo.niveau} ${classeInfo.lettre}`);
          }
        }
      }
    };

    fetchUserInfos();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-16 bg-white">
      {/* ✅ Bloc personnalisé pour l’élève */}
      {isEleve && (
        <div className="mb-16 bg-indigo-50 border border-indigo-100 p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold text-indigo-700 mb-2">
            Bienvenue, {prenom} 👋
          </h2>
          <p className="text-sm text-gray-700">
            Classe : <span className="font-semibold text-indigo-600">{classe}</span>
          </p>
        </div>
      )}

      {/* === Cartes principales === */}
      <div className="grid md:grid-cols-3 gap-8 pt-40">
        <FeatureCard
          to="/eleve/experiences"
          icon={<Flask size={28} className="text-purple-600" />}
          title="Expériences Virtuelles"
          text="Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions."
        />
        <FeatureCard
          to="/eleve/quiz"
          icon={<Brain size={28} className="text-purple-600" />}
          title="Quiz Interactifs"
          text="Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme."
        />
        <FeatureCard
          to="/eleve/3d"
          icon={<Cube size={28} className="text-purple-600" />}
          title="Visualisation 3D"
          text="Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés."
        />
      </div>

      {/* === Avantages + Description === */}
      <section className="pt-52 pb-l8 bg-white">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Autonomie & Pratique" text="Répétez les expériences à volonté, avancez à votre rythme et maîtrisez les notions à votre façon." />
            <Card title="Approche Pédagogique Moderne" text="Des contenus visuels et interactifs, alignés avec le programme officiel pour apprendre efficacement." />
            <Card title="Accessibilité Permanente" text="Accédez à votre espace élève où que vous soyez, sur tout appareil connecté, 24h/24." />
            <Card title="Apprentissage Ludique" text="Vivez une expérience motivante grâce aux quiz, animations 3D et éléments interactifs intégrés." />
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 shadow-md h-full flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-bold text-indigo-700 mb-6">Notre Laboratoire Virtuel</h3>
              <p className="text-gray-700 text-base leading-relaxed mb-4">
                Conçu pour stimuler la curiosité scientifique, notre laboratoire numérique permet à chaque élève de s’immerger dans l’apprentissage expérimental.
              </p>
              <p className="text-gray-700 text-base leading-relaxed">
                Grâce à une combinaison de simulations, visualisations 3D, évaluations interactives et suivi personnalisé, vous progressez de façon active et engageante.
              </p>
            </div>
            <div className="mt-8">
              <Link to="/eleve/experiences" className="inline-block px-6 py-3 bg-indigo-600 text-white text-base font-medium rounded-md shadow hover:bg-indigo-700 transition">
                Explorer le laboratoire
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-5 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
    </Link>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <h4 className="text-lg font-semibold text-indigo-600 mb-2">{title}</h4>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}
