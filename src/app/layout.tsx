import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODET - Comité de Développement Tchoutsi",
  description: "Plateforme de gestion du Comité de Développement Tchoutsi",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
