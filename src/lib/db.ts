import { createClient, type Client } from "@libsql/client";

export type Papel = "gestor" | "colaborador" | "externo";
export type TipoAusencia = "ferias" | "ausencia";
export type StatusSolicitacao = "pendente" | "aprovada" | "recusada";

export interface Usuario {
  id: number;
  nome: string;
  usuario: string;
  senha_hash: string;
  papel: Papel;
  ativo: boolean;
  data_nascimento: string | null;
  ativo_distribuicao: boolean;
}

export type UsuarioPublico = Omit<Usuario, "senha_hash">;

export function paraUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    usuario: usuario.usuario,
    papel: usuario.papel,
    ativo: usuario.ativo,
    data_nascimento: usuario.data_nascimento,
    ativo_distribuicao: usuario.ativo_distribuicao,
  };
}

export type Aniversariante = { nome: string; dia: number; mes: number };

export interface SolicitacaoAusencia {
  id: number;
  usuario_id: number;
  tipo: TipoAusencia;
  data_inicio: string;
  data_fim: string;
  status: StatusSolicitacao;
  aprovado_por: number | null;
  criado_em: string;
  atualizado_em: string;
}

export interface SolicitacaoComUsuario extends SolicitacaoAusencia {
  usuario_nome: string;
}

export type ResumoGraficoJson = {
  resumo: { COD_MEDIDA: string; COD_STAT_USU: string; QUANTIDADE: number }[];
  codigos: string[];
  statusList: string[];
};

export interface ResumoDiario {
  id: number;
  data: string;
  total_pendentes: number;
  em_atraso: number;
  areas_envolvidas: number;
  resumo_por_codigo: ResumoGraficoJson;
  resumo_grupo2: ResumoGraficoJson;
  atualizado_em: string;
}

export type TipoSolicitacaoNota = "LN" | "AC" | "OU";
export type StatusNota = "pendente" | "concluida";

export interface NotaServico {
  numero_nota: string;
  data_emissao: string;
  cidade: string;
  regional: string;
  prazo: string;
  medida: string;
  tipo_solicitacao: TipoSolicitacaoNota;
  tecnico_id: number | null;
  status: StatusNota;
  data_distribuicao: string;
  data_conclusao: string | null;
}

export interface NotaServicoComTecnico extends NotaServico {
  tecnico_nome: string | null;
}

export interface Aviso {
  id: number;
  titulo: string;
  mensagem: string;
  criado_por: number;
  criado_em: string;
  ativo: boolean;
}

export interface AvisoComAutor extends Aviso {
  autor_nome: string;
}

// ---- painel externo (migrado do site estático do painelConexao) ----
// Cada tabela é substituída por completo a cada ingestão (DELETE + INSERT
// numa única transação) — são snapshots do estado atual, não séries que
// acumulam ao longo do tempo; o painelConexao já manda o recorte completo
// (ex: histórico inteiro desde a data mínima configurada) em cada push.

export type PainelExternoGrafico = "aprovacao" | "liberacao" | "universalizacao";

export interface PainelExternoHistoricoLinha {
  grafico: PainelExternoGrafico;
  mes: string;
  servico: string;
  mercado: string;
  regional: string;
  categoria: string;
  quantidade: number;
}

export interface PainelExternoMedidaLinha {
  grupo: string;
  servico: string;
  mercado: string;
  regional: string;
  codMedida: string;
  situacao: string;
  quantidade: number;
}

export interface PainelExternoInconsistenciaLinha {
  tipo: string;
  numNota: string;
  codServico: string;
  datCriacao: string;
  codStatusUsuNota: string | null;
  codMedida: string;
  codStatUsu: string;
}

// Mesmas colunas de buscarOrcamentosEmitiveis (server/src/queries do
// painelConexao), MENOS DES_ENDERECO_OBRA — só o endereço fica de fora,
// por pedido explícito ("lista quase completa, só sem endereço").
export interface PainelExternoOrcamentoEmitivelLinha {
  numNota: string;
  codServico: string;
  desServico: string | null;
  desObra: string | null;
  regional: string | null;
  localidade: string | null;
  dataCriacaoNota: string | null;
  codMedida: string;
  codStatUsu: string;
  dataCriacaoMedida: string | null;
  dataVencimento: string | null;
  itemAnexo: string | null;
  prazoPadrao: string | null;
  prazoReal: string | null;
  gerExpResp: string | null;
  tipoPrazo: string | null;
  dataConclusaoReal: string | null;
  codAreaResp: string | null;
  desSituacao: string | null;
}

