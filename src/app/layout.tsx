import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DiagnosisProvider } from "@/lib/diagnosis-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { TRPCProvider } from "@/lib/trpc-provider";
import { SessionProvider } from "@/components/auth/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "LUMINA",
  description: "LUMINA - キャストと店舗をつなぐ募集情報提供サービス",
  icons: {
    icon: "/Favicon_16x16.png",
    apple: "/Apple_Touch_Icon_180x180.png",
  },
  openGraph: {
    title: "LUMINA - キャスト・店舗 募集情報提供",
    description: "キャストと店舗をつなぐ募集情報提供サービス",
    images: [
      { url: "/OGP_1200x630_Facebook_Twitter.png", width: 1200, height: 630 },
      { url: "/OGP_1200x1200_Instagram.png", width: 1200, height: 1200 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMINA - キャスト・店舗 募集情報提供",
    images: ["/OGP_1200x630_Facebook_Twitter.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <SessionProvider>
            <DiagnosisProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </DiagnosisProvider>
          </SessionProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
