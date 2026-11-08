import type { Metadata } from "next";
import { Funnel_Display, Geist, Geist_Mono, IBM_Plex_Mono, Inter, Orbitron } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { buildSiteMetadata } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const landingDisplay = Funnel_Display({
  variable: "--font-landing-display",
  subsets: ["latin"],
});

const landingSans = Inter({
  variable: "--font-landing-sans",
  subsets: ["latin"],
});

const landingMono = IBM_Plex_Mono({
  variable: "--font-landing-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = buildSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${landingDisplay.variable} ${landingSans.variable} ${landingMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${geistSans.className} flex min-h-screen flex-col antialiased selection:bg-foreground selection:text-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
