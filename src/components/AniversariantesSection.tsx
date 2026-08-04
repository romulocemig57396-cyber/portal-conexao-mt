import { listAniversariantesDoMes } from "@/lib/db";

export async function AniversariantesSection() {
  const aniversariantes = await listAniversariantesDoMes();

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Aniversariantes do mês</h2>
      <div className="mt-4 rounded-xl border border-cemig-card-border bg-cemig-card-bg">
        {aniversariantes.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            Ninguém da equipe faz aniversário este mês.
          </p>
        ) : (
          <ul className="divide-y divide-cemig-card-border">
            {aniversariantes.map((a) => (
              <li key={a.nome} className="flex items-center gap-3 p-4">
                <span className="text-xl leading-none">🎂</span>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{String(a.dia).padStart(2, "0")}/{String(a.mes).padStart(2, "0")}</span>
                  {" — "}
                  {a.nome}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
