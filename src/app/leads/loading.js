import { LeadsPageTableSkeleton } from "@/components/ui/ContentSkeletons";

/** Shown on navigation to /leads before the client page hydrates (App Router `loading.js`). */
export default function LeadsLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4">
          <LeadsPageTableSkeleton rows={10} />
          <p className="mt-3 text-xs font-medium text-text-muted">Loading leads…</p>
        </div>
      </div>
    </div>
  );
}
