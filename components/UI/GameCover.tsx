
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getGameCoverUrl } from '../../services/gameCoverService';

interface GameCoverProps {
    gameName: string;
    className?: string;
}

export const GameCover: React.FC<GameCoverProps> = ({ gameName, className = "" }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchCover = async () => {
            setLoading(true);
            const url = await getGameCoverUrl(gameName);
            if (isMounted) {
                setImageUrl(url);
                setLoading(false);
            }
        };

        fetchCover();

        return () => {
            isMounted = false;
        };
    }, [gameName]);

    // FALLBACK UI (The old gradient box)
    const Fallback = () => (
        <div className={`flex-shrink-0 bg-gradient-to-br from-midnight-800 to-midnight-950 flex items-center justify-center text-slate-600 transition-colors relative z-10 ${className}`}>
             <ImageIcon className="w-8 h-8 opacity-40" />
        </div>
    );

    if (loading) {
        return (
            <div className={`flex-shrink-0 bg-midnight-900 animate-pulse border border-white/5 ${className}`}>
                <div className="w-full h-full bg-white/5"></div>
            </div>
        );
    }

    if (!imageUrl) {
        return <Fallback />;
    }

    return (
        <div className={`flex-shrink-0 relative bg-black ${className}`}>
             <img 
                src={imageUrl} 
                alt={gameName}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                onError={(e) => {
                    // Fail-safe if URL is broken
                    e.currentTarget.style.display = 'none';
                    setImageUrl(null); 
                }}
             />
             {/* Gradient overlay to ensure text readability if used elsewhere, or just nice aesthetic */}
             <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/60 to-transparent pointer-events-none"></div>
        </div>
    );
};
