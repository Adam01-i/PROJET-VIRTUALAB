import { useEffect, useState } from 'react';
import { FlaskRound as Flask, Brain, Cuboid as Cube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import { motion } from 'framer-motion';
import HeroSection from '../../../../components/ui/HeroSection';


const commentairesFictifs = [
  {
    auteur: "Amina, élève de Terminale",
    contenu: "Le labo virtuel m'a permis de comprendre des expériences que je n’avais jamais osé essayer en vrai.",
  },
  {
    auteur: "Youssou, professeur de physique-chimie",
    contenu: "C’est un outil formidable pour rendre mes cours plus interactifs et engageants.",
  },
  {
    auteur: "Ibrahima, lycéenne",
    contenu: "Les quiz m’aident à mémoriser plus facilement. C’est fun et utile !",
  },
  {
    auteur: "Lamine, élève de Première",
    contenu: "Visualiser les molécules en 3D m’a aidé à mieux comprendre les structures.",
  },
  {
    auteur: "Fatima, élève de Seconde",
    contenu: "J’adore refaire les expériences quand je veux. C’est comme un jeu éducatif.",
  },
  {
    auteur: "Alioune, parent d’élève",
    contenu: "Une plateforme éducative moderne, intuitive et rassurante pour les parents.",
  },
];

export default function AccueilView() {
  const [prenom, setPrenom] = useState('');
  const [classe, setClasse] = useState('');
  const [isEleve, setIsEleve] = useState(false);

  useEffect(() => {
    const fetchUserInfos = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'eleve') {
        setIsEleve(true);
        setPrenom(profile.name || '');

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

  const fadeUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: 'easeOut' },
    }),
  };

  return (
    <div>
      {/* ✅ Hero Section avec image de fond et contenu centré */}
      <div className="relative">
        <HeroSection images={["/assets/bg/baniere.png"]}>
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/40 z-0" />

          {/* Contenu Hero */}
          <div className="relative z-10 flex flex-col justify-center items-center text-center h-full max-w-3xl mx-auto px-6 sm:px-8 py-24 md:py-32 mt-56">
            <Flask size={48} className="text-indigo-300 mb-6 drop-shadow-md" />
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              Votre Laboratoire de Chimie Virtuel
            </h1>


            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Link to="/eleve/experiences" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md flex items-center justify-center gap-2 shadow hover:shadow-indigo-400/20 text-sm font-medium transition duration-300">
                <Flask size={18} />
                <span>Lancer une expérience</span>
              </Link>

              <Link to="/eleve/quiz" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md flex items-center justify-center gap-2 text-sm font-medium shadow hover:shadow-white/10 transition duration-300">
                <Brain size={18} />
                <span>Évaluer mes connaissances</span>
              </Link>
            </div>
            <div className=' sm:mt-3'>
              <p className="text-base sm:text-lg text-indigo-100 mb-8 leading-relaxed font-light drop-shadow-sm">
                Réalisez des expériences en toute sécurité, testez vos connaissances<br className="hidden sm:block" />
                avec des quiz ludiques, et explorez des structures moléculaires en 3D comme jamais auparavant.
              </p>
            </div>
          </div>
        </HeroSection>
      </div>

      {/* ✅ Section inférieure */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#f9f9ff] via-white to-[#f9f9ff] min-h-screen px-6 sm:px-10 lg:px-24">
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#a5b4fc" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="max-w-[1280px] mx-auto px-4 py-20 relative z-10">
          {/* Bloc élève */}
          {isEleve && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="mb-16 bg-white/70 backdrop-blur-md border border-indigo-100 p-6 rounded-xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">Bienvenue, {prenom} 👋</h2>
              <p className="text-sm text-gray-700">
                Classe : <span className="font-semibold text-indigo-600">{classe}</span>
              </p>
            </motion.div>
          )}

          {/* Blocs principaux */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-32"
          >
            <FeatureCard
              to="/eleve/experiences"
              icon={<Flask size={28} className="text-indigo-600" />}
              title="Expériences Virtuelles"
              text="Réalisez des expériences de chimie en toute sécurité. Manipulez virtuellement le matériel et observez les réactions."
            />
            <FeatureCard
              to="/eleve/quiz"
              icon={<Brain size={28} className="text-indigo-600" />}
              title="Quiz Interactifs"
              text="Testez vos connaissances avec des quiz adaptés au programme de première. Progressez à votre rythme."
            />
            <FeatureCard
              to="/eleve/3d"
              icon={<Cube size={28} className="text-indigo-600" />}
              title="Visualisation 3D"
              text="Explorez les molécules en trois dimensions. Comprenez leur structure et leurs propriétés."
            />
          </motion.div>

          {/* Avantages & labo */}
          <div className="grid md:grid-cols-2 gap-12 mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <Card title="Autonomie & Pratique" text="Répétez les expériences à volonté, avancez à votre rythme et maîtrisez les notions à votre façon." />
              <Card title="Approche Moderne" text="Des contenus visuels et interactifs, alignés avec le programme officiel pour apprendre efficacement." />
              <Card title="Accessibilité Permanente" text="Accédez à votre espace élève où que vous soyez, 24h/24." />
              <Card title="Apprentissage Ludique" text="Vivez une expérience motivante grâce aux quiz, animations 3D et éléments interactifs intégrés." />
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
              className="bg-white/30 backdrop-blur-xl border border-gray-200 p-8 rounded-2xl shadow-lg flex flex-col justify-between"
            >
              <h3 className="text-3xl font-bold text-indigo-700 mb-6">Notre Laboratoire Virtuel</h3>
              <p className="text-gray-700 mb-4">Conçu pour stimuler la curiosité scientifique, notre laboratoire numérique permet à chaque élève de s’immerger dans l’apprentissage expérimental.</p>
              <p className="text-gray-700">Grâce à une combinaison de simulations, visualisations 3D, évaluations interactives et suivi personnalisé, vous progressez de façon active et engageante.</p>
              <Link to="/eleve/experiences" className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition">
                Explorer le laboratoire
              </Link>
            </motion.div>
          </div>

          {/* Commentaires utilisateurs */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="mb-32"
          >
            <h2 className="text-3xl font-bold text-center text-indigo-800 mb-10">Ils en parlent mieux que nous 💬</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {commentairesFictifs.map((com, i) => (
                <motion.div key={i} variants={fadeUp} custom={i}
                  className="bg-white/80 backdrop-blur-md border border-indigo-100 p-5 rounded-xl shadow-md"
                >
                  <p className="text-gray-700 italic mb-3">"{com.contenu}"</p>
                  <p className="text-right text-sm font-semibold text-indigo-700">– {com.auteur}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Formulaire de contact */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
            className="mx-auto max-w-3xl bg-white/30 backdrop-blur-xl border border-indigo-100 p-10 rounded-3xl shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-indigo-800 mb-6 text-center">Contactez-nous</h2>
            <p className="text-center text-gray-700 mb-10">
              Une question ? Une suggestion ? Laissez-nous un message, nous vous répondrons rapidement.
            </p>

            <form action="https://formspree.io/f/xovwznly" method="POST" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input name="nom" type="text" placeholder="Votre nom" required className="flex-1 px-4 py-3 bg-white/80 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-400 text-black" />
                <input name="email" type="email" placeholder="Votre email" required className="flex-1 px-4 py-3 bg-white/80 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-400 text-black" />
              </div>
              <textarea name="message" rows={5} placeholder="Votre message" required className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-400 text-black" />
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:brightness-110 transition">
                Envoyer le message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )


}

function FeatureCard({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="group bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-5 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed flex-grow">{text}</p>
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
