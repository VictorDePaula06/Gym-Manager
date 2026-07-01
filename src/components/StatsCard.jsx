export default function StatsCard({ title, value, icon: Icon, trend, color = '#10b981' }) {
    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            borderTop: `3px solid ${color}`,
        }}>
            {/* Marca d'água do ícone no canto */}
            {Icon && (
                <Icon
                    size={96}
                    style={{ position: 'absolute', right: '-14px', bottom: '-20px', color, opacity: 0.06, pointerEvents: 'none' }}
                />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.1rem' }}>
                <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: `${color}22`,
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {Icon && <Icon size={24} />}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</p>
            </div>

            <h3 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                {value}
            </h3>
            {trend && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{trend}</p>}
        </div>
    );
}
