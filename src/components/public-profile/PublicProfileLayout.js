'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Globe, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import BackgroundElements from '@/components/layout/BackgroundElements';
import CustomToastContainer from '@/components/ui/ToastContainer';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

export default function PublicProfileLayout({ profile, children }) {
  const trackedViewRef = useRef(false);

  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;

    const sessionId = generateSessionId();
    const visitorId = generateVisitorId();
    
    const trackView = async () => {
      try {
        await trackAnalyticsEvent({
          slug: profile.slug,
          event_type: 'profile_view',
          session_id: sessionId,
          visitor_id: visitorId,
        });
      } catch (error) {
        console.error('Failed to track profile view:', error);
      }
    };

    trackView();
  }, [profile.slug]);

  const socialLinks = profile.social_links || {};
  const hasSocial = Object.values(socialLinks).some(link => link);
  const roleLabel =
    profile.professional_type === 'mortgage_broker'
      ? 'Mortgage Broker'
      : profile.professional_type === 'lawyer'
        ? 'Real Estate Lawyer'
        : 'Real Estate Agent';
  const company = profile.professional_profile?.company_name;
  const email = profile.email;
  const phone = profile.professional_profile?.phone;
  const roleLinks =
    profile.professional_type === 'agent'
      ? [
          { href: '#properties', label: 'Properties' },
        ]
      : profile.professional_type === 'mortgage_broker'
        ? [{ href: '#programs', label: 'Programs' }]
        : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <BackgroundElements variant="default" />
      {/* Main Content */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.65fr_0.85fr]">
            <div>
              <div className="flex items-start gap-4">
                {profile.profile_photo_url ? (
                  <Image
                    src={profile.profile_photo_url}
                    alt={profile.professional_name}
                    width={56}
                    height={56}
                    sizes="56px"
                    className="h-14 w-14 rounded-xl object-cover object-center ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                    {String(profile.professional_name || 'P').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-text-heading">{profile.professional_name}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{roleLabel}</div>
                  {company && <div className="mt-1 text-xs text-text-muted">{company}</div>}
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-text-muted">
                {profile.tagline || profile.about || 'Professional real estate services backed by guided AI support.'}
              </p>
              {(email || phone) && (
                <div className="mt-4 space-y-2 text-sm text-text-muted">
                  {email && (
                    <a href={`mailto:${email}`} className="flex min-w-0 items-center gap-2 transition hover:text-primary">
                      <Mail size={14} className="shrink-0 text-primary" />
                      <span className="min-w-0 break-all">{email}</span>
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} className="flex min-w-0 items-center gap-2 transition hover:text-primary">
                      <Phone size={14} className="shrink-0 text-primary" />
                      <span className="min-w-0">{phone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-text-heading">Explore</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="#about" className="text-text-muted transition hover:text-primary">About</Link></li>
                <li><Link href="#services" className="text-text-muted transition hover:text-primary">Services</Link></li>
                {roleLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-text-muted transition hover:text-primary">{link.label}</Link>
                  </li>
                ))}
                <li><Link href="#reviews" className="text-text-muted transition hover:text-primary">Reviews</Link></li>
                <li><Link href="#guide" className="text-text-muted transition hover:text-primary">Guide</Link></li>
                <li><Link href="#contact" className="text-text-muted transition hover:text-primary">How to connect</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-text-heading">Connect</h3>
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                <div className="flex items-start gap-2">
                  <MessageCircle size={15} className="mt-0.5 shrink-0 text-primary" />
                  <span>Use the chat bubble to ask questions or start an inquiry.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
                  <span>Requests are routed with context for professional follow-up.</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {hasSocial && (
                  <>
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-text-muted transition hover:border-primary/30 hover:text-primary" aria-label="Website">
                      <Globe size={15} />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-xs font-bold text-text-muted transition hover:border-primary/30 hover:text-primary" aria-label="LinkedIn">in</a>
                  )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {profile.professional_name}. All rights reserved.</p>
            <Link href="/" className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-primary transition hover:text-primary/80">
              <span className="grid h-7 w-7 place-items-center rounded-lg overflow-hidden">
                <Image
                  src="/logo/logo.png"
                  alt="Nesti AI logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-cover"
                />
              </span>
              <span>Powered by Nesti AI</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </footer>
      <CustomToastContainer />
    </div>
  );
}

