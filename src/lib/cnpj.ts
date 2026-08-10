export type CnpjCnaeSecundario = {
  codigo: number;
  descricao: string;
};

export type CnpjSocio = {
  nome_socio: string;
  qualificacao_socio: string;
  faixa_etaria: string;
  data_entrada_sociedade: string;
};

export type CnpjRegimeTributario = {
  ano: number;
  forma_de_tributacao: string;
};

export type CnpjData = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  descricao_identificador_matriz_filial: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string | null;
  motivo_situacao_cadastral: number;
  descricao_motivo_situacao_cadastral: string;
  situacao_especial: string;
  data_situacao_especial: string | null;
  data_inicio_atividade: string;
  natureza_juridica: string;

  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: CnpjCnaeSecundario[];

  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;

  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  email: string | null;

  capital_social: number;
  porte: string;
  opcao_pelo_simples: boolean | null;
  data_opcao_pelo_simples: string | null;
  opcao_pelo_mei: boolean | null;
  data_opcao_pelo_mei: string | null;

  qsa: CnpjSocio[];
  regime_tributario: CnpjRegimeTributario[];
};
