import type { Papel } from "@/lib/db";

export type Categoria = "Equipe" | "Acompanhamento" | "Ferramentas" | "Portais Cemig";

export type Card = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  tipo: "link" | "interno";
  url?: string; // se tipo = link
  rota?: string; // se tipo = interno, ex: /calendario
  icone?: string;
  /** Papéis que podem ver o card. Se omitido, visível para todos. */
  papeis?: Papel[];
};

/** Ordem fixa de exibição das seções na home. */
export const ORDEM_CATEGORIAS: Categoria[] = [
  "Equipe",
  "Acompanhamento",
  "Ferramentas",
  "Portais Cemig",
];

/**
 * Lista de cards do portal. Para adicionar um novo painel, basta acrescentar
 * uma entrada aqui — o grid da home se ajusta automaticamente.
 */
export const cards: Card[] = [
  {
    id: "acompanhamento-diario",
    titulo: "Acompanhamento diário",
    descricao: "Painel de medidas pendentes",
    categoria: "Acompanhamento",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_PAINEL_MEDIDAS_URL ?? "#",
    icone: "📊",
  },
  {
    id: "calendario",
    titulo: "Calendário de férias e ausências",
    descricao: "Solicite e acompanhe férias e ausências da equipe",
    categoria: "Equipe",
    tipo: "interno",
    rota: "/calendario",
    icone: "🗓️",
  },
  {
    id: "servicos-regulatorios",
    titulo: "Serviços Regulatórios em Andamento",
    descricao: "Painel de acompanhamento dos serviços regulatórios em andamento",
    categoria: "Acompanhamento",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_PAINEL_REGULATORIOS_URL ?? "#",
    icone: "📋",
  },
  {
    id: "orcamento-mt",
    titulo: "Orçamento MT",
    descricao: "Ferramenta de apoio na emissão de orçamentos",
    categoria: "Ferramentas",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_ORCAMENTO_MT_URL ?? "#",
    icone: "💰",
  },
  {
    id: "aprweb",
    titulo: "APRWEB",
    descricao: "Sistema de envio de arquivos por RT's",
    categoria: "Ferramentas",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_APRWEB_URL ?? "#",
    icone: "📤",
  },
  {
    id: "chamados",
    titulo: "Chamados",
    descricao: "Sistema para abertura de chamados para TI e demais áreas",
    categoria: "Portais Cemig",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_CHAMADOS_URL ?? "#",
    icone: "🎫",
  },
  {
    id: "cemigon",
    titulo: "CemigON",
    descricao: "",
    categoria: "Ferramentas",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_CEMIGON_URL ?? "#",
    icone: "⚡",
  },
  {
    id: "conecta",
    titulo: "Conecta",
    descricao: "Página principal sharepoint",
    categoria: "Portais Cemig",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_CONECTA_URL ?? "#",
    icone: "🔗",
  },
  {
    id: "univercemig",
    titulo: "Univercemig",
    descricao: "Portal de cursos Cemig",
    categoria: "Portais Cemig",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_UNIVERCEMIG_URL ?? "#",
    icone: "🎓",
  },
  {
    id: "sap",
    titulo: "SAP",
    descricao: "Acesso ao S4 Hana",
    categoria: "Ferramentas",
    tipo: "link",
    url: process.env.NEXT_PUBLIC_SAP_URL ?? "#",
    icone: "🖥️",
  },
];

export function cardsParaPapel(papel: Papel): Card[] {
  return cards.filter((card) => !card.papeis || card.papeis.includes(papel));
}

export type SecaoCards = { categoria: Categoria; cards: Card[] };

/** Agrupa os cards por categoria, na ordem fixa de ORDEM_CATEGORIAS. */
export function agruparPorCategoria(cards: Card[]): SecaoCards[] {
  return ORDEM_CATEGORIAS.map((categoria) => ({
    categoria,
    cards: cards.filter((card) => card.categoria === categoria),
  })).filter((secao) => secao.cards.length > 0);
}
