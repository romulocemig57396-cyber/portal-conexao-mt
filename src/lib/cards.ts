import type { Papel } from "@/lib/db";

export type Card = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "link" | "interno";
  url?: string; // se tipo = link
  rota?: string; // se tipo = interno, ex: /calendario
  icone?: string;
  /** Papéis que podem ver o card. Se omitido, visível para todos. */
  papeis?: Papel[];
};

/**
 * Lista de cards do portal. Para adicionar um novo painel, basta acrescentar
 * uma entrada aqui — o grid da home se ajusta automaticamente.
 */
export const cards: Card[] = [
  {
    id: "acompanhamento-diario",
    titulo: "Acompanhamento diário",
    descricao: "Painel de medidas pendentes",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_PAINEL_MEDIDAS_URL ?? "#",
    icone: "📊",
  },
  {
    id: "calendario",
    titulo: "Calendário de férias e ausências",
    descricao: "Solicite e acompanhe férias e ausências da equipe",
    tipo: "interno",
    rota: "/calendario",
    icone: "🗓️",
  },
  {
    id: "servicos-regulatorios",
    titulo: "Serviços Regulatórios em Andamento",
    descricao: "Painel de acompanhamento dos serviços regulatórios em andamento",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_PAINEL_REGULATORIOS_URL ?? "#",
    icone: "📋",
  },
];

export function cardsParaPapel(papel: Papel): Card[] {
  return cards.filter((card) => !card.papeis || card.papeis.includes(papel));
}
