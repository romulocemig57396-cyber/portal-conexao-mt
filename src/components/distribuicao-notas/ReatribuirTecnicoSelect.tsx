"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReatribuirTecnicoSelect({
  numeroNota,
  tecnicoAtualId,
  tecnicos,
}: {
  numeroNota: string;
  tecnicoAtualId: number | null;
  tecnicos: { id: number; nome: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function reatribuir(novoId: number) {
    if (novoId === tecnicoAtualId) return;
    setErro(null);
    setPending(true);
    const res = await fetch(`/api/notas/${numeroNota}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tecnicoId: novoId }),
    });
    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível reatribuir a nota.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        value={tecnicoAtualId ?? ""}
        disabled={pending}
        onChange={(e) => reatribuir(Number(e.target.value))}
        className="rounded-md border border-cemig-card-border bg-white px-2 py-1 text-xs disabled:opacity-60"
      >
        {tecnicos.map((tecnico) => (
          <option key={tecnico.id} value={tecnico.id}>
            {tecnico.nome}
          </option>
        ))}
      </select>
      {erro && <p className="mt-0.5 text-[10px] text-red-600">{erro}</p>}
    </div>
  );
}
