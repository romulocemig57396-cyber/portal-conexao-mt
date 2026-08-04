"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NovoAvisoForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: formData.get("titulo"),
        mensagem: formData.get("mensagem"),
      }),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível criar o aviso.");
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
      <h2 className="text-sm font-semibold text-gray-900">Novo aviso</h2>

      <div>
        <label htmlFor="titulo" className="block text-xs font-medium text-gray-700">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="mensagem" className="block text-xs font-medium text-gray-700">
          Mensagem
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          required
          rows={3}
          className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
        />
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Publicando..." : "Publicar aviso"}
      </button>
    </form>
  );
}
