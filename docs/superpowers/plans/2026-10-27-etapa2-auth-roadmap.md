# Etapa 2 (autenticação): o que falta

Atualizado em 2026-10-28. Marque `[x]` conforme for concluindo e dê commit junto com o código.

## Onde paramos

- Cadastro (`POST /api/register`), login (`POST /api/login`), middleware de autenticação e `GET /api/me` existem e estão commitados.
- App separado do `listen` (`src/app.ts` monta, `src/server.ts` liga na porta).
- Testes automáticos com vitest + supertest em `tests/` (`npm test`), contra um banco separado `reboqueops_test` (container `postgres-test` na porta 5433, dados em memória, `.env.test` na raiz, trava que recusa rodar fora de um banco `_test`).
- `npm run build` + `npm start` provados com ping, login e `/me` (200).
- Medição de tempo do login feita (e-mail inexistente vs senha errada).
- Falta: "lembrar de mim logado" (token e login), renovação do token no middleware, convite da segunda conta e teste de isolamento entre tenants.

## Decisões já tomadas

- O tenant nunca vem do cliente: é buscado no banco a partir do `sub` do token.
- Token JWT HS256 com `sub` e `exp`, validade de 7 dias.
- Renovação deslizante: a cada pedido autenticado, token novo no cabeçalho da resposta.
- "Continuar logado" desligado = sem renovação.
- Risco de celular roubado aceito. Token não é guardado no banco.
- Camadas: rota > controller > service (sem repositório). Erros com `AppError`.
- Mesma mensagem 401 para e-mail inexistente e senha errada.
- Código e commits em inglês; interface e docs em português.

## Passo 0: fechar o login

Testes com **vitest** (decisão do desenvolvedor).

- [ X ] 0.1 Separar o app do `listen`: um arquivo exporta o app (rotas, `express.json()`, middleware de erro) e outro só chama `listen`. Conferir que `npm run dev` continua funcionando.
- [ X ] 0.2 Instalar vitest e supertest (mais os tipos do supertest) como devDependencies; criar o script `test`. Anotar por que cada pacote.
- [ X ] 0.3 Teste mínimo: `GET /api/ping` retorna 200. Tem de passar.
- [ X ] 0.4 Decidir o banco dos testes: banco separado (outra `DATABASE_URL`) ou e-mails únicos por execução com limpeza. Decidir também como o vitest recebe `JWT_SECRET` e `DATABASE_URL`.
- [ X ] 0.5 Os 4 testes do login (descrever antes de escrever: usuário inicial, requisição, status e corpo esperados):
  - [ X ] senha certa: 200 com `{ token }`
  - [ X ] senha errada: 401
  - [ X ] e-mail inexistente: 401 com a mesma mensagem da senha errada
  - [ X ] corpo sem e-mail: 422
- [ X ] 0.6 Teste de que o `sub` do token é o id do usuário no banco.
- [ X ] 0.7 Medir o tempo à parte, em script (não como teste do vitest, para não ficar instável): 10 chamadas com e-mail existente e senha errada vs 10 com e-mail inexistente. As médias devem ficar próximas.
- [ X ] 0.8 `npm run typecheck`, `npm run build`, `npm start` e `GET /api/ping`.
- [ X ] 0.9 Commit em inglês. `git status` sem `dist/`, `src/generated/` ou `.env`.

## Passo 1: desenhar o middleware por escrito

Responder antes de codar:

- [ X ] Cabeçalho e formato do token de entrada (`Authorization` + prefixo?). Faltando ou mal formado: qual status e mensagem?
- [ X ] Usuário do token não existe mais no banco: qual erro e status (mesma mensagem genérica?).
- [ X ] O que o middleware entrega ao controller (`userId`, `tenantId`), onde isso fica na requisição e como tipar no TypeScript.
- [ X ] Renovação: quando assina o token novo, qual o nome do cabeçalho de resposta, e o que muda com "continuar logado" desligado.
- [ X ] Onde mora "continuar logado": claim dentro do token (recomendação, sem consulta extra ao banco) ou no banco. Qual o padrão da caixinha.

## Passo 2: "continuar logado" no token e no login

