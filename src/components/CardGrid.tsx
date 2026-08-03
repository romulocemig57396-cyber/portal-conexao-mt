import Link from "next/link";
import type { Card } from "@/lib/cards";

export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}

function CardItem({ card }: { card: Card }) {
  const conteudo = (
    <>
      <div className="flex items-center gap-2">
        <div className="flex h-6 shrink-0 items-center">
          {card.iconeImg ? (
            <img src={card.iconeImg} alt="" className="h-full w-auto max-w-[80px] object-contain" />
          ) : (
            card.icone && <span className="text-lg leading-none">{card.icone}</span>
          )}
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{card.titulo}</h2>
      </div>
      {card.descricao && <p className="mt-1.5 text-xs text-gray-600">{card.descricao}</p>}
    </>
  );

  const className =
    "block rounded-lg border border-cemig-card-border bg-cemig-card-bg p-3 shadow-sm transition hover:shadow-md hover:-translate-y-0.5";

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