export interface PainelExternoCompleto {
  atualizadoEm: string | null;
  historico: PainelExternoHistoricoLinha[];
  medidas: PainelExternoMedidaLinha[];
  inconsistencias: PainelExternoInconsistenciaLinha[];
  orcamentosEmitiveis: PainelExternoOrcamentoEmitivelLinha[];
}

declare global {
  var __portalDb: Client | undefined;
  var __portalDbReady: Promise<void> | undefined;
}

function toPlain<T>(row: Record<string, unknown>): T {
  return { ...row } as T;
}

function toUsuario(row: Record<string, unknown>): Usuario {
  return {
    ...row,
    ativo: Boolean(row.ativo),
    ativo_distribuicao: Boolean(row.ativo_distribuicao),
  } as Usuario;
}

function toAviso<T extends Aviso>(row: Record<string, unknown>): T {
  return { ...row, ativo: Boolean(row.ativo) } as T;
}

async function migrate(client: Client) {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        papel TEXT NOT NULL CHECK (papel IN ('gestor', 'colaborador')),
        ativo INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS solicitacoes_ausencia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        tipo TEXT NOT NULL CHECK (tipo IN ('ferias', 'ausencia')),
        data_inicio TEXT NOT NULL,
        data_fim TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
        aprovado_por INTEGER REFERENCES usuarios(id),
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS resumo_diario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL UNIQUE,
        total_pendentes INTEGER NOT NULL DEFAULT 0,
        em_atraso INTEGER NOT NULL DEFAULT 0,
        areas_envolvidas INTEGER NOT NULL DEFAULT 0,
        resumo_por_codigo TEXT NOT NULL,
        resumo_grupo2 TEXT NOT NULL,
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS avisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        criado_por INTEGER NOT NULL REFERENCES usuarios(id),
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        ativo INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS notas_servico (
        numero_nota TEXT PRIMARY KEY,
        data_emissao TEXT NOT NULL,
        cidade TEXT NOT NULL,
        regional TEXT NOT NULL,
        prazo TEXT NOT NULL,
        medida TEXT NOT NULL,
        tipo_solicitacao TEXT NOT NULL CHECK (tipo_solicitacao IN ('LN', 'AC', 'OU')),
        tecnico_id INTEGER REFERENCES usuarios(id),
        status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida')),
        data_distribuicao TEXT NOT NULL DEFAULT (datetime('now')),
        data_conclusao TEXT
      )`,
      // Painel externo (migrado do site estático do painelConexao) — cada
      // tabela é substituída por completo a cada ingestão, ver
      // substituirPainelExterno().
      `CREATE TABLE IF NOT EXISTS painel_externo_historico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grafico TEXT NOT NULL,
        mes TEXT NOT NULL,
        servico TEXT NOT NULL,
        mercado TEXT NOT NULL,
        regional TEXT NOT NULL,
        categoria TEXT NOT NULL,
        quantidade INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS painel_externo_medidas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grupo TEXT NOT NULL,
        servico TEXT NOT NULL,
        mercado TEXT NOT NULL,
        regional TEXT NOT NULL,
        cod_medida TEXT NOT NULL,
        situacao TEXT NOT NULL,
        quantidade INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS painel_externo_inconsistencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        num_nota TEXT NOT NULL,
        cod_servico TEXT NOT NULL,
        dat_criacao TEXT NOT NULL,
        cod_status_usu_nota TEXT,
        cod_medida TEXT NOT NULL,
        cod_stat_usu TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS painel_externo_orcamentos_emitiveis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        num_nota TEXT NOT NULL,
        cod_servico TEXT NOT NULL,
        des_servico TEXT,
        des_obra TEXT,
        regional TEXT,
        localidade TEXT,
        data_criacao_nota TEXT,
        cod_medida TEXT NOT NULL,
        cod_stat_usu TEXT NOT NULL,
        data_criacao_medida TEXT,
        data_vencimento TEXT,
        item_anexo TEXT,
        prazo_padrao TEXT,
        prazo_real TEXT,
        ger_exp_resp TEXT,
        tipo_prazo TEXT,
        data_conclusao_real TEXT,
        cod_area_resp TEXT,
        des_situacao TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS painel_externo_metadata (
        chave TEXT PRIMARY KEY,
        atualizado_em TEXT NOT NULL
      )`,
    ],
    "write"
  );

  const colunas = await client.execute("PRAGMA table_info(usuarios)");
  const nomesColunas = colunas.rows.map((r) => (r as unknown as { name: string }).name);
  if (!nomesColunas.includes("ativo")) {
    await client.execute("ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1");
  }
  if (!nomesColunas.includes("data_nascimento")) {
    await client.execute("ALTER TABLE usuarios ADD COLUMN data_nascimento TEXT");
  }
  if (!nomesColunas.includes("ultima_visita_home")) {
    await client.execute("ALTER TABLE usuarios ADD COLUMN ultima_visita_home TEXT");
  }
  if (!nomesColunas.includes("ativo_distribuicao")) {
    await client.execute(
      "ALTER TABLE usuarios ADD COLUMN ativo_distribuicao INTEGER NOT NULL DEFAULT 0"
    );
    await client.execute(
      "UPDATE usuarios SET ativo_distribuicao = 1 WHERE papel = 'colaborador' AND (nome LIKE 'Crisd%' OR nome LIKE 'Leticia%' OR nome LIKE 'Letícia%')"
    );
  }

  // SQLite não permite alterar um CHECK existente via ALTER TABLE — a única
  // forma de acrescentar 'externo' à lista de papéis é recriar a tabela.
  // Detecta pelo texto do CHECK gravado no próprio schema (sqlite_master),
  // então só recria uma vez, na primeira subida depois desta mudança.
  const schemaUsuarios = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'"
  );
  const sqlUsuarios =
    (schemaUsuarios.rows[0] as unknown as { sql: string } | undefined)?.sql ?? "";
  if (sqlUsuarios && !sqlUsuarios.includes("'externo'")) {
    // solicitacoes_ausencia/avisos/notas_servico têm FK pra usuarios(id) — no
    // Turso (diferente do SQLite local em arquivo, que não aplica FK por
    // padrão) isso bloqueia o DROP TABLE abaixo com "FOREIGN KEY constraint
    // failed" se a checagem estiver ligada. PRAGMA foreign_keys é um no-op
    // dentro de uma transação (e client.batch("write") abre uma), então
    // precisa ser um execute() isolado antes/depois do batch, nunca dentro
    // dele. O DROP TABLE IF EXISTS cobre uma tentativa anterior que tenha
    // falhado antes de chegar ao RENAME.
    await client.execute("PRAGMA foreign_keys=OFF");
    try {
      await client.batch(
        [
          "DROP TABLE IF EXISTS usuarios_novo",
          `CREATE TABLE usuarios_novo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            usuario TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            papel TEXT NOT NULL CHECK (papel IN ('gestor', 'colaborador', 'externo')),
            ativo INTEGER NOT NULL DEFAULT 1,
            data_nascimento TEXT,
            ultima_visita_home TEXT,
            ativo_distribuicao INTEGER NOT NULL DEFAULT 0
          )`,
          `INSERT INTO usuarios_novo
              (id, nome, usuario, senha_hash, papel, ativo, data_nascimento, ultima_visita_home, ativo_distribuicao)
            SELECT id, nome, usuario, senha_hash, papel, ativo, data_nascimento, ultima_visita_home, ativo_distribuicao
            FROM usuarios`,
          "DROP TABLE usuarios",
          "ALTER TABLE usuarios_novo RENAME TO usuarios",
        ],
        "write"
      );
    } finally {
      await client.execute("PRAGMA foreign_keys=ON");
    }
  }
}

function getClient(): Client {
  if (!globalThis.__portalDb) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL não configurada.");

    globalThis.__portalDb = createClient({ url, authToken });
    globalThis.__portalDbReady = migrate(globalThis.__portalDb);
  }
  return globalThis.__portalDb;
}

async function ready(): Promise<Client> {
  const client = getClient();
  await globalThis.__portalDbReady;
  return client;
}

// ---- usuarios ----

export async function findUsuarioByLogin(usuario: string): Promise<Usuario | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM usuarios WHERE usuario = ?",
    args: [usuario],
  });
  const row = result.rows[0];
  return row ? toUsuario(row as unknown as Record<string, unknown>) : undefined;
}

export async function findUsuarioById(id: number): Promise<Usuario | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM usuarios WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? toUsuario(row as unknown as Record<string, unknown>) : undefined;
}

export async function listUsuarios(): Promise<Usuario[]> {
  const client = await ready();
  const result = await client.execute("SELECT * FROM usuarios ORDER BY nome");
  return result.rows.map((row) => toUsuario(row as unknown as Record<string, unknown>));
}

export async function removerUsuarioPorLogin(usuario: string): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "DELETE FROM usuarios WHERE usuario = ?",
    args: [usuario],
  });
}

export async function atualizarSenhaUsuario(id: number, novaSenhaHash: string): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
    args: [novaSenhaHash, id],
  });
}

export async function atualizarUsuario(
  id: number,
  data: { nome?: string; papel?: Papel; dataNascimento?: string | null }
): Promise<Usuario | undefined> {
  const client = await ready();
  if (data.nome !== undefined) {
    await client.execute({
      sql: "UPDATE usuarios SET nome = ? WHERE id = ?",
      args: [data.nome, id],
    });
  }
  if (data.papel !== undefined) {
    await client.execute({
      sql: "UPDATE usuarios SET papel = ? WHERE id = ?",
      args: [data.papel, id],
    });
  }
  if (data.dataNascimento !== undefined) {
    await client.execute({
      sql: "UPDATE usuarios SET data_nascimento = ? WHERE id = ?",
      args: [data.dataNascimento, id],
    });
  }
  return findUsuarioById(id);
}

export async function atualizarAtivoUsuario(id: number, ativo: boolean): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE usuarios SET ativo = ? WHERE id = ?",
    args: [ativo ? 1 : 0, id],
  });
}

export async function atualizarAtivoDistribuicaoUsuario(id: number, ativo: boolean): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE usuarios SET ativo_distribuicao = ? WHERE id = ?",
    args: [ativo ? 1 : 0, id],
  });
}

export async function criarUsuario(data: {
  nome: string;
  usuario: string;
  senhaHash: string;
  papel: Papel;
  dataNascimento?: string | null;
}): Promise<Usuario> {
  const client = await ready();
  const result = await client.execute({
    sql: "INSERT INTO usuarios (nome, usuario, senha_hash, papel, data_nascimento) VALUES (?, ?, ?, ?, ?)",
    args: [data.nome, data.usuario, data.senhaHash, data.papel, data.dataNascimento ?? null],
  });
  return (await findUsuarioById(Number(result.lastInsertRowid)))!;
}

// ---- solicitacoes_ausencia ----

const SELECT_COM_USUARIO = `
  SELECT s.*, u.nome AS usuario_nome
  FROM solicitacoes_ausencia s
  JOIN usuarios u ON u.id = s.usuario_id
