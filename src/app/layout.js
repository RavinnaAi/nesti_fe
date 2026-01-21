import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackgroundElements from "@/components/layout/BackgroundElements";
import CustomToastContainer from "@/components/ui/ToastContainer";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "Nesti AI - AI Intelligence Platform for Real Estate",
  description: "Transform your real estate business with AI intelligence",
};

export default function RootLayout({ children }) {
  console.log("Nesti AI - AI Intelligence Platform for Real Estate ", process.env.NEXT_PUBLIC_API_URL);
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} flex flex-col min-h-screen`}
      >
        <Providers>
          <BackgroundElements variant="default" />
          <Header />
          <main className="flex-grow relative z-10">{children}</main>
          <Footer />
          <CustomToastContainer />
        </Providers>
      </body>
    </html>
  );
}
