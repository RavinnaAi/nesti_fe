'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Bot, Briefcase, CalendarCheck, Eye, Menu, ShieldCheck, Star, Users, X } from 'lucide-react';

export default function PublicHero({ profile, onCTAClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const professionalType = profile.professional_type;
  const roleLabel =
    professionalType === 'mortgage_broker'
      ? 'Mortgage Broker'
      : professionalType === 'lawyer'
        ? 'Real Estate Lawyer'
        : 'Real Estate Agent';
  const totals = profile.dashboard_kpis?.totals || {};
  const rates = profile.dashboard_kpis?.conversion_rates || {};

  const formatInt = (value) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return '0';
    if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
    return String(Math.round(number));
  };

  const formatPercent = (value) => {
    const number = Number(value || 0);
    return `${Math.round(number * 100)}%`;
  };

  const getStatsConfig = () => {
    return [
      {
        icon: <Users className="text-primary" size={17} />,
        value: `${formatInt(totals.leads_created)}+`,
        label: 'New Leads',
      },
      {
        icon: <Eye className="text-primary" size={17} />,
        value: `${formatInt(totals.lead_views)}+`,
        label: 'Lead Views',
      },
      {
        icon: <CalendarCheck className="text-primary" size={17} />,
        value: `${formatInt(totals.appointments_booked)}+`,
        label: 'Appointments',
      },
      {
        icon: <Award className="text-primary" size={17} />,
        value: formatPercent(rates.closed_won_from_created),
        label: 'Win Rate',
      },
    ];
  };

  const statsConfig = getStatsConfig();
  const calendlyLink = profile.professional_profile?.calendly_link || '';
  const trackedCalendlyLink = (() => {
    if (!calendlyLink) return '';
    try {
      const url = new URL(calendlyLink);
      url.searchParams.set('utm_source', 'nesti_public_profile');
      url.searchParams.set('utm_campaign', profile.professional_user_id || profile.id || profile.slug || '');
      url.searchParams.set('utm_content', 'public_profile_consultation');
      return url.toString();
    } catch {
      return calendlyLink;
    }
  })();
  const handleConsultationClick = () => {
    if (trackedCalendlyLink) {
      window.open(trackedCalendlyLink, '_blank', 'noopener,noreferrer');
      onCTAClick?.('book_consultation');
      return;
    }
    onCTAClick?.('book_consultation');
  };
  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#services', label: 'Services' },
    ...(professionalType === 'agent'
      ? [{ href: '#properties', label: 'Properties' }]
      : professionalType === 'mortgage_broker'
        ? [{ href: '#programs', label: 'Programs' }]
        : []),
    { href: '#reviews', label: 'Reviews' },
    { href: '#network', label: 'Network' },
    { href: '#guide', label: 'Guide' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-16">
      <header className="fixed inset-x-0 top-0 z-[1000] border-b border-border/70 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition hover:bg-primary/5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/20">
              <Bot size={20} />
            </span>
            <span className="flex min-h-10 flex-col justify-center leading-tight">
              <span className="text-base font-semibold tracking-tight text-text-heading">Nesti AI</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Real Estate Intelligence</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[13px] font-semibold text-text-heading lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:inline-flex">
            <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
              {profile.profile_photo_url ? (
                <Image
                  src={profile.profile_photo_url}
                  alt={profile.professional_name || roleLabel}
                  fill
                  className="object-cover object-center"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-sm font-bold">
                  {profile.professional_name?.charAt(0) || 'P'}
                </span>
              )}
            </span>
            <span>
              <span className="block text-base font-bold leading-tight text-text-heading">
                {profile.professional_name || 'Nesti Professional'}
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                {roleLabel}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-text-muted transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary lg:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white/98 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1 text-sm font-medium text-text-heading">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 transition hover:bg-primary/5 hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="relative min-h-[430px] overflow-hidden">
        {profile.cover_photo_url ? (
          <Image
            src={profile.cover_photo_url}
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/20 via-white to-primary/30" />
        )}
        {/* Desktop/tablet overlay — light premium fade without hard edges */}
        <div className="absolute inset-0 hidden sm:block"
          style={{
            background: [
              'linear-gradient(to right, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.82) 30%, rgba(255,255,255,0.42) 54%, rgba(255,255,255,0.08) 72%, transparent 88%)',
              'linear-gradient(to top,   rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.30) 30%, transparent 56%)',
            ].join(', '),
          }}
        />
        {/* Mobile overlay — stronger readability over busy cover photos */}
        <div className="absolute inset-0 sm:hidden"
          style={{
            background: [
              'linear-gradient(to bottom, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.86) 42%, rgba(255,255,255,0.74) 72%, rgba(255,255,255,0.88) 100%)',
              'linear-gradient(to right, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 58%, rgba(255,255,255,0.34) 100%)',
            ].join(', '),
          }}
        />

        <div className="relative z-10 mx-auto grid min-h-[430px] max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7 lg:max-w-2xl">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700">
              Top Rated {roleLabel}
            </span>

            <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-[1.12] tracking-tight text-text-heading sm:text-3xl lg:text-[38px]">
              {profile.headline || `Work with ${profile.professional_name}`}
            </h1>

            {profile.tagline && (
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-text-body">
                {profile.tagline}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleConsultationClick}
                className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark"
              >
                Book a Free Consultation
              </button>
            </div>

            <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {statsConfig.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/90 shadow-sm">
                    {stat.icon}
                  </span>
                  <div>
                    <div className="text-xs font-semibold leading-tight text-text-heading">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-medium leading-tight text-text-muted">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="ml-auto max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-text-heading shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-2.5">
                <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-primary shadow-sm ring-1 ring-slate-200">
                  {profile.profile_photo_url ? (
                    <Image
                      src={profile.profile_photo_url}
                      alt={profile.professional_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-bold">
                      {profile.professional_name?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">{profile.professional_name}</div>
                  <div className="text-[10px] text-slate-500">Your Local {roleLabel}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-primary" />
                  Trusted Advisor
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase size={13} className="text-primary" />
                  Client Focused
                </div>
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-primary" />
                  AI Powered Follow-up
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

