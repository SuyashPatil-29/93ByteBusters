import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { AI } from "./actions-ingres";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "INGRES Groundwater Assistant",
  description: "Explore India's groundwater assessments with INGRES data, CGWB reports, and research. Ask about any state, district, or block.",
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
          <Navbar />
          {children}
        </AI>
      </body>
    </html>
  );
}
