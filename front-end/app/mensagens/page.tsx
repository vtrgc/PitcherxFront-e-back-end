import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import { MessageCircle } from "lucide-react";
import { cls } from "../components/ui/estilos";

/**
 * O backend não possui entidade nem endpoints de mensagens. A página existe na
 * navegação, mas apenas informa a limitação — nenhuma conversa é simulada.
 */
export default function Mensagens() {
  return (
    <PageShell area="usuario">
      <div className="pb-5 mb-1">
        <p className={cls.eyebrow}>Converse</p>
        <h1 className={cls.h1}>Mensagens</h1>
      </div>

      <div className={cls.card}>
        <EmptyState
          icon={MessageCircle}
          title="Mensagens ainda não estão disponíveis"
          description="A troca de mensagens depende de recursos que ainda não existem no servidor do PitcherX. Enquanto isso, use os comentários das publicações e as propostas para conversar."
        />
      </div>
    </PageShell>
  );
}
