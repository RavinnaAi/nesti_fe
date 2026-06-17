'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, Menu, Phone, ShieldCheck, UserPlus, X } from 'lucide-react';

const ROLE_HERO = {
  agent: {
    eyebrow: 'Local Market Partner',
    fallbackHeadline: (name) => `Move smarter with ${name}`,
    fallbackTagline:
      'Get guided support for buying, selling, pricing, showings, and consultation requests in one organized experience.',
    cardSubtitle: 'Local Real Estate Agent',
    trustItems: ['Buyer & seller guidance', 'Property inquiry support', 'AI organized follow-up'],
  },
  mortgage_broker: {
    eyebrow: 'Mortgage Strategy Partner',
    fallbackHeadline: (name) => `Plan your financing with ${name}`,
    fallbackTagline:
      'Start a guided mortgage inquiry for pre-approval, affordability, refinancing, and document readiness.',
    cardSubtitle: 'Mortgage Planning Specialist',
    trustItems: ['Pre-approval guidance', 'Affordability review', 'Loan strategy follow-up'],
  },
  lawyer: {
    eyebrow: 'Real Estate Legal Partner',
    fallbackHeadline: (name) => `Close with clarity beside ${name}`,
    fallbackTagline:
      'Ask about contracts, title matters, closing timelines, and legal transaction support before your next step.',
    cardSubtitle: 'Real Estate Legal Advisor',
    trustItems: ['Contract review support', 'Closing timeline guidance', 'Secure legal intake'],
  },
};

export default function PublicHero({ profile, onCTAClick, onDirectLeadClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const professionalType = profile.professional_type;
  const heroContent = ROLE_HERO[professionalType] || ROLE_HERO.agent;
  const professionalProfile = profile.professional_profile || {};
  const companyName = professionalProfile.company_name || '';
  const email = profile.email || '';
  const phone = professionalProfile.phone || profile.phone || '';
  const roleLabel =
    professionalType === 'mortgage_broker'
      ? 'Mortgage Broker'
      : professionalType === 'lawyer'
        ? 'Real Estate Lawyer'
        : 'Real Estate Agent';
  const inviteShareUrl = String(profile.invite_link?.share_url || '').trim();
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
    { href: '#guide', label: 'Guide' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <section className="relative overflow-hidden bg-transparent pt-16">
      <header className="fixed inset-x-0 top-0 z-[1000] border-b border-border/70 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition hover:bg-primary/5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg overflow-hidden">
              <Image
                src="/logo/logo.png"
                alt="Nesti AI logo"
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
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
        {/* Tablet overlay — stronger than desktop for text contrast on medium screens */}
        <div
          className="absolute inset-0 hidden md:block lg:hidden"
          style={{
            background: [
              'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 42%, rgba(255,255,255,0.62) 68%, rgba(255,255,255,0.26) 84%, transparent 96%)',
              'linear-gradient(to top, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.44) 36%, rgba(255,255,255,0.12) 68%, transparent 100%)',
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
          <div className="rounded-2xl bg-white/72 p-4 backdrop-blur-[1.5px] sm:p-5 md:p-6 lg:col-span-7 lg:max-w-2xl lg:rounded-none lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
            <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
              {heroContent.eyebrow}
            </span>

            <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-[1.12] tracking-tight text-text-heading sm:text-3xl lg:text-[38px]">
              {profile.headline || heroContent.fallbackHeadline(profile.professional_name || 'this professional')}
            </h1>

            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-text-heading/85 lg:text-text-body">
              {profile.tagline || heroContent.fallbackTagline}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {heroContent.trustItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-[11px] font-semibold text-text-body shadow-sm"
                >
                  <ShieldCheck size={12} className="text-primary" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onDirectLeadClick}
                className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark"
              >
                Submit inquiry
              </button>
              <button
                onClick={handleConsultationClick}
                className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark"
              >
                Book a Free Consultation
              </button>
              {inviteShareUrl ? (
                <a
                  href={inviteShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white/95 px-4 py-2.5 text-xs font-bold text-primary shadow-lg shadow-primary/10 ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-primary/20"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-white/20 group-hover:text-white">
                    <UserPlus size={14} />
                  </span>
                  Join Nesti
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="ml-auto w-fit min-w-[18rem] max-w-[24rem] rounded-2xl bg-white p-3 text-left text-text-heading shadow-xl shadow-slate-900/10">
              <div className="flex items-start gap-2.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-primary/15 bg-primary/10 shadow-sm ring-1 ring-slate-200">
                  {profile.profile_photo_url ? (
                    <Image
                      src={profile.profile_photo_url}
                      alt={profile.professional_name}
                      fill
                      sizes="56px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-lg font-bold text-primary">
                      {profile.professional_name?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold leading-tight">{profile.professional_name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{heroContent.cardSubtitle}</div>
                  {companyName ? <div className="mt-1 truncate text-xs font-semibold text-text-heading">{companyName}</div> : null}
                </div>
              </div>

              {(email || phone) ? (
                <div className="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-600">
                  {email ? (
                    <div className="flex min-w-0 items-start gap-2">
                      <Mail size={13} className="mt-0.5 shrink-0 text-primary" />
                      <span className="min-w-0 break-all">{email}</span>
                    </div>
                  ) : null}
                  {phone ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <Phone size={13} className="shrink-0 text-primary" />
                      <span className="min-w-0">{phone}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

