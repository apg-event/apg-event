import React, { useState, useEffect } from 'react';

interface PlayerAvatarProps {
    src: string;
    name: string;
    className?: string;
    style?: React.CSSProperties;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ src, name, className = "", style }) => {
    const [hasError, setHasError] = useState(false);

    // Сброс ошибки если изменился источник (например, переключили игрока)
    useEffect(() => {
        setHasError(false);
    }, [src]);

    // Если произошла ошибка загрузки (файла нет), используем DiceBear
    const displaySrc = hasError 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`
        : src;

    return (
        <img 
            src={displaySrc} 
            alt={name}
            className={className}
            style={style}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
};