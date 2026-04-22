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
  const isSmall = size === "small";
  const itemPad = isSmall ? "px-3 py-1.5 gap-2" : "px-3 py-2 gap-2.5";
  const itemText = isSmall ? "text-xs" : "text-sm";
  const iconWrap = isSmall ? "w-6 h-6" : "w-8 h-8";
  const iconPx = isSmall ? 14 : 18;

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
            } ${size === "small"
              ? "h-10 text-xs px-3 pr-10 items-center py-0 min-h-0"
              : "h-14 px-4 pr-12 items-start pt-4"
            } border-2 rounded-md transition-all duration-200 hover:shadow-md focus:ring-2 bg-white cursor-pointer text-left flex ${error
              ? "border-red-400 focus:border-red-500 focus:ring-red-300"
              : "border-border hover:border-primary focus:border-primary focus:ring-primary/20"
            } ${value ? "text-text-heading" : "text-text-muted"}`}
        >
          {selectedOption ? (
            <span
              className={`font-medium flex gap-2 ${isSmall ? "items-center text-xs" : "items-start text-sm"}`}
            >
              {selectedOption.icon ? (
                <selectedOption.icon
                  size={iconPx}
                  className={`text-primary flex-shrink-0 ${isSmall ? "" : "mt-0.5"}`}
                />
              ) : null}
              {selectedOption.label}
            </span>
          ) : (
            <span className={isSmall ? "text-xs" : "text-sm"}>{placeholder}</span>
          )}
        </button>
        <div
          className={`absolute pointer-events-none top-1/2 -translate-y-1/2 ${size === "small" ? "right-3" : "right-4"
            }`}
        >
          <svg
            className={`${size === "small" ? "w-4 h-4" : "w-5 h-5"} text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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
          <div
            className={`absolute z-50 w-full overflow-x-hidden overflow-y-auto bg-white border-2 border-border rounded-md shadow-xl mt-1 ${isSmall ? "max-h-52 text-xs" : "max-h-60 text-sm"
              } ${className}`}
          >
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
                  className={`w-full flex items-center transition-colors group duration-150 hover:!text-primary-dark ${itemPad} ${isSelected
                    ? "bg-primary/20 text-primary-dark"
                    : "hover:bg-primary/20 hover:text-primary-dark"
                    } ${index !== options.length - 1 ? "border-b border-border/50" : ""}`}
                >
                  {IconComponent ? (
                    <div
                      className={`${iconWrap} rounded-md bg-green-100 flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent size={iconPx} className="text-primary" />
                    </div>
                  ) : null}
                  <span
                    className={`font-medium transition-colors duration-150 leading-snug ${itemText} ${isSelected ? "text-primary-dark" : "group-hover:text-primary-dark"
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
