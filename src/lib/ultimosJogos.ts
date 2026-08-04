/**
 * Lista configurável de times acompanhados. Para adicionar/remover um
 * time, basta editar esta lista — o quadro na home se ajusta sozinho.
 *
 * `ligas` são os campeonatos que o time disputa (idLeague do TheSportsDB).
 * São usadas como fonte extra além de `eventslast.php`, porque o índice
 * "últimos eventos" por time da API gratuita às vezes fica desatualizado
 * (confirmado na prática: um jogo do Cruzeiro pela Copa do Brasil não
 * aparecia em eventslast.php?id=134294, mas aparecia certinho consultando
 * pelo lado do adversário) — cruzar as duas fontes e ficar com a data mais
 * recente reduz esse tipo de lacuna, embora não elimine 100%, já que a API
 * gratuita tem outras limitações (vários endpoints retornam só 1 resultado).
 */
export const TIMES_ACOMPANHADOS = [
  {
    nome: "Cruzeiro",
    idTeam: "134294",
    ligas: ["4351", "4725", "4501", "5763"], // Série A, Copa do Brasil, Libertadores, Mineiro
  },
  {
    nome: "Atlético-MG",
    idTeam: "134299",
    ligas: ["4351", "4725", "4724", "5763"], // Série A, Copa do Brasil, Sul-Americana, Mineiro
  },
];

export type ResultadoJogo = "vitoria" | "empate" | "derrota";

export type UltimoJogo =
  | {
      nome: string;
      disponivel: true;
      adversario: string;
      golsTime: number;
      golsAdversario: number;
      resultado: ResultadoJogo;
      data: string;
      competicao: string;
    }
  | { nome: string; disponivel: false };

type EventoBruto = {
  idHomeTeam?: string;
  idAwayTeam?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string;
  intAwayScore?: string;
  dateEvent?: string;
  strLeague?: string;
  strStatus?: string;
};

async function buscarJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { next: { revalidate: 10800 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Candidatos vindos do índice "últimos eventos" do próprio time. */
async function candidatosPorTime(idTeam: string): Promise<EventoBruto[]> {
  const data = (await buscarJson(
    `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${idTeam}`
  )) as { results?: EventoBruto[] } | null;
  return data?.results ?? [];
}

/** Candidatos vindos do último evento encerrado de cada liga do time. */
async function candidatosPorLigas(idTeam: string, ligas: string[]): Promise<EventoBruto[]> {
  const respostas = await Promise.all(
    ligas.map((idLeague) =>
      buscarJson(`https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${idLeague}`)
    )
  );

  return respostas
    .map((data) => (data as { events?: EventoBruto[] } | null)?.events?.[0])
    .filter((evento): evento is EventoBruto => !!evento)
    .filter((evento) => evento.idHomeTeam === idTeam || evento.idAwayTeam === idTeam);
}

function paraUltimoJogo(nome: string, idTeam: string, evento: EventoBruto): UltimoJogo | null {
  const ehCasa = evento.idHomeTeam === idTeam;
  const adversario = ehCasa ? evento.strAwayTeam : evento.strHomeTeam;
  const golsTime = Number(ehCasa ? evento.intHomeScore : evento.intAwayScore);
  const golsAdversario = Number(ehCasa ? evento.intAwayScore : evento.intHomeScore);
  const data = evento.dateEvent;

  if (
    typeof adversario !== "string" ||
    Number.isNaN(golsTime) ||
    Number.isNaN(golsAdversario) ||
    typeof data !== "string"
  ) {
    return null;
  }

  const resultado: ResultadoJogo =
    golsTime > golsAdversario ? "vitoria" : golsTime === golsAdversario ? "empate" : "derrota";

  return {
    nome,
    disponivel: true,
    adversario,
    golsTime,
    golsAdversario,
    resultado,
    data,
    competicao: evento.strLeague ?? "",
  };
}

async function buscarUltimoJogo(time: {
  nome: string;
  idTeam: string;
  ligas: string[];
}): Promise<UltimoJogo> {
  const [porTime, porLigas] = await Promise.all([
    candidatosPorTime(time.idTeam),
    candidatosPorLigas(time.idTeam, time.ligas),
  ]);

  const candidatos = [...porTime, ...porLigas]
    .map((evento) => paraUltimoJogo(time.nome, time.idTeam, evento))
    .filter((j): j is Extract<UltimoJogo, { disponivel: true }> => j !== null);

  if (candidatos.length === 0) {
    return { nome: time.nome, disponivel: false };
  }

  return candidatos.reduce((maisRecente, atual) =>
    atual.data > maisRecente.data ? atual : maisRecente
  );
}

export async function getUltimosJogos(): Promise<UltimoJogo[]> {
  return Promise.all(TIMES_ACOMPANHADOS.map(buscarUltimoJogo));
}
