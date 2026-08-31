import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowLeft, HelpCircle, ShieldCheck, CreditCard } from 'lucide-react';

const ACCENT = '#10b981';

const SECTIONS = [
    {
        id: 'faq',
        icon: HelpCircle,
        title: 'Perguntas frequentes',
        items: [
            { q: 'Preciso instalar algum programa?', a: 'Não! É 100% online (nas nuvens). Você acessa pelo navegador de qualquer computador, tablet ou celular. Se seu aparelho estragar, seus dados continuam salvos.' },
            { q: 'Funciona em iPhone e Android?', a: 'Sim. É otimizado para celular e funciona como um aplicativo. Não precisa baixar da loja — basta acessar pelo navegador e adicionar à tela inicial.' },
            { q: 'Como funciona o teste grátis?', a: 'Todo novo cadastro começa com 15 dias grátis no plano Ouro (tudo liberado). Depois, é só escolher o plano que faz mais sentido pra você — a Inteligência Artificial está incluída em todos os planos.' },
            { q: 'Posso usar com mais de um professor/instrutor?', a: 'Sim, em Configurações → Equipe você cadastra os professores da sua academia/consultoria. Cada um pode ter seu próprio acesso.' },
        ],
    },
    {
        id: 'privacidade',
        icon: ShieldCheck,
        title: 'Privacidade e segurança dos dados',
        items: [
            { q: 'Quais dados são coletados?', a: 'Do responsável pela conta: nome, e-mail e WhatsApp. Dos alunos cadastrados por você: nome, contato, avaliações físicas, fotos de evolução (se enviadas), fichas de treino e dados de pagamento como plano e valor. Nunca coletamos número de cartão de crédito — isso é processado direto pelo Stripe, nosso parceiro de pagamentos, e nunca passa pelos nossos servidores.' },
            { q: 'Onde os dados ficam armazenados?', a: 'Em infraestrutura do Google Cloud / Firebase, com criptografia em trânsito e em repouso, e backups automáticos. Não guardamos nada em planilhas soltas ou papel.' },
            { q: 'Quem tem acesso aos dados dos meus alunos?', a: 'Só você (o responsável pela conta) e os professores que você cadastrar na sua equipe. Cada aluno só enxerga os próprios dados no app dele — nunca os dados de outros alunos.' },
            { q: 'Vocês usam serviços de terceiros?', a: 'Sim, dois: o Stripe para processar pagamentos (com certificação PCI-DSS, o mais alto padrão de segurança para dados de cartão) e, opcionalmente, a API do Google Gemini para gerar treinos com Inteligência Artificial — só se você mesmo configurar sua própria chave em Configurações.' },
            { q: 'Como peço a exclusão dos meus dados (LGPD)?', a: 'Você pode solicitar a exclusão total da sua conta e dos dados associados a qualquer momento, falando com o suporte pelo WhatsApp. Enquanto a conta estiver ativa, os dados ficam disponíveis para você exportar ou consultar quando quiser.' },
        ],
    },
    {
        id: 'faturamento',
        icon: CreditCard,
        title: 'Faturamento, planos e cancelamento',
        items: [
            { q: 'Como funciona a cobrança?', a: 'A cobrança é automática e recorrente (mensal ou anual, conforme o plano escolhido), via cartão de crédito, processada com segurança pelo Stripe. Você recebe o recibo por e-mail a cada cobrança.' },
            { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa e sem fidelidade. O cancelamento é feito direto no app, em Configurações → Assinatura → Gerenciar Assinatura. Seu acesso continua ativo normalmente até o fim do período que você já pagou — não cortamos o acesso na hora do cancelamento.' },
            { q: 'Posso trocar de plano (upgrade ou downgrade)?', a: 'Sim, a qualquer momento, pelo mesmo caminho (Gerenciar Assinatura). No upgrade, cobramos só a diferença proporcional aos dias que faltam no período atual, e o acesso ao plano novo já é liberado na hora. No downgrade, a troca vale a partir do próximo ciclo de cobrança — você continua com os benefícios do plano atual até lá.' },
            { q: 'O que acontece se o pagamento falhar?', a: 'Damos 5 dias de tolerância para você regularizar (trocar o cartão ou aguardar uma nova tentativa automática do Stripe) antes de bloquear o acesso. Assim que o pagamento é confirmado, o acesso volta automaticamente.' },
            { q: 'Tem reembolso?', a: 'Por ser uma assinatura recorrente com cancelamento livre a qualquer momento (sem multa), não fazemos reembolso do período já em uso. Casos excepcionais são avaliados individualmente pelo suporte.' },
        ],
    },
];

export default function HelpCenter() {
    const navigate = useNavigate();
    const [open, setOpen] = useState('faq-0');

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0c', color: 'white' }}>
            <header style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={18} /> Voltar
                </button>
            </header>

            <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Central de Ajuda</h1>
                <p style={{ color: '#9ca3af', marginBottom: '2.5rem' }}>
                    Tudo sobre como funciona o Alivia Fitness: dúvidas gerais, privacidade dos dados e regras de cobrança.
                </p>

                {/* Nav rápida */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                    {SECTIONS.map((s) => (
                        <a key={s.id} href={`#${s.id}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 1rem', borderRadius: '99px',
                            border: `1px solid ${ACCENT}44`, color: ACCENT,
                            fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600,
                        }}>
                            <s.icon size={14} /> {s.title}
                        </a>
                    ))}
                </div>

                {SECTIONS.map((section, sIdx) => (
                    <section key={section.id} id={section.id} style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <section.icon size={22} color={ACCENT} /> {section.title}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {section.items.map((item, i) => {
                                const key = `${section.id}-${i}`;
                                const isOpen = open === key;
                                return (
                                    <div key={key} onClick={() => setOpen(isOpen ? null : key)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', overflow: 'hidden' }}>
                                        <div style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: isOpen ? ACCENT : '#e2e8f0', fontSize: '0.95rem' }}>
                                            {item.q}
                                            <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', flexShrink: 0, marginLeft: '1rem' }} />
                                        </div>
                                        {isOpen && (
                                            <div style={{ padding: '0 1.4rem 1.3rem', color: '#9ca3af', lineHeight: 1.6, fontSize: '0.9rem' }}>{item.a}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                    Não achou o que procurava? Fale com a gente pelo WhatsApp direto na tela de Assinatura, dentro do app.
                </p>
            </div>
        </div>
    );
}
