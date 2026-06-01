/** Public marketing home (landing page). */
export const PUBLIC_HOME_PATH = "/";

function isPublicHomePath(pathname) {
  return String(pathname || "").trim() === PUBLIC_HOME_PATH;
}

function scrollPublicPageToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Header/sidebar logo: go to `/`, or scroll to top when already there. */
export function navigateToPublicHome(router, pathname, onBeforeNavigate) {
  onBeforeNavigate?.();
  if (isPublicHomePath(pathname)) {
    scrollPublicPageToTop();
    return;
  }
  try {
    router.replace(PUBLIC_HOME_PATH);
  } catch {
    window.location.assign(PUBLIC_HOME_PATH);
  }
}
