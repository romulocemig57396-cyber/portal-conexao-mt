// Ordem de exibição dos chips de "Tipo de solicitação" no painel externo:
// os mais volumosos primeiro (mesma lista do painelConexao), qualquer código
// novo vindo do banco entra depois em ordem alfabética, e "SEM TIPO" por último.
const ORDEM = ["LN", "AC", "SA", "OIP", "LP", "GD", "TR", "ML", "RL", "NT"];

export function ordenarTiposSolicitacao(tipos: Iterable<string>): string[] {
  const unicos = [...new Set(tipos)];
  const peso = (t: string) => {
    if (t === "SEM TIPO") return ORDEM.length + 1;
    const i = ORDEM.indexOf(t);
    return i === -1 ? ORDEM.length : i;
  };
  return unicos.sort((a, b) => peso(a) - peso(b) || a.localeCompare(b));
}
