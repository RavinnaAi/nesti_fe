'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';

const ROLE_PLACEHOLDERS = {
  mortgage_broker: [
    { client_name: 'Sarah Johnson', lead_type: 'Pre-Approval Lead', rating: 5, text: 'Got pre-approved quickly and closed on my dream home within 30 days.', location: 'Local Market' },
    { client_name: 'David Chen', lead_type: 'Home Loan Lead', rating: 5, text: 'Found me a rate that saved thousands over the life of my loan.', location: 'Local Market' },
    { client_name: 'Emily Torres', lead_type: 'Refinance Lead', rating: 5, text: 'Refinancing was completely seamless. Clear communication throughout.', location: 'Local Market' },
    { client_name: 'Mark Liu', lead_type: 'Mortgage Strategy Lead', rating: 5, text: 'Outstanding advice tailored to my financial situation.', location: 'Local Market' },
    { client_name: 'Priya Shah', lead_type: 'Rate Lock Lead', rating: 5, text: 'Locked in an excellent rate before the market moved. Very professional.', location: 'Local Market' },
    { client_name: 'James Okafor', lead_type: 'Home Loan Lead', rating: 5, text: 'First-time homebuyer experience made stress-free. Highly recommend.', location: 'Local Market' },
  ],
  lawyer: [
    { client_name: 'Michael Brown', lead_type: 'Closing Lead', rating: 5, text: 'Every document was reviewed thoroughly. I felt fully protected.', location: 'Local Market' },
    { client_name: 'Rachel Kim', lead_type: 'Contract Review Lead', rating: 5, text: 'Caught an issue in the contract that could have cost me significantly.', location: 'Local Market' },
    { client_name: 'James Wilson', lead_type: 'Transaction Legal Lead', rating: 5, text: 'Smooth, secure closing from start to finish.', location: 'Local Market' },
    { client_name: 'Fatima Hassan', lead_type: 'Title Support Lead', rating: 5, text: 'Title issues resolved swiftly. Exceptional communication.', location: 'Local Market' },
    { client_name: 'Carlos Rivera', lead_type: 'Escrow Counsel Lead', rating: 5, text: 'Guided me through escrow like a true professional.', location: 'Local Market' },
    { client_name: 'Nina Patel', lead_type: 'Closing Lead', rating: 5, text: 'Seamless closing experience. Would not use anyone else.', location: 'Local Market' },
  ],
  agent: [
    { client_name: 'Amanda Foster', lead_type: 'Buyer Lead', rating: 5, text: 'Found my perfect home in just two weeks. Negotiation skills are second to none.', location: 'Local Market' },
    { client_name: 'Robert Martinez', lead_type: 'Seller Lead', rating: 5, text: 'Sold above asking price in 5 days. Marketing was perfectly executed.', location: 'Local Market' },
    { client_name: 'Lisa Wang', lead_type: 'Investor Lead', rating: 5, text: 'Always finds deals before they hit the market.', location: 'Local Market' },
    { client_name: 'Kevin O\'Brien', lead_type: 'Buyer Lead', rating: 5, text: 'Patient, knowledgeable and always available. Exceptional service.', location: 'Local Market' },
    { client_name: 'Aisha Malik', lead_type: 'Seller Lead', rating: 5, text: 'Professional staging advice and a quick sale at a great price.', location: 'Local Market' },
    { client_name: 'Tom Nguyen', lead_type: 'Investor Lead', rating: 5, text: 'Helped me build a solid rental portfolio. Highly recommended.', location: 'Local Market' },
  ],
};

function inferLeadType(testimonial, role, index) {
  const t = String(testimonial?.text || '').toLowerCase();
  if (role === 'mortgage_broker') {
    if (t.includes('refinanc')) return 'Refinance Lead';
    if (t.includes('pre-approv') || t.includes('pre approv')) return 'Pre-Approval Lead';
    return ['Home Loan Lead', 'Rate Lock Lead', 'Mortgage Strategy Lead'][index % 3];
  }
  if (role === 'lawyer') {
    if (t.includes('contract')) return 'Contract Review Lead';
    if (t.includes('closing')) return 'Closing Lead';
    return ['Transaction Legal Lead', 'Title Support Lead', 'Escrow Counsel Lead'][index % 3];
  }
  if (t.includes('seller')) return 'Seller Lead';
  if (t.includes('buyer')) return 'Buyer Lead';
  if (t.includes('invest')) return 'Investor Lead';
  return ['Buyer Lead', 'Seller Lead', 'Investor Lead'][index % 3];
}

