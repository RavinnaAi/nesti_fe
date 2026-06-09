"use client";

import { useEffect, useRef, useState } from "react";
import { User, Mail, Calendar, Pencil, ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import FormField from "@/components/auth/FormField";
import PhoneNumberField from "@/components/ui/PhoneNumberField";
import SubmitButton from "@/components/auth/SubmitButton";
import { validateEmailRequired } from "@/lib/emailUtils";
import { normalizePhoneForStorage, validatePhoneRequired } from "@/lib/phoneUtils";
import { useAppDispatch, useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { useSavePersonalInfo, useUploadProfileMedia } from "@/hooks/useProfileApi";
import { setPersonalInfo } from "@/store/profileSlice";
import ChangePassword from "@/components/settings/ChangePassword";

function isValidCalendlyUrl(value) {
  const s = String(value || "").trim();
  if (!s) return true;
  try {
    const url = new URL(s);
    const host = String(url.hostname || "").toLowerCase();
    return host === "calendly.com" || host.endsWith(".calendly.com");
  } catch {
    return false;
  }
}

const validatePersonalInfo = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  const emailError = validateEmailRequired(form.email);
  if (emailError) errors.email = emailError;
  const phoneError = validatePhoneRequired(form.phone);
  if (phoneError) errors.phone = phoneError;
  if (!isValidCalendlyUrl(form.calendlyUrl)) {
    errors.calendlyUrl = "Please enter a valid Calendly URL (https://calendly.com/...)";
  }
  return errors;
};

export default function PersonalInfo({ onSaveSuccess } = {}) {
  const storedPersonal = useAppSelector((state) => state.profile.personalInfo);
  const authUser = useAppSelector((state) => state.auth.user);
  const profileQuery = useProfileQuery();
  const dispatch = useAppDispatch();
  const [focusedField, setFocusedField] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    calendlyUrl: "",
  });
  const [profileImage, setProfileImage] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const savePersonalInfo = useSavePersonalInfo();
  const uploadMedia = useUploadProfileMedia();
  const authProvider = String(
    profileQuery.data?.user?.auth_provider ||
      profileQuery.data?.user?.authProvider ||
      authUser?.auth_provider ||
      authUser?.authProvider ||
      ""
  ).toLowerCase();
  const canChangePassword = authProvider !== "google";

  useEffect(() => {
    if (storedPersonal) {
      setForm((prev) => ({
        ...prev,
        ...storedPersonal,
        calendlyUrl: storedPersonal.calendlyUrl || storedPersonal.calendalyUrl || "",
      }));
      if (storedPersonal.profileImage) {
        setProfileImage(storedPersonal.profileImage);
      }
      if (storedPersonal.coverImage) {
        setCoverImage(storedPersonal.coverImage);
      }
    }
  }, [storedPersonal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const errors = validatePersonalInfo(form);
    if (Object.keys(errors).length) {
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      phone: normalizePhoneForStorage(form.phone),
      calendly_link: form.calendlyUrl.trim(),
    };
    if (profileImage && /^https?:\/\//i.test(String(profileImage))) {
      payload.profile_image = String(profileImage).trim();
    }
    if (coverImage && /^https?:\/\//i.test(String(coverImage))) {
      payload.cover_image = String(coverImage).trim();
    }

    setLoading(true);
    try {
      await savePersonalInfo.mutateAsync(payload);
      await onSaveSuccess?.();
    } catch {
      /* error surfaced via toast in useSavePersonalInfo hook */
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const THREE_MB = 3 * 1024 * 1024;
    if (file.size > THREE_MB) {
      toast.error("Image must be under 3MB.");
      return;
    }
    try {
      const data = await uploadMedia.mutateAsync({ file, kind: "profile" });
      const url = data?.profile_image || data?.url || "";
      if (url) {
        setProfileImage(url);
        dispatch(setPersonalInfo({ profileImage: url }));
      }
    } catch {
      /* toast from hook */
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const THREE_MB = 3 * 1024 * 1024;
    if (file.size > THREE_MB) {
      toast.error("Image must be under 3MB.");
      return;
    }
    try {
      const data = await uploadMedia.mutateAsync({ file, kind: "cover" });
      const url = data?.cover_image || data?.url || "";
      if (url) {
        setCoverImage(url);
        dispatch(setPersonalInfo({ coverImage: url }));
      }
    } catch {
      /* toast from hook */
    }
  };

  const displayName =
    [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "Your profile";

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold tracking-tight text-text-heading sm:text-xl">
        Personal information
      </h2>

      {/* Cover + profile card */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
        {/* Cover — fixed 16:5 aspect */}
        <div className="relative aspect-[16/5] w-full min-h-[8rem] sm:min-h-0">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-primary/10"
              aria-hidden
            />
          )}
          <div className="absolute inset-x-0 top-0 flex justify-end p-3 sm:p-3.5">
            <button
              type="button"
              disabled={uploadMedia.isPending}
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-3 py-1 text-[10px] font-semibold text-text-heading shadow-sm backdrop-blur-md transition hover:bg-white disabled:opacity-50"
            >
              <ImageIcon size={13} className="text-primary" aria-hidden />
              {uploadMedia.isPending ? "Uploading…" : "Change cover"}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>
        </div>

        {/* Avatar + name */}
        <div className="relative flex items-end gap-3 px-4 pb-3.5 sm:gap-4 sm:px-6 sm:pb-4">
          <div className="relative z-[1] -mt-8 shrink-0 sm:-mt-9">
            <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl border-[3px] border-white bg-slate-50 shadow-md sm:h-[5.25rem] sm:w-[5.25rem] sm:rounded-2xl">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="" className="h-full w-full object-cover object-center" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-muted/70">
                  <User size={24} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={uploadMedia.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full border border-border/70 bg-white px-2 py-0.5 text-[9px] font-semibold text-text-heading shadow transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
              aria-label="Edit profile photo"
            >
              <Pencil size={10} className="shrink-0 text-primary" aria-hidden />
              Edit
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div className="min-w-0 flex-1 pb-0.5">
            <p className="text-sm font-semibold tracking-tight text-text-heading sm:text-base">{displayName}</p>
          </div>
        </div>
      </div>

      {/* Contact & scheduling */}
      <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-xs font-semibold text-text-heading">Contact &amp; scheduling</h3>
        <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
          <FormField
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            onFocus={() => setFocusedField("firstName")}
            onBlur={() => setFocusedField("")}
            placeholder="Enter first name"
            icon={User}
            focusedField={focusedField}
            className="!h-12 text-[13px]"
            required
          />
          <FormField
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            onFocus={() => setFocusedField("lastName")}
            onBlur={() => setFocusedField("")}
            placeholder="Enter last name"
            icon={User}
            focusedField={focusedField}
            className="!h-12 text-[13px]"
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField("")}
            placeholder="you@example.com"
            icon={Mail}
            focusedField={focusedField}
            disabled
            className="!h-12 bg-gray-100 text-[13px] cursor-not-allowed"
            required
          />
          <PhoneNumberField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField("")}
            error={null}
            required
            className="!h-12 text-[13px]"
          />
          <div className="md:col-span-2">
            <FormField
              label="Calendly URL"
              name="calendlyUrl"
              value={form.calendlyUrl}
              onChange={handleChange}
              onFocus={() => setFocusedField("calendlyUrl")}
              onBlur={() => setFocusedField("")}
              placeholder="https://calendly.com/your-handle/..."
              icon={Calendar}
              focusedField={focusedField}
              className="!h-12 text-[13px]"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {canChangePassword ? (
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full rounded-md border border-border bg-white px-4 py-2 text-[13px] font-semibold text-text-heading transition hover:border-primary/40 hover:text-primary sm:w-auto"
            >
              Change password
            </button>
          ) : null}
          <SubmitButton
            loading={loading}
            type="button"
            onClick={handleSubmit}
            className="w-full text-[13px] sm:w-auto sm:min-w-[10rem]"
          >
            Save changes
          </SubmitButton>
        </div>
      </div>

      {showPasswordModal ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-transparent p-4 lg:pl-60"
          style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
        >
          <div className="w-full max-w-lg rounded-lg border border-border/90 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <h3 className="text-sm font-semibold text-text-heading">Change password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-text-muted hover:text-text-heading hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="p-3">
              <ChangePassword />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
