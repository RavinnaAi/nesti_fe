import MissionPage from "@/components/public-pages/MissionPage";
import { getPublicPage } from "@/lib/publicPageContent";
import { getPublicPageMeta } from "@/lib/publicPageMeta";

export const metadata = {
  title: "Our Mission | Nesti AI",
  description: "Modernizing real estate through intelligent technology",
};

export default function MissionRoute() {
  const page = getPublicPage("mission");
  const meta = { ...getPublicPageMeta("mission") };
  delete meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <MissionPage page={page} meta={meta} sections={page.sections || []} />
    </div>
  );
}