function initials(name) {
  return String(name || 'C')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function ClientCard({ client }) {
  return (
    <div className="flex h-full min-h-[160px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Stars */}
      <div className="mb-2.5 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} className={i < (client.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
        ))}
      </div>

      {/* Quote */}
      <p className="mb-4 line-clamp-3 flex-1 text-[12px] leading-5 text-text-body">
        &ldquo;{client.text}&rdquo;
      </p>

      {/* Client info */}
      <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3">
        {client.client_photo_url ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-100">
            <Image src={client.client_photo_url} alt={client.client_name} fill className="object-cover" sizes="32px" />
          </div>
        ) : (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {initials(client.client_name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-text-heading">{client.client_name}</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">{client.lead_type}</div>
        </div>
        {client.location && (
          <div className="flex shrink-0 items-center gap-1 text-[10px] text-text-muted">
            <MapPin size={10} className="text-primary" />
            <span className="max-w-[70px] truncate">{client.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const CARDS_PER_PAGE = 3;
const AUTO_MS = 3800;

export default function PublicHappyClientsSlider({ testimonials = [], profile }) {
  const [page, setPage] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const role = profile?.professional_type || 'agent';
  const location =
    profile?.professional_profile?.location ||
    profile?.professional_profile?.target_neighborhoods ||
    'Local Market';

  const clients = useMemo(() => {
    // 1. Real clients from leads
    const fromLeads = (profile?.real_clients || []).filter((c) => c.client_name && c.text);
    if (fromLeads.length) return fromLeads.map((c) => ({ ...c, is_placeholder: false }));

    // 2. Manually entered testimonials
    const fromTestimonials = (testimonials || []).map((t, i) => ({
      client_name: t.client_name || 'Verified Client',
      client_photo_url: t.client_photo_url || null,
      rating: t.rating || 5,
      text: t.text || '',
      lead_type: inferLeadType(t, role, i),
      location,
      is_placeholder: false,
    }));
    if (fromTestimonials.length) return fromTestimonials;

    // 3. Static placeholders
    return (ROLE_PLACEHOLDERS[role] || ROLE_PLACEHOLDERS.agent).map((p) => ({
      ...p,
      location,
      is_placeholder: true,
    }));
  }, [profile?.real_clients, testimonials, role, location]);

  // Cycle so every page always has exactly CARDS_PER_PAGE cards
  const cycles = clients.length > 0 ? Math.ceil((CARDS_PER_PAGE * 3) / clients.length) : 1;
  const cycledClients = Array.from(
    { length: clients.length * cycles },
    (_, i) => clients[i % clients.length],
  );
  const totalPages = Math.ceil(cycledClients.length / CARDS_PER_PAGE);

  const advance = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setPage((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
      setFading(false);
    }, 280);
  }, [totalPages]);

  // Infinite auto-slide
  useEffect(() => {
    if (totalPages <= 1) return;
    timerRef.current = setInterval(advance, AUTO_MS);
    return () => clearInterval(timerRef.current);
  }, [advance, totalPages]);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setFading(true);
    setTimeout(() => { setPage(i); setFading(false); }, 280);
    timerRef.current = setInterval(advance, AUTO_MS);
  };

  const visible = cycledClients.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <section id="reviews" className="bg-transparent py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Happy Clients</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">Success Stories</h3>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease' }}
        >
          {visible.map((client, i) => (
            <ClientCard key={`${client.client_name}-${page}-${i}`} client={client} />
          ))}
        </div>

        {/* Dots */}
        {totalPages > 1 && (
          <div className="mt-5 flex justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === page ? 'w-6 bg-primary' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

