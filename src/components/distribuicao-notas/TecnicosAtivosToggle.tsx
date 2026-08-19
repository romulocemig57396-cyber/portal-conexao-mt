"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioPublico } from "@/lib/db";

export function TecnicosAtivosToggle({ tecnicos }: { tecnicos: UsuarioPublico[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar(tecnico: UsuarioPublico) {
    setErro(null);
    setPendingId(tecnico.id);
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tecnico.id, ativoDistribuicao: !tecnico.ativo_distribuicao }),
    });
    setPendingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível atualizar o técnico.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
      <h2 className="text-sm font-semibold text-gray-900">Técnicos ativos para distribuição</h2>
      <p className="mt-1 text-xs text-gray-600">
        Apenas os técnicos ativos recebem notas nos próximos lotes processados.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {tecnicos.map((tecnico) => (
          <button
            key={tecnico.id}
            type="button"
            onClick={() => alternar(tecnico)}
            disabled={pendingId === tecnico.id || !tecnico.ativo}
            title={!tecnico.ativo ? "Usuário inativo no portal" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              tecnico.ativo_distribuicao
                ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                : "border-cemig-card-border bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tecnico.nome} {tecnico.ativo_distribuicao ? "· ativo" : "· inativo"}
          </button>
        ))}
      </div>

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