`;

export async function listSolicitacoesAprovadas(): Promise<SolicitacaoComUsuario[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_COM_USUARIO} WHERE s.status = 'aprovada' ORDER BY s.data_inicio`
  );
  return result.rows.map((row) =>
    toPlain<SolicitacaoComUsuario>(row as unknown as Record<string, unknown>)
  );
}

export async function listSolicitacoesPendentes(): Promise<SolicitacaoComUsuario[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_COM_USUARIO} WHERE s.status = 'pendente' ORDER BY s.criado_em`
  );
  return result.rows.map((row) =>
    toPlain<SolicitacaoComUsuario>(row as unknown as Record<string, unknown>)
  );
}

export async function contarSolicitacoesPendentes(): Promise<number> {
  const client = await ready();
  const result = await client.execute(
    "SELECT COUNT(*) AS total FROM solicitacoes_ausencia WHERE status = 'pendente'"
  );
  const row = result.rows[0] as unknown as { total: number | string };
  return Number(row.total);
}

export async function listSolicitacoesPorUsuario(
  usuarioId: number
): Promise<SolicitacaoAusencia[]> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM solicitacoes_ausencia WHERE usuario_id = ? ORDER BY data_inicio DESC",
    args: [usuarioId],
  });
  return result.rows.map((row) =>
    toPlain<SolicitacaoAusencia>(row as unknown as Record<string, unknown>)
  );
}

export async function findSolicitacaoById(id: number): Promise<SolicitacaoAusencia | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM solicitacoes_ausencia WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? toPlain<SolicitacaoAusencia>(row as unknown as Record<string, unknown>) : undefined;
}

export async function criarSolicitacao(data: {
  usuarioId: number;
  tipo: TipoAusencia;
  dataInicio: string;
  dataFim: string;
  status?: "pendente" | "aprovada";
  aprovadoPor?: number;
}): Promise<SolicitacaoAusencia> {
  const client = await ready();
  const result = await client.execute({
    sql: `INSERT INTO solicitacoes_ausencia (usuario_id, tipo, data_inicio, data_fim, status, aprovado_por)
          VALUES (?, ?, ?, ?, COALESCE(?, 'pendente'), ?)`,
    args: [
      data.usuarioId,
      data.tipo,
      data.dataInicio,
      data.dataFim,
      data.status ?? null,
      data.aprovadoPor ?? null,
    ],
  });
  return (await findSolicitacaoById(Number(result.lastInsertRowid)))!;
}

export async function atualizarStatusSolicitacao(
  id: number,
  status: Extract<StatusSolicitacao, "aprovada" | "recusada">,
  aprovadoPor: number
): Promise<SolicitacaoAusencia | undefined> {
  const client = await ready();
  await client.execute({
    sql: `UPDATE solicitacoes_ausencia
          SET status = ?, aprovado_por = ?, atualizado_em = datetime('now')
          WHERE id = ?`,
    args: [status, aprovadoPor, id],
  });
  return findSolicitacaoById(id);
}

export async function excluirSolicitacao(id: number): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "DELETE FROM solicitacoes_ausencia WHERE id = ?",
    args: [id],
  });
}

// ---- resumo_diario ----

export async function upsertResumoDiario(data: {
  data: string;
  totalPendentes: number;
  emAtraso: number;
  areasEnvolvidas: number;
  resumoPorCodigo: ResumoGraficoJson;
  resumoGrupo2: ResumoGraficoJson;
}): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: `INSERT INTO resumo_diario
            (data, total_pendentes, em_atraso, areas_envolvidas, resumo_por_codigo, resumo_grupo2, atualizado_em)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(data) DO UPDATE SET
            total_pendentes = excluded.total_pendentes,
            em_atraso = excluded.em_atraso,
            areas_envolvidas = excluded.areas_envolvidas,
            resumo_por_codigo = excluded.resumo_por_codigo,
            resumo_grupo2 = excluded.resumo_grupo2,
            atualizado_em = datetime('now')`,
    args: [
      data.data,
      data.totalPendentes,
      data.emAtraso,
      data.areasEnvolvidas,
      JSON.stringify(data.resumoPorCodigo),
      JSON.stringify(data.resumoGrupo2),
    ],
  });
}

export async function getResumoMaisRecente(): Promise<ResumoDiario | undefined> {
  const client = await ready();
  const result = await client.execute(
    "SELECT * FROM resumo_diario ORDER BY data DESC LIMIT 1"
  );
  const row = result.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) return undefined;

  return {
    ...row,
    resumo_por_codigo: JSON.parse(row.resumo_por_codigo as string),
    resumo_grupo2: JSON.parse(row.resumo_grupo2 as string),
  } as ResumoDiario;
}

// ---- avisos ----

const SELECT_AVISO_COM_AUTOR = `
  SELECT a.*, u.nome AS autor_nome
  FROM avisos a
  JOIN usuarios u ON u.id = a.criado_por
