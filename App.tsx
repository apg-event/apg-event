import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { GameBoard } from './components/Board/GameBoard';
import { ProfileList } from './components/Profiles/ProfileList';
import { GlossaryView } from './components/Glossary/GlossaryView';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { useGameData } from './services/gameService';
import { useProgress } from '@react-three/drei';
import { preloadIcons } from './services/iconService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const { players, gameState } = useGameData();
  
  // 3D Assets Loading State
  const { progress, active } = useProgress();
  
  // App-level Loading State
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Preload Icons
  useEffect(() => {
    preloadIcons().then(() => setIconsLoaded(true));
  }, []);

  // Check if everything is ready (Assets + Data + Icons)
  useEffect(() => {
    // We consider it ready when:
    // 1. 3D Progress is 100% (or not active anymore)
    // 2. Players data has been loaded (length > 0) OR a timeout has passed
    // 3. Icons are preloaded
    
    const assetsLoaded = progress === 100;
    const dataLoaded = players.length > 0;

    if (assetsLoaded && dataLoaded && iconsLoaded) {
        setIsAppReady(true);
    } 
    
    // Fail-safe: If assets/icons are loaded but data is taking too long
    if (assetsLoaded && iconsLoaded && !dataLoaded) {
        const timer = setTimeout(() => {
             setIsAppReady(true);
        }, 5000);
        return () => clearTimeout(timer);
    }
    
  }, [progress, players, iconsLoaded]);

  const handlePlayerFocus = (playerId: string) => {
    setActiveTab('map');
    setFocusedPlayerId(playerId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return <GameBoard players={players} focusedPlayerId={focusedPlayerId} />;
      case 'profiles':
        return <ProfileList players={players} />;
      case 'glossary':
        return <div className="flex-1 overflow-auto bg-[#0B0C15]"><GlossaryView /></div>;
      default:
        return <GameBoard players={players} focusedPlayerId={focusedPlayerId} />;
    }
  };

  return (
    <>
      {showLoader && (
        <LoadingScreen 
            progress={progress} 
            isReady={isAppReady} 
            onFinished={() => setShowLoader(false)} 
        />
      )}
      
      <Layout activeTab={activeTab} onTabChange={setActiveTab} players={players} onPlayerFocus={handlePlayerFocus}>
        {/* Central Content Area */}
        <div className="flex-1 relative flex flex-col h-full">
          {renderContent()}
        </div>
      </Layout>
    </>
  );
};

export default App;
