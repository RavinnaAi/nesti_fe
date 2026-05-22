'use client';

import Image from 'next/image';
import { CalendarCheck, Clock3, ShieldCheck, Target, Zap } from 'lucide-react';

const toTitle = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const getInitials = (name) =>
  String(name || 'Professional')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function PublicAboutSection({ about, profile, role = 'agent' }) {
  const professionalProfile = profile?.professional_profile || {};
  const professionalName = profile?.professional_name || 'Trusted Professional';
  const profilePhoto = profile?.profile_photo_url;
  const detailItems = [
    { label: 'Availability', value: professionalProfile.availability, icon: CalendarCheck },
    { label: 'Response Time', value: professionalProfile.response_time, icon: Clock3 },
    { label: 'Support Level', value: professionalProfile.support_level, icon: ShieldCheck },
    { label: 'Approach', value: professionalProfile.sales_approach || professionalProfile.negotiation_style, icon: Target },
    { label: 'Energy', value: professionalProfile.energy_style || professionalProfile.personality_tag, icon: Zap },
  ].filter((item) => item.value);

  const paragraphs = String(about || '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) return null;

  return (
    <section id="about" className="bg-transparent py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main content row – both columns stretch to the same height */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-14">
          {/* Left - Portrait */}
          <div className="flex flex-col items-center lg:w-72 lg:shrink-0 lg:items-start">
            <div className="relative w-60 flex-1 overflow-hidden rounded-2xl bg-slate-100 shadow-md sm:w-72" style={{ minHeight: '260px' }}>
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt={professionalName}
                  fill
                  sizes="(min-width: 640px) 288px, 240px"
                  className="object-cover object-center"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/20 to-primary/5 text-4xl font-bold text-primary">
                  {getInitials(professionalName)}
                </div>
              )}
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-text-heading lg:text-left">
              {professionalName}
            </h3>
            <p className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-widest text-primary lg:text-left">
              {professionalProfile.company_name || toTitle(profile?.professional_type)}
            </p>
          </div>

          {/* Right - Bio */}
          <div className="flex flex-1 flex-col justify-center lg:pt-2">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Get to know me
            </div>
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">
              The story behind the service
            </h2>
            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-[15px] leading-8 text-text-body">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom - Detail chips */}
        {detailItems.length > 0 && (
          <div className="mt-10 border-t border-slate-100 pt-8">
            <div className="flex flex-wrap justify-center gap-4">
              {detailItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 shadow-sm"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                      <Icon size={15} />
                    </span>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {item.label}
                      </div>
                      <div className="text-sm font-medium text-text-heading">
                        {toTitle(item.value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!detailItems.length && (
          <div className="mt-10 border-t border-slate-100 pt-8">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck size={15} />
              </span>
              <span className="text-sm text-text-muted">Client-first approach with responsive communication</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

