"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Resultado = {
  totalLidas: number;
  novas: number;
  jaExistentes: number;
  semCorrespondencia: number;
  distribuicao: { tecnicoId: number; nome: string; quantidade: number }[];
};

export function ProcessarLoteForm() {
  const router = useRouter();
  const [relatorio1, setRelatorio1] = useState("");
  const [relatorio2, setRelatorio2] = useState("");
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setResultado(null);
    setPending(true);

    const res = await fetch("/api/notas/processar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relatorio1, relatorio2 }),
    });
    const data = await res.json().catch(() => null);
    setPending(false);

    if (!res.ok) {
      setErro(data?.error ?? "Não foi possível processar os relatórios.");
      return;
    }

    setResultado(data as Resultado);
    setRelatorio1("");
    setRelatorio2("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
      <h2 className="text-sm font-semibold text-gray-900">Processar novo lote</h2>
      <p className="mt-1 text-xs text-gray-600">
        Cole os dois relatórios (colunas separadas por tabulação, sem cabeçalho) e clique em
        Processar. Apenas notas ainda não cadastradas serão distribuídas.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <label htmlFor="relatorio1" className="block text-xs font-medium text-gray-700">
              Relatório 1 — dados gerais da nota
            </label>
            <textarea
              id="relatorio1"
              value={relatorio1}
              onChange={(e) => setRelatorio1(e.target.value)}
              rows={8}
              placeholder={"18.08.2026\t1257698205\tJuatuba\tCN\t22.08.2026\t0019"}
              className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 font-mono text-xs"
            />
          </div>
          <div>
            <label htmlFor="relatorio2" className="block text-xs font-medium text-gray-700">
              Relatório 2 — tipo de solicitação
            </label>
            <textarea
              id="relatorio2"
              value={relatorio2}
              onChange={(e) => setRelatorio2(e.target.value)}
              rows={8}
              placeholder={"1257698205\t5"}
              className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 font-mono text-xs"
            />
          </div>
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Processando..." : "Processar"}
        </button>
      </form>

      {resultado && (
        <div className="mt-4 rounded-md border border-cemig-card-border bg-white p-3 text-sm">
          <p className="text-gray-900">
            {resultado.novas} nota(s) nova(s) distribuída(s) de {resultado.totalLidas} lida(s)
            {resultado.jaExistentes > 0 && ` — ${resultado.jaExistentes} já cadastrada(s)`}
            {resultado.semCorrespondencia > 0 &&
              ` — ${resultado.semCorrespondencia} sem correspondência no relatório 2 (tratada como AC)`}
            .
          </p>
          {resultado.distribuicao.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
              {resultado.distribuicao.map((d) => (
                <li key={d.tecnicoId}>
                  {d.nome}: {d.quantidade} nota(s)
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
