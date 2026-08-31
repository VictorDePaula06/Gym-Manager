# Integração de Pagamento — Stripe

## Visão geral

O app é uma SPA (Vite/React) sem backend próprio. Para lidar com o Stripe (que exige uma
secret key nunca exposta no navegador), usamos **Firebase Cloud Functions** (Gen 2) como
a única camada de backend do projeto.

Projeto Firebase: `gymmanager-4c352`
Região das functions: `us-central1`

## Arquitetura

```
Cliente (navegador)
  → chama createCheckoutSession / createPortalSession (Cloud Functions, httpsCallable)
  → é redirecionado para o Stripe (Checkout ou Customer Portal)

Stripe
  → processa pagamento / mudança de plano
  → dispara evento para o webhook (stripeWebhook, Cloud Function HTTP)

stripeWebhook
  → valida a assinatura do evento
  → grava o resultado em tenants/{tenantId} no Firestore
```

Arquivo principal do backend: [`functions/index.js`](../functions/index.js)

## Functions publicadas

| Function | Tipo | O que faz |
|---|---|---|
| `createCheckoutSession` | Callable | Cria/reaproveita o Customer no Stripe e retorna a URL do Checkout de uma assinatura nova |
| `createPortalSession` | Callable | Retorna a URL do Customer Portal do Stripe (trocar cartão, cancelar, trocar de plano) |
| `stripeWebhook` | HTTP | `https://us-central1-gymmanager-4c352.cloudfunctions.net/stripeWebhook` — recebe eventos do Stripe |

Eventos do webhook tratados: `checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`.

## Mapeamento de planos (Price IDs)

Vive em duas cópias que **precisam ficar sincronizadas manualmente** se algum preço mudar
no Stripe: `PRICE_TIER_MAP` em `functions/index.js` (backend) e `STRIPE_PRICE_IDS` em
`src/utils/stripe.js` (frontend, usado só para montar o botão de assinar).

| Plano | Mensal | Anual |
|---|---|---|
| Bronze | `price_1UAHGXLOoGy5dacxvh5TrcZY` | `price_1UAHJ1LOoGy5dacxDBNyToyb` |
| Prata | `price_1UAHKdLOoGy5dacxbBMQXXLh` | `price_1UAHL4LOoGy5dacxupSkrmTj` |
| Ouro | `price_1UAHLyLOoGy5dacx3RsUj17N` | `price_1UAHN1LOoGy5dacxgyLoxMqG` |

Esses são os Price IDs de **produção** (modo live). Se algum plano for repriced no Stripe,
o Price ID muda — é preciso atualizar os dois arquivos e fazer redeploy.

## Segredos (nunca ficam no código nem no chat)

Guardados no Google Secret Manager via Firebase Functions Secrets:

- `STRIPE_SECRET_KEY` — a `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` — o `whsec_...` gerado ao criar o endpoint de webhook no Stripe

Para trocar algum dos dois (ex: se precisar revogar e gerar uma chave nova no Stripe):

```bash
cd gym-manager
npx firebase functions:secrets:set STRIPE_SECRET_KEY
```

Cola o valor quando pedir (o campo fica escondido — cuidado para não colar duas vezes
antes do Enter, isso concatena o valor errado). Depois disso, é preciso rodar o deploy de
novo para a function passar a usar a versão nova do segredo:

```bash
npx firebase deploy --only functions
```

## Deploy

```bash
cd gym-manager
npx firebase deploy --only functions
```

Precisa estar logado (`npx firebase login`) e o projeto Firebase precisa estar no
**plano Blaze** (pago) — é pré-requisito para Cloud Functions fazerem chamadas de rede
saindo (para a API do Stripe).

## Configuração feita no Stripe Dashboard

- **Catálogo de produtos**: 3 produtos (Plano Bronze/Prata/Ouro), cada um com 2 preços
  (mensal e anual) — ver tabela acima
- **Webhook** (Desenvolvedores → Webhooks): endpoint apontando para a URL do
  `stripeWebhook`, escutando `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`
- **Customer Portal** (Configurações → Faturamento → Portal do cliente):
  - Cancelamento de assinatura: habilitado, cancela no fim do período de faturamento
  - Troca de planos: habilitada, com os 6 preços (Bronze/Prata/Ouro × mensal/anual)
    disponíveis para troca
  - Rateio na troca de plano: **"Ratear taxas e créditos"** — upgrade cobra a diferença
    proporcional na hora e libera o plano novo imediatamente; downgrade só troca no fim
    do período atual (sem estorno automático)

## Fluxo do cliente (visão de produto)

1. Cadastro → 15 dias de teste grátis, sem cartão
2. Trial expira sem assinatura → tela de bloqueio ([`TrialExpired.jsx`](../src/pages/TrialExpired.jsx))
   com CTA único para a tela de planos ([`Subscription.jsx`](../src/pages/Subscription.jsx))
3. Assina um plano → Stripe Checkout → webhook libera o acesso automaticamente no Firestore
   (`active`, `subscriptionStatus`, `tier`, `plan`, `current_period_end`)
4. Cobranças recorrentes automáticas pelo Stripe. Se o cartão falhar (`past_due`), o app dá
   5 dias de tolerância antes de bloquear ([`PaymentRequired.jsx`](../src/pages/PaymentRequired.jsx))
5. Em Configurações → Assinatura, o cliente pode:
   - Ver o plano atual e a próxima cobrança
   - "Fazer upgrade" → tela de planos → nova assinatura via Checkout
   - "Gerenciar Assinatura" → abre o Customer Portal do Stripe → trocar cartão, trocar de
     plano (com rateio automático) ou cancelar — tudo sem precisar de mim ou do João

## Campos gravados em `tenants/{tenantId}` pelo webhook

- `active` (bool)
- `subscriptionStatus`: `'active' | 'trialing' | 'past_due' | 'canceled'`
- `tier`: `'bronze' | 'prata' | 'ouro'`
- `plan`: `'monthly' | 'annual'` (ciclo de cobrança — não confundir com `tier`)
- `current_period_end`: Firestore Timestamp
- `stripeCustomerId`, `stripeSubscriptionId`

## Testado em produção

Assinatura real feita e confirmada em 30/08/2026 (plano Bronze mensal) — webhook processou
sem erro, acesso liberado automaticamente no app. Depois cancelada/estornada manualmente no
Dashboard do Stripe por ter sido só um teste.
