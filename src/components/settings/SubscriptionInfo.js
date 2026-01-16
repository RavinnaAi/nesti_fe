"use client";

export default function SubscriptionInfo() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-heading">
              Current Plan
            </div>
            <div className="text-xs text-text-muted">Pro • Billed monthly</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            Active
          </span>
        </div>
        <div className="mt-3 text-sm text-text-body">
          Next billing date: 24 Dec 2024
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-2">
          Payment Method
        </div>
        <div className="text-sm text-text-body">Visa •••• 4242 (expires 07/27)</div>
        <button className="mt-3 inline-flex items-center px-4 py-2 text-sm font-semibold text-primary rounded-lg border border-primary/30 hover:bg-primary/5 transition">
          Update payment method
        </button>
      </div>
    </div>
  );
}
