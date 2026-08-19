import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { CargaInicialForm } from "@/components/distribuicao-notas/CargaInicialForm";

export default async function CargaInicialPage() {
  const session = await auth();
  const user = session!.user;
  if (user.papel !== "gestor") {
    redirect("/distribuicao-notas");
  }

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Adicionar nota com responsável</h1>
            <p className="mt-1 text-sm text-gray-600">
              Cadastre notas que já estão em andamento fora do app — com o responsável já
              definido manualmente — para deixar o histórico de pendências correto antes de
              novas distribuições automáticas.
            </p>
          </div>
          <Link
            href="/distribuicao-notas"
            className="shrink-0 rounded-md border border-cemig-card-border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Voltar
          </Link>
        </div>

        <div className="mt-6">
          <CargaInicialForm />
        </div>
      </main>
    </>
  );
}
