import { createClient, type Client } from "@libsql/client";

export type Papel = "gestor" | "colaborador";
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

declare global {
  var __portalDb: Client | undefined;
  var __portalDbReady: Promise<void> | undefined;
}

function toPlain<T>(row: Record<string, unknown>): T {
  return { ...row } as T;
}

function toUsuario(row: Record<string, unknown>): Usuario {
  return { ...row, ativo: Boolean(row.ativo) } as Usuario;
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
}): Promise<SolicitacaoAusencia> {
  const client = await ready();
  const result = await client.execute({
    sql: `INSERT INTO solicitacoes_ausencia (usuario_id, tipo, data_inicio, data_fim)
          VALUES (?, ?, ?, ?)`,
    args: [data.usuarioId, data.tipo, data.dataInicio, data.dataFim],
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
