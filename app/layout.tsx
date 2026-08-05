import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const SITE_URL = "https://hanwoointernationalinc.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hanwoo International Inc. — Cross-border Store",
    template: "%s | Hanwoo International",
  },
  description:
    "Curated cross-border essentials with free worldwide shipping. Global goods, delivered to your door.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Hanwoo International Inc.",
    title: "Hanwoo International Inc. — Cross-border Store",
    description:
      "Curated cross-border essentials with free worldwide shipping. Global goods, delivered to your door.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
