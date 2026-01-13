import React from "react";

export function Select({ value, onValueChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={className}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function SelectContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>;
}

export function SelectItem({ value, children, className = "" }) {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  );
}