`;

export async function listAvisosAtivos(): Promise<AvisoComAutor[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_AVISO_COM_AUTOR} WHERE a.ativo = 1 ORDER BY a.criado_em DESC`
  );
  return result.rows.map((row) => toAviso<AvisoComAutor>(row as unknown as Record<string, unknown>));
}

export async function listAvisos(): Promise<AvisoComAutor[]> {
  const client = await ready();
  const result = await client.execute(`${SELECT_AVISO_COM_AUTOR} ORDER BY a.criado_em DESC`);
  return result.rows.map((row) => toAviso<AvisoComAutor>(row as unknown as Record<string, unknown>));
}

export async function findAvisoById(id: number): Promise<Aviso | undefined> {
  const client = await ready();
  const result = await client.execute({ sql: "SELECT * FROM avisos WHERE id = ?", args: [id] });
  const row = result.rows[0];
  return row ? toAviso<Aviso>(row as unknown as Record<string, unknown>) : undefined;
}

export async function criarAviso(data: {
  titulo: string;
  mensagem: string;
  criadoPor: number;
}): Promise<Aviso> {
  const client = await ready();
  const result = await client.execute({
    sql: "INSERT INTO avisos (titulo, mensagem, criado_por) VALUES (?, ?, ?)",
    args: [data.titulo, data.mensagem, data.criadoPor],
  });
  return (await findAvisoById(Number(result.lastInsertRowid)))!;
}

