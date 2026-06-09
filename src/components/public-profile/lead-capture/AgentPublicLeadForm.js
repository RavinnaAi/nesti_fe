'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AgentLeadOnboarding from '@/components/chatbot/AgentLeadOnboarding';
import { emptyAgentLeadDraft, PRE_CHAT_STEPS } from '@/components/chatbot/agentLeadCapture';
import { attachSellerImagesToAgentFormContact } from '@/components/chatbot/widget/agentSellerImageUpload';
import {
  AGENT_PROPERTY_STEP_REQUIRED,
  AGENT_QUALIFY_STEP_REQUIRED,
  AGENT_REACH_STEP_REQUIRED,
  getAgentStartPayload,
  getBasicContactValidationError,
  missingDraftFields,
} from '@/components/chatbot/widget/roleChatStrategy';

export default function AgentPublicLeadForm({
  submitting,
  onSubmitLead,
  onCancel,
  resetKey,
  embedToken = '',
  sessionId = '',
  prefillIntent = null,
  prefillLeadDraft = null,
}) {
  const [step, setStep] = useState('intent');
  const [chosenIntent, setChosenIntent] = useState(null);
  const [draft, setDraft] = useState(() => emptyAgentLeadDraft());
  const [propertyImageFiles, setPropertyImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const initialIntent = prefillIntent === 'buy' || prefillIntent === 'sell' ? prefillIntent : null;
    setStep(initialIntent ? 'contact' : 'intent');
    setChosenIntent(initialIntent);
    setDraft({
      ...emptyAgentLeadDraft(),
      ...(prefillLeadDraft && typeof prefillLeadDraft === 'object' ? prefillLeadDraft : {}),
    });
    setPropertyImageFiles([]);
    setUploadingImages(false);
    setValidationError('');
  }, [resetKey, prefillIntent, prefillLeadDraft]);

  const goNext = () => {
    setValidationError('');
    if (step === 'intent') {
      if (!chosenIntent) return setValidationError('Please choose buy or sell to continue.');
      return setStep('contact');
    }
    if (step === 'contact') {
      const contactError = getBasicContactValidationError(draft);
      if (contactError) return setValidationError(contactError);
      return setStep('property');
    }
    if (step === 'property') {
      const required = AGENT_PROPERTY_STEP_REQUIRED[chosenIntent === 'sell' ? 'sell' : 'buy'];
      if (missingDraftFields(draft, required).length) return setValidationError('Please complete all property details.');
      if (chosenIntent === 'sell' && !propertyImageFiles.length) {
        return setValidationError('Please upload at least one property image for seller inquiries.');
      }
      return setStep('qualify');
    }
    if (step === 'qualify') {
      if (missingDraftFields(draft, AGENT_QUALIFY_STEP_REQUIRED).length) {
        return setValidationError('Please complete all qualification fields.');
      }
      setStep('reach');
    }
  };

  const submit = async () => {
    setValidationError('');
    if (!chosenIntent) return setValidationError('Please choose buy or sell to continue.');
    const contactError = getBasicContactValidationError(draft);
    if (contactError) return setValidationError(contactError);
    const propertyRequired = AGENT_PROPERTY_STEP_REQUIRED[chosenIntent === 'sell' ? 'sell' : 'buy'];
    if (missingDraftFields(draft, propertyRequired).length) return setValidationError('Please complete all property details.');
    if (missingDraftFields(draft, AGENT_QUALIFY_STEP_REQUIRED).length) return setValidationError('Please complete all qualification fields.');
    if (missingDraftFields(draft, AGENT_REACH_STEP_REQUIRED).length) return setValidationError('Please complete contact preferences.');

    try {
      const { formContact } = getAgentStartPayload(chosenIntent, draft);
      let nextFormContact = formContact;
      if (chosenIntent === 'sell') {
        setUploadingImages(true);
        try {
          const uploadResult = await attachSellerImagesToAgentFormContact({
            intent: chosenIntent,
            formContact,
            embedToken,
            sessionId,
            propertyImageFiles,
            messages: {
              missingImages: 'Please upload at least one property image for seller inquiries.',
              missingSession: 'Chat session is not ready. Please close and reopen the inquiry form.',
              emptyUpload: 'Property images could not be uploaded. Please try again.',
              uploadFailed: 'Property images could not be uploaded. Please try again.',
            },
          });
          nextFormContact = uploadResult.formContact;
          setDraft((prev) => ({
            ...prev,
            property_images: uploadResult.uploadedImages,
          }));
        } catch (uploadError) {
          setValidationError(uploadError?.message || 'Property images could not be uploaded. Please try again.');
          return;
        } finally {
          setUploadingImages(false);
        }
      }
      await onSubmitLead({
        full_name: nextFormContact.name,
        ...nextFormContact,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to submit inquiry');
    }
  };

  const canGoBack = PRE_CHAT_STEPS.indexOf(step) > 0;

  return (
    <AgentLeadOnboarding
      step={step}
      chosenIntent={chosenIntent}
      onChooseIntent={setChosenIntent}
      draft={draft}
      onFieldChange={(field, value) => setDraft((d) => ({ ...d, [field]: value }))}
      onBack={() => {
        const idx = PRE_CHAT_STEPS.indexOf(step);
        if (idx > 0) setStep(PRE_CHAT_STEPS[idx - 1]);
      }}
      onForward={goNext}
      onStartChat={submit}
      validationError={validationError}
      propertyImageFiles={propertyImageFiles}
      onPropertyImageFilesChange={setPropertyImageFiles}
      propertyImagesUploading={submitting || uploadingImages}
      startActionLabel={submitting ? 'Submitting...' : 'Submit inquiry'}
      backButtonDisabled={!canGoBack || submitting || uploadingImages}
    />
  );
}
