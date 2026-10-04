import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recall",
  description: "Spaced repetition over text messages.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
