import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskRound as Flask, Brain } from "lucide-react";

const images = [
  "/assets/img1.png",
  "/assets/img2.png",
  "/assets/img3.png",
  "/assets/img4.png",
  "/assets/img5.png",
];

function ImageCarouselBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      
      {/* ✅ Carousel d’images avec transition fluide */}
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={`background-${i}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100 z-0' : 'opacity-0'
          }`}
        />
      ))}

      {/* ✅ Overlay sombre */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 opacity-60 pointer-events-none z-10" />

      {/* ✅ Texte centré */}
      <div className="relative z-20 h-full flex items-center justify-center px-4">
        <div className="text-center max-w-[1280px] mx-auto">
          <div className="mb-6">
            <Flask size={48} className="text-purple-300 mx-auto" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Votre Laboratoire de Chimie Virtuel
          </h1>
          <p className="text-lg text-purple-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Réalisez des expériences en toute sécurité, testez vos connaissances avec des quiz ludiques, 
            et explorez des structures moléculaires en 3D comme jamais auparavant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/eleve/experiences"
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 shadow hover:shadow-purple-500/20 text-sm font-medium"
            >
              <Flask size={18} />
              <span>Lancer une expérience</span>
            </Link>
            <Link
              to="/eleve/quiz"
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Brain size={18} />
              <span>Évaluer mes connaissances</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ Découpe en vague en bas */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-20 leading-none">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-[200px]"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#ffffff"
            d="M0,224 C480,320 960,128 1440,224 L1440,320 L0,320 Z"
          />
        </svg>
      </div>

      {/* ✅ Ombre après les vagues */}
      <div className="absolute bottom-[-72px] left-0 w-full h-20 bg-gradient-to-t from-black to-transparent shadow-lg z-30"></div>
    </div>
  );
}

export default ImageCarouselBackground;
