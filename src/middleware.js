import { NextResponse } from "next/server";

/**
 * Public chatbot pages must be embeddable in iframes on other origins (marketing sites,
 * simple HTML, etc.). Global next.config headers use X-Frame-Options: SAMEORIGIN and
 * frame-ancestors 'self', which block that. This matcher relaxes framing only for /chatbot/*.
 */
export function middleware() {
  const isDev = process.env.NODE_ENV !== "production";
  const connectSrc = isDev
    ? "connect-src 'self' http: https: ws: wss:"
    : "connect-src 'self' https: wss:";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'self' data: blob:",
    "frame-src https://calendly.com https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors *",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    connectSrc,
    "form-action 'self'",
  ].join("; ");

  const res = NextResponse.next();
  res.headers.delete("x-frame-options");
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: "/chatbot/:path*",
};
