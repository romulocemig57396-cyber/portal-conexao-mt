"use client";

import { addDays, format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { SolicitacaoComUsuario } from "@/lib/db";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales: { "pt-BR": ptBR },
});

const CORES_TIPO: Record<string, string> = {
  ferias: "#3D9B3D",
  ausencia: "#1E7A5F",
};

function parseDataLocal(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

interface AusenciaEvento extends Event {
  tipo: "ferias" | "ausencia";
}

export function TeamCalendar({ solicitacoes }: { solicitacoes: SolicitacaoComUsuario[] }) {
  const eventos: AusenciaEvento[] = solicitacoes.map((s) => ({
    title: `${s.usuario_nome} — ${s.tipo === "ferias" ? "Férias" : "Ausência"}`,
    start: parseDataLocal(s.data_inicio),
    end: addDays(parseDataLocal(s.data_fim), 1),
    allDay: true,
    tipo: s.tipo,
  }));

  return (
    <div className="rounded-xl border border-cemig-card-border bg-white p-4 shadow-sm">
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        culture="pt-BR"
        style={{ height: 560 }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: CORES_TIPO[(event as AusenciaEvento).tipo] ?? "#1E7A5F",
            borderRadius: 6,
            border: "none",
          },
        })}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          noEventsInRange: "Nenhuma ausência aprovada neste período.",
          showMore: (total) => `+${total} mais`,
        }}
      />
    </div>
  );
}
