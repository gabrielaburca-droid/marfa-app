import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "Marfa – evidență financiară", template: "%s · Marfa" },
  description: "Evidența încasărilor și cheltuielilor firmei.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#217f47" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
