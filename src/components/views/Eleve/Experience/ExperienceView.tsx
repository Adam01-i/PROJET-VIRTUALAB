'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ExperienceCard from './ExperienceCard';
import ExperienceDetailView from './ExperienceDetailView';
import { supabase } from '../../../../lib/supabaseClient';

const ITEMS_PER_PAGE = 3;

export default function ExperienceView() {
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [prenom, setPrenom] = useState('');

  const handleStartExperience = async (experienceId: string) => {
    const experience = experiences.find((e) => e.id === experienceId);
    if (experience) {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (userId) {
        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'simulation',
          duree: null,
          meta: {
            experience_id: experience.id,
            titre: experience.titre,
          },
        });
      }
    }
    setActiveExperience(experienceId);
  };

  const totalPages = Math.ceil(experiences.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = experiences.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (!user) {
        const { data: allExperiences } = await supabase
          .from('vue_experience_details')
          .select('*')
          .order('created_at', { ascending: false });
        setExperiences(allExperiences || []);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'eleve') {
        setLoading(false);
        return;
      }

      setPrenom(profile.name || '');

      const { data: classeLink } = await supabase
        .from('eleves_classes')
        .select('classe_id')
        .eq('eleve_id', user.id)
        .single();

      const classeId = classeLink?.classe_id;
      if (!classeId) {
        setLoading(false);
        return;
      }

      const { data: classeExperiences } = await supabase
        .from('vue_experience_details')
        .select('*')
        .eq('classe_id', classeId)
        .order('created_at', { ascending: false });

      if (classeExperiences) {
        setExperiences(classeExperiences);
      }

      setLoading(false);
    };

    fetchExperiences();
  }, []);

  const currentExperience = activeExperience
    ? experiences.find((e) => e.id === activeExperience)
    : null;

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">Chargement des expériences...</div>
    );
  }

  if (currentExperience) {
    return (
      <ExperienceDetailView
        experience={currentExperience}
        onBack={() => setActiveExperience(null)}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-24 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">
        {prenom ? `Bienvenue ${prenom} 👋 – Expériences de ta classe` : "Expériences disponibles (mode invité)"}
      </h2>

      {experiences.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          Aucune expérience disponible pour le moment.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                onStart={handleStartExperience}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
