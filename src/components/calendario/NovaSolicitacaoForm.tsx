"use client";

import { useActionState } from "react";
import { criarSolicitacaoAction } from "@/app/calendario/actions";

export function NovaSolicitacaoForm() {
  const [state, formAction, pending] = useActionState(criarSolicitacaoAction, undefined);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4"
    >
      <h3 className="text-sm font-semibold text-gray-900">Nova solicitação</h3>

      <div>
        <label htmlFor="tipo" className="block text-xs font-medium text-gray-700">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
        >
          <option value="ferias">Férias</option>
          <option value="ausencia">Ausência</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dataInicio" className="block text-xs font-medium text-gray-700">
            Início
          </label>
          <input
            id="dataInicio"
            type="date"
            name="dataInicio"
            required
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="dataFim" className="block text-xs font-medium text-gray-700">
            Fim
          </label>
          <input
            id="dataFim"
            type="date"
            name="dataFim"
            required
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Solicitar"}
      </button>
    </form>
  );
}
