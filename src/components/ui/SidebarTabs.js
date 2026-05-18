"use client";

export default function SidebarTabs({
  tabs = [],
  activeId,
  onChange,
  stickyTop = "0",
  containerClassName = "",
  activeClassName = "bg-primary-dark text-white",
  inactiveClassName = "text-text-heading hover:bg-primary/5",
  activeIconClassName = "bg-white/20 text-white",
  inactiveIconClassName = "bg-background-light",
}) {
  return (
    <div
      className={`sticky space-y-0.5 rounded-2xl border border-border/80 bg-white p-2 shadow-sm transition-all duration-200 ${containerClassName}`}
      style={{ top: stickyTop }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
              isActive ? activeClassName : inactiveClassName
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isActive ? activeIconClassName : inactiveIconClassName
              }`}
            >
              {Icon ? <Icon size={17} strokeWidth={2} /> : null}
            </span>
            <span className="min-w-0 flex-1 leading-snug">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
