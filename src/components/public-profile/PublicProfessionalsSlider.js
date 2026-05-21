'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, Scale, Home } from 'lucide-react';
import { getPublicProfessionalNetwork } from '@/lib/publicProfileClient';

const ROLE_META = {
  agent: {
    label: 'Real Estate Agent',
    Icon: Home,
    bg: 'from-emerald-500 to-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent: 'text-emerald-600',
  },
  mortgage_broker: {
    label: 'Mortgage Broker',
    Icon: Briefcase,
    bg: 'from-blue-500 to-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'text-blue-600',
  },
  lawyer: {
    label: 'Real Estate Lawyer',
    Icon: Scale,
    bg: 'from-violet-500 to-violet-600',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    accent: 'text-violet-600',
  },
};

function initials(name) {
  return String(name || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function ProfessionalCard({ pro }) {
  const meta = ROLE_META[pro.professional_type] || ROLE_META.agent;
  const { Icon } = meta;

  const inner = (
    <>
      {/* Cover header */}
      <div className={`relative flex h-[82px] items-center justify-center overflow-hidden bg-gradient-to-r ${meta.bg}`}>
        {pro.cover_photo_url ? (
          <>
            <Image
              src={pro.cover_photo_url}
              alt={`${pro.professional_name} cover`}
              fill
              className="object-cover object-center"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${meta.bg} opacity-45`} />
          </>
        ) : null}
        <Icon size={20} className="relative z-10 text-white/80" />
      </div>

      {/* Avatar */}
      <div className="relative -mt-7 mb-2 flex justify-center">
        {pro.profile_photo_url ? (
          <div className="relative h-[52px] w-[52px] overflow-hidden rounded-full border-[3px] border-white shadow-md">
            <Image src={pro.profile_photo_url} alt={pro.professional_name} fill className="object-cover object-top" sizes="52px" />
          </div>
        ) : (
          <div className={`grid h-[52px] w-[52px] place-items-center rounded-full border-[3px] border-white bg-gradient-to-br ${meta.bg} text-sm font-bold text-white shadow-md`}>
            {initials(pro.professional_name)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center px-4 pb-4 text-center">
        <div className="mb-0.5 text-[13px] font-bold leading-snug text-text-heading">
          {pro.professional_name}
        </div>

        {/* Company name — always reserve space */}
        <div className="mb-3 h-4 text-[11px] text-text-muted">
          {pro.company_name || ''}
        </div>

        <div className="mb-4 flex justify-center">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.badge}`}>
            <Icon size={9} />
            {meta.label}
          </span>
        </div>

      </div>
    </>
  );

  const cls = 'flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md';

  return pro.slug ? (
    <Link href={`/professional/${pro.slug}`} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const CARDS_PER_PAGE = 3;
const AUTO_SLIDE_MS = 3500;

export default function PublicProfessionalsSlider({ currentSlug }) {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getPublicProfessionalNetwork({ limit: 60, exclude: currentSlug })
      .then((data) => setProfessionals(data.professionals || []))
      .catch(() => setProfessionals([]))
      .finally(() => setLoading(false));
  }, [currentSlug]);

  // Cycle the raw list so every page has exactly 3 cards
  const cycles = professionals.length > 0 ? Math.ceil((CARDS_PER_PAGE * 3) / professionals.length) : 1;
  const cycledAll = professionals.length > 0
    ? Array.from({ length: professionals.length * cycles }, (_, i) => professionals[i % professionals.length])
    : [];
  const totalPages = cycledAll.length > 0 ? Math.ceil(cycledAll.length / CARDS_PER_PAGE) : 0;
  const totalPagesRef = useRef(totalPages);
  useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);

  const advance = () => {
    setFading(true);
    setTimeout(() => {
      setPage((prev) => (prev >= totalPagesRef.current - 1 ? 0 : prev + 1));
      setFading(false);
    }, 300);
  };

  const goToPage = (i) => {
    clearInterval(timerRef.current);
    setFading(true);
    setTimeout(() => { setPage(i); setFading(false); }, 300);
    timerRef.current = setInterval(advance, AUTO_SLIDE_MS);
  };

  // Infinite auto-slide
  useEffect(() => {
    if (totalPages <= 1) return;
    timerRef.current = setInterval(advance, AUTO_SLIDE_MS);
    return () => clearInterval(timerRef.current);
  }, [totalPages]);

  if (loading) {
    return (
      <section id="network" className="bg-slate-50/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 h-12 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!professionals.length) return null;

  const visible = cycledAll.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <section id="network" className="bg-slate-50/70 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Nesti AI Network</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">Meet Our Professionals</h3>
          <p className="mt-1.5 text-sm text-text-muted">
            Trusted agents, mortgage brokers, and lawyers in your area.
          </p>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}
        >
          {visible.map((pro, i) => (
            <ProfessionalCard key={`${pro.slug || pro.professional_name}-${i}`} pro={pro} />
          ))}
        </div>

        {/* Dot indicators */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
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

