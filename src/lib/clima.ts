const LATITUDE = -19.9167;
const LONGITUDE = -43.9345;
const FEED_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`;

export type Clima = {
  temperatura: number;
  temperaturaMax: number;
  temperaturaMin: number;
  ventoKmh: number;
  descricao: string;
  icone: string;
};

const WEATHER_CODE_MAP: Record<number, { descricao: string; icone: string }> = {
  0: { descricao: "Céu limpo", icone: "☀️" },
  1: { descricao: "Poucas nuvens", icone: "🌤️" },
  2: { descricao: "Parcialmente nublado", icone: "⛅" },
  3: { descricao: "Nublado", icone: "☁️" },
  45: { descricao: "Neblina", icone: "🌫️" },
  48: { descricao: "Neblina com geada", icone: "🌫️" },
  51: { descricao: "Garoa fraca", icone: "🌦️" },
  53: { descricao: "Garoa moderada", icone: "🌦️" },
  55: { descricao: "Garoa forte", icone: "🌦️" },
  56: { descricao: "Garoa congelante fraca", icone: "🌧️" },
  57: { descricao: "Garoa congelante forte", icone: "🌧️" },
  61: { descricao: "Chuva fraca", icone: "🌧️" },
  63: { descricao: "Chuva moderada", icone: "🌧️" },
  65: { descricao: "Chuva forte", icone: "🌧️" },
  66: { descricao: "Chuva congelante fraca", icone: "🌧️" },
  67: { descricao: "Chuva congelante forte", icone: "🌧️" },
  71: { descricao: "Neve fraca", icone: "🌨️" },
  73: { descricao: "Neve moderada", icone: "🌨️" },
  75: { descricao: "Neve forte", icone: "🌨️" },
  77: { descricao: "Grãos de neve", icone: "🌨️" },
  80: { descricao: "Pancadas de chuva fracas", icone: "🌦️" },
  81: { descricao: "Pancadas de chuva moderadas", icone: "🌦️" },
  82: { descricao: "Pancadas de chuva fortes", icone: "⛈️" },
  85: { descricao: "Pancadas de neve fracas", icone: "🌨️" },
  86: { descricao: "Pancadas de neve fortes", icone: "🌨️" },
  95: { descricao: "Trovoada", icone: "⛈️" },
  96: { descricao: "Trovoada com granizo fraco", icone: "⛈️" },
  99: { descricao: "Trovoada com granizo forte", icone: "⛈️" },
};

function traduzirCodigo(codigo: number): { descricao: string; icone: string } {
  return WEATHER_CODE_MAP[codigo] ?? { descricao: "Condição desconhecida", icone: "🌡️" };
}

export async function getClima(): Promise<Clima | null> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = await res.json();
    const atual = data?.current;
    const diario = data?.daily;

    if (
      typeof atual?.temperature_2m !== "number" ||
      typeof atual?.weathercode !== "number" ||
      typeof atual?.windspeed_10m !== "number"
    ) {
      return null;
    }

    const { descricao, icone } = traduzirCodigo(atual.weathercode);

    return {
      temperatura: Math.round(atual.temperature_2m),
      temperaturaMax: Math.round(diario?.temperature_2m_max?.[0] ?? atual.temperature_2m),
      temperaturaMin: Math.round(diario?.temperature_2m_min?.[0] ?? atual.temperature_2m),
      ventoKmh: Math.round(atual.windspeed_10m),
      descricao,
      icone,
    };
  } catch {
    return null;
  }
}
