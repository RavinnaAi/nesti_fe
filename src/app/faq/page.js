import FaqPage from "@/components/public-pages/FaqPage";
import { getPublicPage } from "@/lib/publicPageContent";
import { getPublicPageMeta } from "@/lib/publicPageMeta";

export const metadata = {
  title: "Frequently Asked Questions | Nesti AI",
  description: "Common platform answers",
};

export default function FaqRoute() {
  const page = getPublicPage("faq");
  const meta = { ...getPublicPageMeta("faq") };
  delete meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <FaqPage page={page} meta={meta} sections={page.sections || []} />
    </div>
  );
}
