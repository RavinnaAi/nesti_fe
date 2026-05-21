'use client';

import { Building, DollarSign, FileText, Handshake, Home, KeyRound } from 'lucide-react';

const iconMap = {
  home: <Home size={32} />,
  dollar: <DollarSign size={32} />,
  contract: <FileText size={32} />,
  handshake: <Handshake size={32} />,
  building: <Building size={32} />,
  key: <KeyRound size={32} />,
};

const fallbackServices = {
  agent: [
    { icon: 'home', title: 'Buyer Representation', description: 'Guidance for home search, property shortlisting, offers, and negotiations.', cta_text: 'Ask about buying' },
    { icon: 'building', title: 'Seller Support', description: 'Help with pricing, positioning, property questions, and selling strategy.', cta_text: 'Ask about selling' },
    { icon: 'key', title: 'Showings & Consultations', description: 'Request property guidance, market insight, or a consultation through the chat assistant.', cta_text: 'Start inquiry' },
  ],
  mortgage_broker: [
    { icon: 'dollar', title: 'Pre-Approval Guidance', description: 'Start a guided inquiry for affordability, documents, credit status, and next steps.', cta_text: 'Start pre-approval' },
    { icon: 'building', title: 'Mortgage Strategy', description: 'Ask about rates, down payment, refinancing, and financing options.', cta_text: 'Ask a question' },
    { icon: 'handshake', title: 'Consultation Support', description: 'Share your financing goal and get routed for professional follow-up.', cta_text: 'Start inquiry' },
  ],
  lawyer: [
    { icon: 'contract', title: 'Contract Review', description: 'Ask about purchase agreements, conditions, clauses, and transaction documents.', cta_text: 'Ask about contracts' },
    { icon: 'key', title: 'Closing Support', description: 'Get guidance on closing timelines, required documents, and transaction steps.', cta_text: 'Ask about closing' },
    { icon: 'handshake', title: 'Title & Legal Guidance', description: 'Start an inquiry for title questions, legal concerns, or consultation support.', cta_text: 'Start inquiry' },
  ],
};

export default function PublicServices({ services = [], professionalType, onServiceClick }) {
  const displayServices = services?.length ? services : (fallbackServices[professionalType] || fallbackServices.agent);

  return (
    <section id="services" className="bg-slate-50/70 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="mb-3 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Services
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text-heading mb-4">
            How this professional can help
          </h2>
          <p className="text-sm leading-6 text-text-muted max-w-2xl mx-auto">
            {professionalType === 'agent' && 'Personalized real estate services designed to help you achieve your goals.'}
            {professionalType === 'mortgage_broker' && 'Comprehensive mortgage solutions tailored to your financial needs.'}
            {professionalType === 'lawyer' && 'Expert legal services for all your real estate transactions.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition duration-300 cursor-pointer group"
              onClick={() => onServiceClick?.(service)}
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  {service.icon && iconMap[service.icon] ? (
                    iconMap[service.icon]
                  ) : (
                    <Handshake size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-text-heading mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm leading-6 text-text-muted mb-4">
                    {service.description}
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

