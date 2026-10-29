# Etapa 2 (autenticação): o que falta

Atualizado em 2026-10-29. Marque `[x]` conforme for concluindo e dê commit junto com o código.

## Onde paramos

- Cadastro (`POST /api/register`), login (`POST /api/login`), middleware de autenticação com renovação do token e `GET /api/me` existem e estão commitados.
- "Lembrar de mim logado" (`rememberMe`) pronto: claim no token, 7 dias (marcado) ou 2 horas (desmarcado), obrigatório no login, e o middleware renova o token do modo marcado no cabeçalho `X-Refreshed-Token`.
- App separado do `listen` (`src/app.ts` monta, `src/server.ts` liga na porta).
- Testes automáticos com vitest + supertest em `tests/` (`npm test`), contra um banco separado `reboqueops_test` (container `postgres-test` na porta 5433, dados em memória, `.env.test` na raiz, trava que recusa rodar fora de um banco `_test`).
- `npm run build` + `npm start` provados com ping, login e `/me` (200).
- Medição de tempo do login feita (e-mail inexistente vs senha errada).
- 37 testes passando (`npm test`): cadastro, login, `rememberMe` (duração exata e claim), `/me` (401 de vários tipos, usuário apagado, 200) e renovação (cabeçalho presente com `true`, ausente com `false`, token novo aceito).
- Falta: JSON malformado → 400, middleware `cors`, convite da segunda conta (Passo 5), teste de isolamento entre tenants (Passo 6) e as pendências do Passo 7.

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

- [ X ] Arquivo novo em `src/middleware/auth.ts`, usando `verifyToken` e o `getUserById` do service (que faz o `findUnique` por id).
- [ X ] `userId` e `tenantId` vêm do banco, nunca do corpo nem do token.
- [ X ] Se a renovação está ligada, assina token novo e põe no cabeçalho da resposta.

## Passo 4: `GET /api/me`

- [ X ] Rota com o middleware aplicado só nela; controller e service no padrão atual.
- [ X ] Devolve nome, e-mail e tenant (id e nome); nunca `passwordHash` (usar `select`).
- [ X ] Testes: sem token 401; token adulterado 401; token válido 200; usuário apagado 401; cabeçalho novo na resposta.

## Passo 5: convite da segunda conta (a mãe)

**Decisão (2026-10-29):** papéis + **convite por link** (em vez de senha inicial). Só o dono convida. Um usuário pertence a **um** tenant (409 se o e-mail já existe em qualquer tenant). Sem envio de e-mail: a API devolve o token ao dono, que manda o link pelo WhatsApp. Caminho de evolução (fora de escopo): tabela de associação usuário↔tenant, serviço de identidade pronto.

Por que o `tenantId` não vem do corpo: senão qualquer usuário logado criaria contas dentro do tenant de outra pessoa, entraria com elas e leria os dados da vítima.

Faça nesta ordem, **teste primeiro** em cada passo, um commit por passo:

- [ ] 5.0 Responder por escrito (ver perguntas abaixo) antes de qualquer código.
- [x] 5.1 **Papel no `User`**: enum (dono, membro) + coluna `role`; migration (usuários que já existem viram dono); o cadastro cria o dono; `getUserById` devolve o `role`. Teste: quem se cadastra fica como dono no banco.
- [x] 5.2 **Middleware entrega o `role`** (vindo do banco, `req.role = user.role`; nunca no token, porque o token carregaria um papel desatualizado se o usuário fosse rebaixado ou apagado). **Decisão revista (2026-10-29): o tipo do `Request` foi declarado** em `src/types/express.d.ts` (`userId`, `tenantId`, `role`), no lugar do `(req as any)`. Motivo: o `role` falha fechado (`role !== "OWNER"` nega se vier `undefined`), mas o `tenantId` **não** (o Prisma ignora `undefined` no `where` e devolveria dados de todos os tenants), então o tipo protege contra erro de digitação antes da Etapa 3. Os campos estão declarados como obrigatórios; em rotas públicas (`/ping`, `/register`, `/login`) eles valem `undefined` em tempo de execução, então só leia `req.tenantId` em rotas atrás do `authMiddleware`. Resta trocar o último `(req as any).userId` do `getMe`.
  - Regra de permissão: sempre *falhar fechado* (negar na dúvida).
- [ ] 5.3 **Tabela `Invitation`**: tenant, e-mail, hash do token, validade, quando foi usado, quem criou. Migration. Atualizar o `resetDb` dos testes (ordem de exclusão por causa das chaves estrangeiras).
- [ ] 5.4 **`POST` de criar convite** (protegido, só dono): 401 sem token, 403 para membro, 201 para dono com token e validade, 409 se o e-mail já tem conta, nada de token em texto puro no banco, o `tenantId` vem do `req`.
- [ ] 5.5 **`POST` de aceitar convite** (público): token válido cria o usuário no **mesmo tenant** como membro, em uma transação, e marca o convite como usado; token usado, vencido ou inválido é rejeitado; e-mail que ganhou conta no meio do caminho dá 409; regras de senha iguais às do cadastro.
- [ ] 5.6 Teste de isolamento (Passo 6) usando o convite: o convite do tenant A nunca cria usuário no tenant B.

Decisões do convite (2026-10-29):

