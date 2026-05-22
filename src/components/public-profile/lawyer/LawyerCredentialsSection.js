'use client';

import { Award } from 'lucide-react';

export default function LawyerCredentialsSection({ credentials }) {
  return (
    <section id="credentials" className="py-16 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-heading mb-4">
            Credentials & Certifications
          </h2>
          <p className="text-lg text-text-muted">
            Professional qualifications and expertise you can trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {credentials.map((credential, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg shadow-sm p-6 border-l-4 border-primary"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-primary">
                  <Award size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-heading mb-1">
                    {credential.title}
                  </h3>
                  <p className="text-sm text-text-muted mb-1">
                    {credential.issuer}
                  </p>
                  <p className="text-xs text-text-muted font-medium">
                    {credential.year}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

