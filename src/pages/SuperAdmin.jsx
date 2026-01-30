
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'; // Added setDoc, deleteDoc, Timestamp
import { Shield, Search, CheckCircle, XCircle, RefreshCw, Calendar, Loader2, Plus, X, Trash2, Clock, AlertTriangle, Star, Award } from 'lucide-react'; // Added Trash2, Clock, AlertTriangle, Award
import { createTenantUser } from '../utils/adminAuth';

const SuperAdmin = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newTenant, setNewTenant] = useState({ email: '', password: '', gymName: '', initialStatus: 'trial' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            // Note: In production, this requires an index or specific security rules 
            // to allow listing "tenants". Since user is owner/dev, it should work.
            const querySnapshot = await getDocs(collection(db, "tenants"));
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setTenants(items);
        } catch (error) {
            console.error("Error fetching tenants:", error);
            alert("Erro ao buscar academias. Verifique o console.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (tenantId, newStatus) => {
        let planType = 'monthly';

        if (newStatus === 'active') {
            const type = prompt("Qual o plano do cliente?\n\n1 - Mensal\n2 - Anual");
            if (!type) return;
            planType = type === '2' ? 'annual' : 'monthly';
        }

        if (!confirm(`Tem certeza que deseja alterar para ${newStatus} (${planType === 'annual' ? 'Anual' : 'Mensal'})?`)) return;

        try {
            const tenantRef = doc(db, 'tenants', tenantId);

            const updates = {
                subscriptionStatus: newStatus,
                active: newStatus === 'active' || newStatus === 'trial',
                plan: planType // Saving the plan type
            };

            // If reverting to trial, reset the "Created At" date so the 7-day counter restarts
            // AND clear any existing legacy subscription end date logic
            if (newStatus === 'trial') {
                updates.createdAt = new Date().toISOString();
                updates.current_period_end = null; // Clear payment simulation dates
                updates.plan = 'trial';
            }

            await updateDoc(tenantRef, updates);

            // Optimistic update
            setTenants(prev => prev.map(t =>
                t.id === tenantId ? { ...t, ...updates } : t
            ));

            alert("Status atualizado com sucesso!");
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Erro ao atualizar.");
        }
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            // 1. Create User in Auth
            const user = await createTenantUser(newTenant.email, newTenant.password);

            // 2. Create Tenant Document
            // Note: We use the UID from the created user
            await setDoc(doc(db, "tenants", user.uid), {
                email: newTenant.email,
                gymName: newTenant.gymName,
                active: true,
                subscriptionStatus: newTenant.initialStatus, // Use selected status
                createdAt: new Date().toISOString(),
                requiresPasswordChange: true, // Force password change on first login
                // Add default settings if needed
            });

            const statusLabel = newTenant.initialStatus === 'active' ? 'PRO (Ativo)' : 'TRIAL (7 Dias)';
            alert(`Academia criada com sucesso!\nLogin: ${newTenant.email}\nStatus: ${statusLabel}`);

            setShowModal(false);
            setNewTenant({ email: '', password: '', gymName: '', initialStatus: 'trial' });
            fetchTenants();

        } catch (error) {
            console.error("Error creating tenant:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert(`Erro: O e-mail "${newTenant.email}" já está registrado no sistema de Autenticação (mesmo que não apareça na lista).\n\nSolução: Use outro e-mail ou exclua o usuário manualmente no Firebase Console > Authentication.`);
            } else {
                alert(`Erro ao criar: ${error.message}`);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteTenant = async (tenantId) => {
        if (!confirm("ATENÇÃO: Isso apaga os dados da academia do banco de dados e ela sumirá da lista.\n\nDeseja continuar?")) return;

        try {
            await deleteDoc(doc(db, "tenants", tenantId));
            setTenants(prev => prev.filter(t => t.id !== tenantId));
            alert("Academia removida da lista.");
        } catch (error) {
            console.error("Error deleting tenant:", error);
            alert("Erro ao remover.");
        }
    };

    const handleAddDays = async (tenantId) => {
        const days = prompt("Quantos dias de teste adicionar?");
        if (!days) return;

        try {
            // Logic to extend trial would require changing createdAt or adding a trialExtension field
            // For MVP simplicity, we won't implement complex date math here yet, 
            // but we can just set status to 'trial' to re-enable 7 days if logic allows.
            // Better to just set to 'active' manually if they pay.
            alert("Em breve: Extensão de dias. Por enquanto, ative como PRO.");
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleLifetime = async (tenantId, currentStatus) => {
        if (!confirm(currentStatus ? "Remover acesso vitalício?" : "Conceder ACESSO VITALÍCIO (Ignora pagamentos)?")) return;

        try {
            const tenantRef = doc(db, 'tenants', tenantId);
            await updateDoc(tenantRef, {
                lifetimeAccess: !currentStatus
            });

            // Optimistic update
            setTenants(prev => prev.map(t =>
                t.id === tenantId ? { ...t, lifetimeAccess: !currentStatus } : t
            ));
            alert("Acesso vitalício atualizado!");
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar.");
        }
    };

    const handleSimulateTrialExpiration = async (tenantId) => {
        if (!confirm("Isso expirará imediatamente o período de teste deste usuário. Continuar?")) return;

        try {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 8); // 8 days ago (trial is 7 days)

            const tenantRef = doc(db, 'tenants', tenantId);
            await updateDoc(tenantRef, {
                createdAt: pastDate.toISOString(),
                subscriptionStatus: 'trial', // Ensure it is in trial mode
                active: true
            });

            // Optimistic update
            setTenants(prev => prev.map(t =>
                t.id === tenantId ? {
                    ...t,
                    createdAt: pastDate.toISOString(),
                    subscriptionStatus: 'trial'
                } : t
            ));

            alert("Período de teste expirado com sucesso!");
        } catch (error) {
            console.error("Erro ao expirar teste:", error);
            alert("Erro ao processar: " + error.message);
        }
    };

    const handleSimulatePastDue = async (tenantId) => {
        const input = prompt("SIMULAR ATRASO DE PAGAMENTO:\n\nDigite quantos dias atrás o 'período' venceu.\n\nExemplo:\n2 = Venceu há 2 dias (DENTRO da carência)\n6 = Venceu há 6 dias (FORA da carência)");

        if (!input) return;
        const daysAgo = parseInt(input);
        if (isNaN(daysAgo)) return alert("Número inválido");

        try {
            const now = new Date();
            const pastDate = new Date();
            pastDate.setDate(now.getDate() - daysAgo);

            const oldCreationDate = new Date();
            oldCreationDate.setDate(oldCreationDate.getDate() - 30); // 30 days old account

            const tenantRef = doc(db, 'tenants', tenantId);
            await updateDoc(tenantRef, {
                subscriptionStatus: 'past_due',
                active: true, // Ensure manual block is off so logic can run
                current_period_end: Timestamp.fromDate(pastDate),
                createdAt: oldCreationDate.toISOString() // Expire the trial too
            });

            // Optimistic update
            setTenants(prev => prev.map(t =>
                t.id === tenantId ? {
                    ...t,
                    subscriptionStatus: 'past_due',
                    active: true,
                    // Note: Firestore timestamp won't be exactly mirrored here without more work, 
                    // but status update is key for UI pill
                } : t
            ));

            const result = daysAgo <= 5 ? "ACESSO LIBERADO (Carência)" : "ACESSO BLOQUEADO (Expirou)";
            alert(`Simulação Aplicada!\nVenceu há: ${daysAgo} dias.\nResultado esperado: ${result}`);

        } catch (error) {
            console.error("Erro na simulação:", error);
            alert("Erro ao simular: " + error.message);
        }
    };

    const handleSimulatePayment = async (tenantId) => {
        const type = prompt("Simular qual plano?\n\n1 - Mensal (30 dias)\n2 - Anual (365 dias)");
        if (!type) return;

        const isAnnual = type === '2';
        const days = isAnnual ? 365 : 30;
        const planName = isAnnual ? 'annual' : 'monthly';

        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + days);

            const tenantRef = doc(db, 'tenants', tenantId);
            await updateDoc(tenantRef, {
                subscriptionStatus: 'active',
                active: true,
                plan: planName,
                current_period_end: Timestamp.fromDate(futureDate)
            });

            // Optimistic update
            setTenants(prev => prev.map(t =>
                t.id === tenantId ? {
                    ...t,
                    subscriptionStatus: 'active',
                    active: true,
                    plan: planName,
                    // Note: Timestamp format in optimistic UI might differ slightly but status/plan is key
                } : t
            ));

            alert(`Pagamento ${isAnnual ? 'ANUAL' : 'MENSAL'} simulado com sucesso!`);

        } catch (error) {
            console.error("Erro ao simular pagamento:", error);
            alert("Erro ao processar: " + error.message);
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id?.includes(searchTerm)
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '1rem', color: 'white' }}>
            <style>{`
                .sa-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .sa-title {
                    font-size: 2rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .sa-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .sa-card {
                    background-color: #1e293b;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #334155;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .sa-card-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                
                @media (max-width: 768px) {
                    .sa-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .sa-controls {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .sa-title {
                        font-size: 1.5rem;
                    }
                    .sa-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .sa-card-actions {
                        width: 100%;
                        display: grid;
                        grid-template-columns: 1fr 1fr; /* 2 cols for buttons */
                    }
                    .sa-card-actions button {
                        justify-content: center;
                    }
                }
            `}</style>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="sa-header">
                    <h1 className="sa-title">
                        <Shield color="#10b981" size={28} />
                        Super Admin
                    </h1>
                    <div className="sa-controls">
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{tenants.length} Academias</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={fetchTenants} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#10b981', padding: '0.5rem', borderRadius: '8px' }}>
                                <RefreshCw size={20} />
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Plus size={20} /> <span className="hide-mobile">Nova Academia</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por email ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 48px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <Loader2 className="animate-spin" size={40} color="#10b981" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filteredTenants.map(tenant => (
                            <div key={tenant.id} className="sa-card">
                                <div style={{ flex: 1, minWidth: '300px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{tenant.email}</h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            backgroundColor: tenant.subscriptionStatus === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                            color: tenant.subscriptionStatus === 'active' ? '#10b981' : '#f59e0b',
                                            border: `1px solid ${tenant.subscriptionStatus === 'active' ? '#10b981' : '#f59e0b'}`
                                        }}>
                                            {tenant.subscriptionStatus?.toUpperCase() || 'TRIAL'}
                                        </span>
                                        {tenant.lifetimeAccess && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                                color: '#a78bfa',
                                                border: '1px solid #8b5cf6',
                                                fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <Star size={10} fill="currentColor" /> VITALÍCIO
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                        ID: <span style={{ fontFamily: 'monospace' }}>{tenant.id}</span>
                                    </p>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        Criado em: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>

                                    {/* Terms Acceptance Info */}
                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        {tenant.termsAccepted ? (
                                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle size={14} />
                                                Aceitou Termos em {tenant.termsAcceptedAt?.seconds ? new Date(tenant.termsAcceptedAt.seconds * 1000).toLocaleDateString() : 'data desconhecida'}
                                                <span style={{ color: '#64748b' }}>({tenant.termsVersion || 'v1.0'})</span>
                                            </span>
                                        ) : (
                                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <AlertTriangle size={14} />
                                                Não aceitou termos
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="sa-card-actions">
                                    {tenant.subscriptionStatus !== 'active' && (
                                        <button
                                            onClick={() => handleUpdateStatus(tenant.id, 'active')}
                                            style={{
                                                backgroundColor: '#059669',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontWeight: 'bold'
                                            }}
                                            title="Ativar como Pago"
                                        >
                                            <CheckCircle size={16} /> Ativar PRO
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleSimulatePayment(tenant.id)}
                                        style={{
                                            backgroundColor: '#10b981', // Emerald/Green
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title="Simular Pagamento (30 dias)"
                                    >
                                        <CheckCircle size={16} /> Simular Pag.
                                    </button>

                                    <button
                                        onClick={() => handleSimulatePastDue(tenant.id)}
                                        style={{
                                            backgroundColor: '#d97706', // Amber/Orange
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title="Simular Atraso de Pagamento"
                                    >
                                        <Clock size={16} /> Simular Atraso
                                    </button>

                                    <button
                                        onClick={() => handleSimulateTrialExpiration(tenant.id)}
                                        style={{
                                            backgroundColor: '#ef4444', // Red
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title="Simular Expiração de Teste"
                                    >
                                        <Clock size={16} /> Expirar Trial
                                    </button>

                                    {tenant.termsAccepted && (
                                        <button
                                            onClick={() => window.open(`/admin/certificate/${tenant.id}`, '_blank')}
                                            style={{
                                                backgroundColor: '#f8fafc',
                                                color: '#334155',
                                                border: '1px solid #cbd5e1',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontWeight: '600'
                                            }}
                                            title="Ver Certificado de Adesão"
                                        >
                                            <Award size={16} color="#0f172a" /> Certificado
                                        </button>
                                    )}

                                    {tenant.subscriptionStatus === 'active' && (
                                        <button
                                            onClick={() => handleUpdateStatus(tenant.id, 'trial')}
                                            style={{
                                                backgroundColor: '#334155',
                                                color: '#e2e8f0',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <CheckCircle size={16} /> Voltar p/ Trial
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleToggleLifetime(tenant.id, tenant.lifetimeAccess)}
                                        style={{
                                            backgroundColor: tenant.lifetimeAccess ? '#8b5cf6' : 'transparent', // Violet
                                            color: tenant.lifetimeAccess ? 'white' : '#8b5cf6',
                                            border: '1px solid #8b5cf6',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title="Alternar Vitalício"
                                    >
                                        <Star size={16} fill={tenant.lifetimeAccess ? "white" : "none"} />
                                    </button>

                                    <button
                                        onClick={() => handleUpdateStatus(tenant.id, 'inactive')}
                                        style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid #ef4444',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title="Bloquear Acesso"
                                    >
                                        <XCircle size={16} />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteTenant(tenant.id)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: '#94a3b8',
                                            border: '1px solid #475569',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title="Excluir da Lista"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredTenants.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                Nenhum resultado encontrado.
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Create Tenant Modal */}
            {
                showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 50
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '2rem',
                            borderRadius: '16px',
                            width: '90%', maxWidth: '400px',
                            border: '1px solid #334155',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus color="#10b981" /> Nova Academia
                            </h2>

                            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}>Nome da Academia</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTenant.gymName}
                                        onChange={e => setNewTenant({ ...newTenant, gymName: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}>E-mail de Login</label>
                                    <input
                                        type="email"
                                        required
                                        value={newTenant.email}
                                        onChange={e => setNewTenant({ ...newTenant, email: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}>Senha Inicial</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newTenant.password}
                                        onChange={e => setNewTenant({ ...newTenant, password: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}>Plano Inicial</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: newTenant.initialStatus === 'trial' ? '#fbbf24' : '#94a3b8' }}>
                                            <input
                                                type="radio"
                                                name="status"
                                                value="trial"
                                                checked={newTenant.initialStatus === 'trial'}
                                                onChange={() => setNewTenant({ ...newTenant, initialStatus: 'trial' })}
                                            />
                                            Trial 7 Dias
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: newTenant.initialStatus === 'active' ? '#10b981' : '#94a3b8' }}>
                                            <input
                                                type="radio"
                                                name="status"
                                                value="active"
                                                checked={newTenant.initialStatus === 'active'}
                                                onChange={() => setNewTenant({ ...newTenant, initialStatus: 'active' })}
                                            />
                                            Já é PRO
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    style={{
                                        marginTop: '1rem',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: creating ? 'not-allowed' : 'pointer',
                                        opacity: creating ? 0.7 : 1,
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {creating ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    {creating ? 'Criando...' : 'Criar Academia'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SuperAdmin;
