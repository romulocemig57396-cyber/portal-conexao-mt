import Link from "next/link";
import type { Card } from "@/lib/cards";

export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <CardItem key={card.id} card={card} numero={index + 1} />
      ))}
    </div>
  );
}

function CardItem({ card, numero }: { card: Card; numero: number }) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cemig-badge text-sm font-semibold text-white">
          {numero}
        </span>
        {card.icone && <span className="text-2xl">{card.icone}</span>}
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900">{card.titulo}</h2>
      <p className="mt-1 text-sm text-gray-600">{card.descricao}</p>
    </>
  );

  const className =
    "block rounded-xl border border-cemig-card-border bg-cemig-card-bg p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5";

  if (card.tipo === "link" && card.url) {
    return (
      <a href={card.url} target="_blank" rel="noopener noreferrer" className={className}>
        {conteudo}
      </a>
    );
  }

  return (
    <Link href={card.rota ?? "#"} className={className}>
      {conteudo}
    </Link>
  );
}
