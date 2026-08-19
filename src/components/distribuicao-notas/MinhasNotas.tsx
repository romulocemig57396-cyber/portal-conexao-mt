"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NotaServico } from "@/lib/db";
import { formatarDataBr, linkSap } from "@/lib/notasServico";

const TIPO_LABEL: Record<string, string> = {
  LN: "LN",
  AC: "AC",
  OU: "OU",
};

export function MinhasNotas({ notas }: { notas: NotaServico[] }) {
  const router = useRouter();
  const [pendingNota, setPendingNota] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function concluir(numeroNota: string) {
    setErro(null);
    setPendingNota(numeroNota);
    const res = await fetch(`/api/notas/${numeroNota}`, { method: "PATCH" });
    setPendingNota(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível concluir a nota.");
      return;
    }
    router.refresh();
  }

  if (notas.length === 0) {
    return (
      <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
        <p className="text-sm text-gray-500">Nenhuma nota pendente para você no momento.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cemig-card-border text-xs text-gray-500">
            <th className="px-4 py-2 font-medium">Nota</th>
            <th className="px-4 py-2 font-medium">Emissão</th>
            <th className="px-4 py-2 font-medium">Prazo</th>
            <th className="px-4 py-2 font-medium">Cidade</th>
            <th className="px-4 py-2 font-medium">Medida</th>
            <th className="px-4 py-2 font-medium">Tipo</th>
            <th className="px-4 py-2 font-medium">SAP</th>
            <th className="px-4 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota) => (
            <tr key={nota.numero_nota} className="border-b border-cemig-card-border last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{nota.numero_nota}</td>
              <td className="px-4 py-3 text-gray-600">{formatarDataBr(nota.data_emissao)}</td>
              <td className="px-4 py-3 text-gray-600">{formatarDataBr(nota.prazo)}</td>
              <td className="px-4 py-3 text-gray-600">{nota.cidade}</td>
              <td className="px-4 py-3 text-gray-600">{nota.medida}</td>
              <td className="px-4 py-3 text-gray-600">{TIPO_LABEL[nota.tipo_solicitacao]}</td>
              <td className="px-4 py-3">
                <a
                  href={linkSap(nota.numero_nota)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cemig-badge hover:underline"
                >
                  Abrir no SAP
                </a>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => concluir(nota.numero_nota)}
                  disabled={pendingNota === nota.numero_nota}
                  className="rounded-md bg-cemig-badge px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pendingNota === nota.numero_nota ? "Concluindo..." : "Concluir"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {erro && <p className="px-4 py-2 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
