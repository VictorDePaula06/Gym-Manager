// Data local de hoje em formato YYYY-MM-DD.
// Evita o bug de fuso do new Date().toISOString(), que converte para UTC e
// "adianta" o dia à noite no horário do Brasil (ex.: 30/06 22h vira 01/07),
// carimbando pagamentos/despesas no mês errado.
export const todayISO = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
};
