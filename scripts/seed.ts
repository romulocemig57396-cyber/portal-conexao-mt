import bcrypt from "bcryptjs";
import { criarUsuario, findUsuarioByLogin, type Papel } from "../src/lib/db";

const SENHA_PADRAO = "mudar123";

const usuariosSeed: Array<{ nome: string; usuario: string; papel: Papel }> = [
  { nome: "Gestor", usuario: "gestor", papel: "gestor" },
  { nome: "Colaborador 1", usuario: "colaborador1", papel: "colaborador" },
  { nome: "Colaborador 2", usuario: "colaborador2", papel: "colaborador" },
  { nome: "Colaborador 3", usuario: "colaborador3", papel: "colaborador" },
  { nome: "Colaborador 4", usuario: "colaborador4", papel: "colaborador" },
  { nome: "Colaborador 5", usuario: "colaborador5", papel: "colaborador" },
  { nome: "Colaborador 6", usuario: "colaborador6", papel: "colaborador" },
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
