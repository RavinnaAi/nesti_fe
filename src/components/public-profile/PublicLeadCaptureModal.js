'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { submitPublicLead } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';
import AgentPublicLeadForm from '@/components/public-profile/lead-capture/AgentPublicLeadForm';
import BrokerPublicLeadForm from '@/components/public-profile/lead-capture/BrokerPublicLeadForm';
import LawyerPublicLeadForm from '@/components/public-profile/lead-capture/LawyerPublicLeadForm';
import { buildInquiredPropertyPayload } from '@/lib/inquiredPropertyUtils';

function buildAgentPrefillFromProperty(property) {
  if (!property || typeof property !== 'object') return { prefillIntent: null, prefillLeadDraft: null };
  return {
    prefillIntent: 'buy',
    prefillLeadDraft: {
      location: property.location || property.address || '',
      address: property.address || property.location || '',
      property_type: property.property_type || '',
      beds: property.bedrooms ? String(property.bedrooms) : '',
      baths: property.bathrooms ? String(property.bathrooms) : '',
      budget: property.expected_price || '',
      timeline: property.timeline || '',
    },
  };
}

export default function PublicLeadCaptureModal({
  open,
  onClose,
  profile,
  onSubmitted,
  prefillProperty = null,
}) {
  const role = profile?.professional_type || 'agent';
  const [submitting, setSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const { prefillIntent, prefillLeadDraft } = buildAgentPrefillFromProperty(prefillProperty);

  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
    setResetKey((v) => v + 1);
    setSessionId(generateSessionId());
    setVisitorId(generateVisitorId());
  }, [open, role]);

  if (!open) return null;

  const roleTitle =
    role === 'lawyer'
      ? 'Submit legal inquiry'
      : role === 'mortgage_broker'
        ? 'Submit mortgage inquiry'
        : 'Submit property inquiry';

  const submitPayload = async (payload) => {
    if (!profile?.slug) return;
    setSubmitting(true);
    try {
      const inquiredProperty =
        role === 'agent' ? buildInquiredPropertyPayload(prefillProperty, profile) : null;
      const res = await submitPublicLead(profile.slug, {
        ...payload,
        ...(inquiredProperty ? { inquired_property: inquiredProperty } : {}),
        session_id: sessionId || generateSessionId(),
        visitor_id: visitorId || generateVisitorId(),
      });
      toast.success(res?.message || 'Inquiry submitted successfully');
      onSubmitted?.(res);
      onClose?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-text-heading">{roleTitle}</h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Same role-based intake fields as chatbot lead creation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-text-muted transition hover:bg-slate-100 hover:text-text-heading disabled:opacity-60"
            aria-label="Close inquiry form"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {role === 'agent' && (
            <AgentPublicLeadForm
              submitting={submitting}
              onSubmitLead={submitPayload}
              onCancel={onClose}
              resetKey={resetKey}
              embedToken={profile?.embed_token || ''}
              sessionId={sessionId}
              prefillIntent={prefillIntent}
              prefillLeadDraft={prefillLeadDraft}
            />
          )}
          {role === 'mortgage_broker' && (
            <BrokerPublicLeadForm
              submitting={submitting}
              onSubmitLead={submitPayload}
              onCancel={onClose}
              resetKey={resetKey}
            />
          )}
          {role === 'lawyer' && (
            <LawyerPublicLeadForm
              submitting={submitting}
              onSubmitLead={submitPayload}
              onCancel={onClose}
              resetKey={resetKey}
            />
          )}
        </div>
        {submitting ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/35">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
