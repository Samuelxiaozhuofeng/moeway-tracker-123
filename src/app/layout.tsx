import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app/app-shell";
import { AppProviders } from "@/components/app/providers";
import { PwaRegister } from "@/components/app/pwa-register";

export const metadata: Metadata = {
  title: "浸录 ImmerseLog",
  description: "面向 Moeway / Refold 沉浸式学习者的离线优先记录工具。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "浸录",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#0d1020",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </AppProviders>
      </body>
    </html>
  );
}
