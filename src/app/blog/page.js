import BlogPage from "@/components/public-pages/BlogPage";
import { getPublicPage } from "@/lib/publicPageContent";
import { getPublicPageMeta } from "@/lib/publicPageMeta";

export const metadata = {
  title: "Nesti Journal | Nesti AI",
  description: "Blog & Insights Hub",
};

export default function BlogRoute() {
  const page = getPublicPage("blog");
  const meta = { ...getPublicPageMeta("blog") };
  delete meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <BlogPage page={page} meta={meta} sections={page.sections || []} />
    </div>
  );
}
