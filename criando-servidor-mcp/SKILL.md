---
name: criando-servidor-mcp
description: 'Use when the user asks to create, scaffold or publish an MCP server (Model Context Protocol): "criar um servidor MCP", "expor tools via MCP", choosing between stdio and Streamable HTTP (httpstream), defining which tools/resources/prompts to expose, adding security (OAuth 2.1, bearer token), or publishing the stdio server to npm ("publicar no npm", "npx nao funciona"). Also for Claude Desktop/Inspector setup or "server not showing up".'
---

# Criando um servidor MCP

## Visão geral

Fluxo: **entrevista → scaffold → implementação → verificação → publicação (se npm) → entrega**. Nunca gere código antes de fechar as 6 decisões da Fase 1.

Dois princípios inegociáveis:
1. **Em servidor stdio, nada é escrito em stdout.** stdout carrega JSON-RPC; `print()`, `console.log`, `System.out`, `fmt.Println` quebram o servidor. Logue em stderr.
2. **Segurança é do transporte, não do código de tool.** stdio não usa OAuth (credenciais vêm de variáveis de ambiente); autenticação existe no Streamable HTTP.

## Fase 1: entrevista (obrigatória)

Pergunte com `ask_user`, uma pergunta por chamada, no máximo ~6. Pule o que o usuário já disse e confirme o resumo antes de escrever código.

| # | Pergunta | Opções | Por que importa |
|---|----------|--------|-----------------|
| 1 | Transporte | stdio (local, o cliente inicia o processo) / Streamable HTTP (remoto, compartilhado, multi-cliente) | define autenticação, logging, deploy e o snippet de config |
| 2 | Stack | Python (`mcp[cli]` ≥ 2.0), TypeScript (`@modelcontextprotocol/server` + zod), C# (`ModelContextProtocol`), Go, Java/Spring AI, Kotlin, Ruby, Rust | comandos de scaffold e SDK |
| 3 | Segurança | aberto / bearer token estático (uso interno) / OAuth 2.1 completo (spec) | só faz sentido se HTTP; se stdio, explique e pergunte só se houver HTTP também |
| 4 | O que o servidor expõe | tools, resources (diretos e templates), prompts | tools = ações (model-controlled); resources = contexto read-only (application-driven); prompts = templates (user-controlled) |
| 5 | Onde criar | pasta, nome do projeto, gerenciador de pacotes | evita sobrescrever projeto existente |
| 6 | Distribuição | local só / publicar no npm (stdio JS) / outro registry | define `bin`, shebang, `files` e a Fase 6 |

Para **cada tool** esperada, registre em uma tabela antes de codar: nome (`snake_case`), o que faz em uma frase, parâmetros (nome, tipo, obrigatório, descrição), efeito colateral (lê ou escreve), e dependências externas (API, banco, arquivo, credencial). Se o usuário for vago ("umas tools de clima"), proponha um conjunto concreto e confirme. Não invente parâmetros que o usuário não validou.

Ferramentas e dados sensíveis: se uma tool escreve, apaga ou chama API paga, marque como requiring consent no README (o host aprova a execução).

## Fase 2: scaffold

| Stack | Comandos |
|-------|----------|
| Python | `uv init <nome>; cd <nome>; uv venv; .venv\Scripts\activate; uv add "mcp[cli]"` |
| TypeScript | `npm init -y; npm install @modelcontextprotocol/server zod; npm install -D @types/node typescript` + `"type":"module"`, `"bin"`, `"build":"tsc"` no package.json, tsconfig com `module: "Node16"` |
| C# | `dotnet new console; dotnet add package ModelContextProtocol --prerelease; dotnet add package Microsoft.Extensions.Hosting` |
| Go | `go mod init <nome>; go get github.com/modelcontextprotocol/go-sdk/mcp` |

Verifique se o runtime existe antes (`node --version`, `uv --version`, `dotnet --version`, `go version`). Se faltar, diga ao usuário em vez de instalar por conta própria.

## Fase 3: implementação

Exemplo completo (Python, stdio, duas tools):

```python
import logging
import httpx2
from mcp.server import MCPServer

logger = logging.getLogger(__name__)   # stderr: seguro em stdio
mcp = MCPServer("weather")

@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"https://api.weather.gov/alerts/active/area/{state.upper()}"
    async with httpx2.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers={"Accept": "application/geo+json"})
        r.raise_for_status()
    features = r.json().get("features", [])
    if not features:
        return "No active alerts for this state."
    return "\n---\n".join(f["properties"]["headline"] for f in features)

if __name__ == "__main__":
    mcp.run(transport="stdio")            # ou transport="streamable-http"
```

