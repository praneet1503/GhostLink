import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ToastViewport from "@/components/ToastViewport";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GhostLink | One Link. Infinite Experiences.",
  description:
    "Create one shareable link that adapts content in real time based on passive browser signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <ToastViewport />
        <Analytics />
      </body>
    </html>
  );
}
