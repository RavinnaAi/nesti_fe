export const emailRegex = /^[^\s@]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
export const emailRegexSimple = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const checkPasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return "weak";
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const requirementsMet = [
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;
  if (requirementsMet === 4) {
    return "strong";
  } else if (requirementsMet >= 2 && password.length >= 8) {
    return "medium";
  }
  return "weak";
};

export const passwordRequirements = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "Uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "Lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "Number", test: (pwd) => /[0-9]/.test(pwd) },
  {
    label: "Special character",
    test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  },
];
