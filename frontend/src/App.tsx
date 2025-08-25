import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import { ProgramProvider } from './contexts/ProgramContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { NotificationContainer } from './components/NotificationContainer';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import CampaignDetail from './components/CampaignDetail';
import './App.css';

// Component to handle campaign detail routing
function CampaignDetailWrapper() {
  const { campaignId } = useParams();
  const { connected, publicKey } = useWallet();

  // If wallet is not connected, show landing page
  if (!connected || !publicKey) {
    return <LandingPage />;
  }

  return <CampaignDetail />;
}

function AppContent() {
  const { connected, publicKey } = useWallet();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(connected && !!publicKey);
  }, [connected, publicKey]);

  return (
    <ProgramProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          {/* Main route - Landing page or Dashboard */}
          <Route 
            path="/" 
            element={
              !isConnected ? (
                <LandingPage />
              ) : (
                <Dashboard />
              )
            } 
          />
          
          {/* Individual campaign route */}
          <Route 
            path="/campaign/:campaignId" 
            element={<CampaignDetailWrapper />} 
          />
        </Routes>
        <NotificationContainer />
      </div>
    </ProgramProvider>
  );
}

function App() {
  return (
    <WalletContextProvider>
      <NotificationProvider>
        <AchievementProvider>
          <Router>
            <AppContent />
          </Router>
        </AchievementProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}

export default App;
