/**
 * Current user Mongo id for matching API fields like `referral.target_user_id`.
 *
 * `/auth/profile` historically omitted user id — fall back to ProfessionalProfile.user_id.
 */
export function resolveAuthUserId(profilePayload, authUser) {
  const profile =
    profilePayload && typeof profilePayload === "object" ? profilePayload : {};
  const u = profile.user && typeof profile.user === "object" ? profile.user : {};
  const prof = profile.professionalProfile ?? profile.professional_profile ?? null;
  const profUid = prof?.user_id;
  const fromProf =
    profUid != null && profUid !== ""
      ? String(typeof profUid === "object" ? profUid._id ?? profUid : profUid).trim()
      : "";
  const candidates = [
    u.id,
    u._id,
    profile.data?.id,
    profile.data?._id,
    authUser?.id,
    authUser?._id,
    authUser?.user_id,
    fromProf,
  ];
  for (const c of candidates) {
    const s = String(c || "").trim();
    if (s) return s;
  }
  return "";
}
