import ComingSoon from "@/components/app/ComingSoon";
import { Smartphone } from "lucide-react";
export default function Page() {
  return (
    <ComingSoon
      icon={<Smartphone size={22} />}
      title="WhatsApp"
      lead="L'état de votre connexion : numéro, statut, synchronisation, messages reçus et envoyés."
      bullets={[
        "Statut de connexion en temps réel",
        "Dernière synchronisation",
        "Messages reçus et envoyés",
        "Votre intégration existante reste inchangée",
      ]}
    />
  );
}
