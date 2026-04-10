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
        <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/20 bg-black/45 px-3 py-1 text-center text-xs text-white/90 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
          made by{" "}
          <a
            href="https://github.com/praneet1503"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-200 underline decoration-cyan-300/70 underline-offset-2 transition hover:text-cyan-100"
          >
            @praneet
          </a>
        </div>
        <ToastViewport />
        <Analytics />
      </body>
    </html>
  );
}
