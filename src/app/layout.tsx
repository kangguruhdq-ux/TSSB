import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TSSB — Server Administration & Infrastructure Management",
  description:
    "A centralized, production-grade server administration and network infrastructure management platform powered by Next.js, Prisma, and PostgreSQL.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "TSSB — Server Administration & Infrastructure Management",
    description:
      "A centralized platform for managing servers, services, network configuration, documentation, users, and system activities.",
    siteName: "TSSB Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-cyan-500 selection:text-black">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              className: "font-sans text-xs border border-slate-700 bg-slate-900 text-slate-100",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
