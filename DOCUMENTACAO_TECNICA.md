# 🛠️ Documentação Técnica - Vector GymHub

Este documento serve como a **BÍBLIA DO DESENVOLVEDOR** para o projeto. Aqui estão os detalhes de funcionamento, lógica de negócio e estrutura do código.

---

## 🏗️ Arquitetura & Stack

*   **Frontend**: React (Vite)
*   **Backend/Database**: Firebase (Firestore, Auth, Storage)
*   **Pagamentos**: Stripe (Links de Pagamento + Webhooks futuros)
*   **Estilização**: CSS Modules / Inline Styles "Glassmorphism"
*   **Hospedagem**: Vercel (Frontend)

---

## 🔐 Autenticação & Permissões (`AuthContext.jsx`)

O sistema de login é o coração da segurança. Ele decide quem é quem.

### Tipos de Usuário (Roles)
1.  **Owner (Dono)**:
    *   Cria a conta pela tela de Registro.
    *   Possui um `tenantId` (ID da academia) que é igual ao seu `uid`.
    *   Tem acesso total.
2.  **Staff/Admin (Equipe)**:
    *   Entra via convite do Dono.
    *   Possui um registro na coleção `staff_access`.
    *   O `tenantId` deles aponta para o ID do Dono.
    *   Se `role === 'admin'`, tem acesso total. Se `role === 'staff'`, acesso restrito.
3.  **Super Admin (Você)**:
    *   Hardcoded no código (`j.17jvictor@gmail.com`).
    *   Bypass em todas as restrições de equipe.
    *   Acesso ao painel `/admin` para gestão global.

### ⚠️ Regras Críticas de Login
*   **Priority Check**: O sistema verifica primeiro se o usuário é `Super Admin`.
*   **Self-Referential Fix**: Se um Dono acidentalmente se convidar para sua própria equipe, o sistema ignora o registro de equipe para não rebaixá-lo (bug corrigido em Jan/2026).
*   **Corrigir Conta**: Existe uma função em `Settings.jsx` que deleta registros de `staff_access` órfãos para forçar o reset da conta para Owner.

---

## 💰 Lógica de Assinatura & SaaS

O controle de acesso financeiro é feito em 3 camadas no `AuthContext`:

### 1. Status Vitalício (`lifetimeAccess`)
*   **Onde fica**: Campo booleano no documento `tenants/{id}`.
*   **Efeito**: Se `true`, ignora **TUDO** (Stripe, datas, atrasos). O acesso é liberado para sempre.
*   **Como ativar**: Via painel Super Admin (botão Estrela).

### 2. Status Pagamento (`subscriptionStatus`)
Valores possíveis vindos do Stripe/Firebase:
*   `active`: Acesso liberado.
*   `trialing`: Acesso liberado (7 dias iniciais).
*   `past_due`: Pagamento falhou ou atrasou. Entra em **Grace Period**.
*   `canceled` / `unpaid`: Acesso bloqueado -> Redireciona para `/payment-required`.

### 3. Período de Carência (Grace Period)
*   **Lógica**: Se `status === 'past_due'`, calculamos `current_period_end + 5 dias`.
*   **Banner**: Um aviso vermelho aparece (`Layout.jsx`) alertando sobre o bloqueio iminente.
*   **Bloqueio**: Após o 5º dia, o acesso cai.

### 4. Link de Pagamento Inteligente (Stripe)
*   **Problema**: Links estáticos não identificam quem pagou.
*   **Solução**: No componente `Subscription.jsx`, anexamos dinamicamente os parâmetros do usuário URL do Stripe.
    *   `client_reference_id`: O UID do usuário (ex: `w2au4...`).
    *   `prefilled_email`: O email do usuário para facilitar o checkout.
*   **Resultado**: O Stripe recebe esse ID e o devolve no Webhook, permitindo que o backend saiba exatamente qual documento em `tenants` atualizar para `active`.

---

## 🗄️ Estrutura do Banco de Dados (Firestore)

### Coleções Principais
*   `tenants/` (Academias)
    *   ID = UID do Dono.
    *   Contém: `gymName`, `subscriptionStatus`, `lifetimeAccess`, `active`.
*   `users/{gymId}/students` (Alunos da Academia)
    *   Subcoleção isolada para cada academia. Ninguém vê dados de outra academia.
*   `staff_access/` (Permissões de Equipe)
    *   Chave = Email do funcionário (sanitizado).
    *   Aponta para qual `gymOwnerId` ele pertence.

---

## 🤖 Funcionalidades "Mágicas" (IA & Automação)
*   **Geração de Treino (`Gemini AI`)**:
    *   Arquivo: `src/utils/gemini.js`
    *   Recebe perfil do aluno (idade, objetivo, dias).
    *   Retorna JSON estruturado com treino ABC.
    *   *Nota*: Prompt ajustado para dar ênfase em inferiores para mulheres.
*   **Simuladores (Dev Tools)**:
    *   Em `SuperAdmin.jsx` você pode avançar o tempo e simular pagamentos para testar o bloqueio sem esperar 30 dias.

---

## 🚨 Troubleshooting Comum

1.  **"Estou aparecendo como Equipe mas sou Dono"**
    *   **Solução**: Vá em Configurações > Manutenção > "Corrigir Conta".
2.  **"Paguei mas não liberou"** (Modo Manual At atual)
    *   **Solução**: Vá no Super Admin, ache a academia e clique em "Ativar PRO".
3.  **"Erro de Permissão no Firestore"**
    *   Verifique se o `tenantId` no `AuthContext` está sendo carregado corretamente antes das chamadas ao banco.
