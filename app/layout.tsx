import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ATS Checker | ResumeBuddy",
  description:
    "Upload your resume and check how ATS-friendly it is before you apply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-action text-sm font-bold text-white"
              aria-hidden="true"
            >
              RB
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">
                ATS Checker
              </p>
              <p className="text-xs text-slate-500">by ResumeBuddy</p>
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          {children}
        </main>

        <footer className="border-t border-slate-200/80 bg-white/50">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>ResumeBuddy · ATS Checker</p>
            <p>Your file is processed in memory and never stored.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
