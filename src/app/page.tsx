import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { CardGrid } from "@/components/CardGrid";
import { NoticiasSection } from "@/components/NoticiasSection";
import { AvisosSection } from "@/components/AvisosSection";
import { UltimosJogosSection } from "@/components/UltimosJogosSection";
import { agruparPorCategoria, cardsParaPapel } from "@/lib/cards";

export default async function HomePage() {
  const session = await auth();
  const user = session!.user;
  const secoes = agruparPorCategoria(cardsParaPapel(user.papel));

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="space-y-10">
          {secoes.map((secao) => (
            <section key={secao.categoria}>
              <h2 className="text-lg font-semibold text-gray-900">{secao.categoria}</h2>
              <div className="mt-4">
                <CardGrid cards={secao.cards} papel={user.papel} />
              </div>
            </section>
          ))}
          <div className="space-y-6">
            <AvisosSection />
            <NoticiasSection />
            <UltimosJogosSection />
          </div>
        </div>
      </main>
    </>
  );
}