Docstrings e type hints viram `inputSchema` (JSON Schema) automaticamente. Em TypeScript, `server.registerTool(nome, { description, inputSchema: z.object({...}) }, handler)`.

Transportes (spec 2026-07-28):
- **stdio**: JSON-RPC delimitado por newline nos streams do subprocesso iniciado pelo cliente. Cancelamento via `notifications/cancelled`.
- **Streamable HTTP**: uma única URL de endpoint; cada mensagem é um `POST` cuja resposta é JSON ou um stream SSE do escopo daquela requisição; metadados de request também espelhados em headers. Em TS use `serveStdio(createServer, ...)` / o helper HTTP com **factory que retorna instância nova a cada chamada** (o servidor faz um probe `server/discover` e depois pode cair para `initialize`); wiring manual com `server.connect(new StdioServerTransport())` só atende clientes da era 2025.

## Fase 4: segurança (só quando HTTP)

Escolhido OAuth 2.1, o servidor MCP é um **resource server**:
- Publique **Protected Resource Metadata** (RFC 9728) em `/.well-known/oauth-protected-resource`; o authorization server publica metadata (RFC 8414 ou OIDC Discovery).
- Aceite apenas `Authorization: Bearer <token>` em **toda** requisição; nunca token em query string.
- Valide **audience**: o token foi emitido para o URI canônico deste servidor (RFC 8707 `resource`). Rejeite tokens de terceiros.
- `401` token inválido/expirado; `403` + `WWW-Authenticate: Bearer error="insufficient_scope", scope="..."` para escopo insuficiente; escopos mínimos no desafio inicial.
- HTTPS obrigatório; sem segredo hardcoded; `.env` + `.env.example` + `.gitignore`.

Alternativa leve (interno, não conforme à spec): bearer token estático lido de variável de ambiente, rejeitando 401 sem header. Documente explicitamente que não é OAuth e que clientes que fazem discovery OAuth (Claude, Inspector) podem não completar o fluxo.

Se o usuário escolheu stdio e pediu "segurança": explique que não há autenticação no transporte; a proteção é o processo local (permissões de arquivo, env vars, validação de entrada, princípio do menor privilégio nas tools).

## Fase 5: verificação (obrigatória)

Execute, não presuma:
1. Build/run limpo (`npm run build` em TS é etapa obrigatória).
2. `npx @modelcontextprotocol/inspector --cli <cmd> --protocol-era modern --method tools/list` e repita com `--protocol-era legacy`.
3. `--method tools/call` em cada tool, com argumento válido e um inválido.
4. HTTP: `curl` no endpoint sem token (esperado 401 com `WWW-Authenticate`), `curl` no `/.well-known/oauth-protected-resource`, depois com token.

Relate o que rodou e o que falhou. Nunca afirme que o servidor funciona sem saída de comando que comprove.

## Fase 6: publicar no npm (stdio em TypeScript/JavaScript)

Publicar no npm é o padrão de distribuição de servidor stdio: o host roda `npx -y <pacote>` e o npm baixa e executa o binário. Ofereça quando o usuário quer compartilhar, instalar em outra máquina ou cadastrar no registry oficial de MCP. Pergunte antes (`ask_user`): publicar agora ou deixar local.

**Publicar é quase irreversível.** Depois de publicado, um mesmo número de versão não pode ser reescrito, e `npm unpublish` é bloqueado para pacotes com downloads ou com mais de 72h (o caminho vira `npm deprecate`). Nunca rode `npm publish` sem confirmação explícita do usuário, e nunca publique sem o `npm pack --dry-run` abaixo.

Passos, nesta ordem:

1. **Nome e escopo.** Pacote sem escopo precisa de nome livre (`npm view <nome> version` retorna `404` se estiver livre). Nome com escopo (`@usuario/mcp-clima`) exige conta ou organização no npm; escopo privado em plano gratuito falha com erro de pricing, então declare `"publishConfig": { "access": "public" }`.
2. **package.json completo.** Estes campos são obrigatórios para o servidor funcionar via `npx`:
```json
{
  "name": "mcp-clima",
  "version": "0.1.0",
  "type": "module",
  "bin": { "mcp-clima": "./build/index.js" },
  "files": ["build"],
  "engines": { "node": ">=20" },
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/<user>/<repo>.git" },
  "publishConfig": { "access": "public" },
  "scripts": { "build": "tsc && chmod 755 build/index.js" }
}
```
   `files: ["build"]` é o que entra no pacote; sem ele, `node_modules` e fontes vão junto. `bin` é o que o `npx` executa.
