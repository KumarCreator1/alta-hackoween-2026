import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PARALLAX ARM // Autonomous Farm Operations Command Center",
  description: "Next.js, Drizzle, Supabase, and Gemini 3.8 Flash Autonomous Agricultural Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F4F5F7] text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
