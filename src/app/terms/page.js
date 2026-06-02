import TermsPage from "@/components/public-pages/TermsPage";
import { getPublicPage } from "@/lib/publicPageContent";
import { getPublicPageMeta } from "@/lib/publicPageMeta";

export const metadata = {
  title: "Terms of Use | Nesti AI",
  description: "Platform terms and conditions",
};

export default function TermsRoute() {
  const page = getPublicPage("terms");
  const meta = { ...getPublicPageMeta("terms") };
  delete meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <TermsPage page={page} meta={meta} sections={page.sections || []} />
    </div>
  );
}
