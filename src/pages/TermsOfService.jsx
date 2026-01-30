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
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
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
            backgroundColor: '#0f172a',
            color: 'white'
        }}>
            <div style={{
                maxWidth: '800px',
                width: '100%',
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                border: '1px solid #334155',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '2rem',
                    borderBottom: '1px solid #334155',
                    backgroundColor: '#0f172a'
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield color="#10b981" /> Termos de Uso e Política de Privacidade
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                        Para continuar utilizando o Vector GymHub, você precisa ler e aceitar nossos termos.
                    </p>
                </div>

                {/* Content */}
                <div style={{
                    padding: '2rem',
                    height: '350px',
                    overflowY: 'auto',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    fontSize: '0.95rem',
                    lineHeight: '1.6'
                }}>
                    <h3>1. Aceitação dos Termos</h3>
                    <p>Ao acessar e usar este software, você aceita e concorda em estar vinculado aos termos e disposições deste acordo.</p>
                    <br />
                    <h3>2. Licença de Uso</h3>
                    <p>Concedemos a você uma licença limitada, não exclusiva e intransferível para usar o software para fins de gestão de sua academia ou estúdio.</p>
                    <br />
                    <h3>3. Responsabilidades</h3>
                    <p>Você é responsável por manter a confidencialidade de sua conta e senha. O sistema não se responsabiliza por dados inseridos incorretamente.</p>
                    <br />
                    <h3>4. Pagamentos e Assinaturas</h3>
                    <p>O não pagamento das mensalidades poderá resultar na suspensão temporária do acesso até a regularização.</p>
                    <br />
                    <h3>5. Dados e Privacidade</h3>
                    <p>Respeitamos a LGPD. Seus dados são criptografados e utilizados apenas para o funcionamento da plataforma.</p>
                    <br />
                    <p style={{ fontStyle: 'italic', color: '#64748b' }}>... Texto completo deve ser inserido aqui ...</p>
                    <br />
                    <br />
                </div>

                {/* Data Collection Form */}
                <div style={{ padding: '0 2rem', marginTop: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Name Input for Legacy Users */}
                    {needsName && (
                        <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f59e0b' }}>
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
                                    border: '1px solid #64748b',
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    )}

                    {/* Document Input */}
                    <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>
                            CPF ou CNPJ do Responsável/Empresa
                        </label>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
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
                                border: '1px solid #64748b',
                                backgroundColor: '#1e293b',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Este documento será vinculado ao seu Certificado de Adesão.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '2rem',
                    borderTop: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <button
                        onClick={logout}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Sair / Recusar
                    </button>

                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
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
