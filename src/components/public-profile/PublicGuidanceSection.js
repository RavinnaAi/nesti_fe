'use client';

import { BookOpen, CheckCircle2, HelpCircle, LockKeyhole, MessageCircle, Sparkles } from 'lucide-react';

const ROLE_GUIDANCE = {
  agent: {
    eyebrow: 'Client Guide',
    title: 'Know what happens before you start.',
    description: 'A simple guide to how buying, selling, property questions, showings, and consultations are handled on this profile.',
    steps: [
      { title: 'Ask about buying or selling', text: 'Use the chat bubble to share your goal, preferred area, price range, property type, and timeline.' },
      { title: 'Explore available opportunities', text: 'Review seller properties, ask about matches, or inquire directly from a property card.' },
      { title: 'Get guided follow-up', text: 'Your details are organized into a lead profile so the agent can respond with useful next steps.' },
    ],
    faqs: [
      { q: 'Can I ask about a specific property?', a: 'Yes. Use the chat bubble or the property inquiry button so the property context is included.' },
      { q: 'Can sellers create an inquiry?', a: 'Yes. Seller questions collect address, price, condition, timeline, and motivation details.' },
      { q: 'Will I see matching properties?', a: 'For buyer inquiries, the assistant can surface available matches and help you choose a next step.' },
    ],
  },
  mortgage_broker: {
    eyebrow: 'Mortgage Guide',
    title: 'Understand the mortgage inquiry flow.',
    description: 'A quick guide to getting financing guidance, pre-approval support, affordability review, and broker follow-up.',
    steps: [
      { title: 'Start with your financing goal', text: 'Ask about pre-approval, affordability, rates, refinancing, purchase budget, or programs.' },
      { title: 'Share basic financial context', text: 'The assistant can guide details like income range, credit score range, down payment, and timeline.' },
      { title: 'Receive broker follow-up', text: 'Your inquiry is routed with financing context so the broker can respond more efficiently.' },
    ],
    faqs: [
      { q: 'Can I get pre-approved here?', a: 'You can start the pre-approval inquiry and share the details needed for broker follow-up.' },
      { q: 'Can I ask about affordability?', a: 'Yes. Share your budget, income range, down payment, and timeline for a more useful review.' },
      { q: 'Is this a final mortgage approval?', a: 'No. This starts the guided inquiry and broker review process before formal underwriting.' },
    ],
  },
  lawyer: {
    eyebrow: 'Legal Guide',
    title: 'Start legal questions with more clarity.',
    description: 'A simple guide for transaction, contract, title, document, and closing-related legal inquiries.',
    steps: [
      { title: 'Choose the legal topic', text: 'Ask about closing, contract review, title support, transaction issues, or consultation.' },
      { title: 'Share transaction context', text: 'The assistant helps collect stage, closing timeline, property value, mortgage status, and service needs.' },
      { title: 'Route securely for follow-up', text: 'Your request is organized so the lawyer can understand the matter before responding.' },
    ],
    faqs: [
      { q: 'Can I ask a legal question directly?', a: 'Yes. Start with the chat bubble and describe the transaction or document issue.' },
      { q: 'Can I request contract review?', a: 'Yes. The assistant gathers contract and transaction context for follow-up.' },
      { q: 'Is this legal advice?', a: 'No. This starts an inquiry so the lawyer can review and follow up appropriately.' },
    ],
  },
};

export default function PublicGuidanceSection({ profile }) {
  const content = ROLE_GUIDANCE[profile?.professional_type] || ROLE_GUIDANCE.agent;

  return (
    <section id="guide" className="bg-transparent py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-primary/5 p-6 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles size={12} />
              {content.eyebrow}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">{content.title}</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">{content.description}</p>

            <div className="mt-6 space-y-3">
              {content.steps.map((step, index) => (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-text-heading">
                      <CheckCircle2 size={14} className="text-primary" />
                      {step.title}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-text-muted">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Helpful Questions</div>
                <h3 className="mt-1 text-xl font-bold text-text-heading">Common things visitors ask</h3>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <HelpCircle size={20} />
              </div>
            </div>

            <div className="grid gap-3">
              {content.faqs.map((item) => (
                <div key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-start gap-2 text-sm font-bold text-text-heading">
                    <BookOpen size={14} className="mt-0.5 shrink-0 text-primary" />
                    {item.q}
                  </div>
                  <p className="mt-1.5 pl-6 text-xs leading-5 text-text-muted">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <MessageCircle size={17} className="mb-2 text-primary" />
                <div className="text-sm font-bold text-text-heading">Use the chat bubble</div>
                <p className="mt-1 text-xs leading-5 text-text-muted">Questions and inquiries start through a guided assistant tailored to this role.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <LockKeyhole size={17} className="mb-2 text-primary" />
                <div className="text-sm font-bold text-text-heading">Clear handoff</div>
                <p className="mt-1 text-xs leading-5 text-text-muted">Your answers are organized into useful context before professional follow-up.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

