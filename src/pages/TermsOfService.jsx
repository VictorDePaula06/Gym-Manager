import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Shield, ArrowRight, Loader2, Star } from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const TermsOfService = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [accepting, setAccepting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [needsName, setNeedsName] = useState(false);
    const [personType, setPersonType] = useState('pf'); // 'pf' or 'pj'
    const [documentNumber, setDocumentNumber] = useState('');

    useEffect(() => {
        const checkStatus = async () => {
            if (user) {
                const tenantRef = doc(db, 'tenants', user.tenantId);
                const docSnap = await getDoc(tenantRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.termsAccepted) {
                        navigate('/app');
                        return;
                    }
                    // Check if ownerName is missing or placeholder
                    if (!data.ownerName || data.ownerName === 'USUÁRIO DO SISTEMA') {
                        setNeedsName(true);
                        if (user.displayName) setFullName(user.displayName);
                    } else {
                        setFullName(data.ownerName);
                    }
                }
            }
            setLoading(false);
        };
        checkStatus();
    }, [user, navigate]);

    const formatDocument = (value) => {
        const v = value.replace(/\D/g, ''); // Remove non-digits
        if (personType === 'pf') { // CPF: 000.000.000-00
            return v
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else { // CNPJ: 00.000.000/0000-00
            return v
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
    };

    const handleDocumentChange = (e) => {
        setDocumentNumber(formatDocument(e.target.value));
    };

    const handleAccept = async () => {
        if (!user) return;

        if (needsName && fullName.trim().length < 3) {
            alert("Por favor, digite seu nome completo para constar no certificado.");
            return;
        }

        const cleanDoc = documentNumber.replace(/\D/g, '');
        if (personType === 'pf' && cleanDoc.length !== 11) {
            alert("Por favor, insira um CPF válido.");
            return;
        }
        if (personType === 'pj' && cleanDoc.length !== 14) {
            alert("Por favor, insira um CNPJ válido.");
            return;
        }

        setAccepting(true);
        try {
            const tenantRef = doc(db, 'tenants', user.tenantId);

            const updates = {
                termsAccepted: true,
                termsAcceptedAt: Timestamp.now(),
                termsVersion: '1.0 - Jan 2026',
                personType,
                documentNumber: cleanDoc
            };

            if (needsName) {
                updates.ownerName = fullName;
            }

            await updateDoc(tenantRef, updates);

            // Force reload to update context
            window.location.href = '/app';
        } catch (error) {
            console.error("Error accepting terms:", error);
            alert("Erro ao salvar aceite. Tente novamente.");
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

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
                <div style={{
                    padding: '2rem',
                    borderBottom: '1px solid var(--border-glass)'
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Shield color="var(--primary)" /> Termos de Uso e Política de Privacidade
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Para continuar utilizando o Alivia Fitness, você precisa ler e aceitar nossos termos.
                    </p>
                </div>

                {/* Content */}
                <div style={{
                    padding: '2rem',
                    height: '350px',
                    overflowY: 'auto',
                    color: 'var(--text-muted)',
                    fontSize: '0.95rem',
                    lineHeight: '1.6'
                }}>
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
                    <br />
                </div>

                {/* Data Collection Form */}
                <div style={{ padding: '0 2rem', marginTop: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Name Input for Legacy Users */}
                    {needsName && (
                        <div style={{ background: 'var(--input-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f59e0b' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#f59e0b', fontSize: '1.1rem' }}>
                                <Star size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                                Confirme seu Nome Completo
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-glass)',
                                    background: 'var(--bg-app)',
                                    color: 'var(--text-main)',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    )}

                    {/* Document Input */}
                    <div style={{ background: 'var(--input-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1rem' }}>
                            CPF ou CNPJ do Responsável/Empresa
                        </label>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="radio"
                                    name="personType"
                                    value="pf"
                                    checked={personType === 'pf'}
                                    onChange={() => { setPersonType('pf'); setDocumentNumber(''); }}
                                />
                                Pessoa Física (CPF)
                            </label>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="radio"
                                    name="personType"
                                    value="pj"
                                    checked={personType === 'pj'}
                                    onChange={() => { setPersonType('pj'); setDocumentNumber(''); }}
                                />
                                Pessoa Jurídica (CNPJ)
                            </label>
                        </div>

                        <input
                            type="text"
                            value={documentNumber}
                            onChange={handleDocumentChange}
                            placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                            maxLength={personType === 'pf' ? 14 : 18}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-glass)',
                                background: 'var(--bg-app)',
                                color: 'var(--text-main)',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Este documento será vinculado ao seu Certificado de Adesão.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '2rem',
                    borderTop: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={logout}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Sair / Recusar
                    </button>

                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="btn-primary"
                        style={{
                            padding: '1rem 2rem',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: accepting ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: accepting ? 0.7 : 1
                        }}
                    >
                        {accepting ? 'Salvando...' : 'Li e Aceito os Termos'} <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
