import PrivacyPage from "@/components/public-pages/PrivacyPage";
import { getPublicPage } from "@/lib/publicPageContent";
import { getPublicPageMeta } from "@/lib/publicPageMeta";

export const metadata = {
  title: "Privacy Policy | Nesti AI",
  description: "Our commitment to privacy",
};

export default function PrivacyRoute() {
  const page = getPublicPage("privacy");
  const meta = { ...getPublicPageMeta("privacy") };
  delete meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <PrivacyPage page={page} meta={meta} sections={page.sections || []} />
    </div>
  );
}
