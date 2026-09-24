import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloseAI — Votre meilleur commercial sur WhatsApp",
  description: "L’assistant IA qui transforme vos conversations WhatsApp en ventes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
