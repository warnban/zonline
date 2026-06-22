import type { Metadata } from "next";
import { IBM_Plex_Sans, Onest } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SupportWidget } from "@/components/support/support-widget";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { JsonLdSite } from "@/components/seo/json-ld";
import { siteName, siteUrl } from "@/lib/legal/content";
import "./globals.css";

const onest = Onest({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — пополнение Steam, Telegram и игр`,
    template: `%s · ${siteName}`,
  },
  description:
    "Пополнение Steam из РФ, Telegram Premium и Stars, подарочные карты PUBG, Free Fire, Roblox. Оплата картой и СБП.",
  keywords: [
    "пополнение steam",
    "telegram stars",
    "pubg uc",
    "free fire алмазы",
    "подарочные карты",
    "zynqo",
  ],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName,
    url: siteUrl,
  },
  robots: { index: true, follow: true },
  verification: {
    yandex: process.env.YANDEX_VERIFICATION ?? "793e591384e240ce",
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body
        className={`${onest.variable} ${ibmPlex.variable} min-h-screen antialiased`}
      >
        <ThemeProvider>
          <JsonLdSite />
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl flex-1 px-4 py-6 pb-20 md:pb-6">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <SupportWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
