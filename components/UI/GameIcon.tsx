import React, { useState, useEffect } from 'react';
import { getIcon, getIconSync } from '../../services/iconService';

interface GameIconProps {
    glossaryId?: string;
    alt: string;
    fallback: React.ReactNode;
    className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({ glossaryId, alt, fallback, className = "w-full h-full object-cover" }) => {
    // Try to get sync first to avoid flash
    const [src, setSrc] = useState<string | null>(() => glossaryId ? (getIconSync(glossaryId) || null) : null);
    const [isLoading, setIsLoading] = useState(!src);

    useEffect(() => {
        if (!glossaryId) {
            setIsLoading(false);
            return;
        }

        // If we already have src from sync init, we might still want to check if it was undefined (loading)
        // getIconSync returns undefined if not in cache yet.
        const cached = getIconSync(glossaryId);
        if (cached !== undefined) {
            setSrc(cached);
            setIsLoading(false);
            return;
        }

        let mounted = true;
        const load = async () => {
            const data = await getIcon(glossaryId);
            if (mounted) {
                setSrc(data);
                setIsLoading(false);
            }
        };
        load();
        
        return () => { mounted = false; };
    }, [glossaryId]);

    if (!glossaryId || isLoading || !src) {
        return <>{fallback}</>;
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className}
        />
    );
};
