import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const TermsPublic = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--bg-app)',
            color: 'var(--text-main)'
        }}>
            <div className="glass-panel" style={{
                maxWidth: '800px',
                width: '100%',
                padding: 0,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-glass)' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', padding: 0, marginBottom: '1rem' }}
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Shield color="var(--primary)" /> Termos de Uso e Política de Privacidade
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Última atualização: janeiro de 2026.
                    </p>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    <h3 style={{ color: 'var(--text-main)' }}>1. Aceitação dos Termos</h3>
                    <p>Ao criar uma conta e utilizar o Alivia Fitness, você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde com algum ponto, não deve utilizar a plataforma.</p>
                    <br />
                    <h3 style={{ color: 'var(--text-main)' }}>2. Licença de Uso</h3>
                    <p>Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável para usar o software exclusivamente para fins de gestão da sua atividade como personal trainer, academia ou estúdio, de acordo com o plano contratado.</p>
                    <br />
                    <h3 style={{ color: 'var(--text-main)' }}>3. Cadastro e Responsabilidades</h3>
                    <p>Você é responsável por manter a confidencialidade de sua conta e senha, e por todas as atividades realizadas a partir do seu login. O Alivia Fitness não se responsabiliza por dados inseridos incorretamente por você ou por seus alunos, nem por decisões de treino ou saúde tomadas com base nas informações registradas no sistema.</p>
                    <br />
                    <h3 style={{ color: 'var(--text-main)' }}>4. Pagamentos e Assinaturas</h3>
                    <p>O acesso às funcionalidades pagas depende de assinatura ativa, processada através do Stripe. O não pagamento das mensalidades poderá resultar na suspensão temporária do acesso até a regularização. Você pode cancelar sua assinatura a qualquer momento, sem multa, diretamente em Configurações → Assinatura; o acesso permanece ativo até o fim do período já pago.</p>
                    <br />
                    <h3 style={{ color: 'var(--text-main)' }}>5. Dados e Privacidade</h3>
                    <p>Respeitamos a Lei Geral de Proteção de Dados (LGPD). Os dados inseridos por você e por seus alunos (informações de cadastro, treinos, avaliações físicas e financeiro) são armazenados de forma criptografada e utilizados apenas para o funcionamento da plataforma, nunca compartilhados com terceiros para fins comerciais. Você pode solicitar a exportação ou exclusão dos seus dados a qualquer momento entrando em contato com o suporte.</p>
                    <br />
                    <h3 style={{ color: 'var(--text-main)' }}>6. Disponibilidade e Alterações</h3>
                    <p>Fazemos o possível para manter o serviço disponível ininterruptamente, mas não garantimos ausência total de falhas. Estes termos podem ser atualizados periodicamente; mudanças relevantes serão comunicadas dentro do app.</p>
                </div>
            </div>
        </div>
    );
};

export default TermsPublic;