3. **Shebang.** A primeira linha do arquivo de entrada (`src/index.ts` compilado em `build/index.js`) deve ser `#!/usr/bin/env node`. Sem ela, o `npx` falha com erro de sintaxe ou "não é executável". Em TypeScript, o shebang vai no topo do `.ts` e o `tsc` o preserva.
4. **Build + inspeção do tarball.** `npm run build` e depois `npm pack --dry-run`. Confira que a lista contém `build/index.js` e que o tamanho é razoável. Se o `bin` apontar para arquivo ausente, o pacote publicado quebra no cliente.
5. **Autenticação.** `npm whoami`; se falhar, `npm login`. Contas com 2FA pedem OTP: `npm publish --otp=<6 dígitos>`. Não peça a senha do usuário; deixe que ele rode `npm login` na máquina dele.
6. **Publicar.** `npm publish`. Depois confirme de fora: `npm view <pacote> version bin` deve mostrar a versão e o binário.
7. **Verificação final com o pacote publicado** (não com o código local):
```
npx -y <pacote>            # deve subir e aguardar em stdio
npx @modelcontextprotocol/inspector --cli npx -y <pacote> --protocol-era modern --method tools/list
```
8. **Versões seguintes.** `npm version patch|minor|major` (cria commit e tag) e `npm publish`. Nunca edite o campo `version` e publique por cima de uma versão existente.

Se o stack não for JS, o npm não é o caminho: Python publica no PyPI (`uv build` + `twine upload` / `uv publish`) e o host usa `uvx <pacote>`; Go e Rust publicam binários, e o padrão npm para eles é um pacote que baixa o binário na instalação. Diga isso em vez de forçar npm.

Depois de publicado, o próximo passo natural é o registry oficial de MCP (`registry.modelcontextprotocol.io`), que exige o pacote no npm como fonte.

## Fase 7: entrega

- Snippet de config do host (`mcpServers`), com **caminho absoluto** e barras duplas em Windows:
```json
{ "mcpServers": { "<nome>": { "command": "uv", "args": ["--directory", "C:\\path\\to\\proj", "run", "server.py"] } } }
```
- Se foi publicado no npm, entregue a variante portátil (funciona em qualquer máquina, sem caminho local):
```json
{ "mcpServers": { "<nome>": { "command": "npx", "args": ["-y", "<pacote>"] } } }
```
- README: como rodar, variáveis de ambiente, tabela de tools, como testar com Inspector, limitações. Se publicado, inclua o comando de instalação e o badge/linha de versão.
- Checklist de segurança quando HTTP (audience, escopos, HTTPS, rotação de token).

## Erros comuns

| Erro | Consequência / correção |
|------|-------------------------|
| `print`/`console.log` em stdio | corrompe JSON-RPC; use stderr (`logging`, `console.error`) |
| Caminho relativo no `mcpServers` | servidor não aparece no host; use absoluto e reinicie o app |
| Esquecer `npm run build` (TS) | host executa arquivo inexistente |
| `server.connect(new StdioServerTransport())` em TS | só clientes era 2025 conectam; use a factory |
| Token em query string | viola a spec; header em toda request |
| Aceitar token de outro audience | confused deputy; valide o URI canônico |
| OAuth em stdio | spec diz que stdio NÃO segue o fluxo OAuth; use env vars |
| Tool com parâmetro inventado | schema errado, chamadas falham; confirme com o usuário |
| Credencial no código | mova para env + `.env.example` sem valor real |
| `bin` apontando para arquivo fora de `files` | pacote publicado não tem o binário; `npx` falha no cliente |
| Shebang ausente no entry point | `npx <pacote>` quebra; primeira linha deve ser `#!/usr/bin/env node` |
| Escopo sem `publishConfig.access: "public"` | `npm publish` recusa com erro de pricing |
| Republicar a mesma versão | npm recusa; bump com `npm version` antes |
| `npm publish` sem `npm pack --dry-run` | publica lixo ou pacote quebrado, e desfazer é limitado (72h, depois só `deprecate`) |
