import Link from "next/link";
import type { Card } from "@/lib/cards";

export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}

function CardItem({ card }: { card: Card }) {
  const conteudo = (
    <>
      <div className="flex h-8 items-center">
        {card.iconeImg ? (
          <img src={card.iconeImg} alt="" className="h-full w-auto max-w-[120px] object-contain" />
        ) : (
          card.icone && <span className="text-2xl leading-none">{card.icone}</span>
        )}
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
