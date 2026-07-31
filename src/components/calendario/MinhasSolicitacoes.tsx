import type { SolicitacaoAusencia } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recusada: "Recusada",
};

const STATUS_CLASS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  aprovada: "bg-green-100 text-green-800",
  recusada: "bg-red-100 text-red-800",
};

const TIPO_LABEL: Record<string, string> = {
  ferias: "Férias",
  ausencia: "Ausência",
};

export function MinhasSolicitacoes({ solicitacoes }: { solicitacoes: SolicitacaoAusencia[] }) {
  if (solicitacoes.length === 0) {
    return <p className="text-sm text-gray-500">Você ainda não fez nenhuma solicitação.</p>;
  }

  return (
    <ul className="space-y-2">
      {solicitacoes.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between rounded-lg border border-cemig-card-border bg-white px-3 py-2 text-sm"
        >
          <div>
            <p className="font-medium text-gray-900">{TIPO_LABEL[s.tipo]}</p>
            <p className="text-xs text-gray-500">
              {s.data_inicio} a {s.data_fim}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[s.status]}`}
          >
            {STATUS_LABEL[s.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
