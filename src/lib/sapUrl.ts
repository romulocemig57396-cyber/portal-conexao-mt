// Mesmo template usado no painelConexao (server/src/sapUrl.js) — não é
// segredo, é só o link de deep-link pro SAP, o mesmo pra qualquer usuário.
const SAP_NOTA_URL_TEMPLATE =
  "https://prd.sap.cemig.com.br/sap/bc/gui/sap/its/webgui?sap-client=100&~transaction=*IW52%20RIWO00-QMNUM={NUM_NOTA}";

export function montarUrlSap(numNota: string): string {
  return SAP_NOTA_URL_TEMPLATE.replace("{NUM_NOTA}", encodeURIComponent(numNota));
}
