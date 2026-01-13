import Link from "next/link";
import { Bot, Mail, PhoneCall, ArrowRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Testimonials", href: "/#testimonials" },
  ];

  const companyLinks = [
    { label: "About Us", href: "/publicPage/about" },
    { label: "Contact", href: "/publicPage/contact" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/publicPage/privacy" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Compliance", href: "#" },
  ];

  const socialLinks = [
    { icon: "📘", label: "Facebook", href: "#" },
    { icon: "🐦", label: "Twitter", href: "#" },
    { icon: "💼", label: "LinkedIn", href: "#" },
    { icon: "📷", label: "Instagram", href: "#" },
  ];

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50/50 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-10 mb-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-2xl grid place-items-center shadow-lg bg-gradient-to-br from-primary to-primary-dark">
                <Bot size={28} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-text-heading">
                Nesti AI
              </span>
            </div>
            <p className="text-text-body text-base md:text-lg leading-relaxed mb-6 max-w-md">
              AI-powered real estate intelligence platform for buyers, sellers,
              and professionals across USA and Canada.
            </p>

            {/* Contact Info */}
            <address className="not-italic space-y-3 mb-6">
              <a
                href="mailto:ravinna.raveenthiran@nesti.ca"
                className="flex items-center gap-2 text-text-body hover:text-primary transition-colors text-base font-medium group"
              >
                <Mail
                  size={20}
                  className="group-hover:scale-110 transition-transform text-primary"
                />
                <span>ravinna.raveenthiran@nesti.ca</span>
              </a>
              <a
                href="tel:+14165654791"
                className="flex items-center gap-2 text-text-body hover:text-primary transition-colors text-base font-medium group"
              >
                <PhoneCall
                  size={20}
                  className="group-hover:scale-110 transition-transform text-primary"
                />
                <span>+1 (416) 565-4791</span>
              </a>
            </address>

            {/* Social Media */}
            <nav aria-label="Social media links">
              <ul className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-xl hover:border-primary hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Product Links */}
          <nav aria-label="Product navigation">
            <h4 className="font-bold mb-6 text-lg text-text-heading">
              Product
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-body hover:text-primary transition-colors text-base font-medium inline-flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowRight
                      size={16}
                      className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company Links */}
          <nav aria-label="Company navigation">
            <h4 className="font-bold mb-6 text-lg text-text-heading">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-body hover:text-primary transition-colors text-base font-medium inline-flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowRight
                      size={16}
                      className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-label="Legal navigation">
            <h4 className="font-bold mb-6 text-lg text-text-heading">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-body hover:text-primary transition-colors text-base font-medium inline-flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowRight
                      size={16}
                      className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}
          <section aria-label="Newsletter subscription">
            <h4 className="font-bold mb-6 text-lg text-text-heading">
              Stay Updated
            </h4>
            <p className="text-text-body text-base mb-4 leading-relaxed">
              Get the latest updates and insights delivered to your inbox.
            </p>
            {/* <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="flex gap-2">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-text-body bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Subscribe to newsletter"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </form> */}
          </section>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <p className="text-text-body text-base">
                &copy; {currentYear} Nesti AI. All rights reserved.
              </p>
              <nav aria-label="Footer legal links">
                <ul className="flex items-center gap-4 text-base">
                  <li>
                    <Link
                      href="/publicPage/privacy"
                      className="text-text-body hover:text-primary transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <span className="text-border" aria-hidden="true">
                      •
                    </span>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-text-body hover:text-primary transition-colors"
                    >
                      Terms
                    </Link>
                  </li>
                  <li>
                    <span className="text-border" aria-hidden="true">
                      •
                    </span>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-text-body hover:text-primary transition-colors"
                    >
                      Cookies
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="flex items-center gap-2 text-text-body text-base">
              <span>Made with</span>
              <span className="text-red-500" aria-label="love">
                ❤️
              </span>
              <span>for Real Estate Professionals</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
