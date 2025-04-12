import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { AI } from "./actions";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NewsSense",
  description: "NewsSense is a real-time financial market analysis platform that connects fund performance with real-world events and news to explain market movements. It provides intelligent insights for ETFs, mutual funds, and market trends.",
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