export async function atualizarAviso(
  id: number,
  data: { titulo?: string; mensagem?: string }
): Promise<Aviso | undefined> {
  const client = await ready();
  if (data.titulo !== undefined) {
    await client.execute({ sql: "UPDATE avisos SET titulo = ? WHERE id = ?", args: [data.titulo, id] });
  }
  if (data.mensagem !== undefined) {
    await client.execute({
      sql: "UPDATE avisos SET mensagem = ? WHERE id = ?",
      args: [data.mensagem, id],
    });
  }
  return findAvisoById(id);
}

export async function atualizarAtivoAviso(id: number, ativo: boolean): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE avisos SET ativo = ? WHERE id = ?",
    args: [ativo ? 1 : 0, id],
  });
}

// ---- notas_servico ----

export async function listNotasExistentesPorNumero(
  numeros: string[]
): Promise<Map<string, NotaServico>> {
  if (numeros.length === 0) return new Map();
  const client = await ready();
  const placeholders = numeros.map(() => "?").join(",");
  const result = await client.execute({
    sql: `SELECT * FROM notas_servico WHERE numero_nota IN (${placeholders})`,
    args: numeros,
  });
  const mapa = new Map<string, NotaServico>();
  for (const row of result.rows) {
    const nota = toPlain<NotaServico>(row as unknown as Record<string, unknown>);
    mapa.set(nota.numero_nota, nota);
  }
  return mapa;
}

