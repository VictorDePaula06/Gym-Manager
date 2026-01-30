# 🛡️ Manual do Super Admin (Gestor do Sistema)

Este documento é para VOCÊ, o dono do software (SaaS). Aqui está tudo o que você precisa saber para gerenciar as academias e o sistema.

---

## 1. Acesso ao Painel Admin
- **URL**: `/admin` (ex: `https://seu-sistema.com/admin`)
- **Login**: Seu e-mail de Super Admin (`j.17jvictor@gmail.com`).
- **Segurança**: Apenas o seu e-mail tem acesso a essa tela. Outros usuários serão redirecionados.

---

## 2. Gerenciando Academias (Clientes)

### ➕ Criar Nova Academia
1. Clique no botão verde **Nova Academia**.
2. Preencha:
   - **Nome da Academia**: O nome que aparecerá no painel deles.
   - **E-mail de Login**: O e-mail que o dono da academia usará para entrar.
   - **Senha Inicial**: Crie uma senha provisória (ex: `mudar123`).
   - **Plano Inicial**:
     - **Trial (7 Dias)**: Para testes. Expira automaticamente.
     - **Já é PRO**: Para quem já pagou adiantado.
3. **Importante**: O sistema cria automaticamente o acesso. Não precisa configurar nada no Firebase manualmente.
4. **Primeiro Acesso**: Quando o cliente entrar pela primeira vez, ele será **obrigado a trocar a senha**.

### 🔍 Listagem e Status
Na lista de academias, você vê o status de cada uma:
- **PRO (Ativo)**: Cliente pagante. Acesso total liberado.
- **TRIAL**: Cliente em período de teste.
- **BLOQUEADO**: Cliente inadimplente ou cancelado.

### ⚙️ Ações Rápidas
Ao lado de cada academia, você tem botões de controle:
- **Ativar PRO**: Libera o acesso total (use quando confirmar o pagamento).
- **Voltar p/ Trial**: Reverte para o modo de teste (útil se o pagamento falhar ou se quiser dar mais uns dias).
- **Bloquear (X)**: Corta o acesso imediatamente. O cliente não consegue ver nada.
- **Excluir (Lixeira)**: Remove a academia da lista e apaga os dados do banco.
  - *Nota*: Isso é um "Soft Delete". O e-mail continua existindo no Google Auth, mas sem dados. Se precisar recriar com o mesmo e-mail, pode dar conflito de "email in use". Nesse caso, o usuário deve ser removido do Firebase Console (Authentication).

---

## 3. Fluxo de Venda Sugerido

1. **Cliente Interessado**: Você cria uma conta **Trial** e passa o login/senha para ele.
2. **Teste**: Ele usa por 7 dias. Ao final, o sistema bloqueia automaticamente (lógica de trial expirado).
3. **Pagamento**: O cliente te paga (Pix, Boleto, etc - por fora do sistema por enquanto).
4. **Ativação**: Você entra no `/admin`, busca o cliente e clica em **Ativar PRO**.
5. **Recorrência**: Se ele não pagar no mês seguinte, você clica em **Bloquear** ou **Voltar p/ Trial**.

---

## 4. Dúvidas Técnicas Comuns

- **"O cliente esqueceu a senha"**:
  - Ele pode clicar em "Esqueci minha senha" na tela de login (o Firebase manda e-mail).
  - Ou você pode deletar a conta dele e criar outra (perde os dados).

- **"Criei uma conta errada"**:
  - Use o botão de Lixeira para apagar.

- **"O cliente disse que pagou mas tá bloqueado"**:
  - Verifique se você clicou em **Ativar PRO**. O sistema não adivinha pagamento manual.

---

## 5. Manutenção do Sistema

- **Firebase**: O banco de dados é o Firestore. Tudo fica salvo em `tenants/{id}` e `users/{id}`.
- **Backups**: O Firebase tem backups automáticos, mas evite mexer no console se não tiver certeza. Use sempre o painel `/admin`.
