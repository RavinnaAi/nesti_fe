import "./globals.css";
import { Inter, Poppins } from "next/font/google";

import Providers from "./providers";
import AppChromeShell from "./AppChromeShell";

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
          <AppChromeShell>{children}</AppChromeShell>
        </Providers>
      </body>
    </html>
  );
}
