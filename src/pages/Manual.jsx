import { useState } from 'react';
import {
    BookOpen, CheckCircle2, KeyRound, Users, ShieldCheck, DollarSign, Dumbbell,
    TrendingUp, ClipboardList, MessageCircle, Settings as SettingsIcon,
    LogIn, LayoutDashboard, Trophy, Activity, CreditCard, AlertTriangle, Info,
} from 'lucide-react';

// Cartão de seção padrão: título com ícone + conteúdo (mesma linguagem visual
// usada em Settings.jsx e nas demais telas do app).
function Card({ icon: Icon, title, children }) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.05rem' }}>
                <Icon size={19} color="var(--primary)" style={{ flexShrink: 0 }} />
                {title}
            </h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {children}
            </div>
        </div>
    );
}

function Callout({ tone = 'tip', children }) {
    const colors = {
        tip: { border: 'var(--primary)', bg: 'rgba(16,185,129,0.08)', color: 'var(--primary)' },
        warn: { border: '#eab308', bg: 'rgba(234,179,8,0.08)', color: '#eab308' },
        danger: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
    }[tone];
    const Icon = tone === 'danger' ? AlertTriangle : tone === 'warn' ? AlertTriangle : Info;
    return (
        <div style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem 0.9rem', borderRadius: '10px', borderLeft: `3px solid ${colors.border}`, background: colors.bg, margin: '0.85rem 0', fontSize: '0.87rem', color: 'var(--text-main)' }}>
            <Icon size={16} color={colors.color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{children}</span>
        </div>
    );
}

function Steps({ items }) {
    return (
        <ol style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0' }}>
            {items.map((it, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.7rem' }}>
                    <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span>{it}</span>
                </li>
            ))}
        </ol>
    );
}

function List({ items }) {
    return (
        <ul style={{ margin: '0.6rem 0', paddingLeft: '1.2rem' }}>
            {items.map((it, i) => <li key={i} style={{ marginBottom: '0.45rem' }}>{it}</li>)}
        </ul>
    );
}

const Pill = ({ tone, children }) => {
    const map = { green: ['rgba(16,185,129,0.15)', 'var(--primary)'], amber: ['rgba(234,179,8,0.15)', '#eab308'], red: ['rgba(239,68,68,0.15)', '#ef4444'] };
    const [bg, color] = map[tone];
    return <span style={{ background: bg, color, padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>{children}</span>;
};

export default function Manual() {
    const [tab, setTab] = useState('personal');

    const tabBtn = (key, label, Icon) => (
        <button
            onClick={() => setTab(key)}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem',
                background: tab === key ? 'var(--primary)' : 'var(--card-bg)',
                color: tab === key ? 'white' : 'var(--text-muted)',
                border: `1px solid ${tab === key ? 'var(--primary)' : 'var(--border-glass)'}`,
                borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            }}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="fade-in" style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <BookOpen size={26} color="var(--primary)" />
                <h1 style={{ margin: 0 }}>Manual do sistema</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
                Como usar o Alivia Fitness — para você e para explicar aos seus alunos.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem' }}>
                {tabBtn('personal', 'Para o Personal', Users)}
                {tabBtn('aluno', 'Para o Aluno', Dumbbell)}
            </div>

            {tab === 'personal' && (
                <div>
                    <Card icon={LogIn} title="Primeiros passos">
                        <p>O acesso do personal é sempre pela conta Google — não existe cadastro por e-mail e senha para quem gerencia a academia.</p>
                        <Steps items={[
                            <>Na tela de login, deixe selecionado <strong>Sou Personal</strong>.</>,
                            <>Toque em <strong>Entrar com Google</strong> e escolha a conta que vai usar.</>,
                            <>Sua conta é criada na hora, já com <strong>7 dias de teste grátis</strong> no plano Ouro (tudo liberado, incluindo IA).</>,
                        ]} />
                        <p>Quando o teste termina, <strong>o acesso não é bloqueado</strong> — sua conta cai automaticamente para o plano Bronze e você continua usando o sistema, só sem IA e limitado a 15 alunos até assinar um plano pago.</p>
                    </Card>

                    <Card icon={CreditCard} title="Planos e assinatura">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>Plano</th>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>Alunos</th>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>IA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderTop: '1px solid var(--border-glass)' }}><td style={{ padding: '0.5rem 0.6rem' }}>Bronze</td><td style={{ padding: '0.5rem 0.6rem' }}>15</td><td style={{ padding: '0.5rem 0.6rem' }}>—</td></tr>
                                    <tr style={{ borderTop: '1px solid var(--border-glass)' }}><td style={{ padding: '0.5rem 0.6rem' }}>Prata</td><td style={{ padding: '0.5rem 0.6rem' }}>40</td><td style={{ padding: '0.5rem 0.6rem' }}><Pill tone="green">Incluída</Pill></td></tr>
                                    <tr style={{ borderTop: '1px solid var(--border-glass)' }}><td style={{ padding: '0.5rem 0.6rem' }}>Ouro</td><td style={{ padding: '0.5rem 0.6rem' }}>Ilimitado</td><td style={{ padding: '0.5rem 0.6rem' }}><Pill tone="green">Incluída</Pill></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p>No plano anual, o valor mensal equivalente sai mais barato do que pagar mês a mês. Em <strong>Configurações → Assinatura</strong>, escolha o plano e toque em <strong>Assinar</strong> — isso abre uma conversa no WhatsApp com os dados já preenchidos.</p>
                        <Callout tone="warn">Atingiu o limite de alunos do plano? O cadastro de um novo aluno é bloqueado com aviso, até fazer upgrade.</Callout>
                    </Card>

                    <Card icon={Users} title="Cadastrar alunos">
                        <p>No formulário de cadastro, todo campo marcado com <code>*</code> é obrigatório. CPF, endereço, e-mail e senha ficam de fora — são opcionais.</p>
                        <p>Ao definir o plano, valor e dia de pagamento, o sistema pergunta: <strong>"O aluno já pagou a primeira mensalidade?"</strong></p>
                        <List items={[
                            <><strong>Sim</strong> — registra o pagamento e calcula o próximo vencimento. Aluno entra <Pill tone="green">Em dia</Pill>.</>,
                            <><strong>Não</strong> — aluno entra em <Pill tone="amber">Período de início</Pill> por 5 dias; depois disso, sem pagamento, vira <Pill tone="red">Pendente</Pill> automaticamente.</>,
                        ]} />
                    </Card>

                    <Card icon={KeyRound} title="Acesso do aluno ao portal">
                        <p><strong>Código de acesso (recomendado):</strong> todo aluno ganha um código de 6 caracteres, visível na ficha dele em Visão Geral. É esse código que confirma o vínculo entre o aluno e você.</p>
                        <Steps items={[
                            'Copie o código na ficha do aluno e envie por WhatsApp.',
                            <>O aluno escolhe <strong>Sou Aluno → Entrar com Google</strong> e faz login.</>,
                            'No primeiro acesso, o sistema pede o código — ele digita e a conta fica vinculada. Nas próximas vezes, entra direto.',
                        ]} />
                        <p><strong>E-mail e senha:</strong> para aluno sem Gmail, preencha e-mail e gere uma senha no cadastro — ele entra pela aba Sou Aluno com esses dados.</p>
                        <Callout tone="danger">O código é sempre exigido no primeiro login com Google, mesmo que o e-mail cadastrado seja o Gmail do aluno — isso evita que alguém entre na conta errada por coincidência de e-mail.</Callout>
                    </Card>

                    <Card icon={DollarSign} title="Financeiro">
                        <List items={[
                            <><Pill tone="green">Em dia</Pill> — pagamento registrado, dentro do ciclo.</>,
                            <><Pill tone="amber">Período de início</Pill> — aluno novo, sem pagamento ainda (5 dias de prazo).</>,
                            <><Pill tone="red">Pendente</Pill> — passou do vencimento (ou dos 5 dias) sem pagar.</>,
                        ]} />
                        <p>Registre um pagamento na ficha do aluno, aba Financeiro, botão <strong>Registrar Pagamento</strong>. O próximo vencimento é recalculado sozinho.</p>
                        <Callout tone="tip">Aluno pendente tem o app bloqueado automaticamente (Treinos, Comunidade e Evolução) até regularizar. Pra liberar mesmo assim, use "Liberar app do aluno" na ficha dele.</Callout>
                    </Card>

                    <Card icon={Dumbbell} title="Treinos e fichas">
                        <p>Monte fichas por divisão (A, B, C…) com séries, repetições e carga. Nos planos <strong>Prata</strong> e <strong>Ouro</strong>, configure sua chave do Google Gemini em Configurações → Inteligência Artificial e gere fichas automaticamente com base no perfil do aluno.</p>
                        <p>Toda ficha pode ser enviada por WhatsApp ou baixada em PDF.</p>
                    </Card>

                    <Card icon={TrendingUp} title="Volume Load">
                        <p>Métrica de progressão: a cada treino concluído, o sistema soma <strong>séries × repetições × carga</strong> de cada exercício com peso registrado.</p>
                        <p>Veja o total da semana, a variação vs. a semana anterior e o gráfico das últimas semanas na ficha do aluno, aba Treinos.</p>
                    </Card>

                    <Card icon={ClipboardList} title="Check-in semanal">
                        <p>Em Configurações → Check-in dos alunos, escolha a cadência (semanalmente ou a cada N treinos) e edite as perguntas — escala, número, texto livre ou múltipla escolha. As respostas aparecem na ficha do aluno, aba Check-ins.</p>
                    </Card>

                    <Card icon={Trophy} title="Comunidade e desafios">
                        <p>Feed onde você e os alunos publicam fotos e comentam. Dois rankings, com propósitos diferentes:</p>
                        <List items={[
                            <><strong>Geral</strong> — todos os alunos, sempre, por treinos concluídos no mês.</>,
                            <><strong>Do desafio</strong> — só quem aceita o convite, contando treinos dentro do período do desafio.</>,
                        ]} />
                        <p>Crie um desafio em Comunidade → Editar desafio (título, regras, prêmio opcional e período).</p>
                    </Card>

                    <Card icon={SettingsIcon} title="Configurações">
                        <List items={[
                            'Nome e logo — aparecem no seu app e no portal do aluno.',
                            'WhatsApp — usado nos botões de contato do sistema.',
                            'Tema — claro ou escuro.',
                            'Inteligência Artificial — sua chave do Gemini (planos Prata e Ouro).',
                        ]} />
                    </Card>
                </div>
            )}

            {tab === 'aluno' && (
                <div>
                    <Card icon={LogIn} title="Como entrar">
                        <p><strong>Com Google (recomendado):</strong></p>
                        <Steps items={[
                            <>Escolha <strong>Sou Aluno → Entrar com Google</strong> e faça login normalmente.</>,
                            <>Na primeira vez, digite o <strong>código de acesso</strong> que seu personal te passou — isso confirma que a conta é sua.</>,
                            'Nos próximos acessos, entra direto, sem código.',
                        ]} />
                        <p><strong>Com e-mail e senha:</strong> se você não tem Google, seu personal te dá um e-mail e senha — use a aba Sou Aluno para entrar com eles.</p>
                    </Card>

                    <Card icon={LayoutDashboard} title="Tela inicial">
                        <List items={[
                            'Check-in da semana — quando disponível, conte pro seu personal como foi a semana.',
                            'Atividade semanal — os dias em que você treinou.',
                            'Treinos e frequência — suas fichas ativas e a frequência recomendada.',
                            'Volume da semana — total de carga movida nos treinos.',
                            'Status da mensalidade — se está em dia, com atalho pro WhatsApp do personal.',
                        ]} />
                    </Card>

                    <Card icon={Activity} title="Fazer o treino">
                        <Steps items={[
                            'Na aba Treinos, escolha a divisão do dia e toque em Iniciar Treino.',
                            'Marque cada série concluída — vídeo, séries, reps e carga sugerida aparecem na tela.',
                            'Entre as séries, um cronômetro de descanso inicia sozinho.',
                            'Ao concluir, já conta no seu Volume Load e no ranking geral, mesmo sem postar nada.',
                        ]} />
                    </Card>

                    <Card icon={Trophy} title="Comunidade">
                        <p>Publique fotos, curta e comente. O <strong>Ranking Geral</strong> conta seus treinos do mês automaticamente. Quando seu personal criar um desafio, você recebe um convite — só entra no <strong>Ranking do desafio</strong> se aceitar.</p>
                    </Card>

                    <Card icon={TrendingUp} title="Evolução">
                        <p>Acompanhe peso, gordura e medidas ao longo do tempo, comparando a primeira e a última avaliação registrada pelo seu personal.</p>
                    </Card>

                    <Card icon={ShieldCheck} title="Mensalidade e acesso">
                        <p>Se sua mensalidade fica pendente, o app bloqueia Treinos, Comunidade e Evolução — a tela Início continua aberta, com um botão pra falar com seu personal no WhatsApp.</p>
                        <Callout tone="tip">Assim que o pagamento é registrado, o acesso volta sozinho.</Callout>
                    </Card>
                </div>
            )}
        </div>
    );
}
