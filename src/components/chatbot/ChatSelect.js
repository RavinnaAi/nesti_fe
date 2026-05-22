"use client";

import { useState, useRef, useEffect, useId } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Custom listbox so option highlight uses brand green (native &lt;select&gt; stays OS blue on Windows/Chrome).
 */
export default function ChatSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  triggerClassName = "",
  disabled = false,
  id: idProp,
  activeClass = "bg-primary/15 text-primary font-semibold",
  hoverClass = "hover:bg-primary/10 hover:text-primary",
}) {
  const uid = useId();
  const id = idProp || uid;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const scrollMenuIntoView = () => {
    window.requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const menu = el.querySelector('[role="listbox"]');
      if (!menu) return;

      const menuRect = menu.getBoundingClientRect();
      const scrollParent = (() => {
        let node = el.parentElement;
        while (node) {
          const style = window.getComputedStyle(node);
          const canScroll = /(auto|scroll)/.test(`${style.overflowY}${style.overflow}`);
          if (canScroll && node.scrollHeight > node.clientHeight) return node;
          node = node.parentElement;
        }
        return document.scrollingElement || document.documentElement;
      })();

      const parentRect =
        scrollParent === document.scrollingElement || scrollParent === document.documentElement
          ? { top: 0, bottom: window.innerHeight }
          : scrollParent.getBoundingClientRect();
      const overflow = menuRect.bottom - parentRect.bottom + 12;
      if (overflow > 0) {
        scrollParent.scrollBy({ top: overflow, behavior: "smooth" });
      }
    });
  };

  useEffect(() => {
    if (!open) return;
    scrollMenuIntoView();
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));
  const label = selected?.label ?? placeholder;
  const muted = !selected || String(value) === "";

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${triggerClassName} flex items-center justify-between gap-2 text-left disabled:opacity-50 ${muted ? "text-text-muted" : "text-text-heading"}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`shrink-0 w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          className="absolute z-[100] mt-1 w-full max-h-52 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg ring-1 ring-black/[0.06]"
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((opt) => {
            const active = String(opt.value) === String(value);
            return (
              <li key={`${id}-${String(opt.value)}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`w-full px-3 py-2 text-left text-xs transition ${
                    active
                      ? activeClass
                      : `text-text-heading ${hoverClass}`
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
