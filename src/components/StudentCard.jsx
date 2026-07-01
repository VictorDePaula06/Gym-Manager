import React from 'react';
import './StudentCard.css';
import { User } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

const StudentCard = ({ student, settings, className = '', style = {} }) => {
    if (!student) return null;

    // Plan Configuration map
    // Maps keywords to { label, color }
    const getPlanConfig = (planName) => {
        const lowerPlan = (planName || '').toLowerCase();

        // Priority Check: Semiannual/Semestral FIRST because "semiannual" contains "annual"
        if (lowerPlan.includes('semiannual') || lowerPlan.includes('semestral')) {
            return { label: 'SEMESTRAL', color: '#fb923c' }; // Orange 400
        }
        // Then Annual
        if (lowerPlan.includes('annual') || lowerPlan.includes('anual')) {
            return { label: 'ANUAL', color: '#fbbf24' }; // Amber 400 (Bright Gold)
        }
        if (lowerPlan.includes('quarterly') || lowerPlan.includes('trimestral')) {
            return { label: 'TRIMESTRAL', color: '#c084fc' }; // Purple 400
        }
        // Default Monthly
        return { label: 'MENSAL', color: '#10b981' }; // Emerald (verde do sistema)
    };

    let { label, color } = getPlanConfig(student.plan);

    // Override color for Inactive students
    if (student.status === 'Inactive') {
        color = '#ef4444'; // Red 500
    }

    const userImage = student.profilePictureUrl || student.photoUrl;

    // Normaliza altura para metros (aceita cm "165" ou metros "1.65"/"1,65")
    const formatHeight = (raw) => {
        if (!raw && raw !== 0) return null;
        let h = parseFloat(raw.toString().replace(',', '.'));
        if (isNaN(h)) return null;
        if (h > 3) h = h / 100; // veio em cm
        return h.toFixed(2).replace('.', ',');
    };

    // IMC + faixa de cor (OMS)
    const getBmi = () => {
        if (!student.weight || !student.height) return null;
        const weight = parseFloat(student.weight.toString().replace(',', '.'));
        let height = parseFloat(student.height.toString().replace(',', '.'));
        if (height > 3) height = height / 100;
        if (!weight || !height) return null;
        return weight / (height * height);
    };

    const bmi = getBmi();
    const getBmiColor = (v) => {
        if (v == null) return 'var(--text-main)';
        if (v < 18.5) return '#60a5fa'; // abaixo do peso
        if (v < 25) return '#10b981';   // normal
        if (v < 30) return '#fbbf24';   // sobrepeso
        return '#ef4444';               // obesidade
    };

    const heightFmt = formatHeight(student.height);

    return (
        <div className={`member-card ${className}`} style={{ border: `2px solid ${color}`, ...style }}>
            <div className="member-card-header">
                <span className="plan-badge" style={{ color: color, borderColor: color }}>
                    {label}
                </span>
            </div>

            <div className="member-avatar-container">
                <div className="member-avatar" style={{ borderColor: color }}>
                    {userImage ? (
                        <OptimizedImage
                            src={userImage}
                            alt={student.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            placeholderColor={color}
                        />
                    ) : (
                        <User size={40} color={color} />
                    )}
                </div>
            </div>

            <div className="member-info">
                <h3 className="member-name">{student.name}</h3>
                <div className="member-status">
                    <span className={`status-dot ${student.status === 'Active' ? 'active' : 'inactive'}`}></span>
                    {student.status === 'Active' ? 'Ativo' : 'Inativo'}
                </div>
            </div>

            <div className="member-stats">
                <div className="stat-item">
                    <span className="stat-label">IDADE</span>
                    <span className="stat-value">
                        {student.birthDate ? (() => {
                            const today = new Date();
                            const birthDate = new Date(student.birthDate);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                            }
                            return age;
                        })() : '--'}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">PESO</span>
                    <span className="stat-value">{student.weight || '--'} <small>kg</small></span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">ALTURA</span>
                    <span className="stat-value">{heightFmt || '--'} <small>m</small></span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">IMC</span>
                    <span className="stat-value" style={{ color: getBmiColor(bmi) }}>
                        {bmi != null ? bmi.toFixed(1) : '--'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StudentCard;
