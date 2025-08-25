import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import { ProgramProvider } from './contexts/ProgramContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationContainer } from './components/NotificationContainer';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import './App.css';

function AppContent() {
  const { connected, publicKey } = useWallet();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(connected && !!publicKey);
  }, [connected, publicKey]);

  return (
    <ProgramProvider>
      <div className="min-h-screen bg-background text-foreground">
        {!isConnected ? (
          <LandingPage />
        ) : (
          <Dashboard />
        )}
        <NotificationContainer />
      </div>
    </ProgramProvider>
  );
}

function App() {
  return (
    <WalletContextProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </WalletContextProvider>
  );
}

export default App;
