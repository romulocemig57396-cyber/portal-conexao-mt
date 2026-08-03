"use client";

import { excluirSolicitacaoAction } from "@/app/calendario/actions";
import type { SolicitacaoComUsuario } from "@/lib/db";

const TIPO_LABEL: Record<string, string> = {
  ferias: "Férias",
  ausencia: "Ausência",
};

export function PeriodosAgendados({
  solicitacoes,
}: {
  solicitacoes: SolicitacaoComUsuario[];
}) {
  if (solicitacoes.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum período agendado.</p>;
  }

  return (
    <ul className="space-y-2">
      {solicitacoes.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-cemig-card-border bg-white px-3 py-2 text-sm"
        >
          <div>
            <p className="font-medium text-gray-900">
              {s.usuario_nome} — {TIPO_LABEL[s.tipo]}
            </p>
            <p className="text-xs text-gray-500">
              {s.data_inicio} a {s.data_fim}
            </p>
          </div>
          <form
            action={excluirSolicitacaoAction}
            onSubmit={(e) => {
              if (!confirm("Excluir este período agendado? Essa ação não pode ser desfeita.")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={s.id} />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Excluir
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
