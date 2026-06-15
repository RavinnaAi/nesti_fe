import Link from "next/link";
import Image from "next/image";
import { Mail, PhoneCall, ArrowRight } from "lucide-react";

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14.2 8.2V6.9c0-.6.4-.8.8-.8h2V2.7L14.2 2.6c-3.1 0-4.8 1.8-4.8 5v.6H6.2v3.8h3.2v9.4h3.9v-9.4h3.1l.5-3.8h-3.6Z" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14.4 10.4 22 2h-1.8l-6.6 7.3L8.4 2H2.3l8 11.3L2.3 22h1.8l7-7.6 5.5 7.6h6.1Zm-2.5 2.7-.8-1.1L4.7 3.4h2.9l5.1 7 .8 1.1 6.8 9.2h-2.9Z" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M5.4 8.9H2.1V22h3.3ZM3.8 2.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM21.9 14.5c0-3.5-1.9-5.2-4.5-5.2a3.9 3.9 0 0 0-3.5 1.9h-.1V8.9h-3.2V22h3.3v-6.5c0-1.7.3-3.4 2.5-3.4 2.1 0 2.1 2 2.1 3.5V22h3.4Z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FooterLinkList({ title, links, ariaLabel }) {
  return (
    <nav aria-label={ariaLabel}>
      <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-text-heading">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-text-body transition-colors hover:text-primary"
            >
              <span>{link.label}</span>
              <ArrowRight
                size={12}
                className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Testimonials", href: "/#testimonials" },
  ];

  const companyLinks = [
    { label: "About", href: "/about" },
    { label: "Mission", href: "/mission" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Finance Policy", href: "/refund-policy" },
  ];

  const socialLinks = [
    { Icon: FacebookIcon, label: "Facebook", href: "#", color: "text-[#1877F2]" },
    { Icon: XIcon, label: "Twitter", href: "#", color: "text-[#111111]" },
    { Icon: LinkedInIcon, label: "LinkedIn", href: "#", color: "text-[#0A66C2]" },
    { Icon: InstagramIcon, label: "Instagram", href: "#", color: "text-[#E4405F]" },
  ];

  return (
    <footer className="border-t border-border bg-gradient-to-b from-white via-background-light/45 to-white">
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/70 via-primary-dark to-primary/60" />
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 md:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-12">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl overflow-hidden">
                  <Image
                    src="/logo/logo.png"
                    alt="Nesti AI logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                </div>
                <div>
                  <span className="block text-xl font-black leading-tight tracking-tight text-text-heading">
                    Nesti AI
                  </span>
                  <span className="-mt-0.5 block text-[11px] font-bold uppercase leading-tight tracking-[0.2em] text-primary">
                    Real Estate Intelligence
                  </span>
                </div>
              </div>

              <p className="max-w-md text-sm leading-5 text-text-body">
                AI-powered real estate intelligence for buyers, sellers, and
                professionals across the USA and Canada.
              </p>

              <address className="mt-4 grid max-w-md gap-1.5 not-italic">
                <a
                  href="mailto:ravinna.raveenthiran@nesti.ca"
                  className="group flex items-center gap-2.5 rounded-lg border border-border/80 bg-white/70 px-2.5 py-2 text-[13px] font-semibold text-text-heading transition-all hover:border-primary/25 hover:bg-white hover:text-primary"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail size={14} aria-hidden />
                  </span>
                  <span className="min-w-0 break-all">ravinna.raveenthiran@nesti.ca</span>
                </a>
                <a
                  href="tel:+14165654791"
                  className="group flex items-center gap-2.5 rounded-lg border border-border/80 bg-white/70 px-2.5 py-2 text-[13px] font-semibold text-text-heading transition-all hover:border-primary/25 hover:bg-white hover:text-primary"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <PhoneCall size={14} aria-hidden />
                  </span>
                  <span>+1 (416) 565-4791</span>
                </a>
              </address>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.9fr_1.2fr]">
              <FooterLinkList
                title="Product"
                links={productLinks}
                ariaLabel="Product navigation"
              />
              <FooterLinkList
                title="Company"
                links={companyLinks}
                ariaLabel="Company navigation"
              />
              <FooterLinkList
                title="Legal"
                links={legalLinks}
                ariaLabel="Legal navigation"
              />

              <section aria-label="Platform updates">
                <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-text-heading">
                  Stay Updated
                </h4>
                <p className="text-[13px] leading-5 text-text-body">
                  Get product updates, AI insights, and real estate growth ideas from
                  Nesti.
                </p>

                <nav className="mt-3" aria-label="Social media links">
                  <ul className="flex flex-wrap items-center gap-1.5">
                    {socialLinks.map(({ Icon, label, href, color }) => (
                      <li key={label}>
                        <a
                          href={href}
                          className={`grid h-8 w-8 place-items-center rounded-lg border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/35 focus:ring-offset-2 ${color}`}
                          aria-label={label}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </section>
            </div>
        </div>

        <div className="mt-7 border-t border-border pt-4">
            <div className="flex flex-col gap-3 text-[13px] text-text-body md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p>&copy; {currentYear} Nesti AI. All rights reserved.</p>
              </div>
              <p className="font-medium text-text-body">
                Built for modern real estate professionals.
              </p>
            </div>
        </div>
      </div>
    </footer>
  );
}
