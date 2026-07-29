import type { Metadata } from "next";
import { DM_Sans, Anton, Bebas_Neue, Oswald } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AppShell from "@/components/AppShell";
import { clerkAppearance } from "@/lib/clerkAppearance";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const anton = Anton({ subsets: ["latin"], weight: ["400"], variable: "--font-anton" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"], variable: "--font-bebas-neue" });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-oswald" });

const BASE_URL = "https://pensil.io";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "pensil.io - thinks before it creates",
    template: "%s | pensil.io",
  },
  description:
    "AI image generation that reasons before it renders. Create stunning YouTube thumbnails, Instagram posts, Twitter banners, and more.",
  keywords: [
    "AI image generation",
    "YouTube thumbnail generator",
    "AI thumbnail maker",
    "reasoning image AI",
    "pensil.io",
    "thumbnail creator",
    "Instagram post generator",
  ],
  authors: [{ name: "pensil.io", url: BASE_URL }],
  creator: "pensil.io",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "pensil.io",
    title: "pensil.io - AI image generation that thinks",
    description:
      "Generate stunning thumbnails, posts, and banners with AI that reasons before it creates.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "pensil.io - AI Image Generation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pensil.io - thinks before it creates",
    description:
      "AI image generation that thinks before it creates. Thumbnails, posts, banners and more.",
    images: ["/og-image.svg"],
    creator: "@pensil_io",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2318181b'/><text y='70' x='50' text-anchor='middle' font-size='58' font-family='system-ui,sans-serif' fill='white' font-weight='bold'>P</text></svg>",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect width='180' height='180' rx='40' fill='%2318181b'/><text y='128' x='90' text-anchor='middle' font-size='102' font-family='system-ui,sans-serif' fill='white' font-weight='bold'>P</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      <html lang="en">
        <body
          className={`${dmSans.variable} ${anton.variable} ${bebasNeue.variable} ${oswald.variable} font-sans bg-zinc-950 text-zinc-50 min-h-screen antialiased`}
        >
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
