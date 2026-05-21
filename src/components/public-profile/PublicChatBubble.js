'use client';

import { useState } from 'react';
import Image from 'next/image';
import PublicInquiryChatWidget from './PublicInquiryChatWidget';

const ROLE_LABEL = {
  agent: 'Chat with Agent',
  mortgage_broker: 'Chat with Broker',
  lawyer: 'Chat with Lawyer',
};

export default function PublicChatBubble({ profile, hideWhenOpen = false, controlledOpen, onControlledToggle }) {
  const [open, setOpen] = useState(false);

  const label = ROLE_LABEL[profile?.professional_type] || 'Chat Now';
  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? controlledOpen : open;
  const toggleOpen = () => {
    if (isControlled) {
      onControlledToggle?.(!isOpen);
      return;
    }
    setOpen((o) => !o);
  };
  const openChat = () => {
    if (isControlled) {
      onControlledToggle?.(true);
      return;
    }
    setOpen(true);
  };

  // Hide bubble entirely when another chat widget is already open on the page
  if (hideWhenOpen) return null;

  return (
    <>
      {/* Floating bubble */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col items-end gap-2">
        {/* Tooltip label — only when this bubble's own chat is closed */}
        {!isOpen && (
          <button
            onClick={openChat}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-text-heading shadow-lg ring-1 ring-slate-200 transition hover:shadow-xl"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            {label}
          </button>
        )}

        {/* Bubble button */}
        <div className="relative">
          <button
            onClick={toggleOpen}
            aria-label={isOpen ? 'Close chat' : label}
            className="relative h-16 w-16 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ padding: '3px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 8px 28px rgba(0,0,0,0.25)' }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-full">
              {profile?.profile_photo_url ? (
                <Image
                  src={profile.profile_photo_url}
                  alt={profile.professional_name || 'Professional'}
                  fill
                  sizes="64px"
                  className="object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-lg font-bold text-white">
                  {String(profile?.professional_name || 'P').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                </div>
              )}
            </div>
          </button>

          {/* Online dot */}
          <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          {isOpen && (
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-[13px] font-bold leading-none text-slate-600 shadow-sm">
              ×
            </span>
          )}
        </div>
      </div>

      {/* Chat widget modal */}
      {!isControlled && (
        <PublicInquiryChatWidget
          profile={profile}
          isOpen={open}
          onClose={() => setOpen(false)}
          inquiryType="contact"
        />
      )}
    </>
  );
}

