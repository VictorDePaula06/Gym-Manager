import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Award, ShieldCheck, Printer } from 'lucide-react';

const TermsCertificate = () => {
    const { tenantId } = useParams();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const docRef = doc(db, 'tenants', tenantId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTenant(docSnap.data());
                } else {
                    alert("Dados não encontrados");
                }
            } catch (error) {
                console.error("Error fetching certificate data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTenant();
    }, [tenantId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={40} color="#0f172a" />
            </div>
        );
    }

    if (!tenant) return <div>Certificado não encontrado.</div>;

    const acceptedDate = tenant.termsAcceptedAt
        ? (tenant.termsAcceptedAt.toDate ? tenant.termsAcceptedAt.toDate() : new Date(tenant.termsAcceptedAt))
        : null;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f1f5f9',
            padding: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Times New Roman', serif",
            color: '#1e293b'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '800px',
                padding: '4rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '10px double #cbd5e1',
                position: 'relative'
            }}>

                {/* Decoration Border */}
                <div style={{
                    position: 'absolute',
                    top: '10px', left: '10px', right: '10px', bottom: '10px',
                    border: '1px solid #e2e8f0',
                    pointerEvents: 'none'
                }}></div>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <ShieldCheck size={64} color="#0f172a" style={{ display: 'block', margin: '0 auto 1rem' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                        Certificado de Adesão
                    </h1>
                    <p style={{ fontSize: '1rem', color: '#64748b', fontStyle: 'italic' }}>
                        Vector GymHub - Termos de Uso e Política de Privacidade
                    </p>
                </div>

                {/* Body */}
                <div style={{ fontSize: '1.2rem', lineHeight: '2', textAlign: 'justify', marginBottom: '3rem' }}>
                    <p>
                        Certificamos para os devidos fins jurídicos que <strong>{tenant.ownerName || 'USUÁRIO DO SISTEMA'}</strong>,
                        portador do documento <strong>{tenant.documentNumber || 'N/A'}</strong> ({tenant.personType === 'pj' ? 'CNPJ' : 'CPF'}),
                        inscrito sob o email <strong>{tenant.email}</strong>, operando a unidade de negócio denominada <strong>{tenant.gymName}</strong>,
                        realizou o aceite digital irrevogável dos Termos de Uso e Políticas de Privacidade da plataforma Vector GymHub.
                    </p>
                    <p style={{ marginTop: '1.5rem' }}>
                        O aceite foi registrado em nossos sistemas seguros na data de:
                    </p>
                </div>

                {/* Highlighted Date */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        display: 'inline-block',
                        borderBottom: '2px solid #0f172a',
                        padding: '0.5rem 2rem',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                    }}>
                        {acceptedDate ? acceptedDate.toLocaleString('pt-BR') : 'DATA NÃO REGISTRADA'}
                    </div>
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', marginTop: '4rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <div>
                        <strong>Hash do Usuário (ID):</strong><br />
                        <span style={{ fontFamily: 'monospace' }}>{tenantId}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <strong>Versão do Termo:</strong><br />
                        {tenant.termsVersion || '1.0'}
                    </div>
                </div>

                {/* Watermark */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                    fontSize: '8rem',
                    color: 'rgba(0,0,0,0.03)',
                    pointerEvents: 'none',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                }}>
                    DIGITALMENTE ASSINADO
                </div>

                {/* Print Button (Hidden on Print) */}
                <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px' }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#0f172a', color: 'white',
                            border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        <Printer size={20} /> Imprimir
                    </button>
                    <style>{`
                        @media print {
                            .no-print { display: none !important; }
                            body { background-color: white; margin: 0; }
                            @page { margin: 0; size: auto; }
                        }
                    `}</style>
                </div>

            </div>
        </div>
    );
};

export default TermsCertificate;
