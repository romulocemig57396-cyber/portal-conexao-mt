import Link from "next/link";
import type { Card } from "@/lib/cards";
import type { Papel } from "@/lib/db";

export function CardGrid({ cards, papel }: { cards: Card[]; papel: Papel }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} papel={papel} />
      ))}
    </div>
  );
}

function CardItem({ card, papel }: { card: Card; papel: Papel }) {
  const desabilitado = card.desabilitadoPara?.includes(papel) ?? false;

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
      {desabilitado && (
        <span className="mt-1.5 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
          Em breve
        </span>
      )}
      {card.descricao && <p className="mt-1.5 text-xs text-gray-600">{card.descricao}</p>}
    </>
  );

  if (desabilitado) {
    return (
      <div className="cursor-not-allowed rounded-lg border border-cemig-card-border bg-cemig-card-bg p-3 opacity-50">
        {conteudo}
      </div>
    );
  }

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
