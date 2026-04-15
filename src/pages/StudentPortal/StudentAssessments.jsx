import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { Activity, Camera, ChevronRight, TrendingUp, Scale, Calendar, X, Download, MessageCircle, Ruler } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../../context/ToastContext';

export default function StudentAssessments() {
    const { user } = useAuth();
    const { settings, students } = useGym();
    const { addToast } = useToast();
    const [assessments, setAssessments] = useState([]);
    const [activeExercise, setActiveExercise] = useState(null); 
    const [activePhoto, setActivePhoto] = useState(null);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [loading, setLoading] = useState(true);

    const studentData = students.find(s => s.id === user?.studentId);
    const gallery = studentData?.photoGallery || [];

    useEffect(() => {
        if (!user?.studentId || !user?.tenantId) return;

        const basePath = `users/${user.tenantId}/students/${user.studentId}`;
        
        // Fetch Assessments (Subcollection)
        const assessmentsQuery = query(collection(db, `${basePath}/assessments`), orderBy('date', 'desc'));
        const unsubscribeAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
            setAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeAssessments();
        };
    }, [user]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Buscando sua evolução...</div>;
    }

    return (
        <div style={{ color: 'var(--text-main)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity className="text-primary" /> Sua Evolução
            </h2>

            {/* Assessment History Section */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Histórico de Avaliações</h3>
                
                {assessments.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--border-glass)', borderRadius: '16px' }}>
                        <Scale size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma avaliação registrada ainda.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {assessments.map((as) => (
                            <div 
                                key={as.id} 
                                onClick={() => setSelectedAssessment(as)}
                                className="glass-panel" 
                                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Avaliação em {as.dateString}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span>Peso: <strong>{as.weight}kg</strong></span>
                                        {as.bodyFat && <span>Gordura: <strong>{as.bodyFat}%</strong></span>}
                                    </div>
                                </div>
                                <ChevronRight color="var(--text-muted)" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Evolution Photos Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fotos de Evolução</h3>
                
                {gallery.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--border-glass)', borderRadius: '16px' }}>
                        <Camera size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Suas fotos de progresso aparecerão aqui.</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                        gap: '1rem' 
                    }}>
                        {gallery.map((photo, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setActivePhoto(photo)}
                                style={{ 
                                    position: 'relative', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden', 
                                    aspectRatio: '3/4',
                                    background: 'black',
                                    cursor: 'pointer'
                                }}
                            >
                                <img 
                                    src={photo.url} 
                                    alt="Evolução" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                                <div style={{ 
                                    position: 'absolute', 
                                    bottom: 0, 
                                    left: 0, 
                                    right: 0, 
                                    padding: '0.5rem', 
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                    fontSize: '0.7rem',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    <Calendar size={10} /> {photo.dateString || new Date(photo.date).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Lightbox */}
            {activePhoto && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
                        background: 'rgba(0,0,0,0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setActivePhoto(null)}
                >
                    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'white' }}>
                        <X size={32} />
                    </div>
                    
                    <div style={{ maxWidth: '100%', maxHeight: '80vh', position: 'relative' }}>
                        <img 
                            src={activePhoto.url} 
                            alt="Evolução Ampliada" 
                            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} 
                        />
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                            {activePhoto.dateString || new Date(activePhoto.date).toLocaleDateString()}
                        </p>
                        {activePhoto.description && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px' }}>
                                {activePhoto.description}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {/* Details & Comparison Modal */}
            {selectedAssessment && (
                <AssessmentModal 
                    assessment={selectedAssessment} 
                    previousAssessment={assessments[assessments.findIndex(a => a.id === selectedAssessment.id) + 1]}
                    onClose={() => setSelectedAssessment(null)}
                    settings={settings}
                    userName={user.name}
                    addToast={addToast}
                />
            )}
        </div>
    );
}

// Sub-component for Detailed Modal & PDF logic
function AssessmentModal({ assessment, previousAssessment, onClose, settings, userName, addToast }) {
    
    const getBase64FromUrl = async (url) => {
        if (!url) return null;
        try {
            const response = await fetch(url + '?not-from-cache-please', { 
                method: 'GET', 
                mode: 'cors', 
                cache: 'no-cache' 
            });
            if (!response.ok) throw new Error('Failed to fetch image');
            
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null); // Resolve with null on error
                reader.readAsDataURL(blob);
            });
        } catch (error) { 
            console.warn("Logo download failed (likely CORS/Network issue):", error);
            return null; 
        }
    }

    const generatePDF = async (shouldShare = false) => {
        try {
            const doc = new jsPDF();
            const a1 = previousAssessment;
            const a2 = assessment;

            // Header
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');

            if (settings?.logoUrl) {
                const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                if (logoBase64) doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text(settings?.gymName || "GymManager", 105, 18, { align: 'center' });
            doc.setFontSize(12);
            doc.text(a1 ? "Comparativo de Evolução Física" : "Relatório de Avaliação Física", 105, 30, { align: 'center' });

            doc.setTextColor(0);
            doc.setFontSize(11);
            doc.text(`Aluno: ${userName}`, 14, 50);
            doc.text(`Data: ${a2.dateString} ${a1 ? `(vs ${a1.dateString})` : ''}`, 14, 58);

            const rows = [
                ['Peso (kg)', a1 ? a1.weight : '-', a2.weight, a1 ? (a2.weight - a1.weight).toFixed(1) : '-'],
                ['Gordura (%)', a1?.bodyFat || '-', a2.bodyFat || '-', a1?.bodyFat && a2.bodyFat ? (a2.bodyFat - a1.bodyFat).toFixed(1) : '-'],
                ['Massa Magra (kg)', a1?.muscleMass || '-', a2.muscleMass || '-', a1?.muscleMass && a2.muscleMass ? (a2.muscleMass - a1.muscleMass).toFixed(1) : '-'],
                ['Bíceps D (cm)', a1?.bicepsRight || '-', a2.bicepsRight || '-', a1?.bicepsRight && a2.bicepsRight ? (a2.bicepsRight - a1.bicepsRight).toFixed(1) : '-'],
                ['Coxa D (cm)', a1?.thighRight || '-', a2.thighRight || '-', a1?.thighRight && a2.thighRight ? (a2.thighRight - a1.thighRight).toFixed(1) : '-'],
                ['Abdômen (cm)', a1?.abdomen || '-', a2.abdomen || '-', a1?.abdomen && a2.abdomen ? (a2.abdomen - a1.abdomen).toFixed(1) : '-'],
                ['Cintura (cm)', a1?.waist || '-', a2.waist || '-', a1?.waist && a2.waist ? (a2.waist - a1.waist).toFixed(1) : '-'],
            ];

            autoTable(doc, {
                startY: 70,
                head: [['Medida', a1 ? `Anterior (${a1.dateString})` : '-', `Atual (${a2.dateString})`, 'Diferença']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 3) {
                        const val = parseFloat(data.cell.raw);
                        if (!isNaN(val) && val !== 0) {
                            const measure = data.row.raw[0].toString().toLowerCase();
                            const reverse = measure.includes('peso') || measure.includes('gordura') || measure.includes('cintura') || measure.includes('abdômen');
                            data.cell.styles.textColor = reverse ? (val < 0 ? [16, 185, 129] : [239, 68, 68]) : (val > 0 ? [16, 185, 129] : [239, 68, 68]);
                            data.cell.text = (val > 0 ? '+' : '') + val.toFixed(1);
                        }
                    }
                }
            });

            if (a2.notes) {
                doc.setFontSize(10);
                doc.text("Observações do Treinador:", 14, doc.lastAutoTable.finalY + 15);
                doc.setTextColor(100);
                const splitNotes = doc.splitTextToSize(a2.notes, 180);
                doc.text(splitNotes, 14, doc.lastAutoTable.finalY + 22);
            }

            if (shouldShare) {
                const blob = doc.output('blob');
                const file = new File([blob], `Evolucao_${userName}.pdf`, { type: 'application/pdf' });
                if (navigator.share) await navigator.share({ files: [file], title: 'Minha Evolução' });
            } else {
                doc.save(`Evolucao_${userName}_${a2.dateString.replace(/\//g, '-')}.pdf`);
            }
            addToast("Relatório gerado!", 'success');
        } catch (e) { addToast("Erro ao gerar PDF", 'error'); }
    };

    const renderMetric = (label, key, unit = '') => {
        const current = parseFloat(assessment[key]);
        const prev = previousAssessment ? parseFloat(previousAssessment[key]) : null;
        const diff = prev !== null && !isNaN(current) && !isNaN(prev) ? current - prev : null;
        
        const reverse = ['weight', 'bodyFat', 'waist', 'abdomen'].includes(key);
        let color = 'var(--text-main)';
        if (diff !== null && Math.abs(diff) > 0.01) {
            color = reverse ? (diff < 0 ? '#10b981' : '#ef4444') : (diff > 0 ? '#10b981' : '#ef4444');
        }

        return (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{assessment[key] ? `${assessment[key]}${unit}` : '-'}</span>
                </div>
                {diff !== null && Math.abs(diff) > 0.01 && (
                    <div style={{ textAlign: 'right', color }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}</span>
                        <div style={{ fontSize: '0.7rem' }}>vs anterior</div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '95%', maxWidth: '500px', maxHeight: '90vh', borderRadius: '24px', overflowY: 'auto', position: 'relative', padding: '1.5rem' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X /></button>
                
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Sua Evolução Física</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avaliação de {assessment.dateString}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {renderMetric('Peso', 'weight', 'kg')}
                    {renderMetric('Gordura', 'bodyFat', '%')}
                    {renderMetric('Massa Magra', 'muscleMass', 'kg')}
                    {renderMetric('Altura', 'height', 'm')}
                </div>

                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Medidas Corporais</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {renderMetric('Bíceps D', 'bicepsRight', 'cm')}
                    {renderMetric('Bíceps E', 'bicepsLeft', 'cm')}
                    {renderMetric('Coxa D', 'thighRight', 'cm')}
                    {renderMetric('Coxa E', 'thighLeft', 'cm')}
                    {renderMetric('Peitoral', 'chest', 'cm')}
                    {renderMetric('Abdômen', 'abdomen', 'cm')}
                    {renderMetric('Cintura', 'waist', 'cm')}
                    {renderMetric('Quadril', 'hips', 'cm')}
                </div>

                {assessment.notes && (
                    <div style={{ padding: '1rem', background: 'rgba(255,193,7,0.05)', borderRadius: '12px', borderLeft: '4px solid #ffc107', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#ffc107', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>OBSERVAÇÕES DO TREINADOR</span>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{assessment.notes}</p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => generatePDF(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Download size={18} /> PDF
                    </button>
                    <button onClick={() => generatePDF(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '12px', background: '#25D366', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                        <MessageCircle size={18} /> WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}
