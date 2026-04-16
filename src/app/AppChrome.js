"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackgroundElements from "@/components/layout/BackgroundElements";
import CustomToastContainer from "@/components/ui/ToastContainer";

/**
 * Public /chatbot/* routes are embedded in iframes on other sites — no site header/footer.
 */
export default function AppChrome({ children }) {
  const pathname = usePathname() || "";
  const isChatbotEmbed = pathname.startsWith("/chatbot");

  if (isChatbotEmbed) {
    return <>{children}</>;
  }

  return (
    <>
      <BackgroundElements variant="default" />
      <Header />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</main>
      <Footer />
      <CustomToastContainer />
    </>
  );
}
