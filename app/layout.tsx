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
  title: "zenzy · India's Premium Local Service Marketplace",
  description: "Zomato for services, LinkedIn for unorganized workers, and Airbnb for home rentals. Fast, transparent, and verified.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "zenzy · India's Premium Local Service Marketplace",
    description: "Zomato for services, LinkedIn for unorganized workers, and Airbnb for home rentals. Fast, transparent, and verified.",
    images: ["/logo.png"],
  },
};

import EmailVerificationGuard from "@/components/EmailVerificationGuard";
import FloatingSupport from "@/components/FloatingSupport";
import AuthModal from "@/components/AuthModal";
import ZenAssistant from "@/components/ZenAssistant";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          precedence="default"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans flex flex-col">
        <AuthProvider>
          <ThemeApplier />
          <EmailVerificationGuard>
            {children}
          </EmailVerificationGuard>
          <FloatingSupport />
          <ZenAssistant />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

