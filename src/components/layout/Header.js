"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle2, ArrowRight, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const NAVIGATION_ITEMS = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/publicPage/about" },
    { label: "Contact", href: "/publicPage/contact" },
  ];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="h-12 w-12 rounded-2xl grid place-items-center transition-all group-hover:scale-110 shadow-lg bg-gradient-to-br from-primary to-primary-dark text-white"
              whileHover={{ rotate: 10 }}
            >
              <Bot size={24} />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-text-heading">
                Nesti AI
              </span>
              <span className="text-lg text-text-muted font-medium -mt-1">
                Real Estate Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-2">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors px-3 rounded-md py-2 text-base font-medium hover:bg-primary/10 hover:font-semibold duration-300 ${
                      isActive
                        ? "text-text-body bg-primary/10 font-semibold"
                        : "text-text-body"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/log-in"
              className="hidden sm:block relative px-5 py-2.5 text-base font-semibold text-gray-700 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="group relative bg-primary-dark inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 md:px-8 md:py-3 font-bold text-sm md:text-base text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight
                  size={16}
                  className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                />
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-body hover:text-primary hover:bg-background-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded={isMenuOpen}
              whileTap={{ scale: 0.95 }}
            >
              <span className="sr-only">Open main menu</span>
              <AnimatePresence mode="wait">
                {!isMenuOpen ? (
                  <motion.svg
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="close"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay and panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Mobile menu panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[70] md:hidden overflow-y-auto"
            >
              {/* Menu header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg">
                    <Bot size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-text-heading">
                      Nesti AI
                    </span>
                    <span className="text-xs text-text-muted">Menu</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg text-text-body hover:text-primary hover:bg-background-light transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Navigation items */}
              <div className="p-4 space-y-2">
                {NAVIGATION_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-white shadow-md"
                            : "text-text-body hover:bg-primary/10 hover:text-primary"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1.5 h-1.5 rounded-full bg-white"
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        )}
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Auth buttons section */}
              <div className="p-4 pt-6 border-t border-border space-y-3">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: NAVIGATION_ITEMS.length * 0.1 + 0.1,
                    type: "spring",
                    stiffness: 100,
                  }}
                >
                  <Link
                    href="/log-in"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                      pathname === "/log-in"
                        ? "bg-primary text-white shadow-md"
                        : "bg-background-light text-text-body hover:bg-border border border-border"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: NAVIGATION_ITEMS.length * 0.1 + 0.2,
                    type: "spring",
                    stiffness: 100,
                  }}
                >
                  <Link
                    href="/sign-up"
                    className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-primary to-primary-dark shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