export async function contarNotasPendentesPorTecnico(): Promise<Map<number, number>> {
  const client = await ready();
  const result = await client.execute(
    "SELECT tecnico_id, COUNT(*) AS total FROM notas_servico WHERE status = 'pendente' AND tecnico_id IS NOT NULL GROUP BY tecnico_id"
  );
  const mapa = new Map<number, number>();
  for (const row of result.rows) {
    const r = row as unknown as { tecnico_id: number; total: number | string };
    mapa.set(Number(r.tecnico_id), Number(r.total));
  }
  return mapa;
}

export async function contarNotasPendentesPorTecnicoEMedida(
  medida: string
): Promise<Map<number, number>> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT tecnico_id, COUNT(*) AS total FROM notas_servico WHERE status = 'pendente' AND medida = ? AND tecnico_id IS NOT NULL GROUP BY tecnico_id",
    args: [medida],
  });
  const mapa = new Map<number, number>();
  for (const row of result.rows) {
    const r = row as unknown as { tecnico_id: number; total: number | string };
    mapa.set(Number(r.tecnico_id), Number(r.total));
  }
  return mapa;
}

export async function inserirNotasServico(
  notas: Array<{
    numero_nota: string;
    data_emissao: string;
    cidade: string;
    regional: string;
    prazo: string;
    medida: string;
    tipo_solicitacao: TipoSolicitacaoNota;
    tecnico_id: number;
  }>
): Promise<void> {
  if (notas.length === 0) return;
  const client = await ready();
  await client.batch(
    notas.map((n) => ({
      sql: `INSERT INTO notas_servico
              (numero_nota, data_emissao, cidade, regional, prazo, medida, tipo_solicitacao, tecnico_id, status, data_distribuicao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', datetime('now'))`,
      args: [
        n.numero_nota,
        n.data_emissao,
        n.cidade,
        n.regional,
        n.prazo,
        n.medida,
        n.tipo_solicitacao,
        n.tecnico_id,
      ],
    })),
    "write"
  );
}

const SELECT_NOTA_COM_TECNICO = `
  SELECT n.*, u.nome AS tecnico_nome
  FROM notas_servico n
  LEFT JOIN usuarios u ON u.id = n.tecnico_id
`;

export async function listNotasPendentesPorTecnico(tecnicoId: number): Promise<NotaServico[]> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM notas_servico WHERE tecnico_id = ? AND status = 'pendente' ORDER BY data_emissao, prazo",
    args: [tecnicoId],
  });
  return result.rows.map((row) => toPlain<NotaServico>(row as unknown as Record<string, unknown>));
}

export async function listNotasPendentesAgrupadas(): Promise<NotaServicoComTecnico[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_NOTA_COM_TECNICO} WHERE n.status = 'pendente' ORDER BY u.nome, n.data_emissao, n.prazo`
  );
  return result.rows.map((row) =>
    toPlain<NotaServicoComTecnico>(row as unknown as Record<string, unknown>)
  );
}

export async function listNotasConcluidasPorTecnico(tecnicoId: number): Promise<NotaServico[]> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM notas_servico WHERE tecnico_id = ? AND status = 'concluida' ORDER BY data_conclusao DESC",
    args: [tecnicoId],
  });
  return result.rows.map((row) => toPlain<NotaServico>(row as unknown as Record<string, unknown>));
}

export async function listNotasConcluidasAgrupadas(): Promise<NotaServicoComTecnico[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_NOTA_COM_TECNICO} WHERE n.status = 'concluida' ORDER BY u.nome, n.data_conclusao DESC`
  );
  return result.rows.map((row) =>
    toPlain<NotaServicoComTecnico>(row as unknown as Record<string, unknown>)
  );
}

export async function findNotaByNumero(numero: string): Promise<NotaServico | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM notas_servico WHERE numero_nota = ?",
    args: [numero],
  });
  const row = result.rows[0];
  return row ? toPlain<NotaServico>(row as unknown as Record<string, unknown>) : undefined;
}

export async function concluirNota(numero: string): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE notas_servico SET status = 'concluida', data_conclusao = datetime('now') WHERE numero_nota = ?",
    args: [numero],
  });
}

/** Reverte uma nota concluída para pendente — volta a contar nos pendentes do técnico. */
export async function reabrirNota(numero: string): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE notas_servico SET status = 'pendente', data_conclusao = NULL WHERE numero_nota = ?",
    args: [numero],
  });
}

/**
 * Atualiza uma nota existente que evoluiu de medida (ex: 0019 -> 0020), voltando-a
 * a 'pendente' para o novo técnico responsável — a nota em si não muda de número,
 * só a etapa de trabalho.
 */
