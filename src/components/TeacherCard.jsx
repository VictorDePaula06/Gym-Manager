import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Mail, Phone } from 'lucide-react';
import './TeacherCard.css';

const TeacherCard = ({ teacher, onEdit, onDelete }) => {
    const navigate = useNavigate();
    if (!teacher) return null;

    // Get initials for avatar
    const getInitials = (name) => {
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.slice(0, 2);
    };

    return (
        <div className="teacher-card">
            <div className="teacher-card-header">
                <span className="staff-badge">Instrutor</span>

                <div className="teacher-avatar-container">
                    <div className="teacher-avatar">
                        {getInitials(teacher.name)}
                    </div>
                </div>

                <div className="teacher-info">
                    <h3 className="teacher-name">{teacher.name}</h3>
                    <div className="teacher-specialty">{teacher.specialty || 'Geral'}</div>
                </div>
            </div>

            <div className="teacher-contact">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} />
                    <span>{teacher.phone || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} />
                    <span style={{ fontSize: '0.8rem' }}>{teacher.email || '-'}</span>
                </div>
            </div>

            <div className="teacher-actions">
                <button
                    onClick={() => onEdit(teacher)}
                    className="action-btn"
                    title="Editar"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={() => navigate(`/app/teachers/${teacher.id}`)}
                    className="action-btn"
                    title="Financeiro & Detalhes"
                    style={{ color: '#10b981' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                </button>
                <button
                    onClick={() => onDelete(teacher.id)}
                    className="action-btn delete"
                    title="Excluir"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default TeacherCard;
