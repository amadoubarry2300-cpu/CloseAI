import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "CloseAI — Votre assistant commercial WhatsApp",
  description:
    "Répondez avec plus de contexte, suivez vos prospects et gardez le contrôle de vos conversations WhatsApp Business avec CloseAI.",
  openGraph: {
    title: "CloseAI — Votre assistant commercial WhatsApp",
    description:
      "Un assistant IA pour accompagner les conversations WhatsApp de votre équipe commerciale.",
    type: "website",
    locale: "fr_FR",
    images: ["/landing/hero-entrepreneuse-africa.jpg"],
  },
};

export default function Home() {
  return <LandingPage />;
}
