import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419";
const LIMITE_NOTICIAS = 8;

export type Noticia = {
  titulo: string;
  link: string;
  fonte: string;
  dataPublicacao: string; // ISO 8601
};

type ItemRss = {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: string | { "#text"?: string };
};

function extrairFonte(item: ItemRss): string {
  if (typeof item.source === "string") return item.source;
  if (item.source && typeof item.source === "object" && item.source["#text"]) {
    return item.source["#text"];
  }
  return "";
}

function limparTitulo(titulo: string, fonte: string): string {
  if (!fonte) return titulo;
  const sufixo = ` - ${fonte}`;
  return titulo.endsWith(sufixo) ? titulo.slice(0, -sufixo.length) : titulo;
}

export async function getNoticias(): Promise<Noticia[]> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const doc = parser.parse(xml);

    const itensBrutos = doc?.rss?.channel?.item;
    const itens: ItemRss[] = Array.isArray(itensBrutos)
      ? itensBrutos
      : itensBrutos
        ? [itensBrutos]
        : [];

    const noticias: Noticia[] = itens
      .map((item) => {
        const fonte = extrairFonte(item);
        const titulo = typeof item.title === "string" ? item.title : "";
        const link = typeof item.link === "string" ? item.link : "";
        const pubDate = typeof item.pubDate === "string" ? item.pubDate : "";
        const data = pubDate ? new Date(pubDate) : null;

        if (!titulo || !link || !data || Number.isNaN(data.getTime())) return null;

        return {
          titulo: limparTitulo(titulo, fonte),
          link,
          fonte,
          dataPublicacao: data.toISOString(),
        };
      })
      .filter((n): n is Noticia => n !== null)
      .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao))
      .slice(0, LIMITE_NOTICIAS);

    return noticias;
  } catch {
    return [];
  }
}
