import { NextResponse } from "next/server";

/**
 * Some browsers or bookmarks split a 24-char lead id across path segments
 * (e.g. `/leads/6a1d5d46acbc54a23ae5/095` instead of `/leads/6a1d5d46acbc54a23ae5095`).
 * Merge or redirect so the App Router matches `leads/[leadId]`.
 */
function redirectSplitLeadWorkspacePath(request) {
  const url = request.nextUrl;
  const { pathname } = url;
  if (!pathname.startsWith("/leads/") || pathname.startsWith("/leads/referrals/")) {
    return null;
  }
  const m = pathname.match(/^\/leads\/([a-fA-F0-9]+)\/([a-fA-F0-9]+)\/?$/i);
  if (!m) return null;
  const [, part1, part2] = m;
  const merged = `${part1}${part2}`;
  if (/^[a-fA-F0-9]{24}$/i.test(merged)) {
    url.pathname = `/leads/${merged}`;
    return NextResponse.redirect(url);
  }
  if (/^\d+$/.test(part2)) {
    url.pathname = `/leads/${part1}`;
    if (!url.searchParams.get("page")) {
      url.searchParams.set("page", String(parseInt(part2, 10) || 1));
    }
    return NextResponse.redirect(url);
  }
  return null;
}

/**
 * Public chatbot pages must be embeddable in iframes on other origins (marketing sites,
 * simple HTML, etc.). Global next.config headers use X-Frame-Options: SAMEORIGIN and
 * frame-ancestors 'self', which block that. This matcher relaxes framing only for /chatbot/*.
 */
export function middleware(request) {
  const splitLeadRedirect = redirectSplitLeadWorkspacePath(request);
  if (splitLeadRedirect) return splitLeadRedirect;

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/chatbot/")) {
    return NextResponse.next();
  }

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
  matcher: ["/chatbot/:path*", "/leads/:path*"],
};
