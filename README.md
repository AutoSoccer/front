# AutoSoccer Frontend

Frontend do AutoSoccer em Next.js, integrado a API de mercado, equipe e
batalha assincrona.

## Requisitos

- Node.js 20+
- Yarn 1.x
- Backend local na porta `3333`

## Como iniciar

```bash
yarn install
yarn dev
```

Abra `http://localhost:3000`.

Por padrao, o frontend usa `http://localhost:3333` como API. Para alterar:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Comandos

```bash
yarn dev
yarn build
yarn lint
yarn tsc --noEmit
```

## Fluxo principal

1. O mercado e a equipe sao carregados da API.
2. Comprar e vender atletas atualiza o saldo no backend.
3. O jogador posiciona de 1 a 6 atletas.
4. O botao Jogar envia a formacao para `POST /partida/jogar`.
5. A batalha espelha os snapshots em um campo compartilhado 3x6.
6. Movimentos e posse da bola sao animados pelos eventos retornados pelo backend.
