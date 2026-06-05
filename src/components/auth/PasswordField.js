"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  focusedField,
  error,
  passwordStrength,
  required = false,
  autoComplete = "current-password",
  showStrengthIndicator = false,
  passwordRequirements = [],
}) {
  const [showPassword, setShowPassword] = useState(false);

  const getIconColor = () => {
    if (focusedField === name) {
      if (passwordStrength === "strong") return "text-green-500";
      if (passwordStrength === "medium") return "text-yellow-500";
      if (passwordStrength === "weak" && value) return "text-red-500";
      return "text-primary";
    }
    if (error) return "text-red-500";
    if (passwordStrength === "strong") return "text-green-500";
    if (passwordStrength === "medium") return "text-yellow-500";
    if (passwordStrength === "weak" && value) return "text-red-500";
    return "text-text-muted";
  };

  const getBorderColor = () => {
    if (error) return "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-300";
    if (passwordStrength === "strong")
      return "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-300";
    if (passwordStrength === "medium")
      return "border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300";
    if (passwordStrength === "weak" && value)
      return "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-300";
    return "border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20";
  };

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-bold text-text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${getIconColor()}`}>
          <Lock size={17} />
        </div>
        <Input
          name={name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          minLength={8}
          className={`h-11 w-full rounded-xl border bg-white/80 pl-10 pr-10 text-sm transition-all duration-200 hover:bg-white hover:shadow-sm cursor-text ${getBorderColor()}`}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-all duration-200 hover:scale-105 hover:text-primary cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {showStrengthIndicator && value && passwordStrength && (
        <div className="mt-1.5 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-300 ${passwordStrength === "strong"
                  ? "bg-green-500 w-full"
                  : passwordStrength === "medium"
                    ? "bg-yellow-500 w-2/3"
                    : "bg-red-500 w-1/3"
                  }`}
              />
            </div>
            <span
              className={`text-xs font-semibold ${passwordStrength === "strong"
                ? "text-green-600"
                : passwordStrength === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
                }`}
            >
              {passwordStrength.charAt(0).toUpperCase() +
                passwordStrength.slice(1)}
            </span>
          </div>
          {passwordRequirements.length > 0 && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] leading-4 text-text-body">
              {passwordRequirements.map((req, idx) => {
                const isValid = req.test(value);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className={
                        isValid ? "text-green-600" : "text-text-muted"
                      }
                    >
                      {isValid ? (
                        <CheckCircle2 size={14} className="inline" />
                      ) : (
                        "○"
                      )}
                    </span>
                    <span>{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="ml-1 mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