export async function atualizarNotaEvoluida(
  numero: string,
  data: {
    dataEmissao: string;
    cidade: string;
    regional: string;
    prazo: string;
    medida: string;
    tipoSolicitacao: TipoSolicitacaoNota;
    tecnicoId: number;
  }
): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: `UPDATE notas_servico
          SET data_emissao = ?, cidade = ?, regional = ?, prazo = ?, medida = ?, tipo_solicitacao = ?,
              tecnico_id = ?, status = 'pendente', data_distribuicao = datetime('now'), data_conclusao = NULL
          WHERE numero_nota = ?`,
    args: [
      data.dataEmissao,
      data.cidade,
      data.regional,
      data.prazo,
      data.medida,
      data.tipoSolicitacao,
      data.tecnicoId,
      numero,
    ],
  });
}

/** Override manual do gestor: troca o técnico responsável sem mexer em status. */
export async function reatribuirNota(numero: string, tecnicoId: number): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE notas_servico SET tecnico_id = ? WHERE numero_nota = ?",
    args: [tecnicoId, numero],
  });
}

const EPOCH = "1970-01-01 00:00:00";

/**
 * Conta avisos ativos criados depois da última visita conhecida do usuário
 * (calculado ANTES de atualizar o timestamp) e só então marca a visita como
 * agora — mesma chamada faz as duas coisas, nessa ordem.
 */
export async function contarAvisosNaoLidosEMarcarVisita(usuarioId: number): Promise<number> {
  const client = await ready();

  const usuarioResult = await client.execute({
    sql: "SELECT ultima_visita_home FROM usuarios WHERE id = ?",
    args: [usuarioId],
  });
  const ultimaVisita =
    (usuarioResult.rows[0] as unknown as { ultima_visita_home: string | null } | undefined)
      ?.ultima_visita_home ?? EPOCH;

  const contagemResult = await client.execute({
    sql: "SELECT COUNT(*) AS total FROM avisos WHERE ativo = 1 AND criado_em > ?",
    args: [ultimaVisita],
  });
  const contagem = Number((contagemResult.rows[0] as unknown as { total: number | string }).total);

  await client.execute({
    sql: "UPDATE usuarios SET ultima_visita_home = datetime('now') WHERE id = ?",
    args: [usuarioId],
  });

  return contagem;
}

// ---- aniversariantes ----

export async function listAniversariantesDoMes(): Promise<Aniversariante[]> {
  const client = await ready();
  const result = await client.execute(
    "SELECT nome, data_nascimento FROM usuarios WHERE ativo = 1 AND data_nascimento IS NOT NULL"
  );

  const mesAtual = new Date().getUTCMonth() + 1;

  return result.rows
    .map((row) => {
      const r = row as unknown as { nome: string; data_nascimento: string };
      const [, mesStr, diaStr] = r.data_nascimento.split("-");
      return { nome: r.nome.split(" ")[0], mes: Number(mesStr), dia: Number(diaStr) };
    })
    .filter((a) => a.mes === mesAtual)
    .sort((a, b) => a.dia - b.dia);
}

// ---- painel externo ----

/**
 * Substitui por completo as 4 tabelas do painel externo numa única
 * transação — se qualquer linha falhar (ex: payload malformado), a
 * transação inteira é desfeita e os dados antigos continuam valendo, em vez
 * de ficar com um recorte parcial/inconsistente.
 */
