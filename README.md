# Mesa & Manjericão

Painel responsivo para restaurante parceiro, feito com React, TypeScript e Vite.

## Executar localmente

1. Instale o Node.js (20.19+ ou 22.12+) e rode `npm install`.
2. Confira o `.env` na raiz: `VITE_API_URL=https://dummyjson.com`.
3. Inicie o projeto com `npm run dev` e abra a URL local indicada pelo Vite.
4. Entre com **emilys** / **emilyspass**.

Após criar ou alterar `.env`, reinicie o servidor de desenvolvimento.

## Funcionalidades

- Login em `/auth/login`, token persistido localmente e validação via `/auth/me`.
- `AuthContext` compartilha sessão e usuário; React Router protege o painel e encaminha visitantes para `/login`.
- Cardápio protegido: listagem, busca, filtro por cozinha, criação, edição e exclusão com confirmação.
- Preço calculado como `R$ 15 + R$ 0,50 × (preparo + cozimento)`.
- Layout adaptado para celular; carregamento, erros com status HTTP e lista vazia.

## Organização

- `src/services/api.ts`: cliente `fetch` para o DummyJSON e erros HTTP com status.
- `src/context/`: Contexto de autenticação e hook `useAuth`.
- `src/components/ProtectedRoute.tsx`: proteção de rotas autenticadas.
- `src/App.tsx`: rotas, telas e componentes do cardápio.

## Checklist de testes antes da entrega

- [x] `npm run dev` abriu a página e o login funcionou no navegador.
- [x] Sair, busca, filtros, novo prato, edição, exclusão e confirmação foram testados.
- [x] Os botões e links funcionais executam suas ações; o atalho Ctrl/⌘ + K foca a busca.
- [x] Em viewport de 375 px, a tela funciona sem rolagem horizontal.
- [x] Sem erros JavaScript no fluxo normal; editar/excluir o prato local provoca o 404 esperado do DummyJSON.
- [x] `npm run build` e `npm run lint` terminaram sem erro.
- [x] ZIP sem `node_modules`; README preenchido com os dois nomes e link do GitHub.

## Nota sobre a API

O DummyJSON simula as mutações: criação, edição e exclusão não são persistidas pelo servidor. O app atualiza o estado da sessão após a resposta. Um prato recém-criado recebe ID 51; editar ou excluir esse item pode retornar 404, que é explicado na tela. Ao recarregar, os pratos voltam aos dados remotos.

## Validação

- `npm run build` — checagem TypeScript e compilação de produção.
- `npm run lint` — análise ESLint.

## GitHub e entrega

- Integrante 1: **Leonardo Dias**.
- Integrante 2: **Vanessa Barbosa**.
- Link do repositório no GitHub: https://github.com/Leonardo-Paulucci/TrabalhoP2-Frontend

O repositório GitHub deve conter commits reais identificados pelos dois integrantes da dupla. O projeto local já foi integrado ao histórico remoto; falta que Vanessa faça um commit próprio no GitHub para registrar a participação dos dois.
