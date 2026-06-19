"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Compass, Sparkles, X } from "lucide-react";

const GUIDE_STEPS = [
  {
    id: "web_page",
    kicker: "Step 1",
    title: "Publish your professional web page",
    navTitle: "Publish web page",
    body: "Your public web page is the first client-facing asset. Review the generated copy, confirm your profile details, and preview how visitors will experience your page before they start a chat.",
    guidance: ["Confirm your name, role, contact details, and service area.", "Review the page as a visitor before sharing it publicly."],
    detail: "This helps you avoid sending traffic to an incomplete page. Once this is ready, the rest of the workspace has a clear source for leads.",
    href: "/dashboard/public-profile",
    actionLabel: "Open Web Page Settings",
  },
  {
    id: "chatbot_embed",
    kicker: "Step 2",
    title: "Create your chatbot embed link",
    navTitle: "Create embed link",
    body: "Use Settings to generate the chatbot link or embed code for your website. This is useful when you want the assistant outside your Nesti public page.",
    guidance: ["Copy the direct chatbot link for quick sharing.", "Use the embed code when adding the assistant to your own website."],
    detail: "The public web page gives you a hosted landing page, while the chatbot embed lets you place the same lead capture experience on your own website or share a direct widget URL.",
    href: "/settings?tab=chatbot",
    actionLabel: "Open Chatbot Settings",
  },
  {
    id: "lead_flow",
    kicker: "Step 3",
    title: "Know where leads go",
    navTitle: "Find leads",
    body: "Use Leads for new inquiries, Clients for consolidated lead profiles, Referrals for partner handoffs, and Conversations for professional chat.",
    guidance: ["Start in Leads when a new inquiry comes in.", "Open Clients when you want a cleaner profile-level view of the relationship."],
    detail: "This removes the “which menu item do I click first?” confusion: start with Leads when a client comes in, then use Clients and Referrals as the relationship grows.",
    href: "/leads",
    actionLabel: "View Leads",
  },
  {
    id: "nurture_email",
    kicker: "Step 4",
    title: "Send nurture emails from a lead or client",
    navTitle: "Send emails",
    body: "Open a lead, client profile, or accepted referral and use the Nurture Email tab to generate, preview, refine, and send follow-up emails.",
    guidance: ["Generate a draft after reviewing the saved lead context.", "Preview and refine the email before sending it to the client."],
    detail: "Nurture emails are not a separate first step. They work best after a lead or client exists because the email uses saved lead context, qualification details, and your workspace information.",
    href: "/leads",
    actionLabel: "Open Leads",
  },
  {
    id: "nurture_logs",
    kicker: "Step 5",
    title: "Review nurture email history",
    navTitle: "Review email history",
    body: "Use Nurture Logs to see sent follow-ups and past email activity across your workspace.",
    guidance: ["Check what was sent before contacting the client again.", "Use the history to keep follow-up consistent across leads and clients."],
    detail: "This gives you an audit trail after emails are sent, so you can understand what was generated, sent, and followed up.",
    href: "/nurture-logs",
    actionLabel: "Open Nurture Logs",
  },
  {
    id: "subscription",
    kicker: "Step 6",
    title: "Check subscription plans and limits",
    navTitle: "Check plans",
    body: "Open Billing to review available plans, current subscription status, plan limits, and upgrade options.",
    guidance: ["Review your current usage and plan limits early.", "Upgrade when you need more leads, nurture emails, or advanced workspace tools."],
    detail: "Some features depend on your plan. Reviewing Billing early helps you understand which tools are available now and what unlocks on higher plans.",
    href: "/checkout",
    actionLabel: "View Subscription Plans",
  },
  {
    id: "professionals",
    kicker: "Step 7",
    title: "Build your professional network",
    navTitle: "Build network",
    body: "Browse professionals so you understand who you can message, collaborate with, or refer leads to inside the platform.",
    guidance: ["Search for professionals who match your client needs.", "Use the network to support referrals, collaboration, and relationship building."],
    detail: "This turns the left menu from a toolbox into a workflow: capture leads, qualify them, book meetings, and collaborate with other professionals.",
    href: "/professionals?role=agent",
    actionLabel: "Browse Professionals",
  },
];

