'use client';

import { Sparkles } from 'lucide-react';

const ROLE_DETAILS = {
  agent: {
    eyebrow: 'Role-Based Support',
    title: 'A clearer path for buyers, sellers, and property questions.',
    description:
      'Visitors can share their intent, budget, property needs, and timeline before the agent follows up, so every conversation starts with useful context.',
    highlights: [
      { title: 'Buyer-ready intake', text: 'Capture location, budget, home style, must-haves, mortgage status, and viewing readiness.' },
      { title: 'Seller context', text: 'Collect property address, expected price, condition, timing, and motivation for a more useful response.' },
      { title: 'Property-specific flow', text: 'Visitors can inquire from a seller property card and carry that property context into the chat.' },
    ],
    proof: ['Organized lead profile', 'Property match support', 'Consultation-ready follow-up'],
  },
  mortgage_broker: {
    eyebrow: 'Financing Support',
    title: 'Turn mortgage questions into structured pre-approval conversations.',
    description:
      'The profile guides visitors through financing goals, affordability, credit range, employment context, and timeline so the broker receives a clearer request.',
    highlights: [
      { title: 'Pre-approval path', text: 'Guide visitors through timeline, credit score range, income range, down payment, and readiness.' },
      { title: 'Affordability framing', text: 'Help buyers describe target price range, monthly comfort, and financing questions before follow-up.' },
      { title: 'Refinance and strategy', text: 'Support refinance, rate, renewal, or loan-program questions with a consistent intake flow.' },
    ],
    proof: ['Pre-approval context', 'Document readiness prompts', 'Broker-ready consultation request'],
  },
  lawyer: {
    eyebrow: 'Legal Transaction Support',
    title: 'Help visitors explain legal needs before the first follow-up.',
    description:
      'Real estate legal inquiries are organized around transaction stage, closing timeline, property value, document needs, and preferred contact method.',
    highlights: [
      { title: 'Contract questions', text: 'Capture document review, agreement, condition, amendment, or clause concerns with context.' },
      { title: 'Closing preparation', text: 'Help visitors explain where they are in the transaction and what timeline they are working toward.' },
      { title: 'Title and transfer support', text: 'Route title, refinance, transfer, and closing service needs into a clearer legal intake.' },
    ],
    proof: ['Structured legal intake', 'Transaction-stage context', 'Clear handoff for review'],
  },
};

export default function PublicRoleDetailSection({ profile }) {
  const content = ROLE_DETAILS[profile?.professional_type] || ROLE_DETAILS.agent;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.75fr)] lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                  <Sparkles size={12} />
                  {content.eyebrow}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-text-heading sm:text-2xl">
                  {content.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-text-muted">{content.description}</p>
              </div>

              <div className="ml-auto grid w-fit min-w-[17rem] gap-2 rounded-2xl border border-primary/15 bg-primary/[0.035] p-3">
                {content.proof.map((item) => (
                  <div key={item} className="w-fit min-w-full rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-text-heading shadow-sm ring-1 ring-primary/10">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-3">
              {content.highlights.map((item) => (
                <div key={item.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-primary/[0.035] p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-text-heading">{item.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