export async function substituirPainelExterno(data: {
  historico: PainelExternoHistoricoLinha[];
  medidas: PainelExternoMedidaLinha[];
  inconsistencias: PainelExternoInconsistenciaLinha[];
  orcamentosEmitiveis: PainelExternoOrcamentoEmitivelLinha[];
}): Promise<void> {
  const client = await ready();

  const statements: Array<{ sql: string; args: (string | number | null)[] }> = [
    { sql: "DELETE FROM painel_externo_historico", args: [] },
    { sql: "DELETE FROM painel_externo_medidas", args: [] },
    { sql: "DELETE FROM painel_externo_inconsistencias", args: [] },
    { sql: "DELETE FROM painel_externo_orcamentos_emitiveis", args: [] },
  ];

  for (const h of data.historico) {
    statements.push({
      sql: `INSERT INTO painel_externo_historico
              (grafico, mes, servico, mercado, regional, categoria, quantidade)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [h.grafico, h.mes, h.servico, h.mercado, h.regional, h.categoria, h.quantidade],
    });
  }

  for (const m of data.medidas) {
    statements.push({
      sql: `INSERT INTO painel_externo_medidas
              (grupo, servico, mercado, regional, cod_medida, situacao, quantidade)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [m.grupo, m.servico, m.mercado, m.regional, m.codMedida, m.situacao, m.quantidade],
    });
  }

  for (const i of data.inconsistencias) {
    statements.push({
      sql: `INSERT INTO painel_externo_inconsistencias
              (tipo, num_nota, cod_servico, dat_criacao, cod_status_usu_nota, cod_medida, cod_stat_usu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        i.tipo,
        i.numNota,
        i.codServico,
        i.datCriacao,
        i.codStatusUsuNota ?? null,
        i.codMedida,
        i.codStatUsu,
      ],
    });
  }

  for (const o of data.orcamentosEmitiveis) {
    statements.push({
      sql: `INSERT INTO painel_externo_orcamentos_emitiveis
              (num_nota, cod_servico, des_servico, des_obra, regional, localidade, data_criacao_nota,
               cod_medida, cod_stat_usu, data_criacao_medida, data_vencimento, item_anexo, prazo_padrao,
               prazo_real, ger_exp_resp, tipo_prazo, data_conclusao_real, cod_area_resp, des_situacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        o.numNota,
        o.codServico,
        o.desServico ?? null,
        o.desObra ?? null,
        o.regional ?? null,
        o.localidade ?? null,
        o.dataCriacaoNota ?? null,
        o.codMedida,
        o.codStatUsu,
        o.dataCriacaoMedida ?? null,
        o.dataVencimento ?? null,
        o.itemAnexo ?? null,
        o.prazoPadrao ?? null,
        o.prazoReal ?? null,
        o.gerExpResp ?? null,
        o.tipoPrazo ?? null,
        o.dataConclusaoReal ?? null,
        o.codAreaResp ?? null,
        o.desSituacao ?? null,
      ],
    });
  }

  statements.push({
    sql: `INSERT INTO painel_externo_metadata (chave, atualizado_em)
          VALUES ('ultima_atualizacao', datetime('now'))
          ON CONFLICT(chave) DO UPDATE SET atualizado_em = excluded.atualizado_em`,
    args: [],
  });

  await client.batch(statements, "write");
}

export async function getPainelExternoCompleto(): Promise<PainelExternoCompleto> {
  const client = await ready();

  const [historico, medidas, inconsistencias, orcamentos, meta] = await Promise.all([
    client.execute(
      "SELECT grafico, mes, servico, mercado, regional, categoria, quantidade FROM painel_externo_historico"
    ),
    client.execute(
      "SELECT grupo, servico, mercado, regional, cod_medida AS codMedida, situacao, quantidade FROM painel_externo_medidas"
    ),
    client.execute(
      `SELECT tipo, num_nota AS numNota, cod_servico AS codServico, dat_criacao AS datCriacao,
              cod_status_usu_nota AS codStatusUsuNota, cod_medida AS codMedida, cod_stat_usu AS codStatUsu
       FROM painel_externo_inconsistencias`
    ),
    client.execute(
      `SELECT num_nota AS numNota, cod_servico AS codServico, des_servico AS desServico, des_obra AS desObra,
              regional, localidade, data_criacao_nota AS dataCriacaoNota, cod_medida AS codMedida,
              cod_stat_usu AS codStatUsu, data_criacao_medida AS dataCriacaoMedida,
              data_vencimento AS dataVencimento, item_anexo AS itemAnexo, prazo_padrao AS prazoPadrao,
              prazo_real AS prazoReal, ger_exp_resp AS gerExpResp, tipo_prazo AS tipoPrazo,
              data_conclusao_real AS dataConclusaoReal, cod_area_resp AS codAreaResp, des_situacao AS desSituacao
       FROM painel_externo_orcamentos_emitiveis`
    ),
    client.execute({
      sql: "SELECT atualizado_em FROM painel_externo_metadata WHERE chave = ?",
      args: ["ultima_atualizacao"],
    }),
  ]);

  return {
    atualizadoEm:
      (meta.rows[0] as unknown as { atualizado_em: string } | undefined)?.atualizado_em ?? null,
    historico: historico.rows.map((row) => {
      const r = row as unknown as PainelExternoHistoricoLinha;
      return { ...r, quantidade: Number(r.quantidade) };
    }),
    medidas: medidas.rows.map((row) => {
      const r = row as unknown as PainelExternoMedidaLinha;
      return { ...r, quantidade: Number(r.quantidade) };
    }),
    inconsistencias: inconsistencias.rows.map((row) =>
      toPlain<PainelExternoInconsistenciaLinha>(row as unknown as Record<string, unknown>)
    ),
    orcamentosEmitiveis: orcamentos.rows.map((row) =>
      toPlain<PainelExternoOrcamentoEmitivelLinha>(row as unknown as Record<string, unknown>)
    ),
  };
}
