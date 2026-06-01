'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RolePreflightLeadForm from '@/components/chatbot/RolePreflightLeadForm';
import { emptyPreflightDraftForRole } from '@/components/chatbot/rolePreflightCapture';
import { getRolePreflightStartPayload } from '@/components/chatbot/widget/roleChatStrategy';

export default function BrokerPublicLeadForm({ submitting, onSubmitLead, onCancel, resetKey }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(() => emptyPreflightDraftForRole('mortgage_broker'));
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setStepIndex(0);
    setDraft(emptyPreflightDraftForRole('mortgage_broker'));
    setValidationError('');
  }, [resetKey]);

  const submit = async () => {
    setValidationError('');
    try {
      const { formContact } = getRolePreflightStartPayload('mortgage_broker', draft);
      await onSubmitLead({
        full_name: formContact.name,
        ...formContact,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to submit inquiry');
    }
  };

  return (
    <RolePreflightLeadForm
      role="mortgage_broker"
      roleUi={{}}
      draft={draft}
      onFieldChange={(field, value) => setDraft((d) => ({ ...d, [field]: value }))}
      onStartChat={submit}
      preflightStepIndex={stepIndex}
      onStepBack={() => setStepIndex((i) => Math.max(0, i - 1))}
      onStepNext={() => setStepIndex((i) => Math.min(2, i + 1))}
      validationError={validationError}
      loading={submitting}
      embedTokenMissing={false}
      startActionLabel={submitting ? 'Submitting...' : 'Submit inquiry'}
    />
  );
}
