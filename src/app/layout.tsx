import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { AmharicFontLoader } from "@/components/AmharicFontLoader";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeaderNav } from "@/components/HeaderNav";
import { Providers } from "@/components/Providers";
import { authOptions } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShegerShop — Marketplace",
  description: "Discover and shop quality products from trusted sellers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} flex min-h-screen flex-col font-sans`}
        suppressHydrationWarning
      >
        <Providers session={session}>
          <AmharicFontLoader />
          <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
            <div className="relative z-20">
              <Header />
            </div>
            <div className="relative z-10">
              <HeaderNav />
            </div>
          </div>
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
