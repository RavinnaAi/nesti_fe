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
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-text-heading mb-2">
          First Name <span className="text-red-500">*</span>
        </label>
        <Input
          name="firstName"
          type="text"
          value={firstName}
          onChange={onFirstNameChange}
          onFocus={onFirstNameFocus}
          onBlur={onFirstNameBlur}
          className={`w-full h-14 border-2 rounded-xl px-4 transition-all duration-200 hover:shadow-md hover:bg-white bg-background-light/50 cursor-text ${
            firstNameError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-300"
              : "border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
          placeholder="Enter first name"
        />
        {firstNameError && (
          <p className="text-xs mt-2 ml-1 text-red-600">{firstNameError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-text-heading mb-2">
          Last Name <span className="text-red-500">*</span>
        </label>
        <Input
          name="lastName"
          type="text"
          value={lastName}
          onChange={onLastNameChange}
          onFocus={onLastNameFocus}
          onBlur={onLastNameBlur}
          className={`w-full h-14 border-2 rounded-xl px-4 transition-all duration-200 hover:shadow-md hover:bg-white bg-background-light/50 cursor-text ${
            lastNameError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-300"
              : "border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
          placeholder="Enter last name"
        />
        {lastNameError && (
          <p className="text-xs mt-2 ml-1 text-red-600">{lastNameError}</p>
        )}
      </div>
    </div>
  );
}
