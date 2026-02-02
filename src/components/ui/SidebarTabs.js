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
      className={`rounded-md border border-border transition-all duration-800 bg-white shadow-sm p-2 space-y-1 sticky ${containerClassName}`}
      style={{ top: stickyTop }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${isActive ? activeClassName : inactiveClassName
              }`}
          >
            <span
              className={`h-9 w-9 rounded-md flex items-center justify-center ${isActive ? activeIconClassName : inactiveIconClassName
                }`}
            >
              {Icon ? <Icon size={16} /> : null}
            </span>
            <span className="text-left">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
