import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "MessMind | Hostel Food-Demand Intelligence",
  description: "Predictive kitchen preparation guidance, waste reduction, and meal intelligence for hostel messes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
