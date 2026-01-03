import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const BodyMeasurementMap = ({ current, previous, gender = 'Male' }) => {
    if (!current) return null;

    // Normalize gender to ensure lowercase match
    const normalizedGender = (gender || 'Male').toLowerCase();
    const isFemale = normalizedGender === 'female';

    // Image source based on gender
    const imageSrc = isFemale ? '/body-female.png' : '/body-male.png';

    // Define points: [x, y] in percentage relative to image container
    const musclePoints = {
        bicepsRight: { x: isFemale ? 28 : 26, y: 32 },
        bicepsLeft: { x: isFemale ? 72 : 74, y: 32 },
        chest: { x: 55, y: isFemale ? 26 : 24 }, // Moved to side (Left Pectoral)
        waist: { x: 50, y: 41 },
        abdomen: { x: 50, y: 48 },
        hips: { x: 50, y: 54 },
        thighRight: { x: isFemale ? 40 : 38, y: 62 },
        thighLeft: { x: isFemale ? 60 : 62, y: 62 },
        calfRight: { x: isFemale ? 40 : 38, y: 82 },
        calfLeft: { x: isFemale ? 60 : 62, y: 82 }
    };

    // Label positions remain mostly the same to keep "HUD" feel
    const labelPositions = {
        bicepsRight: { x: 5, y: 20, align: 'right' },
        bicepsLeft: { x: 95, y: 20, align: 'left' },
        chest: { x: 25, y: 8, align: 'right' }, // Moved off the head to the side
        waist: { x: 10, y: 42, align: 'right' },
        abdomen: { x: 90, y: 48, align: 'left' },
        hips: { x: 10, y: 56, align: 'right' },
        thighRight: { x: 10, y: 70, align: 'right' },
        thighLeft: { x: 90, y: 70, align: 'left' },
        calfRight: { x: 10, y: 90, align: 'right' },
        calfLeft: { x: 90, y: 90, align: 'left' }
    };

    const labels = {
        bicepsRight: 'Bíceps Dir.',
        bicepsLeft: 'Bíceps Esq.',
        chest: 'Peitoral',
        waist: 'Cintura',
        abdomen: 'Abdômen',
        hips: 'Quadril',
        thighRight: 'Coxa Dir.',
        thighLeft: 'Coxa Esq.',
        calfRight: 'Panturrilha D.',
        calfLeft: 'Panturrilha E.'
    };

    const renderConnector = (key) => {
        const start = musclePoints[key];
        const end = labelPositions[key];
        if (!start || !end) return null;

        return (
            <line
                key={`line-${key}`}
                x1={`${start.x}%`}
                y1={`${start.y}%`}
                x2={`${end.x}%`}
                y2={`${end.y}%`}
                stroke="var(--text-muted)" // Solid color
                strokeOpacity="0.6"
                strokeWidth="1.5" // Slightly thicker
            />
        );
    };

    const renderDot = (key) => {
        const p = musclePoints[key];
        if (!p) return null;
        return (
            <circle
                key={`dot-${key}`}
                cx={`${p.x}%`}
                cy={`${p.y}%`}
                r="4"
                fill="var(--primary)"
                stroke="var(--card-bg)"
                strokeWidth="2"
            />
        );
    }

    const renderLabel = (key) => {
        const pos = labelPositions[key];
        const currentVal = parseFloat((current[key] || 0).toString().replace(',', '.'));
        const previousVal = previous ? parseFloat((previous[key] || 0).toString().replace(',', '.')) : null;

        if (!currentVal) return null;

        let diff = null;
        let diffColor = 'var(--text-muted)';
        let Icon = Minus;

        if (previousVal !== null) {
            diff = currentVal - previousVal;
            if (Math.abs(diff) >= 0.1) {
                const isGrowthGood = !['waist', 'abdomen', 'hips'].includes(key);
                if (diff > 0) {
                    diffColor = isGrowthGood ? '#10b981' : '#ef4444';
                    Icon = ArrowUp;
                } else {
                    diffColor = isGrowthGood ? '#ef4444' : '#10b981';
                    Icon = ArrowDown;
                }
            }
        }

        return (
            <div
                key={`label-${key}`}
                style={{
                    position: 'absolute',
                    top: `${pos.y}%`,
                    left: `${pos.x}%`,
                    transform: 'translate(-50%, -50%)',
                    background: 'var(--card-bg)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Standard soft shadow
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: pos.align === 'right' ? 'flex-end' : pos.align === 'left' ? 'flex-start' : 'center',
                    minWidth: '100px',
                    zIndex: 10
                }}
            >
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    marginBottom: '2px',
                    textTransform: 'uppercase'
                }}>
                    {labels[key]}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                        {currentVal}
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', marginLeft: '2px', color: 'var(--text-muted)' }}>cm</span>
                    </span>
                    {diff !== null && Math.abs(diff) >= 0.1 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: diffColor,
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: diffColor + '15', // very light background of the same color
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}>
                            <Icon size={12} style={{ marginRight: '2px' }} />
                            {Math.abs(diff).toFixed(1)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', aspectRatio: '1.2' }}>
            <img
                src={`${imageSrc}?v=8`} // Force reload
                alt={`Body Map ${gender}`}
                className="body-silhouette"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    height: '95%',
                    width: 'auto',
                    objectFit: 'contain',
                    opacity: 0.9,
                }}
            />

            {/* SVG Layer for connectors */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                {Object.keys(musclePoints).map(key => current[key] && renderConnector(key))}
                {Object.keys(musclePoints).map(key => current[key] && renderDot(key))}
            </svg>

            {/* Labels Layer */}
            {Object.keys(labelPositions).map(key => current[key] && renderLabel(key))}
        </div>
    );
};

export default BodyMeasurementMap;
