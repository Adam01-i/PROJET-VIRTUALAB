import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { experienceData } from '../../../../data/Experience/experienceData';
import ExperienceCard from './ExperienceCard';
import ExperienceDetailView from './ExperienceDetailView';

const ITEMS_PER_PAGE = 3;

export default function ExperienceView() {
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleStartExperience = (experienceId: string) => {
    setActiveExperience(experienceId);
  };

  const totalPages = Math.ceil(experienceData.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = experienceData.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const currentExperience = activeExperience
    ? experienceData.find(e => e.id === activeExperience)
    : null;

  if (currentExperience) {
    return (
      <ExperienceDetailView
        experience={currentExperience}
        onBack={() => setActiveExperience(null)}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-20 py-20 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Expériences disponibles</h2>

      {/* Cartes paginées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentData.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            onStart={handleStartExperience}
          />
        ))}
      </div>

      {/* Pagination numérotée */}
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
    </div>
  );
}
