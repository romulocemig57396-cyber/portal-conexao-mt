"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Resultado = {
  totalLidas: number;
  cadastradas: number;
  jaExistentes: number;
  erros: string[];
};

export function CargaInicialForm() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setResultado(null);
    setPending(true);

    const res = await fetch("/api/notas/carga-inicial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    const data = await res.json().catch(() => null);
    setPending(false);

    if (!res.ok) {
      setErro(data?.error ?? "Não foi possível cadastrar as notas.");
      return;
    }

    setResultado(data as Resultado);
    setTexto("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
      <h2 className="text-sm font-semibold text-gray-900">Colar notas</h2>
      <p className="mt-1 text-xs text-gray-600">
        Colunas separadas por tabulação, sem cabeçalho: data de emissão, número da nota, cidade,
        regional, prazo, medida, tipo de solicitação (LN/AC/OU ou código bruto 5/vazio) e
        responsável (nome do técnico). Essas notas entram direto como pendentes, sem passar pelo
        algoritmo de distribuição.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={10}
          placeholder={"18.08.2026\t1257698205\tJuatuba\tCN\t22.08.2026\t0019\t5\tCrisdálhia"}
          className="w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 font-mono text-xs"
        />

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      {resultado && (
        <div className="mt-4 rounded-md border border-cemig-card-border bg-white p-3 text-sm">
          <p className="text-gray-900">
            {resultado.cadastradas} nota(s) cadastrada(s) de {resultado.totalLidas} lida(s)
            {resultado.jaExistentes > 0 && ` — ${resultado.jaExistentes} já cadastrada(s)`}.
          </p>
          {resultado.erros.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-red-600">
              {resultado.erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          <Link
            href="/distribuicao-notas"
            className="mt-3 inline-block rounded-md border border-cemig-card-border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Voltar para Distribuição de Notas
          </Link>
        </div>
      )}
    </div>
  );
}
