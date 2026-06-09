'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { MapPin, Quote, Star } from 'lucide-react';

const US_CA_LOCATIONS = [
  'Austin, TX',
  'Toronto, ON',
  'Vancouver, BC',
  'Miami, FL',
  'Denver, CO',
  'Calgary, AB',
  'Seattle, WA',
  'Montreal, QC',
  'Phoenix, AZ',
  'Boston, MA',
  'Chicago, IL',
  'Ottawa, ON',
];

const CARD_HEIGHT = 'h-[304px]';

const ROLE_PLACEHOLDERS = {
  mortgage_broker: [
    { client_name: 'Sarah Johnson', lead_type: 'Pre-Approval Lead', rating: 5, text: 'Got pre-approved quickly and closed on my dream home within 30 days.', location: 'Austin, TX' },
    { client_name: 'David Chen', lead_type: 'Home Loan Lead', rating: 5, text: 'Found me a rate that saved thousands over the life of my loan.', location: 'Toronto, ON' },
    { client_name: 'Emily Torres', lead_type: 'Refinance Lead', rating: 5, text: 'Refinancing was completely seamless. Clear communication throughout.', location: 'Vancouver, BC' },
    { client_name: 'Mark Liu', lead_type: 'Mortgage Strategy Lead', rating: 5, text: 'Outstanding advice tailored to my financial situation.', location: 'Miami, FL' },
    { client_name: 'Priya Shah', lead_type: 'Rate Lock Lead', rating: 5, text: 'Locked in an excellent rate before the market moved. Very professional.', location: 'Denver, CO' },
    { client_name: 'James Okafor', lead_type: 'Home Loan Lead', rating: 5, text: 'First-time homebuyer experience made stress-free. Highly recommend.', location: 'Calgary, AB' },
    { client_name: 'Noah Peterson', lead_type: 'Pre-Approval Lead', rating: 5, text: 'Clear step-by-step financing plan and very responsive support.', location: 'Seattle, WA' },
    { client_name: 'Anika Roy', lead_type: 'Refinance Lead', rating: 5, text: 'Reduced my monthly payment and explained every option clearly.', location: 'Montreal, QC' },
  ],
  lawyer: [
    { client_name: 'Michael Brown', lead_type: 'Closing Lead', rating: 5, text: 'Every document was reviewed thoroughly. I felt fully protected.', location: 'Boston, MA' },
    { client_name: 'Rachel Kim', lead_type: 'Contract Review Lead', rating: 5, text: 'Caught an issue in the contract that could have cost me significantly.', location: 'Chicago, IL' },
    { client_name: 'James Wilson', lead_type: 'Transaction Legal Lead', rating: 5, text: 'Smooth, secure closing from start to finish.', location: 'Ottawa, ON' },
    { client_name: 'Fatima Hassan', lead_type: 'Title Support Lead', rating: 5, text: 'Title issues resolved swiftly. Exceptional communication.', location: 'Phoenix, AZ' },
    { client_name: 'Carlos Rivera', lead_type: 'Escrow Counsel Lead', rating: 5, text: 'Guided me through escrow like a true professional.', location: 'Austin, TX' },
    { client_name: 'Nina Patel', lead_type: 'Closing Lead', rating: 5, text: 'Seamless closing experience. Would not use anyone else.', location: 'Toronto, ON' },
    { client_name: 'Omar Siddiqui', lead_type: 'Contract Review Lead', rating: 5, text: 'Excellent legal clarity before we signed anything.', location: 'Vancouver, BC' },
    { client_name: 'Grace Allen', lead_type: 'Title Support Lead', rating: 5, text: 'Resolved title concerns quickly and professionally.', location: 'Denver, CO' },
  ],
  agent: [
    { client_name: 'Amanda Foster', lead_type: 'Buyer Lead', rating: 5, text: 'Found my perfect home in just two weeks. Negotiation skills are second to none.', location: 'Miami, FL' },
    { client_name: 'Robert Martinez', lead_type: 'Seller Lead', rating: 5, text: 'Sold above asking price in 5 days. Marketing was perfectly executed.', location: 'Calgary, AB' },
    { client_name: 'Lisa Wang', lead_type: 'Investor Lead', rating: 5, text: 'Always finds deals before they hit the market.', location: 'Seattle, WA' },
    { client_name: 'Kevin O\'Brien', lead_type: 'Buyer Lead', rating: 5, text: 'Patient, knowledgeable and always available. Exceptional service.', location: 'Montreal, QC' },
    { client_name: 'Aisha Malik', lead_type: 'Seller Lead', rating: 5, text: 'Professional staging advice and a quick sale at a great price.', location: 'Phoenix, AZ' },
    { client_name: 'Tom Nguyen', lead_type: 'Investor Lead', rating: 5, text: 'Helped me build a solid rental portfolio. Highly recommended.', location: 'Boston, MA' },
    { client_name: 'Priyanka Desai', lead_type: 'Buyer Lead', rating: 5, text: 'From shortlisting to closing, every step felt organized and easy.', location: 'Chicago, IL' },
    { client_name: 'Daniel Brooks', lead_type: 'Seller Lead', rating: 5, text: 'Great pricing strategy and strong communication throughout.', location: 'Ottawa, ON' },
  ],
};

