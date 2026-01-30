import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { GameBoard } from './components/Board/GameBoard';
import { ProfileList } from './components/Profiles/ProfileList';
import { GlossaryView } from './components/Glossary/GlossaryView';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { useGameData } from './services/gameService';
import { useProgress } from '@react-three/drei';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('glossary');
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const { players, gameState } = useGameData();
  
  // 3D Assets Loading State
  const { progress, active } = useProgress();
  
  // App-level Loading State
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Check if everything is ready (Assets loaded + Data fetched)
  useEffect(() => {
    // We consider it ready when:
    // 1. 3D Progress is 100% (or not active anymore)
    // 2. Players data has been loaded (length > 0) OR a timeout has passed (fail-safe for empty data)
    
    // Note: players might be empty initially. useGameData returns [] then fetches.
    // If connection fails, players stays []. We don't want to lock the screen forever.
    
    const assetsLoaded = progress === 100;
    const dataLoaded = players.length > 0;

    if (assetsLoaded && dataLoaded) {
        setIsAppReady(true);
    } 
    
    // Fail-safe: If assets are loaded but data is taking too long (e.g. server error or 0 players),
    // force ready after 5 seconds of assets being done.
    if (assetsLoaded && !dataLoaded) {
        const timer = setTimeout(() => {
             setIsAppReady(true);
        }, 5000);
        return () => clearTimeout(timer);
    }
    
  }, [progress, players]);

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