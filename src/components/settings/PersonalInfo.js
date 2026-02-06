"use client";

import { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, Calendar } from "lucide-react";
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
    calendalyUrl: "",
  });
  const [profileImage, setProfileImage] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const savePersonalInfo = useSavePersonalInfo();

  useEffect(() => {
    if (storedPersonal) {
      setForm((prev) => ({ ...prev, ...storedPersonal }));
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
    // console.log("savePersonalInfo", storedPersonal);
    const payload = {
      professional_type: storedPersonal.role,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      // calendalyUrl: form.calendalyUrl.trim(),
      profile_image: profileImage,
      cover_image: coverImage,
    };

    // console.log("payload", payload);
    // return;

    setLoading(true);
    try {
      await savePersonalInfo.mutateAsync(payload);
    } catch (err) {
      console.error("Personal info update error:", err);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 rounded-md bg-background-light border border-border shadow-sm overflow-hidden flex items-center justify-center">
          {profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileImage}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="text-text-muted" size={32} />
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-white shadow-sm text-sm font-semibold text-text-heading hover:border-primary hover:text-primary transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <User size={16} />
            Change Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="text-xs text-text-muted">
            JPG, PNG or WEBP. Max 2MB
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-24 w-24 rounded-md bg-background-light border border-border shadow-sm overflow-hidden flex items-center justify-center">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="text-text-muted" size={32} />
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-white shadow-sm text-sm font-semibold text-text-heading hover:border-primary hover:text-primary transition"
            onClick={() => coverInputRef.current?.click()}
          >
            <User size={16} />
            Change Cover
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
          <div className="text-xs text-text-muted">
            JPG, PNG or WEBP. Max 3MB
          </div>
        </div>
      </div>

      {/* <div className="space-y-2">
        <div className="h-24 w-full rounded-2xl bg-background-light border border-border shadow-sm overflow-hidden flex items-center justify-center">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="text-text-muted" size={32} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white shadow-sm text-sm font-semibold text-text-heading hover:border-primary hover:text-primary transition"
            onClick={() => coverInputRef.current?.click()}
          >
            <User size={16} />
            Change Cover
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
          <div className="text-xs text-text-muted">JPG, PNG or WEBP. Max 3MB</div>
        </div>
      </div> */}

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

        {/* <FormField
          label="Calendaly Url"
          name="calendalyUrl"
          value={form.calendalyUrl}
          onChange={handleChange}
          onFocus={() => setFocusedField("calendalyUrl")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter calendaly url"
          icon={Calendar}
          focusedField={focusedField}
          required
        />  
        */}

      </div>

      <div className="pt-2">
        <SubmitButton loading={loading}>Save changes</SubmitButton>
      </div>
    </form>
  );
}
