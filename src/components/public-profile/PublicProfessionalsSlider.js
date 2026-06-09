'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, MapPin, Scale, Home } from 'lucide-react';
import { getPublicProfessionalNetwork } from '@/lib/publicProfileClient';

const CARD_HEIGHT = 'h-[232px]';
const ROLE_CHIP = 'border-emerald-200 bg-emerald-50 text-emerald-700';
const ROLE_AVATAR = 'bg-emerald-600';

const ROLE_META = {
  agent: { label: 'Real Estate Agent', Icon: Home },
  mortgage_broker: { label: 'Mortgage Broker', Icon: Briefcase },
  lawyer: { label: 'Real Estate Lawyer', Icon: Scale },
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

function ProfessionalCard({ pro, className = '' }) {
  const meta = ROLE_META[pro.professional_type] || ROLE_META.agent;
  const { Icon } = meta;

  const inner = (
    <>
      <div className="relative h-[84px] shrink-0 overflow-hidden bg-slate-50">
        {pro.cover_photo_url ? (
          <Image
            src={pro.cover_photo_url}
            alt={`${pro.professional_name} cover`}
            fill
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50">
            <Icon size={22} strokeWidth={1.25} className="text-slate-300" />
          </div>
        )}
      </div>

      <div className="relative -mt-7 flex shrink-0 justify-center">
        <div className="relative">
          {pro.profile_photo_url ? (
            <div className="relative h-[54px] w-[54px] overflow-hidden rounded-full bg-white p-[2px] shadow-[0_4px_14px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <Image
                  src={pro.profile_photo_url}
                  alt={pro.professional_name}
                  fill
                  className="object-cover object-top"
                  sizes="54px"
                />
              </div>
            </div>
          ) : (
            <div className="relative h-[54px] w-[54px] rounded-full bg-white p-[2px] shadow-[0_4px_14px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60">
              <div className={`grid h-full w-full place-items-center rounded-full text-xs font-semibold text-white ${ROLE_AVATAR}`}>
                {initials(pro.professional_name)}
              </div>
            </div>
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-white text-white ${ROLE_AVATAR}`}>
            <Icon size={8} strokeWidth={2.25} />
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center px-4 pb-3.5 pt-1 text-center">
        <h4 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-5 tracking-tight text-text-heading">
          {pro.professional_name}
        </h4>

        <p className="mt-0.5 line-clamp-1 h-4 w-full text-[11px] text-text-muted">
          {pro.company_name || '\u00A0'}
        </p>

        <div className="mt-0.5 flex h-4 w-full items-center justify-center gap-1 text-[10px] text-text-muted">
          {pro.location ? (
            <>
              <MapPin size={10} className="shrink-0 text-primary/70" />
              <span className="line-clamp-1">{pro.location}</span>
            </>
          ) : (
            <span aria-hidden="true">&nbsp;</span>
          )}
        </div>

        <span className={`mt-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${ROLE_CHIP}`}>
          <Icon size={9} strokeWidth={2} />
          {meta.label}
        </span>
      </div>
    </>
  );

  const cardClass = `group flex ${CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md ${className}`;

  return pro.slug ? (
    <Link href={`/professional/${pro.slug}`} className={cardClass}>
      {inner}
    </Link>
  ) : (
    <div className={cardClass}>{inner}</div>
  );
}

function LoadingSkeleton() {
  return (
    <section id="network" className="relative bg-transparent py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mb-6 text-center sm:mb-7">
          <div className="mx-auto mb-2 h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mx-auto mb-2 h-8 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mx-auto h-4 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[232px] w-[16.5rem] shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-white md:w-[17.5rem]" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PublicProfessionalsSlider({ currentSlug }) {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedSlugRef = useRef('');

  useEffect(() => {
    const key = currentSlug || '';
    if (fetchedSlugRef.current === key) return;
    fetchedSlugRef.current = key;

    getPublicProfessionalNetwork({ limit: 60, exclude: currentSlug })
      .then((data) => setProfessionals(data.professionals || []))
      .catch(() => setProfessionals([]))
      .finally(() => setLoading(false));
  }, [currentSlug]);

  const sliderItems = useMemo(() => [...professionals, ...professionals], [professionals]);

  if (loading) return <LoadingSkeleton />;
  if (!professionals.length) return null;

  return (
    <section id="network" className="relative bg-transparent py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mb-6 text-center sm:mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Nesti AI Network</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">Meet Our Professionals</h3>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-text-muted sm:text-sm">
            Trusted agents, mortgage brokers, and lawyers in your area.
          </p>
        </div>

        <div className="relative overflow-hidden py-3">
          <div className="press-logo-track relative flex w-max items-stretch gap-4 py-1">
            {sliderItems.map((pro, index) => (
              <ProfessionalCard
                key={`${pro.slug || pro.professional_name}-${index}`}
                pro={pro}
                className="w-[16.5rem] shrink-0 md:w-[17.5rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
