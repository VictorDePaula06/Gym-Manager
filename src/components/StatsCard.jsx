export default function StatsCard({ title, value, icon: Icon, trend, color = 'var(--primary)' }) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
                padding: '1rem',
                background: `rgba(16, 185, 129, 0.1)`,
                borderRadius: '16px',
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 20px -5px ${color}40`
            }}>
                <Icon size={28} />
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{value}</h3>
                {trend && <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>{trend}</p>}
            </div>
        </div>
    )
}
