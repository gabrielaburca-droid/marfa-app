import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "Marfa – evidență financiară", template: "%s · Marfa" },
  description: "Evidența încasărilor și cheltuielilor firmei.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f6f5f1" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