function roleIntro(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "lawyer") {
    return "Set up your legal intake flow, then use the workspace to manage matters, referrals, and follow-up.";
  }
  if (normalized === "mortgage_broker") {
    return "Set up your mortgage intake flow, then use the workspace to qualify borrowers and book consultations.";
  }
  return "Set up your lead capture flow, then use the workspace to review leads, clients, referrals, and follow-up.";
}

export default function DashboardStartGuide({ professionalRole, onDismiss }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowLeft") setActiveIndex((idx) => Math.max(0, idx - 1));
      if (event.key === "ArrowRight") {
        setActiveIndex((idx) => Math.min(GUIDE_STEPS.length - 1, idx + 1));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const activeStep = GUIDE_STEPS[activeIndex] || GUIDE_STEPS[0];
  const progress = `${activeIndex + 1} of ${GUIDE_STEPS.length}`;
  const progressPercent = `${((activeIndex + 1) / GUIDE_STEPS.length) * 100}%`;
  const isLastStep = activeIndex >= GUIDE_STEPS.length - 1;

  const goToIndex = (nextIndex) => {
    const bounded = Math.max(0, Math.min(GUIDE_STEPS.length - 1, nextIndex));
    setActiveIndex(bounded);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-white/95 shadow-sm ring-1 ring-primary/[0.03]">
        <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-text-heading">New to the workspace?</h2>
            <p className="mt-0.5 max-w-none text-xs leading-5 text-text-muted lg:whitespace-nowrap">
              Open a guide that explains what to do first, how to create your chatbot, where nurture emails live, and how plans affect features.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-dark"
            >
              <Sparkles size={14} />
              Open user guide
            </button>
            <button
              type="button"
              onClick={() => onDismiss?.("dismissed")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-text-muted transition hover:bg-slate-50 hover:text-text-heading"
            >
              Hide
            </button>
          </div>
        </div>
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/30 px-4 py-6 lg:left-60">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} aria-hidden />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-user-guide-title"
            className="relative z-[1] flex h-[36rem] max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] ring-1 ring-slate-950/[0.04]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-3.5">
              <div className="min-w-0">
                <h2 id="dashboard-user-guide-title" className="text-lg font-semibold tracking-tight text-text-heading">
                  Your first workspace steps
                </h2>
                <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-muted">
                  {roleIntro(professionalRole)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-text-muted shadow-sm transition hover:bg-slate-50 hover:text-text-heading"
                aria-label="Close user guide"
              >
                <X size={15} />
              </button>
            </div>
            <div className="h-1 bg-slate-100" aria-hidden>
              <div className="h-full rounded-r-full bg-primary transition-all duration-300" style={{ width: progressPercent }} />
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[13.5rem_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-hidden border-b border-slate-100 bg-slate-50/80 p-3 lg:border-b-0 lg:border-r">
                <div className="flex h-full min-h-0 flex-col justify-between gap-1">
                  {GUIDE_STEPS.map((step, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToIndex(idx)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[11px] transition ${
                          isActive
                            ? "bg-white text-primary-dark shadow-sm ring-1 ring-slate-200"
                            : "text-text-muted hover:bg-white hover:text-text-heading hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold transition ${
                            isActive
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-text-muted"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate font-semibold">{step.navTitle || step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="min-h-0 overflow-y-auto p-5">
                <h3 className="text-lg font-semibold tracking-tight text-text-heading">{activeStep.title}</h3>
                <p className="mt-2 max-w-2xl text-[12.5px] leading-5 text-text-body">{activeStep.body}</p>
                {activeStep.guidance?.length ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.02]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">What to do</p>
                    <div className="mt-2 space-y-1.5">
                      {activeStep.guidance.map((item) => (
                        <div key={item} className="flex gap-2 text-[12px] leading-5 text-text-body">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-dark">Why this matters</p>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-text-muted">{activeStep.detail}</p>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <Link
                    href={activeStep.href}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-dark"
                  >
                    {activeStep.actionLabel}
                    <ArrowRight size={14} />
                  </Link>
                  {isLastStep ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onDismiss?.("completed");
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 text-xs font-bold text-primary-dark transition hover:bg-primary/[0.06]"
                    >
                      <CheckCircle2 size={14} />
                      Finish guide
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <button
                type="button"
                onClick={() => goToIndex(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-text-heading shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={13} />
                Back
              </button>
              <button
                type="button"
                onClick={() => goToIndex(activeIndex + 1)}
                disabled={isLastStep}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-text-heading shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
