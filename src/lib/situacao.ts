// Mesmas 6 categorias de SITUACOES_VENCIMENTO do painelConexao
// (client/src/App.jsx) — situação regulatória calculada em
// server/src/queries/regulatorio.js (SITUACAO_REGULATORIA).
export const SITUACAO_META: Record<string, { label: string; color: string }> = {
  PENDENTES: { label: "Pendentes", color: "#4a3aa7" },
  "EM ATRASO": { label: "Em atraso", color: "#a02b2b" },
  "VENCE HOJE": { label: "Vence hoje", color: "#8a5a0b" },
  "VENCE 7 DIAS": { label: "Vence em até 7 dias", color: "#2a78d6" },
  "NO PRAZO": { label: "No prazo", color: "#2f9e6e" },
  "SEM VENCIMENTO REGULATÓRIO": { label: "Sem vencimento regulatório", color: "#898781" },
};

export const SITUACOES_ORDEM = Object.keys(SITUACAO_META);
