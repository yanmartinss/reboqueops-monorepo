# ReboqueOps: design

Data: 2026-10-16

## Intenção e motivo

O pai do desenvolvedor é motorista de reboque autônomo (empresa "YAN-CAR REBOQUE", uma pessoa só). Hoje ele anota ligações no caderno e mensagens ficam no WhatsApp. O desenvolvedor edita à mão, no Canva, os recibos que alguns clientes exigem, com dados que o pai manda. O fiado de clientes antigos depende de memória e anotação solta. Não existe visão de quanto entrou no mês nem de quem deve.

O app existe para tirar esse trabalho manual e dar ao pai uma visão simples do negócio. O projeto também é de estudo do desenvolvedor (mobile, web, backend). Metas de estudo estão marcadas como tal.

## Quem usa e como

- **Pai (usuário principal):** usa no celular, sozinho. Muitas vezes está na rua com as mãos ocupadas, então o app **não entra no fluxo da ligação**. O caderno continua existindo. O app é usado no **fechamento do dia, à noite**, passando os serviços do dia do caderno para o app, um por um. Tem Android ou iPhone: **não confirmado**.
- **Mãe:** usa a versão web para ver e também registrar serviços, porque o iOS dela impede o app sem pagar a App Store. Pai e mãe fecham as contas juntos à noite, e **só um preenche por vez** (suposição de uso, não imposta pelo app).
- **Desenvolvedor:** constrói e mantém.

## Metas

1. Registrar cada serviço de forma rápida, poucos toques, letra grande.
2. Gerar o recibo em PDF igual ao modelo atual (`recibo.pdf` na raiz) e enviar por WhatsApp.
3. Controlar fiado: quem deve, quanto, e dar baixa quando pagar.
4. Resumo do mês respondendo **exatamente três perguntas** (abaixo).
5. Funcionar sem internet no celular do pai e sincronizar depois.

## Não metas (versão 1)

- Despesas (combustível, manutenção do reboque). Fica para a versão 2, decisão do desenvolvedor.
- Despacho de chamadas, mapa em tempo real, rastreio, app para clientes.
- Múltiplas empresas ou vários motoristas.
- Cálculo automático de preço. O preço é combinado por conversa e só registrado.

## Anti-metas (seria fracasso mesmo que funcione)

- O app deixar o registro mais lento que o caderno a ponto de o pai parar de usar.
- Números do resumo errados ou que mudam sem explicação (ex.: fiado contado duas vezes).
- Dados perdidos ao trocar de celular ou reinstalar.

## Regras do produto

### Serviço

Campos: cliente (nome, telefone, endereço), placa, valor (em centavos), forma de pagamento, data do serviço, data do pagamento, observações opcionais (origem, destino).

Origem e destino são opcionais. Nenhum campo além de telefone, placa, valor e forma de pagamento deve ser obrigatório.

### Pagamento

- Formas: Pix, dinheiro, débito, crédito e fiado.
- Qualquer forma que **não seja fiado** nasce **paga**, com data de pagamento igual à data do serviço.
- **Fiado** nasce **em aberto**, sem data de pagamento.
- Ao marcar um fiado como pago, o app **pergunta como o cliente pagou** (Pix, dinheiro, débito ou crédito). A forma do serviço passa de fiado para a escolhida, e a data de pagamento é registrada.

### Cliente recorrente

Ao digitar o telefone de um cliente já cadastrado, o app preenche nome e endereço. Cliente novo é digitado uma vez.

### Recibo

Modelo de referência: `recibo.pdf`.

- Cabeçalho fixo: nome da empresa e telefone.
- Bloco de cima (cliente): recebi de, endereço, valor, **valor por extenso**, referente a (frase gerada: "Reboque de um veículo placa X"), data.
- Bloco de baixo (emitente): nome, CPF/RG e assinatura do pai, **sempre iguais**, preenchidos automaticamente.
- Saída: PDF compartilhável por WhatsApp.
- O app deve poder gerar o recibo de um serviço já salvo (por exemplo, de um fiado depois que for pago).

### Resumo do mês

Responde três perguntas e nada além:

1. **Quanto ganhei no mês.** Conta pelo **mês da data de pagamento** (quando o dinheiro entrou), não pelo mês do serviço. Fiado só conta quando pago.
2. **Quem está me devendo.** Lista de fiados em aberto, com cliente, data, placa, valor e botão "marcar como pago".
3. **Forma de pagamento mais usada.** Contagem por forma. "Fiado" aparece contando só os que ainda estão em aberto. Quando um fiado é pago, ele sai de fiado e entra na forma escolhida.

## Arquitetura

Decidida pelo desenvolvedor, com as justificativas dele:

- **Mobile:** Expo com SQLite local. Drizzle em vez de SQL puro (o desenvolvedor quer testar).
- **Web:** React. Existe porque a mãe usa iOS e o desenvolvedor não quer pagar a App Store.
- **Backend:** Node com TypeScript. Motivos: o problema é pequeno e não precisa da estrutura do Java, e o desenvolvedor domina TypeScript.
- **Login e senha:** objetivo de estudo do desenvolvedor, não necessidade do pai.
- **Offline-first:** o celular grava primeiro no SQLite. Sem internet, o serviço fica pendente e é enviado ao backend quando a conexão volta.
- **O backend é a fonte dos dados**, não só backup: a web lê e grava nele, e o celular busca nele o que a mãe registrou. O SQLite do celular é uma cópia local.
- **IDs dos serviços são UUID** gerados no cliente, para que celular e web criem registros sem colidir. A ordem de exibição vem de um campo de data, não do ID.

Estrutura do repositório: monorepo.

## O que fica para quem for construir

Itens abaixo são escolhas do construtor, não decididas pelo desenvolvedor. Devem ser declaradas como tal:

- Banco do backend (a definir) e biblioteca de acesso.
- Estratégia de sincronização (como detectar o que está pendente, o que acontece em conflito raro).
- Biblioteca de geração de PDF e de valor por extenso.
- Estrutura de pastas do monorepo e compartilhamento de tipos entre apps.
- Design visual (cores): o desenvolvedor quer cores diferentes dos mockups.

## Suposições a confirmar

- Só uma pessoa edita por vez (hábito do casal, não imposto pelo app).
- Fuso: America/Fortaleza. Datas guardadas em UTC. (Escolha minha.)
- Dinheiro em centavos (inteiro). (Escolha minha.)
- O CPF/RG e nome do emitente são fixos e ficam em configuração.
- O pai usa Android (confirmado pelo desenvolvedor). O app Expo é dele; a web é da mãe.
- Pai e mãe entram em **contas separadas** (objetivo de estudo de cadastro de login), com opção de continuar logado e salvar senha para facilitar o uso. Como as duas contas compartilham os mesmos dados do negócio: **em aberto**.

## Perguntas em aberto

- Nenhuma no momento sobre identificação de usuário (resolvida abaixo).

## Decisão: identificação do usuário

Decidida pelo desenvolvedor, depois de descartar o id do usuário ou do tenant enviados pelo cliente (o cliente pode alterá-los): após o login o backend devolve um **token JWT assinado** com uma chave secreta só do backend. Em cada pedido o backend valida a assinatura, descobre o usuário e busca o tenant dele no banco. O tenant nunca vem do cliente. O cookie ou o local storage definem apenas como o token fica guardado, não se ele pode ser falsificado: isso é a assinatura. Requisito de uso: opção de continuar logado (como o token expira e é renovado fica para o construtor, a declarar como escolha dele).

## Decisão: tenant (contas separadas, mesmos dados)

Decidida pelo desenvolvedor: existe uma tabela de **tenant** (o negócio do pai). A tabela de usuário aponta para um tenant. O primeiro usuário cadastrado cria o tenant e pode adicionar outros usuários. Todas as tabelas de dados (serviços, clientes) carregam o id do tenant. O backend **nunca aceita o tenant vindo do cliente**: ele o descobre no banco a partir do usuário autenticado. Isso fecha a contradição com "multiusuário fora de escopo" do `CLAUDE.md`: o escopo é um negócio com dois usuários, não várias empresas, mas o desenho já suporta mais.
