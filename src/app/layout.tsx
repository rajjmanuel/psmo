import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { BrandingProvider } from "@/components/BrandingProvider";
import { getPersistedSettings } from "@/lib/settings-server";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "PSMO Asset Management System",
  description:
    "Inventory, disposal, and procurement workflows of the Property Supply and Management Office.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialSettings = await getPersistedSettings();

  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${poppins.variable} antialiased`}>
        <BrandingProvider initial={initialSettings}>{children}</BrandingProvider>
      </body>
    </html>
  );
}
