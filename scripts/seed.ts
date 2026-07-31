import bcrypt from "bcryptjs";
import { criarUsuario, findUsuarioByLogin, type Papel } from "../src/lib/db";

const SENHA_PADRAO = "mudar123";

const usuariosSeed: Array<{ nome: string; usuario: string; papel: Papel }> = [
  { nome: "Romulo Rodrigues Pereira", usuario: "romulorp", papel: "gestor" },
  { nome: "Alcimara Cardoso Cortes Faustino", usuario: "alcimaraf", papel: "colaborador" },
  { nome: "Andréa Aparecida Dutra Naves de Castro", usuario: "andreac", papel: "colaborador" },
  { nome: "Crisdálhia Fernanda Hermes Soares", usuario: "crisdalhias", papel: "colaborador" },
  { nome: "Guilherme Aparecido Inácio", usuario: "guilhermei", papel: "colaborador" },
  { nome: "Carolina de Oliveira Rocha", usuario: "carolinar", papel: "colaborador" },
  { nome: "Leticia Miranda Santos", usuario: "leticias", papel: "colaborador" },
  { nome: "Marina Nolasco dos Santos", usuario: "marinas", papel: "colaborador" },
];

async function main() {
  const senhaHash = bcrypt.hashSync(SENHA_PADRAO, 10);

  for (const u of usuariosSeed) {
    if (await findUsuarioByLogin(u.usuario)) {
      console.log(`Usuario '${u.usuario}' ja existe, pulando.`);
      continue;
    }
    await criarUsuario({ nome: u.nome, usuario: u.usuario, senhaHash, papel: u.papel });
    console.log(`Usuario '${u.usuario}' criado (papel: ${u.papel}).`);
  }

  console.log(`\nSenha padrao para todos os usuarios: ${SENHA_PADRAO}`);
  console.log("Ajuste nomes/logins reais e oriente a troca de senha apos o primeiro acesso.");
}

main();
