import React, { useState } from 'react';

interface GameIconProps {
    glossaryId?: string;
    alt: string;
    fallback: React.ReactNode;
    className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({ glossaryId, alt, fallback, className = "w-full h-full object-cover" }) => {
    const [error, setError] = useState(false);

    if (!glossaryId || error) {
        return <>{fallback}</>;
    }

    return (
        <img 
            src={`./assets/icons/${glossaryId}.png`} 
            alt={alt} 
            className={className}
            onError={() => setError(true)}
        />
    );
};