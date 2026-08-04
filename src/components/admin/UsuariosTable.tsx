"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioPublico } from "@/lib/db";

const PAPEL_LABEL: Record<string, string> = {
  gestor: "Gestor",
  colaborador: "Colaborador",
};

export function UsuariosTable({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: UsuarioPublico[];
  usuarioAtualId: number;
}) {
  const router = useRouter();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState("colaborador");
  const [dataNascimento, setDataNascimento] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  function iniciarEdicao(usuario: UsuarioPublico) {
    setEditandoId(usuario.id);
    setNome(usuario.nome);
    setPapel(usuario.papel);
    setDataNascimento(usuario.data_nascimento ?? "");
    setNovaSenha("");
    setErro(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setErro(null);
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setErro(null);
    setPendingId(id);
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setPendingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível atualizar o usuário.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function salvarEdicao(id: number) {
    const ok = await patch(id, {
      nome,
      papel,
      dataNascimento,
      ...(novaSenha ? { novaSenha } : {}),
    });
    if (ok) setEditandoId(null);
  }

  async function alternarAtivo(usuario: UsuarioPublico) {
    await patch(usuario.id, { ativo: !usuario.ativo });
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cemig-card-border text-xs text-gray-500">
            <th className="px-4 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Login</th>
            <th className="px-4 py-2 font-medium">Papel</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b border-cemig-card-border last:border-0">
              {editandoId === usuario.id ? (
                <td colSpan={5} className="px-4 py-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome"
                      className="rounded-md border border-cemig-card-border px-3 py-2 text-sm"
                    />
                    <select
                      value={papel}
                      onChange={(e) => setPapel(e.target.value)}
                      className="rounded-md border border-cemig-card-border px-3 py-2 text-sm"
                    >
                      <option value="colaborador">Colaborador</option>
                      <option value="gestor">Gestor</option>
                    </select>
                    <input
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      type="date"
                      title="Data de nascimento"
                      className="rounded-md border border-cemig-card-border px-3 py-2 text-sm"
                    />
                    <input
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      type="password"
                      placeholder="Nova senha (opcional)"
                      className="rounded-md border border-cemig-card-border px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => salvarEdicao(usuario.id)}
                        disabled={pendingId === usuario.id}
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
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {usuario.nome}
                    {usuario.id === usuarioAtualId && (
                      <span className="ml-2 text-xs text-gray-400">(você)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{usuario.usuario}</td>
                  <td className="px-4 py-3 text-gray-600">{PAPEL_LABEL[usuario.papel]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        usuario.ativo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(usuario)}
                        className="rounded-md border border-cemig-card-border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => alternarAtivo(usuario)}
                        disabled={pendingId === usuario.id || usuario.id === usuarioAtualId}
                        title={
                          usuario.id === usuarioAtualId
                            ? "Você não pode desativar sua própria conta"
                            : undefined
                        }
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {usuario.ativo ? "Desativar" : "Ativar"}
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
