export type ProximoFeriado = {
  nome: string;
  data: string; // YYYY-MM-DD
  diasRestantes: number;
};

type FeriadoBrasilApi = { date: string; name: string; type: string };

function parseDataLocal(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function buscarFeriados(ano: number): Promise<FeriadoBrasilApi[]> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getProximoFeriado(): Promise<ProximoFeriado | null> {
  const hoje = inicioDoDia(new Date());
  const anoAtual = hoje.getFullYear();

  const feriados = await buscarFeriados(anoAtual);
  let futuros = feriados.filter((f) => parseDataLocal(f.date) >= hoje);

  // Se estamos no fim do ano e não sobrou feriado, busca o ano seguinte.
  if (futuros.length === 0) {
    const feriadosProximoAno = await buscarFeriados(anoAtual + 1);
    futuros = feriadosProximoAno.filter((f) => parseDataLocal(f.date) >= hoje);
  }

  if (futuros.length === 0) return null;

  const proximo = futuros.reduce((maisProximo, atual) =>
    atual.date < maisProximo.date ? atual : maisProximo
  );

  const diasRestantes = Math.round(
    (parseDataLocal(proximo.date).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  return { nome: proximo.name, data: proximo.date, diasRestantes };
}
