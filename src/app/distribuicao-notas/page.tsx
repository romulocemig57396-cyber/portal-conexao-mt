import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { ProcessarLoteForm } from "@/components/distribuicao-notas/ProcessarLoteForm";
import { TecnicosAtivosToggle } from "@/components/distribuicao-notas/TecnicosAtivosToggle";
import { NotasPorTecnico } from "@/components/distribuicao-notas/NotasPorTecnico";
import { MinhasNotas } from "@/components/distribuicao-notas/MinhasNotas";
import {
  listNotasPendentesAgrupadas,
  listNotasPendentesPorTecnico,
  listUsuarios,
  paraUsuarioPublico,
} from "@/lib/db";

export default async function DistribuicaoNotasPage() {
  const session = await auth();
  const user = session!.user;

  if (user.papel === "gestor") {
    const usuarios = await listUsuarios();
    const tecnicos = usuarios
      .filter((u) => u.papel === "colaborador")
      .map(paraUsuarioPublico);
    const notasPendentes = await listNotasPendentesAgrupadas();

    return (
      <>
        <Header nome={user.name ?? user.id} papel={user.papel} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <h1 className="text-xl font-semibold text-gray-900">Distribuição de Notas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Cole os relatórios para distribuir novas notas de serviço entre os técnicos ativos.
          </p>

          <div className="mt-6 space-y-6">
            <ProcessarLoteForm />
            <TecnicosAtivosToggle tecnicos={tecnicos} />
            <NotasPorTecnico
              notas={notasPendentes}
              tecnicos={tecnicos.filter((t) => t.ativo)}
            />
          </div>
        </main>
      </>
    );
  }

  const minhasNotas = await listNotasPendentesPorTecnico(Number(user.id));

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Minhas notas pendentes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Notas de serviço distribuídas para você. Marque como concluída quando finalizar.
        </p>

        <div className="mt-6">
          <MinhasNotas notas={minhasNotas} />
        </div>
      </main>
    </>
  );
}
