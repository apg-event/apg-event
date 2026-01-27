import React, { useEffect, useState } from 'react';
import { Snowflake, Wind } from 'lucide-react';

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

// 1. Выносим функцию рандома, чтобы использовать её везде
const getRandomPhrase = () => {
  return LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, isReady, onFinished }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFading, setIsFading] = useState(false);
  
  // 2. Инициализируем стейт СРАЗУ случайной фразой (Lazy initialization)
  const [phrase, setPhrase] = useState(() => getRandomPhrase());

  // Cycle phrases
  useEffect(() => {
    if (isReady) return;
    const interval = setInterval(() => {
      // 3. Используем ту же функцию для смены фраз
      setPhrase(getRandomPhrase());
    }, 2000);
    return () => clearInterval(interval);
  }, [isReady]);

  // Handle exit animation
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
      {/* ... (Остальной JSX без изменений) ... */}
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
        <div className="mb-12 relative">
             <div className="absolute inset-0 bg-ice-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
             <Snowflake className="w-16 h-16 text-ice-300 animate-spin-slow relative z-10 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
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
                    {/* Фраза теперь рандомная с самого начала */}
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