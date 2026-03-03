import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/pwa/RegisterSW";

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
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
