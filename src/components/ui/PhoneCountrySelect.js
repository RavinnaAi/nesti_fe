'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function getSelectedOption(options, value) {
  for (const option of options) {
    if (!option.divider && option.value === value) {
      return option;
    }
  }
  return null;
}

function DefaultArrow() {
  return <div className="PhoneInputCountrySelectArrow" aria-hidden="true" />;
}

export default function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  iconComponent: Icon,
  arrowComponent: Arrow = DefaultArrow,
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const rootRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const isDisabled = disabled || readOnly;

  const getDropdownStyle = useCallback(() => {
    const phoneInput = rootRef.current?.closest('.nesti-phone-input');
    if (!phoneInput) return null;

    const rect = phoneInput.getBoundingClientRect();
    const gap = 6;
    const estimatedHeight = dropdownRef.current?.offsetHeight || 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    if (openAbove) {
      return {
        bottom: window.innerHeight - rect.top + gap,
        left: rect.left,
        width: rect.width,
        placement: 'above',
      };
    }

    return {
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      placement: 'below',
    };
  }, []);

  const updateDropdownPosition = useCallback(() => {
    setDropdownStyle(getDropdownStyle());
  }, [getDropdownStyle]);

  const selectedOption = useMemo(() => getSelectedOption(options, value), [options, value]);

  const countryOptions = useMemo(
    () => options.filter((option) => !option.divider && option.value),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countryOptions;
    return countryOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [countryOptions, search]);

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    onBlur?.();
  }, [onBlur]);

  const openDropdown = useCallback(() => {
    if (isDisabled) return;
    setDropdownStyle(getDropdownStyle());
    setOpen(true);
    onFocus?.();
  }, [isDisabled, onFocus, getDropdownStyle]);

  useEffect(() => {
    if (!open) return undefined;

    updateDropdownPosition();

    const handlePointerDown = (event) => {
      if (
        rootRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }
      close();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') close();
    };

    const handleLayoutChange = () => updateDropdownPosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [open, close, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      updateDropdownPosition();
      searchRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, filteredOptions.length, updateDropdownPosition]);

  const handleSelect = (countryCode) => {
    onChange(countryCode);
    close();
  };

  return (
    <div
      ref={rootRef}
      className={`PhoneInputCountry nesti-phone-country-select${open ? ' nesti-phone-country-select--open' : ''}`}
    >
      <button
        type="button"
        className="nesti-phone-country-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isDisabled}
        onClick={() => (open ? close() : openDropdown())}
      >
        {selectedOption ? (
          <Icon aria-hidden country={value} label={selectedOption.label} />
        ) : null}
        <Arrow />
      </button>

      {open && dropdownStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dropdownRef}
              className={`nesti-phone-country-dropdown nesti-phone-country-dropdown--portal${
                dropdownStyle.placement === 'above' ? ' nesti-phone-country-dropdown--above' : ''
              }`}
              style={{
                top: dropdownStyle.top,
                bottom: dropdownStyle.bottom,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
              role="listbox"
              aria-label={ariaLabel}
            >
              <div className="nesti-phone-country-search-wrap">
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search country"
                  className="nesti-phone-country-search"
                  aria-label="Search country"
                />
              </div>
              <ul className="nesti-phone-country-list">
                {filteredOptions.length ? (
                  filteredOptions.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`nesti-phone-country-option${isSelected ? ' nesti-phone-country-option--selected' : ''}`}
                          onClick={() => handleSelect(option.value)}
                        >
                          <Icon aria-hidden country={option.value} label={option.label} />
                          <span className="nesti-phone-country-option__label">{option.label}</span>
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="nesti-phone-country-empty">No countries found</li>
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
