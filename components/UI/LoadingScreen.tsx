import React, { useEffect, useState } from 'react';
import { Wind } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  isReady: boolean;
  onFinished: () => void;
}

const LOADING_PHRASES = [
  "Генерация сугробов...",
  "Заточка ледорубов...",
  "Прогрев дайсов...",
  "Призыв стримеров...",
  "Установка ловушек...",
  "Полировка льда...",
  "Сдуваем снежинки...",
  "Проверка толщины льда...",
  "Утепление текстур...",
  "Разгон облаков...",
  "Натирание кубиков на удачу...",
  "Разметка гексагональной сетки...",
  "Проверка вместимости инвентаря...",
  "Дефрагментация ледника...",
  "Очистка объектива от инея..."
];

const getRandomPhrase = () => {
  return LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
};

// --- 3D DICE COMPONENT ---
const Dice3D = () => {
    // State for the cube's rotation
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        // Function to get a random face rotation
        // We add multiples of 360 to ensure it spins in interesting directions instead of just snapping back
        const roll = () => {
            const faces = [
                { x: 0, y: 0 },      // 1 (Front)
                { x: -90, y: 0 },    // 2 (Top)
                { x: 0, y: -90 },    // 3 (Right)
                { x: 0, y: 90 },     // 4 (Left)
                { x: 90, y: 0 },     // 5 (Bottom)
                { x: 180, y: 0 },    // 6 (Back)
            ];
            
            // Pick a random face
            const targetFace = faces[Math.floor(Math.random() * faces.length)];
            
            // Add random full spins (1 to 3 full rotations) to make the movement dynamic
            const extraSpinsX = (Math.floor(Math.random() * 3) + 1) * 360;
            const extraSpinsY = (Math.floor(Math.random() * 3) + 1) * 360;
            const extraSpinsZ = (Math.floor(Math.random() * 2)) * 90; // Small Z tilt for realism

            setRotation({
                x: targetFace.x + extraSpinsX,
                y: targetFace.y + extraSpinsY,
                z: extraSpinsZ 
            });
        };

        // Initial roll
        roll();

        // Roll every 2.5 seconds
        const interval = setInterval(roll, 2500);
        return () => clearInterval(interval);
    }, []);


    // Styles for 3D Cube Faces
    // Updated: Solid bg-slate-100, no transparency, dark blue dots
    // Cube Size: w-24 (96px). TranslateZ should be 48px.
    const faceBaseClass = "absolute inset-0 bg-slate-100 border-2 border-slate-300 rounded-xl flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] backface-hidden";
    
    // Updated Dot Color: Dark Blue (Midnight 900)
    const dotClass = "w-4 h-4 bg-midnight-900 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.4)]";
    
    // Grid layouts for dots
    const one = <div className={dotClass}></div>;
    const two = <div className="flex gap-8"><div className={dotClass}></div><div className={dotClass}></div></div>;
    const three = <div className="flex gap-2"><div className={`${dotClass} self-start`}></div><div className={`${dotClass} self-center`}></div><div className={`${dotClass} self-end`}></div></div>;
    const four = <div className="grid grid-cols-2 gap-4"><div className={dotClass}></div><div className={dotClass}></div><div className={dotClass}></div><div className={dotClass}></div></div>;
    const five = <div className="grid grid-cols-2 gap-4 relative"><div className={dotClass}></div><div className={dotClass}></div><div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${dotClass}`}></div><div className={dotClass}></div><div className={dotClass}></div></div>;
    const six = <div className="grid grid-cols-2 gap-x-4 gap-y-2"><div className={dotClass}></div><div className={dotClass}></div><div className={dotClass}></div><div className={dotClass}></div><div className={dotClass}></div><div className={dotClass}></div></div>;

    return (
        <div className="w-24 h-24 perspective-[1000px]">
            <div 
                className="w-full h-full relative transform-style-3d transition-transform duration-[1500ms] ease-in-out"
                style={{ 
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`
                }}
            >
                {/* 
                   Cube Construction:
                   Size 96px (w-24). TranslateZ = 48px.
                */}
                
                {/* Front (1) */}
                <div className={faceBaseClass} style={{ transform: 'rotateY(0deg) translateZ(48px)' }}>{one}</div>
                
                {/* Back (6) */}
                <div className={faceBaseClass} style={{ transform: 'rotateY(180deg) translateZ(48px)' }}>{six}</div>
                
                {/* Right (3) */}
                <div className={faceBaseClass} style={{ transform: 'rotateY(90deg) translateZ(48px)' }}>{three}</div>
                
                {/* Left (4) */}
                <div className={faceBaseClass} style={{ transform: 'rotateY(-90deg) translateZ(48px)' }}>{four}</div>
                
                {/* Top (2) */}
                <div className={faceBaseClass} style={{ transform: 'rotateX(90deg) translateZ(48px)' }}>{two}</div>
                
                {/* Bottom (5) */}
                <div className={faceBaseClass} style={{ transform: 'rotateX(-90deg) translateZ(48px)' }}>{five}</div>
                
                {/* Inner Core (Optional, barely visible now that it's solid, but keeps a faint glow effect around edges) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-ice-500/20 blur-xl rounded-full"></div>
            </div>
        </div>
    );
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, isReady, onFinished }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [phrase, setPhrase] = useState(() => getRandomPhrase());

  useEffect(() => {
    if (isReady) return;
    const interval = setInterval(() => {
      setPhrase(getRandomPhrase());
    }, 2000);
    return () => clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      const timeout = setTimeout(() => {
        setIsFading(true);
        const removeTimeout = setTimeout(() => {
          setShouldRender(false);
          onFinished();
        }, 1000);
        return () => clearTimeout(removeTimeout);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isReady, onFinished]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-midnight-950 transition-opacity duration-1000 ease-in-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-midnight-900 via-midnight-950 to-black z-0"></div>
         <div 
            className="absolute inset-0 opacity-[0.15] z-0" 
            style={{ 
                backgroundImage: `radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)`, 
                backgroundSize: '40px 40px' 
            }}
         ></div>
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aurora-purple/10 blur-[120px] rounded-full animate-pulse-slow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ice-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-20 flex flex-col items-center max-w-sm w-full px-8">
        
        {/* Animated Dice Container */}
        <div className="mb-12 relative flex items-center justify-center">
             {/* Adjusted glow for the solid cube */}
             <div className="absolute inset-0 bg-white blur-[80px] opacity-10 rounded-full animate-pulse"></div>
             <Dice3D />
        </div>

        <h1 className="text-3xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-ice-200 via-white to-ice-200 mb-2">
            APG EVENT
        </h1>
        
        <div className="h-6 mb-8 flex items-center gap-2 text-ice-400/70 text-sm font-mono tracking-widest uppercase">
            {isReady ? (
                <span className="animate-pulse text-emerald-400">Готово к запуску</span>
            ) : (
                <>
                    <Wind className="w-4 h-4 animate-pulse" />
                    <span>{phrase}</span>
                </>
            )}
        </div>

        <div className="w-full h-1.5 bg-midnight-800 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
            <div 
                className="h-full bg-gradient-to-r from-ice-600 via-ice-400 to-white transition-all duration-300 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>

        <div className="mt-4 font-mono text-xs text-slate-500">
            {Math.round(progress)}%
        </div>
      </div>

      <div className="absolute bottom-8 text-[10px] text-slate-700 font-mono tracking-widest uppercase opacity-50">
          Загрузка игрового мира
      </div>
    </div>
  );
};