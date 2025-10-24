import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Visual Chain-of-Thought",
  description: "Inspect and challenge structured reasoning graphs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Visual Chain-of-Thought";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-white text-slate-900 antialiased dark:bg-[#0b0f1a] dark:text-slate-100`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
                <span className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  {appName}
                </span>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 bg-slate-50/60 dark:bg-slate-950/60">{children}</main>
          </div>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