- Convite **amarrado a um e-mail**; vale **2 horas**; sempre cria um **membro** (a tabela `Invitation` não tem coluna `role`).
- Tabela `Invitation`: `tokenHash` (único), `email`, `expiresAt`, `acceptedAt` (nulo = não usado), `invitedBy` + `tenantId` com chave composta para `User(id, tenantId)` (o banco impede convite de um tenant com `invitedBy` de outro), `onDelete: Cascade` (convite pendente de usuário/tenant que some perde o sentido; o histórico dos já aceitos some junto), `@@index([tenantId])`.
- O token é **aleatório de 32 bytes** (`crypto.randomBytes`, nunca `Math.random`). A segurança vem da aleatoriedade, não do hash; o hash (SHA-256, rápido) só evita guardar o link em texto no banco. Senha usa bcrypt porque é curta e escolhida por uma pessoa.
- Resposta do **criar convite** (201, só para o dono): `token` em texto (única vez em que existe), `expiresAt` e `email`. **Só o token**, o link é montado no front (a segurança está no token; montar no back exigiria uma variável com o endereço do front, e há dois fronts). Nunca devolve `tokenHash` nem dados de senha.
- Fila da rota: `authMiddleware` → `requireOwner` → controller.

Perguntas do 5.0 (responder por escrito):

1. O convite fica **amarrado a um e-mail** ou o link é livre? (Amarrado é mais seguro: qual ataque ele evita?)
2. Por que o token do convite pode ser guardado com um hash rápido (SHA-256) e a senha precisa de bcrypt? (Pense em quanta aleatoriedade cada um tem.)
3. Validade do convite: quanto tempo, e por quê?
4. Como garantir **uso único** mesmo com dois pedidos de aceitar ao mesmo tempo?
5. O que o "aceitar" devolve: um token de login (com `rememberMe`?) ou a pessoa precisa fazer login depois?
6. Existe convite pendente para o mesmo e-mail: o novo invalida o antigo?

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
- **Middleware de autenticação lança `throw new AppError("Access denied", 401)`.** No Express 5 um erro lançado em middleware `async` já é encaminhado ao middleware de erro; não precisa de `next(err)`. O `try/catch` cobre **só** o `verifyToken` (a única chamada que lança erro de token). Uma falha real do banco em `getUserById` sobe como erro desconhecido (500 com `console.error`), e não vira 401: senão uma queda do Postgres pareceria "acesso negado" e esconderia a causa.
- **Renovação:** o cabeçalho `X-Refreshed-Token` é escrito **antes** do `next()` (o controller envia a resposta depois). O token novo usa o `user.id` do banco e mantém o modo do token (`decoded.rememberMe`), para o modo da sessão não mudar sozinho se o `if` mudar. No modo desmarcado nada é escrito, senão a sessão de 2 horas viraria uma sessão deslizante. O cabeçalho também sai em respostas de erro do controller; aceito, porque o token novo é válido.
- **Testes compartilham um único banco:** nunca rode dois `npm test` ao mesmo tempo. O `resetDb` de uma execução apaga os dados da outra e causa falhas sem sentido (409, 401 inesperados).
- **Teste primeiro:** os testes de renovação foram escritos e vistos falhando antes do código. Mantenha o método.

## Em aberto (ainda sem decisão)

- No cliente (web e app), onde guardar o token do modo desmarcado para ele sumir ao fechar a aba/app. Assunto das etapas web e mobile.
- JSON malformado no corpo (por exemplo, vírgula sobrando) hoje dá **500**, porque o middleware de erro só reconhece `AppError`. O erro do parser já traz `statusCode: 400` e `type: "entity.parse.failed"`. Tratar no middleware de erro do `app.ts` e testar. (Está também no Passo 7.)
- Teste do token do `register` (carrega `rememberMe: true` e dura 7 dias).
- O `true` fixo em `signToken(user.id, true)` do `createUser` (cadastro entra no modo "lembrar") merece nome ou comentário.
- Teste para o caso do banco falhando dentro do middleware (hoje sobe como 500): como simular um erro do banco sem derrubar o container?
- Salvar (ou não) o script da medição de tempo no repositório.
- `tenant.service.ts` foi removido por enquanto. Se voltar, justificar a consulta extra frente ao `getUserById` (que já devolve `tenantName`).

## Atenção: o que as caixinhas marcadas ainda não cobrem

Conferido em 2026-10-29 nos arquivos. Os Passos 1 a 4 agora estão sustentados pelo código e pelos testes, com uma exceção deliberada:

- Passo 1 (3º item) e Passo 4: o tipo de `userId`/`tenantId` no `Request` segue `(req as any)`. **Adiado de propósito**, e precisa estar decidido antes da primeira consulta que filtra por `req.tenantId` (Etapa 3).

## Verificação ponta a ponta (fim da etapa)

Cadastro → token → `GET /api/me` com o token → dados do próprio usuário e tenant; login → token; convite cria usuário no mesmo tenant; segundo tenant isolado; `npm run typecheck`, `npm run build`, `npm start` e `/api/ping` sem erro; `git status` sem `dist/`, `src/generated/` ou `.env`.

## Para retomar no notebook

1. `git pull` e `npm install` em `reboqueops-api`.
2. Criar o `.env` na raiz a partir do `.env.example` (o `.env` não vai para o git; copie os valores por um canal seguro, não por commit) e o `.env.test` a partir do `.env.test.example`.
3. `docker compose up -d` na raiz (sobe o Postgres de dev e o de teste), depois `npx prisma migrate dev` (o Postgres do notebook começa vazio). O `prisma generate` roda sozinho no `npm install` (`postinstall`); se mudar o `schema.prisma`, rode `npx prisma generate` à mão.
4. Em `reboqueops-api`: `npm run typecheck` e `npm test` (tem de dar tudo verde antes de começar). Scripts rodam dentro de `reboqueops-api`, não na raiz.
5. Abrir este arquivo e continuar do primeiro `[ ]` sem marcar.
