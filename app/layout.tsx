import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeApplier from "@/components/ThemeApplier";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zenzy.shop"),
  title: {
    default: "Zenzy | India's Operating System for Service Businesses",
    template: "%s | Zenzy",
  },
  description:
    "Zenzy is an all-in-one operating system for construction, interior, and professional service businesses. Manage leads, quotes, bookings, projects, workspaces, payments, documents, communication and customer relationships from one platform.",
  keywords: [
    "Zenzy",
    "project management",
    "construction CRM",
    "contractor CRM",
    "business operating system",
    "workspace",
    "quotation software",
    "service business management",
    "field service software",
    "project collaboration",
    "client workspace",
    "professional portfolio",
    "lead management",
    "business dashboard",
    "construction software India",
    "interior designer software",
    "architecture project management",
    "zenzy.shop",
  ],
  authors: [{ name: "Zenzy Technologies Ltd.", url: "https://zenzy.shop" }],
  creator: "Zenzy Technologies Ltd.",
  publisher: "Zenzy Technologies Ltd.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://zenzy.shop",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Zenzy | Win Projects. Manage Work. Grow Your Business.",
    description:
      "Zenzy is an all-in-one operating system for construction, interior, and professional service businesses. Manage leads, quotes, bookings, projects, workspaces, payments, documents, communication and customer relationships from one platform.",
    url: "https://zenzy.shop",
    siteName: "Zenzy",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenzy | Operating System for Service Businesses",
    description:
      "Zenzy is an all-in-one operating system for construction, interior, and professional service businesses. Manage leads, quotes, bookings, projects, workspaces, payments, documents, communication and customer relationships from one platform.",
    creator: "@zenzy",
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://zenzy.shop/#organization",
      "name": "Zenzy",
      "url": "https://zenzy.shop",
      "logo": "https://zenzy.shop/logo.png",
      "description":
        "Zenzy is an all-in-one operating system for construction, interior, and professional service businesses. Manage leads, quotes, bookings, projects, workspaces, payments, documents, communication and customer relationships from one platform.",
      "sameAs": [
        "https://twitter.com/zenzy",
        "https://linkedin.com/company/zenzy",
        "https://instagram.com/zenzy"
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://zenzy.shop/#website",
      "url": "https://zenzy.shop",
      "name": "Zenzy",
      "description": "India's Operating System for Service Businesses",
      "publisher": {
        "@id": "https://zenzy.shop/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://zenzy.shop/services?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://zenzy.shop/#software",
      "name": "Zenzy Operating System",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "description":
        "The all-in-one operating system for service businesses. Manage leads, projects, workspaces, quotes, invoices, and customers from one platform.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      }
    }
  ],
};

import EmailVerificationGuard from "@/components/EmailVerificationGuard";
import FloatingSupport from "@/components/FloatingSupport";
import CompareBar from "@/components/CompareBar";
import AuthModal from "@/components/AuthModal";
import AppStartupLoader from "@/components/AppStartupLoader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          precedence="default"
          className="lazyload"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans flex flex-col pb-20 md:pb-0">
        <AuthProvider>
          <ThemeApplier />
          <AppStartupLoader>
            <EmailVerificationGuard>
              {children}
            </EmailVerificationGuard>
          </AppStartupLoader>
          <FloatingSupport />
          <CompareBar />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

