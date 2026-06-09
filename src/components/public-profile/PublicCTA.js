'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';

const ROLE_CONTENT = {
  agent: {
    eyebrow: 'How to connect',
    title: 'Work with a trusted real estate professional.',
    description:
      'Use the chat assistant for questions about buying, selling, investing, property availability, or booking a consultation with this agent.',
    steps: [
      { label: 'Intent', title: 'Choose your real estate goal', description: 'Tell the assistant if you want to buy, sell, invest, ask about a listing, or book a consultation.' },
      { label: 'Area', title: 'Share your preferred area', description: 'Add your target city, neighborhood, property location, or the area where you need guidance.' },
      { label: 'Budget', title: 'Clarify budget and price range', description: 'For buyers, share your budget. For sellers, share your expected price or current property value.' },
      { label: 'Needs', title: 'Explain your property needs', description: 'Mention bedrooms, property type, must-have features, timeline, motivation, or seller details.' },
      { label: 'Contact', title: 'Send a complete request', description: 'The assistant organizes your answers and connects the full inquiry to the agent for follow-up.' },
      { label: 'Booking', title: 'Book a consultation', description: 'Ask the assistant to help route a consultation request to the agent.' },
    ],
  },
  mortgage_broker: {
    eyebrow: 'How to connect',
    title: 'Get mortgage guidance from a trusted broker.',
    description:
      'Use the chat assistant for questions about pre-approval, affordability, refinancing, rates, documents, or booking a mortgage consultation.',
    steps: [
      { label: 'Intent', title: 'Choose your need', description: 'Pre-approval, affordability, refinance, rates, or mortgage advice.' },
      { label: 'Info', title: 'Share basics', description: 'Budget, income range, credit status, timeline, and financing goal.' },
      { label: 'Contact', title: 'Get connected', description: 'The assistant connects your request to the broker for follow-up.' },
      { label: 'Booking', title: 'Book a consultation', description: 'Ask the assistant to help route a mortgage consultation request to the broker.' },
    ],
  },
  lawyer: {
    eyebrow: 'How to connect',
    title: 'Get legal support for your real estate transaction.',
    description:
      'Use the chat assistant for questions about closings, contracts, title review, legal documents, or booking a legal consultation.',
    steps: [
      { label: 'Intent', title: 'Select legal help', description: 'Closing, contract review, title support, or transaction guidance.' },
      { label: 'Info', title: 'Add case context', description: 'Transaction stage, timeline, property value, and legal needs.' },
      { label: 'Contact', title: 'Get connected', description: 'The assistant sends your inquiry to the lawyer with clear details.' },
      { label: 'Booking', title: 'Book a consultation', description: 'Ask the assistant to help route a legal consultation request to the lawyer.' },
    ],
  },
};

export default function PublicCTA({ profile, onDirectLeadClick }) {
  const content = ROLE_CONTENT[profile.professional_type] || ROLE_CONTENT.agent;

  return (
    <section id="contact" className="bg-transparent py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-7 lg:p-8">
            <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {content.eyebrow}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2">
              <h2 className="max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-text-heading md:text-[32px]">
                {content.title}
              </h2>
              <button
                type="button"
                onClick={onDirectLeadClick}
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 ring-1 ring-primary/15 transition duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/35"
              >
                Submit inquiry
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 transition duration-300 group-hover:bg-white/25">
                  <ArrowRight size={13} className="transition duration-300 group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-text-muted">
              {content.description}
            </p>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
              <div
                className="mb-5 hidden gap-2 md:grid"
                style={{ gridTemplateColumns: `repeat(${content.steps.length}, minmax(0, 1fr))` }}
              >
                {content.steps.map((step, index) => (
                  <div
                    key={step.label}
                    className="relative flex min-h-[42px] items-center justify-center"
                  >
                    <div
                      className={`relative z-10 flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 lg:text-[11px] ${
                        index === 0
                          ? 'bg-primary text-white ring-primary'
                          : 'bg-slate-50 text-text-muted ring-slate-200'
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                          index === 0
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-text-muted ring-1 ring-slate-200'
                        }`}
                      >
                        {index + 1}
                      </span>
                      {step.label}
                    </div>
                    {index < content.steps.length - 1 && (
                      <div className="pointer-events-none absolute left-[calc(100%-4px)] top-1/2 z-0 hidden h-px w-4 -translate-y-1/2 bg-primary/25 md:block">
                        <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-primary/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {content.steps.map((step, index) => (
                  <div key={step.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <CheckCircle2 size={14} className="text-primary" />
                      <h3 className="text-sm font-bold text-text-heading">{step.title}</h3>
                    </div>
                    <p className="mt-2 pl-9 text-[12px] leading-5 text-text-muted">{step.description}</p>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}

