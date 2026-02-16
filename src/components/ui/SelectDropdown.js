"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Generic dropdown styled like RoleDropdown.
 *
 * Props:
 * - label?: string
 * - placeholder?: string
 * - options: Array<{ value: string; label: string; icon?: React.ComponentType<{ size?: number }> }>
 * - value: string
 * - onChange: (val: string) => void
 * - onFocus?: () => void
 * - onBlur?: () => void
 * - error?: string
 * - required?: boolean
 */
export default function SelectDropdown({
  label,
  className = "",
  disabled,
  placeholder = "Select an option",
  options = [],
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  required = false,
  size = "default", // "default" (h-14) or "small" (h-10)
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-text-heading mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`relative ${disabled ? "!cursor-not-allowed !bg-gray-100" : ""
          }`}
        ref={dropdownRef}
      >
        <button
          type="button"
          onClick={() => (!disabled ? setIsOpen((prev) => !prev) : null)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full ${disabled ? "!cursor-not-allowed !bg-gray-100" : ""
            } ${size === "small" ? "h-10 text-xs px-3 pr-10" : "h-14 px-4 pr-12"} border-2 rounded-md transition-all duration-200 hover:shadow-md focus:ring-2 bg-white cursor-pointer text-left flex items-start pt-4 ${error
              ? "border-red-400 focus:border-red-500 focus:ring-red-300"
              : "border-border hover:border-primary focus:border-primary focus:ring-primary/20"
            } ${value ? "text-text-heading" : "text-text-muted"}`}
        >
          {selectedOption ? (
            <span className="font-medium flex items-start gap-2">
              {selectedOption.icon ? (
                <selectedOption.icon size={18} className="text-primary mt-0.5" />
              ) : null}
              {selectedOption.label}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </button>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isOpen && (
          <div className={`absolute z-50 max-h-[250px] min-w-[250px] overflow-y-auto w-full mt-2 bg-white border-2 border-border rounded-md shadow-xl overflow-hidden ${className}`}>
            {options.map((opt, index) => {
              const IconComponent = opt.icon;
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-start gap-3 transition-colors group duration-150 hover:!text-primary-dark  ${isSelected
                    ? "bg-primary/20 text-primary-dark"
                    : "hover:bg-primary/20 hover:text-primary-dark"
                    } ${index !== options.length - 1
                      ? "border-b border-border/50"
                      : ""
                    }`}
                >
                  {IconComponent ? (
                    <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                      <IconComponent size={18} className="text-primary" />
                    </div>
                  ) : null}
                  <span
                    className={`font-medium transition-colors text-sm duration-150 pt-0.5
                       ${isSelected
                        ? "text-primary-dark"
                        : "group-hover:text-primary-dark"
                      }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="text-xs mt-2 ml-1 text-red-600">{error}</p>}
    </div>
  );
}
