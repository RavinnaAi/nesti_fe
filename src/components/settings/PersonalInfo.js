"use client";

import { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, Calendar, Camera, ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import FormField from "@/components/auth/FormField";
import SubmitButton from "@/components/auth/SubmitButton";
import { useAppDispatch, useAppSelector } from "@/store";
import { useSavePersonalInfo } from "@/hooks/useProfileApi";
import { setPersonalInfo } from "@/store/profileSlice";

const validatePersonalInfo = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      errors.email = "Please enter a valid email";
    }
  }
  if (form.phone && form.phone.trim().length < 7) {
    errors.phone = "Phone should be at least 7 digits";
  }
  return errors;
};

export default function PersonalInfo() {
  const storedPersonal = useAppSelector((state) => state.profile.personalInfo);
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
  const savePersonalInfo = useSavePersonalInfo();

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
    e.preventDefault();
    const errors = validatePersonalInfo(form);
    if (Object.keys(errors).length) {
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      phone: form.phone.trim(),
      calendly_link: form.calendlyUrl.trim(),
    };

    setLoading(true);
    try {
      await savePersonalInfo.mutateAsync(payload);
    } catch {
      /* error surfaced via toast in useSavePersonalInfo hook */
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
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
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setProfileImage(dataUrl);
      dispatch(setPersonalInfo({ profileImage: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
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
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setCoverImage(dataUrl);
      dispatch(setPersonalInfo({ coverImage: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section heading ── */}
      <div>
        <h2 className="text-lg font-bold text-text-heading">Personal Information</h2>
        <p className="text-sm text-text-muted mt-0.5">Update your profile photo, cover image, and contact details.</p>
      </div>

      {/* ── Images row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Profile photo */}
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-xl bg-background-light border border-border shadow-sm overflow-hidden flex items-center justify-center">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="text-text-muted" size={28} />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition"
              aria-label="Change profile photo"
            >
              <Camera size={18} className="text-white" />
            </button>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-border bg-white text-xs font-semibold text-text-heading hover:border-primary hover:text-primary transition shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={13} />
              Change Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <p className="text-[11px] text-text-muted">JPG, PNG or WEBP. Max 3MB</p>
          </div>
        </div>

        {/* Cover image */}
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-xl bg-background-light border border-border shadow-sm overflow-hidden flex items-center justify-center">
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="text-text-muted" size={28} />
              )}
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition"
              aria-label="Change cover image"
            >
              <Camera size={18} className="text-white" />
            </button>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-border bg-white text-xs font-semibold text-text-heading hover:border-primary hover:text-primary transition shadow-sm"
              onClick={() => coverInputRef.current?.click()}
            >
              <ImageIcon size={13} />
              Change Cover
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <p className="text-[11px] text-text-muted">JPG, PNG or WEBP. Max 3MB</p>
          </div>
        </div>
      </div>

      {/* ── Form fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          className="bg-gray-100 cursor-not-allowed"
          required
        />
        <FormField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onFocus={() => setFocusedField("phone")}
          onBlur={() => setFocusedField("")}
          placeholder="+1 555 000 0000"
          icon={Phone}
          focusedField={focusedField}
        />
        <FormField
          label="Calendly URL"
          name="calendlyUrl"
          value={form.calendlyUrl}
          onChange={handleChange}
          onFocus={() => setFocusedField("calendlyUrl")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter Calendly URL"
          icon={Calendar}
          focusedField={focusedField}
        />
      </div>

      {/* ── Submit ── */}
      <div className="pt-2">
        <SubmitButton loading={loading}>Save changes</SubmitButton>
      </div>
    </form>
  );
}
