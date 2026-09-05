# Cantinho das Contas

Sistema de controle de gastos pessoais com tema Moranguinho, feito em
Next.js e pronto para publicar na Vercel com um banco Postgres de verdade
(os dados ficam salvos entre sessões e acessíveis de qualquer aparelho).

## Colocar no ar (Vercel)

1. Acesse [vercel.com](https://vercel.com), entre com sua conta e clique em
   **Add New → Project**.
2. Selecione este repositório (`Nariga33/Thauany`) e importe — a Vercel
   detecta automaticamente que é um projeto Next.js.
3. Antes de finalizar (ou depois, na aba **Storage** do projeto), clique em
   **Create Database → Postgres** (Neon) e conecte ao projeto. Isso cria
   automaticamente a variável de ambiente `DATABASE_URL` que o site precisa.
4. Clique em **Deploy**. Em ~1 minuto o site estará no ar com um link
   `https://seu-projeto.vercel.app`.

As tabelas do banco (`lancamentos` e `orcamentos`) são criadas
automaticamente no primeiro acesso ao site — não precisa rodar nenhum
comando de migração manualmente. Alguns lançamentos de exemplo e um
orçamento padrão de R$ 300 por categoria também são criados na primeira
vez, só para o painel não abrir vazio.

## Adicionar suas próprias imagens

Por direitos autorais, este projeto não inclui ilustrações oficiais de
personagens de terceiros. Se você quiser usar imagens que já possui,
coloque os arquivos em `public/imagens/` (veja o `LEIA-ME.md` daquela
pasta) e referencie-os no código, por exemplo:

```tsx
<img src="/imagens/seu-arquivo.png" alt="" />
```

## Rodar localmente

```bash
npm install
vercel env pull .env.local   # baixa a DATABASE_URL do projeto na Vercel
npm run dev
```

Abra http://localhost:3000.

## Estrutura

- `app/page.tsx` — carrega os dados do banco (Server Component).
- `app/Dashboard.tsx` — a interface interativa (cliente): formulário de
  lançamento, extrato do mês, orçamento por categoria.
- `app/actions.ts` — Server Actions que validam e gravam no banco.
- `lib/db.ts` — acesso ao Postgres via Neon (`@neondatabase/serverless`),
  incluindo a criação automática das tabelas.
- `lib/categories.ts` — categorias de receita/despesa e formas de
  pagamento usadas em todo o app.

## Outros arquivos deste repositório

- `Controle_de_Gastos_Moranguinho.xlsx` — versão em planilha do mesmo
  controle de gastos.
- `cantinho-das-contas.html` — versão em Artifact (protótipo inicial),
  independente deste sistema Next.js.
