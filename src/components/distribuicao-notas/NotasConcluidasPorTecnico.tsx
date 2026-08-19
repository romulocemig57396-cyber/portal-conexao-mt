"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NotaServicoComTecnico } from "@/lib/db";
import { formatarDataBr, linkSap } from "@/lib/notasServico";

const TIPO_LABEL: Record<string, string> = {
  LN: "LN",
  AC: "AC",
  OU: "OU",
};

function formatarDataHoraBr(dataHora: string | null) {
  if (!dataHora) return "—";
  const [data, hora] = dataHora.split(" ");
  const horaCurta = hora ? hora.slice(0, 5) : "";
  return `${formatarDataBr(data)}${horaCurta ? ` ${horaCurta}` : ""}`;
}

export function NotasConcluidasPorTecnico({ notas }: { notas: NotaServicoComTecnico[] }) {
  const router = useRouter();
  const [pendingNota, setPendingNota] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function reabrir(numeroNota: string) {
    setErro(null);
    setPendingNota(numeroNota);
    const res = await fetch(`/api/notas/${numeroNota}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pendente" }),
    });
    setPendingNota(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível reabrir a nota.");
      return;
    }
    router.refresh();
  }

  if (notas.length === 0) {
    return (
      <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
        <h2 className="text-sm font-semibold text-gray-900">Notas concluídas</h2>
        <p className="mt-2 text-sm text-gray-500">Nenhuma nota concluída ainda.</p>
      </div>
    );
  }

  const grupos = new Map<string, NotaServicoComTecnico[]>();
  for (const nota of notas) {
    const chave = nota.tecnico_nome ?? "Sem técnico";
    const lista = grupos.get(chave) ?? [];
    lista.push(nota);
    grupos.set(chave, lista);
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        Notas concluídas por técnico ({notas.length} no total)
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        Reabrir devolve a nota para a caixa de pendências do técnico e volta a contar no total
        de pendentes acumuladas dele.
      </p>

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      <div className="mt-3 space-y-4">
        {[...grupos.entries()].map(([nome, notasDoTecnico]) => (
          <div key={nome} className="rounded-lg border border-cemig-card-border bg-white">
            <div className="border-b border-cemig-card-border px-3 py-2 text-sm font-semibold text-gray-900">
              {nome} — {notasDoTecnico.length} concluída(s)
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cemig-card-border text-gray-500">
                  <th className="px-3 py-1.5 font-medium">Nota</th>
                  <th className="px-3 py-1.5 font-medium">Emissão</th>
                  <th className="px-3 py-1.5 font-medium">Cidade</th>
                  <th className="px-3 py-1.5 font-medium">Medida</th>
                  <th className="px-3 py-1.5 font-medium">Tipo</th>
                  <th className="px-3 py-1.5 font-medium">Concluída em</th>
                  <th className="px-3 py-1.5 font-medium">SAP</th>
                  <th className="px-3 py-1.5 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {notasDoTecnico.map((nota) => (
                  <tr key={nota.numero_nota} className="border-b border-cemig-card-border last:border-0">
                    <td className="px-3 py-1.5 text-gray-900">{nota.numero_nota}</td>
                    <td className="px-3 py-1.5 text-gray-600">{formatarDataBr(nota.data_emissao)}</td>
                    <td className="px-3 py-1.5 text-gray-600">{nota.cidade}</td>
                    <td className="px-3 py-1.5 text-gray-600">{nota.medida}</td>
                    <td className="px-3 py-1.5 text-gray-600">{TIPO_LABEL[nota.tipo_solicitacao]}</td>
                    <td className="px-3 py-1.5 text-gray-600">
                      {formatarDataHoraBr(nota.data_conclusao)}
                    </td>
                    <td className="px-3 py-1.5">
                      <a
                        href={linkSap(nota.numero_nota)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cemig-badge hover:underline"
                      >
                        Abrir no SAP
                      </a>
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => reabrir(nota.numero_nota)}
                        disabled={pendingNota === nota.numero_nota}
                        className="rounded-md border border-cemig-card-border px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {pendingNota === nota.numero_nota ? "Reabrindo..." : "Reabrir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