- [ X ] `signToken` recebe o id e a escolha de continuar logado; `verifyToken` devolve também essa escolha.
- [ X ] Schema do login aceita o campo novo.
- [ X ] Testes do token com os casos de sempre, mais a nova claim.

## Passo 3: middleware de autenticação

- [ X ] Arquivo novo em `src/middlewares/`, usando `verifyToken` e `prisma.user.findUnique` por id.
- [ X ] `userId` e `tenantId` vêm do banco, nunca do corpo nem do token.
- [ X ] Se a renovação está ligada, assina token novo e põe no cabeçalho da resposta.

## Passo 4: `GET /api/me`

- [ X ] Rota com o middleware aplicado só nela; controller e service no padrão atual.
- [ X ] Devolve nome, e-mail e tenant (id e nome); nunca `passwordHash` (usar `select`).
- [ X ] Testes: sem token 401; token adulterado 401; token válido 200; usuário apagado 401; cabeçalho novo na resposta.

## Passo 5: convite da segunda conta (a mãe)

Design antes do código:

- [ ] Quem convida, como a conta entra no mesmo tenant (rota protegida cria o usuário com o `tenantId` do convidante, vindo do middleware), como ela define a senha, o que a API devolve.
- [ ] Implementar o `POST` protegido seguindo as camadas.
- [ ] Testar 409 para e-mail repetido e que o novo usuário cai no mesmo tenant.

## Passo 6: isolamento entre tenants (obrigatório pelo plano)

- [ ] Dois usuários em tenants diferentes; provar que um não enxerga o outro (por ora via `/me` e convite). A versão completa com serviços e clientes é obrigatória na Etapa 3.

## Passo 7: pendências menores

- [ ] `createUser`: mover `signToken` para depois do try/catch (só o `create` deve ficar dentro).
- [ ] JSON malformado no corpo hoje deve dar 500; tratar como 400 e testar.
- [ ] Mensagem do 422 não diz qual campo falhou.
- [ ] Justificar custo do bcrypt (10) e limite de senha do cadastro (máx. 20 sem justificativa; bcrypt corta em 72 bytes).
- [ ] Decidir `@db.Uuid` nos ids.
- [ ] Rate limit no login.
- [ ] CORS: expor o cabeçalho do token novo para a web (`Access-Control-Expose-Headers`).
- [ ] Definir o estilo de commits no `CLAUDE.md`.
- [ ] Registrar no spec as decisões desta etapa (renovação, risco aceito, camadas sem repositório). Pedir ao Claude para editar.

## Decisões da sessão (2026-10-28)

- **"Lembrar de mim logado" mora no token**, não no banco. Motivo: é propriedade da **sessão**, não do usuário (celular marcado, computador alheio desmarcado). O argumento do "gargalo" não vale: o middleware já consulta o banco a cada requisição.
- **Padrão marcado** (por causa do pai) e o campo é **obrigatório, sem `default`** no `POST /api/login`, booleano (`z.boolean()`). Quem chama a API sem a tela tem de mandar o campo; o corpo sem ele dá 422. Motivo: com `.default(true)` quem esquecesse o campo receberia, em silêncio, um token de 7 dias que se renova. O "marcado por padrão" vive na tela (a caixinha já vem marcada), não na API.
- **Nome do campo:** `rememberMe` (booleano, obrigatório no login, vai como claim dentro do token).
- **Modo marcado:** renovação a cada requisição autenticada (e no login), 7 dias contados de novo.
- **Modo desmarcado:** sem renovação, `exp` de **2 horas** (`signToken` escolhe `"7d"` ou `"2h"` conforme o `rememberMe`). "Até a próxima sessão" é comportamento do cliente (onde ele guarda o token); o servidor sempre emite um `exp` finito.
- **Token do `register`:** emitido com `rememberMe: true`, igual ao padrão da caixinha.
- **Cabeçalho do token novo:** `X-Refreshed-Token`. A web precisa de `Access-Control-Expose-Headers: X-Refreshed-Token`. O app mobile (Expo) não passa por CORS. Ainda não existe middleware `cors` no app.
- **Camadas do middleware:** ele chama `getUserById` (service) e grava no `req` só `userId` e `tenantId`, ambos vindos do banco (nunca do token ou do corpo). O `/me` faz a própria consulta, porque quer mais campos que os ids. As outras rotas protegidas só precisam do `tenantId`.
- **`as any` no `req` adiado.** Precisa estar decidido antes da primeira consulta que filtra por `req.tenantId` (Etapa 3). Motivo: o Prisma ignora `undefined` dentro de `where`, então um erro de digitação em `req.tenantId` poderia devolver dados de todos os tenants.
- **Gerador do Prisma com `importFileExtension = "js"`** no `schema.prisma`, para o cliente gerado ser importável pelo Node em `npm start`. Depois de mudar o schema, rodar `prisma generate` (não `migrate`: `generate` refaz o código do cliente, `migrate` altera o banco).
- **`postinstall: prisma generate`** no `package.json`, para o notebook gerar o cliente sozinho após `npm install`. Risco: em deploy com `npm install --omit=dev` o comando `prisma` (devDependency) não existe e o install falha. Decidir antes do primeiro deploy.
- **Commits:** separar por assunto (o que conserta o `start` num commit, a limpeza do middleware em outro).

