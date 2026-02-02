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
      <label className="block text-sm font-semibold text-text-heading mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === name
              ? "text-primary"
              : error
                ? "text-red-500"
                : "text-text-muted"
              }`}
          >
            <Icon size={20} />
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
          className={`w-full ${disabled ? "!cursor-not-allowed !bg-gray-100" : ""} h-14 border-2 rounded-md transition-all duration-200 hover:shadow-md hover:bg-white bg-background-light/50 cursor-text ${Icon ? "pl-12 pr-4" : "px-4"
            } ${error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-300"
              : "border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
            } ${className}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
      {error && (
        <p className="text-xs mt-2 ml-1 text-red-600">{error}</p>
      )}
    </div>
  );
}
