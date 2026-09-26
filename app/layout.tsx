import type { Metadata } from "next";
import "./globals.css";
import "../components/landing/landing.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://close-ai-jade.vercel.app"),
  title: "CloseAI — Votre meilleur commercial sur WhatsApp",
  description: "L’assistant IA qui transforme vos conversations WhatsApp en ventes.",
  icons: { icon: "/closeai-app-icon.png", apple: "/closeai-app-icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
