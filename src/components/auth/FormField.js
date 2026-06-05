"use client";

import { Input } from "@/components/ui/Input";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  onFocus,
  disabled,
  onBlur,
  placeholder,
  icon: Icon,
  focusedField,
  error,
  required = false,
  autoComplete,
  className = "",
}) {
  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-bold text-text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === name
              ? "text-primary"
              : error
                ? "text-red-500"
                : "text-text-muted"
              }`}
          >
            <Icon size={17} />
          </div>
        )}
        <Input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          disabled={disabled}
          onBlur={onBlur}
          className={`h-11 w-full ${disabled ? "!cursor-not-allowed !bg-gray-100" : ""} rounded-xl border bg-white/80 text-sm transition-all duration-200 hover:bg-white hover:shadow-sm cursor-text ${Icon ? "pl-10 pr-3" : "px-3"
            } ${error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-border hover:border-primary/45 focus:border-primary focus:ring-2 focus:ring-primary/15"
            } ${className}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
      {error && (
        <p className="ml-1 mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
