import { listAniversariantesDoMes } from "@/lib/db";

export async function AniversariantesSection() {
  const aniversariantes = await listAniversariantesDoMes();

  if (aniversariantes.length === 0) {
    return (
      <div className="w-72 rounded-lg border border-cemig-card-border bg-cemig-card-bg px-3 py-1.5 text-xs text-gray-500 shadow-sm">
        Ninguém da equipe faz aniversário este mês.
      </div>
    );
  }

  return (
    <div className="w-72 rounded-lg border border-cemig-card-border bg-cemig-card-bg p-3 shadow-sm">
      <p className="text-xs font-semibold text-gray-900">Aniversariantes do mês</p>
      <ul className="mt-1.5 space-y-1">
        {aniversariantes.map((a) => (
          <li key={a.nome} className="flex items-center gap-2 text-xs text-gray-700">
            <span className="leading-none">🎂</span>
            <span>
              <span className="font-medium text-gray-900">
                {String(a.dia).padStart(2, "0")}/{String(a.mes).padStart(2, "0")}
              </span>{" "}
              — {a.nome}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
