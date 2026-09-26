import ComingSoon from "@/components/app/ComingSoon";
import { Users } from "lucide-react";
export default function Page() {
  return (
    <ComingSoon
      icon={<Users size={22} />}
      title="Équipe"
      lead="Invitez vos collaborateurs et travaillez ensemble sur vos conversations."
      bullets={[
        "Invitations par e-mail",
        "Rôles et permissions",
        "Transfert de conversations entre membres",
      ]}
    />
  );
}
