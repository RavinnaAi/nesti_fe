'use client';

import PhoneInput from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
import { DEFAULT_PHONE_COUNTRY } from '@/lib/phoneUtils';
import PhoneCountrySelect from '@/components/ui/PhoneCountrySelect';
import 'react-phone-number-input/style.css';

const SETTINGS_INPUT =
  'nesti-phone-input h-11 w-full rounded-xl border bg-white/80 text-sm transition-all duration-200 hover:bg-white hover:shadow-sm px-3';

const CHAT_INPUT =
  'nesti-phone-input nesti-phone-input--chat w-full min-w-0 rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-text-heading shadow-sm transition-colors focus:outline-none focus:ring-2';

export default function PhoneNumberField({
  label,
  name,
  value = '',
  onChange,
  onFocus,
  onBlur,
  error,
  required = false,
  disabled = false,
  variant = 'settings',
  className = '',
  autoComplete = 'tel',
  defaultCountry = DEFAULT_PHONE_COUNTRY,
}) {
  const isSettings = variant === 'settings';
  const hasError = Boolean(error);

  const input = (
    <PhoneInput
      id={name}
      name={name}
      international
      countryCallingCodeEditable={false}
      limitMaxLength
      smartCaret
      defaultCountry={defaultCountry}
      labels={en}
      countrySelectComponent={PhoneCountrySelect}
      value={value || undefined}
      onChange={(nextValue) => onChange?.(nextValue || '')}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      autoComplete={autoComplete}
      placeholder={isSettings ? 'Enter phone number' : 'Phone number'}
      className={`${isSettings ? SETTINGS_INPUT : CHAT_INPUT} ${
        hasError
          ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200'
          : isSettings
            ? 'border-border hover:border-primary/45 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15'
            : 'focus-within:ring-primary/15'
      } ${disabled ? '!cursor-not-allowed !bg-gray-100 opacity-90' : ''} ${className}`}
      numberInputProps={{
        className: 'nesti-phone-input__number',
        name,
      }}
    />
  );

  if (!isSettings) return input;

  return (
    <div className="relative">
      {label ? (
        <label htmlFor={name} className="mb-1.5 block text-xs font-bold text-text-heading">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      {input}
      {error ? <p className="ml-1 mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
