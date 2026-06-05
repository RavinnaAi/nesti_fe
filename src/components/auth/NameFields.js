"use client";

import { Input } from "@/components/ui/Input";

export default function NameFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onFirstNameFocus,
  onLastNameFocus,
  onFirstNameBlur,
  onLastNameBlur,
  firstNameError,
  lastNameError,
  focusedField,
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-text-heading">
          First Name <span className="text-red-500">*</span>
        </label>
        <Input
          name="firstName"
          type="text"
          value={firstName}
          onChange={onFirstNameChange}
          onFocus={onFirstNameFocus}
          onBlur={onFirstNameBlur}
          className={`h-11 w-full rounded-xl border bg-white/80 px-3 text-sm transition-all duration-200 hover:bg-white hover:shadow-sm cursor-text ${firstNameError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-border hover:border-primary/45 focus:border-primary focus:ring-2 focus:ring-primary/15"
            }`}
          placeholder="Enter first name"
        />
        {firstNameError && (
          <p className="ml-1 mt-1.5 text-xs text-red-600">{firstNameError}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-text-heading">
          Last Name <span className="text-red-500">*</span>
        </label>
        <Input
          name="lastName"
          type="text"
          value={lastName}
          onChange={onLastNameChange}
          onFocus={onLastNameFocus}
          onBlur={onLastNameBlur}
          className={`h-11 w-full rounded-xl border bg-white/80 px-3 text-sm transition-all duration-200 hover:bg-white hover:shadow-sm cursor-text ${lastNameError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-border hover:border-primary/45 focus:border-primary focus:ring-2 focus:ring-primary/15"
            }`}
          placeholder="Enter last name"
        />
        {lastNameError && (
          <p className="ml-1 mt-1.5 text-xs text-red-600">{lastNameError}</p>
        )}
      </div>
    </div>
  );
}
