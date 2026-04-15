import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const OptimizedImage = ({ src, alt, className = '', style = {}, placeholderColor = '#e2e8f0' }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        setLoaded(true);
    };

    const handleError = () => {
        setError(true);
        setLoaded(true); // Stop loading state even on error
    };

    return (
        <div
            className={`optimized-image-container ${className}`}
            style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: placeholderColor,
                ...style
            }}
        >
            {!loaded && !error && (
                <div
                    className="image-skeleton"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-loading 1.5s infinite',
                        zIndex: 1
                    }}
                />
            )}

            {error ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    color: '#94a3b8'
                }}>
                    <ImageOff size={24} />
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                        ...style
                    }}
                />
            )}

            <style>{`
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default OptimizedImage;
