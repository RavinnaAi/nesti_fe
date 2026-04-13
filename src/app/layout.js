import "./globals.css";
import { Suspense } from "react";
import { Inter, Poppins } from "next/font/google";

import Providers from "./providers";
import AppChrome from "./AppChrome";

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
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} flex flex-col min-h-screen`}
      >
        <Providers>
          {/*
            usePathname() inside AppChrome can opt the root into client navigation handling;
            Suspense avoids dev/runtime webpack chunk issues and matches Next.js guidance.
          */}
          <Suspense
            fallback={
              <main className="flex-grow relative z-10">{children}</main>
            }
          >
            <AppChrome>{children}</AppChrome>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
