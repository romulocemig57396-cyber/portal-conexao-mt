import Link from "next/link";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { NotasConcluidasPorTecnico } from "@/components/distribuicao-notas/NotasConcluidasPorTecnico";
import { MinhasNotasConcluidas } from "@/components/distribuicao-notas/MinhasNotasConcluidas";
import { listNotasConcluidasAgrupadas, listNotasConcluidasPorTecnico } from "@/lib/db";

export default async function NotasConcluidasPage() {
  const session = await auth();
  const user = session!.user;

  const voltar = (
    <Link href="/distribuicao-notas" className="text-xs text-cemig-badge hover:underline">
      ← Voltar para Distribuição de Notas
    </Link>
  );

  if (user.papel === "gestor") {
    const notasConcluidas = await listNotasConcluidasAgrupadas();

    return (
      <>
        <Header nome={user.name ?? user.id} papel={user.papel} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {voltar}
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Notas concluídas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Histórico de notas concluídas por todos os técnicos.
          </p>

          <div className="mt-6">
            <NotasConcluidasPorTecnico notas={notasConcluidas} />
          </div>
        </main>
      </>
    );
  }

  const minhasNotas = await listNotasConcluidasPorTecnico(Number(user.id));

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {voltar}
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Minhas notas concluídas</h1>
        <p className="mt-1 text-sm text-gray-600">Histórico das notas que você já concluiu.</p>

        <div className="mt-6">
          <MinhasNotasConcluidas notas={minhasNotas} />
        </div>
      </main>
    </>
  );
}
