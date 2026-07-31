"use client";

import { useActionState } from "react";
import { alterarSenhaAction } from "@/app/perfil/actions";

export function AlterarSenhaForm() {
  const [state, formAction, pending] = useActionState(alterarSenhaAction, undefined);

  return (
    <form
      action={formAction}
      className="max-w-sm space-y-3 rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4"
    >
      <div>
        <label htmlFor="senhaAtual" className="block text-xs font-medium text-gray-700">
          Senha atual
        </label>
        <input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="novaSenha" className="block text-xs font-medium text-gray-700">
          Nova senha
        </label>
        <input
          id="novaSenha"
          name="novaSenha"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="confirmarSenha" className="block text-xs font-medium text-gray-700">
          Confirmar nova senha
        </label>
        <input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
        />
      </div>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.sucesso && <p className="text-xs text-green-700">Senha alterada com sucesso.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
