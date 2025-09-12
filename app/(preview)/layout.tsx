import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { AI } from "./actions";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "INGRES Groundwater Assistant",
  description:
    "AI assistant for India's INGRES groundwater assessments. Query regional results, analyze trends, compare regions, and search research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" richColors />
        <AI>
          <LanguageProvider>
            <Navbar />
            {children}
          </LanguageProvider>
        </AI>
        <Analytics />
      </body>
    </html>
  );
}
