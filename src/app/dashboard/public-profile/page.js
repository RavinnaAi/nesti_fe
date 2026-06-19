'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FeaturePageGate from '@/components/billing/FeaturePageGate';
import { FEATURES } from '@/constants/features';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { deletePublicProfile, generatePublicProfileCopy, getOwnPublicProfile, updatePublicProfile } from '@/lib/publicProfileClient';
import { Check, Copy, Eye, Globe2, Loader2, Save, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteLeadConfirmModal from '@/components/leads/DeleteLeadConfirmModal';

export default function PublicProfilePage() {
  const { token } = useAuthGuard();
  const { hasFeature } = useFeatureAccess();
  const canEditPublicProfile = hasFeature(FEATURES.PUBLIC_PROFILE);
  const queryClient = useQueryClient();
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['own-public-profile'],
    queryFn: () => getOwnPublicProfile(token),
    enabled: !!token && canEditPublicProfile,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updatePublicProfile(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['own-public-profile']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const generateCopyMutation = useMutation({
    mutationFn: () => generatePublicProfileCopy(token),
    onSuccess: (data) => {
      const generated = data?.generated || {};
      setFormData((prev) => ({ ...prev, ...generated }));
      toast.success(data?.message || 'AI landing page copy generated. Click Save to apply.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate AI copy');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePublicProfile(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['own-public-profile']);
      setFormData({});
      setShowDeleteConfirm(false);
      toast.success(data?.message || 'Public webpage deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete public webpage');
    },
  });

  const [formData, setFormData] = useState({});

  const handleUpdate = (updates) => {
    setFormData({ ...formData, ...updates });
  };

  const handleSave = () => {
    if (Object.keys(formData).length > 0) {
      updateMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Profile changes saved');
        },
      });
      setFormData({});
    }
  };

  const handlePublish = () => {
    updateMutation.mutate(
      { enabled: true },
      {
        onSuccess: () => {
          toast.success('Public page published');
        },
      },
    );
  };

  const handleDeleteWebPage = () => {
    if (!profile) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWebPage = () => {
    deleteMutation.mutate();
  };

  const handleCopyPublicUrl = async () => {
    if (!slug || !origin) return;
    const publicUrl = `${origin}/professional/${slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Public link copied');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const profile = profileData?.profile;
  const slug = profile?.slug || profileData?.suggested_slug;
  const user = profileData?.user || {};
  const professionalProfile = profileData?.professional_profile || {};
  const displayName =
    professionalProfile.full_name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    'Your profile';
  const roleLabel = {
    agent: 'Real Estate Agent',
    mortgage_broker: 'Mortgage Broker',
    lawyer: 'Real Estate Lawyer',
  }[professionalProfile.professional_type || profileData?.professional_type || profile?.professional_type] || 'Professional';
  const publicUrl = slug ? `${origin || ''}/professional/${slug}` : '';

  return (
    <FeaturePageGate feature={FEATURES.PUBLIC_PROFILE}>
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-5 lg:px-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.055)]">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white via-emerald-50/40 to-white px-5 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                <Globe2 size={13} />
                Professional Web Page
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-800">
                Public Profile Settings
              </h1>
              <p className="mt-0.5 max-w-2xl text-xs leading-5 text-text-muted">
                Review your professional details and generate polished public-facing copy for your landing page.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:shrink-0">
              {slug && (
                <a
                  href={`/professional/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
                >
                  <Eye size={15} />
                  Preview
                </a>
              )}
              {profile && !(formData.enabled ?? Boolean(profile?.enabled)) && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={updateMutation.isPending}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Globe2 size={15} />}
                  Publish
                </button>
              )}
              <button
                type="button"
                onClick={() => generateCopyMutation.mutate()}
                disabled={generateCopyMutation.isPending}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
              >
                {generateCopyMutation.isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                Generate
              </button>
              {profile ? (
                <button
                  type="button"
                  onClick={handleDeleteWebPage}
                  disabled={deleteMutation.isPending}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete page'}
                </button>
              ) : null}
              {Object.keys(formData).length > 0 ? (
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-800 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-4 p-4 sm:p-5 lg:grid-cols-[0.86fr_1.44fr]">
          <aside className="flex min-h-0">
            <div className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Profile Snapshot</h2>
                  <p className="mt-0.5 text-[11px] leading-4 text-text-muted">Pulled from account and professional profile.</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    formData.enabled ?? Boolean(profile?.enabled)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {(formData.enabled ?? Boolean(profile?.enabled)) ? 'Live' : 'Hidden'}
                </span>
              </div>
              <div className="grid flex-1 gap-2">
                <ReadOnlyField label="Name" value={displayName} />
                <ReadOnlyField label="Role" value={roleLabel} />
                <ReadOnlyField label="Email" value={user.email} />
                <ReadOnlyField label="Company" value={professionalProfile.company_name} />
                <ReadOnlyField label="Location" value={professionalProfile.location} />
                <ReadOnlyField
                  label="Experience"
                  value={professionalProfile.experience ? `${professionalProfile.experience} years` : ''}
                />
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Public URL
              </label>
              <div className="flex h-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
        <div className="flex min-w-0 flex-1 items-center truncate px-3 text-sm font-medium text-slate-700">
                  {publicUrl || 'Generate a slug to create your public link'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPublicUrl}
                  disabled={!publicUrl}
                  className="inline-flex h-full items-center gap-1.5 border-l border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Headline
              </label>
              <input
                type="text"
                value={formData.headline ?? profile?.headline ?? ''}
                onChange={(e) => handleUpdate({ headline: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 shadow-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                placeholder="Generate this from your professional profile"
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Tagline
              </label>
              <textarea
                value={formData.tagline ?? profile?.tagline ?? ''}
                onChange={(e) => handleUpdate({ tagline: e.target.value })}
                className="min-h-[66px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal leading-5 text-slate-700 shadow-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                placeholder="Generate this from your professional profile"
                maxLength={200}
              />
            </div>

            <div className="flex flex-1 flex-col">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                About Section
              </label>
              <textarea
                value={formData.about ?? profile?.about ?? ''}
                onChange={(e) => handleUpdate({ about: e.target.value })}
                className="min-h-[190px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal leading-6 text-slate-700 shadow-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10 lg:min-h-0"
                placeholder="Generate this from your professional profile"
                maxLength={2000}
              />
            </div>
          </section>
        </div>
      </div>
      <DeleteLeadConfirmModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteWebPage}
        isPending={deleteMutation.isPending}
        title="Delete web page?"
        confirmLabel="Delete web page"
        pendingLabel="Deleting web page..."
        description="This will delete your public webpage and remove related profile analytics history. This action cannot be undone. You can create a new webpage later."
      />
    </div>
    </FeaturePageGate>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-slate-700">{value || 'Not set'}</div>
    </div>
  );
}
