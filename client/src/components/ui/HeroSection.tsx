"use client"
import { useEffect, useState, ReactNode } from 'react';

export default function HeroSection({ images, children }: { images: string[], children?: ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
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

      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 opacity-0 pointer-events-none z-10" />

      <div className="relative z-20 h-full flex items-center justify-center px-4">
        <div className="max-w-[1280px] mx-auto w-full">
          {children}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-20 leading-none">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-[200px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#ffffff"
            d="M0,224 C480,320 960,128 1440,224 L1440,320 L0,320 Z"
          />
        </svg>
      </div>

      <div className="absolute bottom-[-70px] left-0 w-full h-20 bg-gradient-to-t from-black to-transparent shadow-lg z-30"></div>
    </div>
  );
}
