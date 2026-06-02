export const PUBLIC_MARKETING_ROUTES = [
  "/about",
  "/mission",
  "/blog",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export function isPublicMarketingRoute(pathname) {
  return PUBLIC_MARKETING_ROUTES.includes(String(pathname || ""));
}
