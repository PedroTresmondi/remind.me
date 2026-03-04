import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/pwa/RegisterSW";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Remind.me",
  description: "PWA de organização pessoal — projetos, tarefas, lembretes e calendário",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Remind.me" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased text-[var(--foreground)]">
        <ThemeProvider>
          <RegisterSW />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
