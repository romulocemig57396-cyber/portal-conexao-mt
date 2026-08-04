"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AvisoComAutor } from "@/lib/db";

export function AvisosTable({ avisos }: { avisos: AvisoComAutor[] }) {
  const router = useRouter();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  function iniciarEdicao(aviso: AvisoComAutor) {
    setEditandoId(aviso.id);
    setTitulo(aviso.titulo);
    setMensagem(aviso.mensagem);
    setErro(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setErro(null);
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setErro(null);
    setPendingId(id);
    const res = await fetch("/api/admin/avisos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setPendingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível atualizar o aviso.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function salvarEdicao(id: number) {
    const ok = await patch(id, { titulo, mensagem });
    if (ok) setEditandoId(null);
  }

  async function alternarAtivo(aviso: AvisoComAutor) {
    await patch(aviso.id, { ativo: !aviso.ativo });
  }

  if (avisos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum aviso cadastrado ainda.</p>;
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cemig-card-border text-xs text-gray-500">
            <th className="px-4 py-2 font-medium">Título</th>
            <th className="px-4 py-2 font-medium">Mensagem</th>
            <th className="px-4 py-2 font-medium">Autor</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {avisos.map((aviso) => (
            <tr key={aviso.id} className="border-b border-cemig-card-border last:border-0">
              {editandoId === aviso.id ? (
                <td colSpan={5} className="px-4 py-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Título"
                      className="rounded-md border border-cemig-card-border px-3 py-2 text-sm"
                    />
                    <input
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Mensagem"
                      className="rounded-md border border-cemig-card-border px-3 py-2 text-sm sm:col-span-1"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => salvarEdicao(aviso.id)}
                        disabled={pendingId === aviso.id}
                        className="rounded-md bg-cemig-badge px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="rounded-md border border-cemig-card-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                  {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 font-medium text-gray-900">{aviso.titulo}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">{aviso.mensagem}</td>
                  <td className="px-4 py-3 text-gray-600">{aviso.autor_nome}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        aviso.ativo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {aviso.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(aviso)}
                        className="rounded-md border border-cemig-card-border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => alternarAtivo(aviso)}
                        disabled={pendingId === aviso.id}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {aviso.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
