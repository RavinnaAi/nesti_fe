"use client";

export default function LeadsListFiltersBar({
  searchTerm,
  onSearchTermChange,
  intentFilter,
  onIntentFilterChange,
  appointmentFilter,
  onAppointmentFilterChange,
  /** Buyer/seller filter — agent-focused; hidden for lawyers. */
  showIntentFilter = true,
  searchPlaceholder = "Search by property type, name, phone, city...",
}) {
  return (
    <div className="w-full max-w-[720px] sm:pt-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 min-w-0 flex-1 rounded-md border border-border/60 bg-white px-2.5 text-[13px] leading-none placeholder:text-[12px] placeholder:text-text-muted/80 focus:outline-none basis-[200px]"
        />
        {showIntentFilter ? (
          <select
            value={intentFilter}
            onChange={(event) => onIntentFilterChange(event.target.value)}
            className="h-9 w-[96px] shrink-0 rounded-md border border-primary/30 bg-primary/5 px-2 text-[12px] font-medium text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            aria-label="Filter by intent"
          >
            <option value="">All</option>
            <option value="buy">Buyer</option>
            <option value="sell">Seller</option>
          </select>
        ) : null}
        <select
          value={appointmentFilter}
          onChange={(event) => onAppointmentFilterChange(event.target.value)}
          className="h-9 min-w-[132px] shrink-0 rounded-md border border-primary/30 bg-primary/5 px-2 text-[12px] font-medium text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          aria-label="Filter by appointment status"
        >
          <option value="all">All appointments</option>
          <option value="booked">Booked</option>
          <option value="canceled">Canceled</option>
          <option value="not_booked">Not booked</option>
        </select>
      </div>
    </div>
  );
}
