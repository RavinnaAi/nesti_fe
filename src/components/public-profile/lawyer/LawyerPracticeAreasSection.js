'use client';

import { FileText, Gavel, Handshake, Home } from 'lucide-react';

const areaIcons = {
  'Residential Real Estate': <Home size={32} />,
  'Commercial Real Estate': <Home size={32} />,
  'Contract Review': <FileText size={32} />,
  'Title Issues': <Gavel size={32} />,
  'Closing Services': <Handshake size={32} />,
};

export default function LawyerPracticeAreasSection({ practiceAreas, onAreaClick }) {
  return (
    <section id="practice-areas" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-heading mb-4">
            Practice Areas
          </h2>
          <p className="text-lg text-text-muted">
            Expert legal services for all your real estate needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {practiceAreas.map((area, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer group text-center"
              onClick={() => onAreaClick?.('consultation')}
            >
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full text-primary mb-4 group-hover:scale-110 transition-transform">
                {areaIcons[area] || <Gavel size={32} />}
              </div>
              <h3 className="text-lg font-semibold text-text-heading">
                {area}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

