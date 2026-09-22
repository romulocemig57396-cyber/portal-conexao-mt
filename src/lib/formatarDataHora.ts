import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

// As datas do banco (datetime('now') do SQLite/Turso) são UTC sem sufixo de
// fuso — por isso o "Z" antes de formatar. O servidor (Railway) roda em UTC,
// então format() puro do date-fns mostraria a hora do servidor, não a de
// quem está vendo (Brasil): formatInTimeZone fixa o fuso de São Paulo
// independente de onde o processo Node está rodando.
export function formatarDataHoraBrasilia(valorUtcSemFuso: string, formatoData: string): string {
  return formatInTimeZone(`${valorUtcSemFuso}Z`, "America/Sao_Paulo", formatoData, { locale: ptBR });
}
