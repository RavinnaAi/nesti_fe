'use client';

import { Briefcase, MapPin, Sparkles } from 'lucide-react';

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueItems(items) {
  return Array.from(new Set(items.filter(Boolean))).slice(0, 8);
}

function fallbackServices(role) {
  if (role === 'mortgage_broker') {
    return ['Pre-approval guidance', 'Mortgage strategy', 'Credit readiness'];
  }
  if (role === 'lawyer') {
    return ['Purchase closings', 'Contract review', 'Secure transaction guidance'];
  }
  return ['Buying guidance', 'Selling strategy', 'Market consultation'];
}

export default function PublicExpertiseBand({ profile, onCTAClick }) {
  const professionalProfile = profile.professional_profile || {};
  const role = profile.professional_type;
  const services = uniqueItems([
    ...(profile.services || []).map((service) => service?.title),
    ...(profile.practice_areas || []),
    ...fallbackServices(role),
  ]);
  const expertise = uniqueItems([
    ...normalizeList(professionalProfile.specializations),
    ...normalizeList(professionalProfile.certificates),
    ...normalizeList(professionalProfile.awards),
    ...normalizeList(professionalProfile.preferred_clients),
  ]);
  const areas = uniqueItems([
    ...normalizeList(professionalProfile.target_neighborhoods),
    ...normalizeList(professionalProfile.location),
  ]);

  const columns = [
    {
      title: 'Services',
      subtitle: 'What clients can request',
      Icon: Briefcase,
      items: services,
    },
    {
      title: 'Expertise',
      subtitle: 'Professional strengths',
      Icon: Sparkles,
      items: expertise.length ? expertise : ['Client-focused advice', 'Clear communication', 'Premium guidance'],
    },
    {
      title: 'Areas',
      subtitle: 'Markets and locations served',
      Icon: MapPin,
      items: areas.length ? areas : ['Local market support', 'Remote consultation available'],
    },
  ];

  return (
    <section className="relative border-y border-border bg-gradient-to-b from-white via-primary/[0.025] to-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Professional Snapshot
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-heading">
              Services, Expertise & Areas
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            A quick view of what this professional handles, where they work, and the strengths clients can expect.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {columns.map(({ title, subtitle, Icon, items }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon size={19} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-text-heading">{title}</h3>
                    <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2">
                {items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onCTAClick?.('contact')}
                    className="rounded-full border border-border bg-gradient-to-b from-white to-gray-50 px-3.5 py-2 text-xs font-semibold text-text-body shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




