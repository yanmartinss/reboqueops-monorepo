# ReboqueOps: plano de implementação

Design: `docs/superpowers/specs/2026-10-16-reboqueops-design.md` (aprovado em 2026-10-16).

A skill `superpowers:writing-plans` não está instalada neste projeto; este plano foi escrito à mão.

## Como usar este plano

- **Ordem escolhida pelo desenvolvedor por motivo de estudo** (backend e login primeiro), não por dependência técnica. O pai ainda não sabe do app e não tem pressa.
- Cada etapa diz **o que você modela antes** de abrir a IDE e **quando está pronta**. Pelo `CLAUDE.md`, o Claude guia com perguntas e não entrega código pronto.
- As etapas são independentes o bastante para parar entre uma e outra.

## Etapas

### 1. Monorepo e backend base
- Modele antes: tabelas `tenant`, `usuario`, `cliente`, `servico` no papel: campos, tipos, chaves e onde entra o id do tenant. IDs são UUID. Dinheiro em centavos. O serviço tem data do serviço e data do pagamento (nula no fiado em aberto).
- Pronto quando: backend Node/TypeScript sobe, conecta ao banco e as tabelas existem por migração.
- Decidido pelo desenvolvedor: biblioteca de acesso é **Drizzle** (a mesma do app Expo), por estudo. Atenção: o Drizzle tem schemas por dialeto (`sqliteTable`, `pgTable`); se o banco do backend não for SQLite, os dois schemas serão arquivos diferentes e precisam ficar alinhados.
- Decidido pelo desenvolvedor: em desenvolvimento, o Postgres roda **local em Docker** e a API acessa esse banco. O uso de Docker é também objetivo de estudo.
- Escolhas a declarar: estrutura do monorepo, como o Docker é configurado (por exemplo, um `docker-compose`), onde ficam as credenciais do banco local.

### 2. Login
- Modele antes: o fluxo de cadastro do primeiro usuário (cria o tenant), o de convite de um segundo usuário, e o conteúdo do JWT.
- Pronto quando: cadastro, login, JWT assinado, e uma rota protegida que descobre o tenant **pelo banco** a partir do usuário do token, nunca do pedido.
- Teste obrigatório: um usuário de outro tenant não consegue ler nem alterar dados do primeiro.
- Escolhas a declarar: expiração e renovação do token (requisito: continuar logado), como armazenar a senha.

### 3. API de clientes e serviços
- Modele antes: o contrato (rotas, entrada, saída) antes da implementação.
- Pronto quando: criar, listar e atualizar serviços e clientes, sempre isolados por tenant. Marcar fiado como pago exige a forma de pagamento escolhida e grava a data de pagamento.

### 4. App do celular (Expo + SQLite + Drizzle)
- Modele antes: o esquema local espelha o do backend? O que muda por ser uma cópia local?
- Pronto quando: o pai (ou você) cadastra um serviço em poucos toques, telefone de cliente antigo preenche nome e endereço, e tudo funciona sem internet.
- Interface: letra grande e poucos toques. Cores a definir (diferentes dos mockups).

### 5. Sincronização
- Modele antes: como o app sabe o que está pendente, e o que acontece se o mesmo fiado foi alterado nos dois lados (raro, pois só uma pessoa edita por vez).
- Pronto quando: serviço criado offline chega ao backend ao voltar a internet, e o que foi criado em outro dispositivo chega ao celular.
- Escolha a declarar: estratégia de sincronização.

### 6. Recibo
- Modele antes: como montar a frase "Reboque de um veículo placa X" e o valor por extenso.
- Pronto quando: PDF igual ao `recibo.pdf` (parte do emitente fixa, vinda de configuração), compartilhável por WhatsApp, gerável de qualquer serviço salvo.
- **Sugestão do Claude:** mostrar ao pai o app com recibo funcionando para validar a hipótese do fechamento à noite.

### 7. Resumo
- Modele antes: as três consultas (ganho do mês pela data de pagamento, fiados em aberto, contagem por forma de pagamento) e o que acontece na virada de mês.
- Pronto quando: as três respostas aparecem corretas, inclusive um fiado de outro mês pago neste mês.

### 8. Web (React)
- Pronto quando: a mãe entra com a conta dela, vê o resumo e os recibos, registra serviços, e tudo aparece no celular do pai.

## Decisões em aberto

- **Banco do backend:** Postgres (escolha do desenvolvedor, por familiaridade).
- **Hospedagem da API e do banco:** não decidida e não bloqueia as etapas 1 a 4, que rodam locais. Só importa a partir da etapa 5. Critério levantado pelo desenvolvedor: serviços gratuitos que "dormem" (como o Render) atrasam só a web da mãe, porque o celular do pai grava local e sincroniza por uma fila em segundo plano. Falta pesquisar custo de VPS e alternativas.

## Riscos conhecidos

- Os dados do pai mudam de comportamento por hipótese ainda não testada com ele.
- Sincronização (etapa 5) é a parte mais difícil.
- A mãe só terá o app na última etapa.