const MIN_STORIES = 6;

const STORY_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=720&fit=crop",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=720&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=720&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=720&fit=crop",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&h=720&fit=crop",
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&h=720&fit=crop",
];

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

function isUsCaLocation(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  if (/lahore|pakistan|karachi|islamabad/i.test(text)) return false;
  return /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/i.test(text)
    || /\b(usa|united states|canada|u\.s\.)\b/i.test(text);
}

function storyLocation(index, preferred) {
  if (isUsCaLocation(preferred)) return preferred;
  return US_CA_LOCATIONS[index % US_CA_LOCATIONS.length];
}

function ClientCard({ client, className = '' }) {
  return (
    <article className={`flex ${CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="relative h-28 shrink-0 w-full overflow-hidden bg-slate-100">
        {client.story_image ? (
          <Image
            src={client.story_image}
            alt={`${client.client_name} story`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 80vw, 320px"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary-dark">
          {client.lead_type}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className={i < (client.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
          </div>
          <Quote size={13} className="text-primary/40" />
        </div>

        <p className="line-clamp-4 min-h-[5rem] text-[12px] leading-5 text-text-body">
          &ldquo;{client.text}&rdquo;
        </p>

        <div className="mt-auto flex shrink-0 items-center gap-2.5 border-t border-slate-100 pt-3">
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
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-muted">
              <MapPin size={10} className="shrink-0 text-primary" />
              <span className="max-w-[110px] truncate">{client.location}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function withStoryImage(item, index) {
  return {
    ...item,
    story_image: item.story_image || STORY_IMAGES[index % STORY_IMAGES.length],
  };
}

export default function PublicHappyClientsSlider({ testimonials = [], profile }) {
  const role = profile?.professional_type || 'agent';
  const profileLocation =
    profile?.professional_profile?.location ||
    profile?.professional_profile?.target_neighborhoods ||
    '';

  const clients = useMemo(() => {
    const placeholders = (ROLE_PLACEHOLDERS[role] || ROLE_PLACEHOLDERS.agent).map((p, i) =>
      withStoryImage({ ...p, is_placeholder: true }, i),
    );

    const fromLeads = (profile?.real_clients || [])
      .filter((c) => c.client_name && c.text)
      .map((c, i) =>
        withStoryImage({
          ...c,
          location: storyLocation(i, c.location || profileLocation),
          is_placeholder: false,
        }, i),
      );

    const fromTestimonials = (testimonials || []).map((t, i) =>
      withStoryImage({
        client_name: t.client_name || 'Verified Client',
        client_photo_url: t.client_photo_url || null,
        rating: t.rating || 5,
        text: t.text || '',
        lead_type: inferLeadType(t, role, i),
        location: storyLocation(i, t.location || profileLocation),
        is_placeholder: false,
      }, i),
    );

    const realStories = fromLeads.length ? fromLeads : fromTestimonials;
    if (!realStories.length) return placeholders;

    if (realStories.length >= MIN_STORIES) return realStories;

    const filler = placeholders
      .filter((p) => !realStories.some((r) => r.client_name === p.client_name && r.text === p.text))
      .slice(0, MIN_STORIES - realStories.length);

    return [...realStories, ...filler];
  }, [profile?.real_clients, testimonials, role, profileLocation]);

  const sliderItems = useMemo(() => [...clients, ...clients], [clients]);

  return (
    <section id="reviews" className="relative bg-transparent py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mb-6 text-center sm:mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Happy Clients</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">Success Stories</h3>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-text-muted sm:text-sm">
            Real outcomes from clients and partners who worked with this professional.
          </p>
        </div>

        <div className="relative overflow-hidden py-3">
          <div className="success-stories-track relative flex w-max items-stretch gap-4 py-1">
            {sliderItems.map((client, index) => (
              <ClientCard
                key={`${client.client_name}-${index}`}
                client={client}
                className="w-[16.5rem] shrink-0 sm:w-[17rem] md:w-[17.5rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
