"use client";

import { SITUACAO_META, SITUACOES_ORDEM } from "@/lib/situacao";

/**
 * Contagem por situação com clique-isola — mesmo comportamento do
 * ChipFiltro (clicar de novo no card ativo limpa o filtro).
 */
export function SituacaoCards({
  linhas,
  situacaoAtiva,
  onSituacaoClick,
}: {
  linhas: { desSituacao: string | null }[];
  situacaoAtiva: string | null;
  onSituacaoClick: (situacao: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {SITUACOES_ORDEM.map((situacao) => {
        const meta = SITUACAO_META[situacao];
        const quantidade = linhas.filter((l) => l.desSituacao === situacao).length;
        const ativo = situacaoAtiva === situacao;
        return (
          <button
            key={situacao}
            type="button"
            onClick={() => onSituacaoClick(situacao)}
            className={`rounded-xl border p-3 text-left transition ${
              ativo
                ? "border-cemig-badge bg-cemig-badge/10"
                : "border-cemig-card-border bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-xs font-medium text-gray-600">{meta.label}</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-gray-900">{quantidade}</p>
          </button>
        );
      })}
    </div>
  );
}
