const CSV_URL =
  "https://dadosabertos.aneel.gov.br/dataset/7f43a020-6dc5-44b8-80b4-d97eaa94436c/resource/0591b8f6-fe54-437b-b72b-1aa2efd46e42/download/bandeira-tarifaria-acionamento.csv";

export type CorBandeira = "verde" | "amarela" | "vermelha";

export type BandeiraTarifaria = {
  bandeira: string;
  descricao: string;
  cor: CorBandeira;
  valorAdicional: number;
  mesReferencia: string; // YYYY-MM-DD
};

const BANDEIRA_META: Record<string, { label: string; cor: CorBandeira; descricao: string }> = {
  Verde: { label: "Verde", cor: "verde", descricao: "Sem acréscimo na tarifa" },
  Amarela: { label: "Amarela", cor: "amarela", descricao: "Acréscimo por 100 kWh consumidos" },
  "Vermelha P1": {
    label: "Vermelha (Patamar 1)",
    cor: "vermelha",
    descricao: "Acréscimo por 100 kWh consumidos",
  },
  "Vermelha P2": {
    label: "Vermelha (Patamar 2)",
    cor: "vermelha",
    descricao: "Acréscimo maior por 100 kWh consumidos",
  },
  "Escassez Hídrica": {
    label: "Escassez Hídrica",
    cor: "vermelha",
    descricao: "Acréscimo extraordinário por 100 kWh consumidos",
  },
};

function parseLinhaCsv(linha: string): string[] {
  return linha.split(";").map((v) => v.trim().replace(/^"|"$/g, ""));
}

export async function getBandeiraTarifaria(): Promise<BandeiraTarifaria | null> {
  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const texto = await res.text();
    const linhas = texto.trim().split("\n").filter(Boolean);
    if (linhas.length < 2) return null;

    const cabecalho = parseLinhaCsv(linhas[0]);
    const idxCompetencia = cabecalho.indexOf("DatCompetencia");
    const idxNome = cabecalho.indexOf("NomBandeiraAcionada");
    const idxValor = cabecalho.indexOf("VlrAdicionalBandeira");
    if (idxCompetencia === -1 || idxNome === -1 || idxValor === -1) return null;

    const registros = linhas.slice(1).map(parseLinhaCsv);
    const maisRecente = registros.reduce((atual, linha) =>
      linha[idxCompetencia] > atual[idxCompetencia] ? linha : atual
    );

    const nomeBandeira = maisRecente[idxNome];
    const meta = BANDEIRA_META[nomeBandeira];
    if (!meta) return null;

    const valorAdicional = Number(maisRecente[idxValor]?.replace(",", ".")) || 0;
    const mesReferencia = maisRecente[idxCompetencia];
    if (!mesReferencia) return null;

    return {
      bandeira: meta.label,
      descricao: meta.descricao,
      cor: meta.cor,
      valorAdicional,
      mesReferencia,
    };
  } catch {
    return null;
  }
}
