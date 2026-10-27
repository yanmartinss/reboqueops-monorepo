# Etapa 2 (autenticação): o que falta

Atualizado em 2026-10-27. Marque `[x]` conforme for concluindo e dê commit junto com o código.

## Onde paramos

- Cadastro (`POST /api/register`) e login (`POST /api/login`) existem e estão commitados.
- Cadastro provado à mão (201 com token, 409 para e-mail repetido, sem tenant órfão).
- Login com erro genérico (401) e proteção de tempo, **ainda não provado**.
- Não existe teste automatizado nem script `test` no `package.json`.

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
- [ ] 0.5 Os 4 testes do login (descrever antes de escrever: usuário inicial, requisição, status e corpo esperados):
  - [ ] senha certa: 200 com `{ token }`
  - [ ] senha errada: 401
  - [ ] e-mail inexistente: 401 com a mesma mensagem da senha errada
  - [ ] corpo sem e-mail: 422
- [ ] 0.6 Teste de que o `sub` do token é o id do usuário no banco.
- [ ] 0.7 Medir o tempo à parte, em script (não como teste do vitest, para não ficar instável): 10 chamadas com e-mail existente e senha errada vs 10 com e-mail inexistente. As médias devem ficar próximas.
- [ ] 0.8 `npm run typecheck`, `npm run build`, `npm start` e `GET /api/ping`.
- [ ] 0.9 Commit em inglês. `git status` sem `dist/`, `src/generated/` ou `.env`.

## Passo 1: desenhar o middleware por escrito

Responder antes de codar:

- [ ] Cabeçalho e formato do token de entrada (`Authorization` + prefixo?). Faltando ou mal formado: qual status e mensagem?
- [ ] Usuário do token não existe mais no banco: qual erro e status (mesma mensagem genérica?).
- [ ] O que o middleware entrega ao controller (`userId`, `tenantId`), onde isso fica na requisição e como tipar no TypeScript.
- [ ] Renovação: quando assina o token novo, qual o nome do cabeçalho de resposta, e o que muda com "continuar logado" desligado.
- [ ] Onde mora "continuar logado": claim dentro do token (recomendação, sem consulta extra ao banco) ou no banco. Qual o padrão da caixinha.

## Passo 2: "continuar logado" no token e no login

- [ ] `signToken` recebe o id e a escolha de continuar logado; `verifyToken` devolve também essa escolha.
- [ ] Schema do login aceita o campo opcional novo.
- [ ] Testes do token com os casos de sempre, mais a nova claim.

## Passo 3: middleware de autenticação

- [ ] Arquivo novo em `src/middlewares/`, usando `verifyToken` e `prisma.user.findUnique` por id.
- [ ] `userId` e `tenantId` vêm do banco, nunca do corpo nem do token.
- [ ] Se a renovação está ligada, assina token novo e põe no cabeçalho da resposta.

## Passo 4: `GET /api/me`

- [ ] Rota com o middleware aplicado só nela; controller e service no padrão atual.
- [ ] Devolve nome, e-mail e tenant (id e nome); nunca `passwordHash` (usar `select`).
- [ ] Testes: sem token 401; token adulterado 401; token válido 200; usuário apagado 401; cabeçalho novo na resposta.

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

## Verificação ponta a ponta (fim da etapa)

Cadastro → token → `GET /api/me` com o token → dados do próprio usuário e tenant; login → token; convite cria usuário no mesmo tenant; segundo tenant isolado; `npm run typecheck`, `npm run build`, `npm start` e `/api/ping` sem erro; `git status` sem `dist/`, `src/generated/` ou `.env`.

## Para retomar no notebook

1. `git pull` e `npm install` em `reboqueops-api`.
2. Criar o `.env` na raiz a partir do `.env.example` (o `.env` não vai para o git; copie os valores por um canal seguro, não por commit).
3. `docker compose up -d` na raiz, depois `npx prisma generate` e `npx prisma migrate dev` (o Postgres do notebook começa vazio).
4. Abrir este arquivo e continuar do primeiro `[ ]` sem marcar.
