"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NovoUsuarioForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: formData.get("nome"),
        usuario: formData.get("usuario"),
        senha: formData.get("senha"),
        papel: formData.get("papel"),
        dataNascimento: formData.get("dataNascimento"),
      }),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível criar o usuário.");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-3 rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">Novo usuário</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className="block text-xs font-medium text-gray-700">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="usuario" className="block text-xs font-medium text-gray-700">
            Login
          </label>
          <input
            id="usuario"
            name="usuario"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="senha" className="block text-xs font-medium text-gray-700">
            Senha inicial
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="papel" className="block text-xs font-medium text-gray-700">
            Papel
          </label>
          <select
            id="papel"
            name="papel"
            required
            defaultValue="colaborador"
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          >
            <option value="colaborador">Colaborador</option>
            <option value="gestor">Gestor</option>
          </select>
        </div>
        <div>
          <label htmlFor="dataNascimento" className="block text-xs font-medium text-gray-700">
            Data de nascimento
          </label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            type="date"
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar usuário"}
      </button>
    </form>
  );
}
