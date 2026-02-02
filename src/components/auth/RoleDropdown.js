"use client";

import { useState, useEffect, useRef } from "react";
import { roles } from "@/constants/auth";
import { CheckCircle2 } from "lucide-react";

export default function RoleDropdown({
  value,
  onChange,
  onFocus,
  onBlur,
  focusedField,
  error,
  required = false,
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedRole = roles.find((r) => r.value === value);

  return (
    <div>
      <label className="block text-sm font-semibold text-text-heading mb-2">
        Sign up as a Professional{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full h-14 border-2 rounded-md px-4 pr-12 transition-all duration-200 hover:shadow-md focus:ring-2 bg-white cursor-pointer text-left flex items-center ${error
            ? "border-red-400 focus:border-red-500 focus:ring-red-300"
            : "border-border hover:border-primary focus:border-primary focus:ring-primary/20"
            } ${value ? "text-text-heading" : "text-text-muted"}`}
        >
          {value ? (
            <span className="font-medium">
              {selectedRole?.label || "Choose your role"}
            </span>
          ) : (
            <span>Choose your role</span>
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
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-border rounded-md shadow-xl overflow-hidden">
            {roles.map((role, index) => {
              const IconComponent = role.icon;
              const isSelected = value === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    onChange(role.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors duration-150 ${isSelected ? "bg-primary/5" : "hover:bg-gray-50"
                    } ${index !== roles.length - 1
                      ? "border-b border-border/50"
                      : ""
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <IconComponent size={18} className="text-primary" />
                  </div>
                  <span className="font-medium text-text-heading">
                    {role.label}
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
