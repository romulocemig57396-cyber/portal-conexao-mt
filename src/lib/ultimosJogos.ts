/**
 * Lista configurável de times acompanhados. Para adicionar/remover um
 * time, basta editar esta lista — o quadro na home se ajusta sozinho.
 */
export const TIMES_ACOMPANHADOS = [
  { nome: "Cruzeiro", idTeam: "134294" },
  { nome: "Atlético-MG", idTeam: "134299" },
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

async function buscarUltimoJogo(time: {
  nome: string;
  idTeam: string;
}): Promise<UltimoJogo> {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${time.idTeam}`,
      { next: { revalidate: 10800 } }
    );
    if (!res.ok) return { nome: time.nome, disponivel: false };

    const data = await res.json();
    const evento = data?.results?.[0];
    if (!evento) return { nome: time.nome, disponivel: false };

    const ehCasa = evento.idHomeTeam === time.idTeam;
    const adversario = ehCasa ? evento.strAwayTeam : evento.strHomeTeam;
    const golsTime = Number(ehCasa ? evento.intHomeScore : evento.intAwayScore);
    const golsAdversario = Number(ehCasa ? evento.intAwayScore : evento.intHomeScore);
    const data_ = evento.dateEvent;

    if (
      typeof adversario !== "string" ||
      Number.isNaN(golsTime) ||
      Number.isNaN(golsAdversario) ||
      typeof data_ !== "string"
    ) {
      return { nome: time.nome, disponivel: false };
    }

    const resultado: ResultadoJogo =
      golsTime > golsAdversario ? "vitoria" : golsTime === golsAdversario ? "empate" : "derrota";

    return {
      nome: time.nome,
      disponivel: true,
      adversario,
      golsTime,
      golsAdversario,
      resultado,
      data: data_,
      competicao: evento.strLeague ?? "",
    };
  } catch {
    return { nome: time.nome, disponivel: false };
  }
}

export async function getUltimosJogos(): Promise<UltimoJogo[]> {
  return Promise.all(TIMES_ACOMPANHADOS.map(buscarUltimoJogo));
}
