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

// Ordem fixa dos chips de classe e de faixa de número de caixas.
const ORDEM_CLASSE = ["RESIDENCIAL", "COMERCIAL", "INDUSTRIAL", "OUTRAS"];
const ORDEM_FAIXA_CAIXAS = ["1", "2", "3", "4 OU MAIS", "SEM INFORMAÇÃO"];

function ordenarPor(valores: Iterable<string>, ordem: string[]): string[] {
  const peso = (v: string) => {
    const i = ordem.indexOf(v);
    return i === -1 ? ordem.length : i;
  };
  return [...new Set(valores)].sort((a, b) => peso(a) - peso(b) || a.localeCompare(b));
}

export const ordenarClasses = (valores: Iterable<string>) => ordenarPor(valores, ORDEM_CLASSE);
export const ordenarFaixasCaixas = (valores: Iterable<string>) => ordenarPor(valores, ORDEM_FAIXA_CAIXAS);

// Universalização: mesmas 5 categorias (e rótulos) do gráfico "Universalização de obras".
const ORDEM_UNIVERSALIZACAO = ["UNIVERSALIZADA", "NAO_UNIVERSALIZADA", "FORA_UNIVERSALIZACAO", "SEGURANCA", "OUTROS"];

export const ROTULOS_UNIVERSALIZACAO: Record<string, string> = {
  UNIVERSALIZADA: "Universalizada",
  NAO_UNIVERSALIZADA: "Não universalizada",
  FORA_UNIVERSALIZACAO: "Fora da universalização",
  SEGURANCA: "Obras de segurança",
  OUTROS: "Outros",
};

export const ordenarUniversalizacoes = (valores: Iterable<string>) => ordenarPor(valores, ORDEM_UNIVERSALIZACAO);
