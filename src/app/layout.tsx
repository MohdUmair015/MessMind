import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MessMind | Food Demand Intelligence",
  description: "Predictive kitchen preparation guidance, food waste reduction, and dining room scanner intelligence for hostel messes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased bg-cream-100 text-charcoal-900 selection:bg-coral-100 selection:text-coral-900">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

