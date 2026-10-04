import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

// Handwriting for what a student would write, print for what Recall prints (see design/DESIGN.md).
const hand = Architects_Daughter({ subsets: ["latin"], weight: "400", variable: "--font-architects-daughter" });
const print = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-atkinson" });

export const metadata: Metadata = {
  title: "Recall",
  description: "Spaced repetition over text messages.",
};

// viewport-fit=cover lets the safe-area insets in globals.css take effect on notched phones.
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hand.variable} ${print.variable}`}>
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
