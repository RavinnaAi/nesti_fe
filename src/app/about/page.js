import AboutPage from "@/components/public-pages/AboutPage";
import { getPublicPage } from "@/lib/publicPageContent";
import { getPublicPageMeta } from "@/lib/publicPageMeta";

export const metadata = {
  title: "About Nesti | Nesti AI",
  description: "The Future of Intelligent Real Estate Infrastructure",
};

export default function AboutRoute() {
  const page = getPublicPage("about");
  const meta = { ...getPublicPageMeta("about") };
  delete meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <AboutPage page={page} meta={meta} sections={page.sections || []} />
    </div>
  );
}
