import { LeadsPageTableSkeleton } from "@/components/ui/ContentSkeletons";

/** Shown on navigation to /leads before the client page hydrates (App Router `loading.js`). */
export default function LeadsLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-transparent shadow-none">
        <div className="p-3 sm:p-4">
          <LeadsPageTableSkeleton rows={12} />
        </div>
      </div>
    </div>
  );
}
