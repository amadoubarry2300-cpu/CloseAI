import ComingSoon from "@/components/app/ComingSoon";
import { Bot } from "lucide-react";
export default function Page() {
  return (
    <ComingSoon
      icon={<Bot size={22} />}
      title="Assistant IA"
      lead="Demandez à votre assistant d'analyser une conversation ou de préparer une réponse."
      bullets={[
        "« Analyse cette conversation »",
        "« Pourquoi ce prospect n'achète pas ? »",
        "« Prépare une relance »",
        "Réponses basées sur le contexte réel de chaque conversation",
      ]}
    />
  );
}
