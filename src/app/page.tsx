import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { CardGrid } from "@/components/CardGrid";
import { cardsParaPapel } from "@/lib/cards";

export default async function HomePage() {
  const session = await auth();
  const user = session!.user;
  const cards = cardsParaPapel(user.papel);

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Painéis</h1>
        <p className="mt-1 text-sm text-gray-600">Selecione um painel para começar.</p>
        <div className="mt-6">
          <CardGrid cards={cards} />
        </div>
      </main>
    </>
  );
}