## Em aberto (ainda sem decisão)

- No cliente (web e app), onde guardar o token do modo desmarcado para ele sumir ao fechar a aba/app. Assunto das etapas web e mobile.
- JSON malformado no corpo (por exemplo, vírgula sobrando) hoje dá **500**, porque o middleware de erro só reconhece `AppError`. O erro do parser já traz `statusCode: 400` e `type: "entity.parse.failed"`. Tratar no middleware de erro do `app.ts` e testar. (Está também no Passo 7.)
- Teste do token do `register` (carrega `rememberMe: true` e dura 7 dias).
- O `true` fixo em `signToken(user.id, true)` do `createUser` merece nome ou comentário.
- Salvar (ou não) o script da medição de tempo no repositório.
- `tenant.service.ts` foi removido por enquanto. Se voltar, justificar a consulta extra frente ao `getUserById` (que já devolve `tenantName`).

## Atenção: caixinhas marcadas que o código ainda não sustenta

Conferido em 2026-10-28 nos arquivos. Desmarque ou conclua:

- Passo 1: "Renovação (cabeçalho, nome)" e "onde mora continuar logado": o desenho está acima, mas o nome do cabeçalho e o modo desmarcado seguem em aberto.
- Passo 2: "`signToken` recebe a escolha de continuar logado": hoje é `signToken(userId)` com `7d` fixo, sem claim de "lembrar".
- Passo 3: "renovação assina novo token e põe no cabeçalho": não há `setHeader`/`res.set` em `src/`.
- Passo 4: teste do "cabeçalho novo na resposta": não existe em `tests/`. Também o tipo do `userId` no `Request` segue `as any` (adiado).

## Verificação ponta a ponta (fim da etapa)

Cadastro → token → `GET /api/me` com o token → dados do próprio usuário e tenant; login → token; convite cria usuário no mesmo tenant; segundo tenant isolado; `npm run typecheck`, `npm run build`, `npm start` e `/api/ping` sem erro; `git status` sem `dist/`, `src/generated/` ou `.env`.

## Para retomar no notebook

1. `git pull` e `npm install` em `reboqueops-api`.
2. Criar o `.env` na raiz a partir do `.env.example` (o `.env` não vai para o git; copie os valores por um canal seguro, não por commit) e o `.env.test` a partir do `.env.test.example`.
3. `docker compose up -d` na raiz (sobe o Postgres de dev e o de teste), depois `npx prisma migrate dev` (o Postgres do notebook começa vazio). O `prisma generate` roda sozinho no `npm install` (`postinstall`); se mudar o `schema.prisma`, rode `npx prisma generate` à mão.
4. Em `reboqueops-api`: `npm run typecheck` e `npm test` (tem de dar tudo verde antes de começar). Scripts rodam dentro de `reboqueops-api`, não na raiz.
5. Abrir este arquivo e continuar do primeiro `[ ]` sem marcar.
