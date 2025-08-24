import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CreateCampaign } from './CreateCampaign';
import { CampaignList } from './CampaignList';
import { motion } from 'framer-motion';
import { 
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon 
} from '@heroicons/react/24/outline';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create'>('campaigns');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { publicKey, connected } = useWallet();

  // Redirect to landing page if wallet disconnects
  useEffect(() => {
    if (!connected) {
      window.location.reload(); // This will trigger the redirect in App.tsx
    }
  }, [connected]);

  const handleCampaignCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('campaigns');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Pill Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-3 py-3 shadow-2xl">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center space-x-3 px-6 py-2">
              <img 
                src="/logo.png" 
                alt="Solado" 
                className="h-8 w-8 rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div 
                className="w-8 h-8 bg-primary rounded-lg items-center justify-center shadow-lg hidden"
                style={{ display: 'none' }}
              >
                <RocketLaunchIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-white font-bold text-xl">Solado</span>
            </div>

            <div className="h-8 w-px bg-white/20" />

            {/* Navigation Pills */}
            <div className="flex items-center bg-white/5 rounded-full p-2">
              <motion.button
                onClick={() => setActiveTab('campaigns')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === 'campaigns'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Browse </span>
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('create')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === 'create'
                    ? 'bg-accent text-accent-foreground shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span>Create</span>
              </motion.button>
            </div>

            <div className="h-8 w-px bg-white/20" />

            {/* Wallet Section */}
            <div className="flex items-center space-x-4 px-3">
              {publicKey && (
                <div className="hidden sm:block text-xs text-white/60 font-mono px-4 py-2 bg-white/5 rounded-full">
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </div>
              )}
              <WalletMultiButton className="!bg-red-500/20 !border !border-red-500/30 hover:!bg-red-500/30 !text-red-400 hover:!text-red-300 !font-medium !px-6 !py-3 !rounded-full !text-sm !transition-all !duration-200" />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content with proper top padding */}
      <main className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="min-h-[calc(100vh-12rem)]"
          >
            {activeTab === 'campaigns' && (
              <div className="space-y-8 mt-10">
                <div className="text-center">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-bold text-foreground mb-6"
                  >
                    Active Campaigns
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-lg mb-8"
                  >
                    Discover and support amazing projects on Solana
                  </motion.p>
                </div>
                <CampaignList key={refreshTrigger} />
              </div>
            )}
            
            {activeTab === 'create' && (
              <div className="space-y-8">
                <div className="text-center">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-bold text-foreground mb-4"
                  >
                    Create Campaign
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-lg"
                  >
                    Launch your fundraising campaign on the blockchain
                  </motion.p>
                </div>
                <CreateCampaign onCampaignCreated={handleCampaignCreated} />
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 border-t border-border/50 bg-card/20 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-6 mb-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Support</a>
              <a href="https://github.com/Shaurya2k06/Solado" className="text-muted-foreground hover:text-foreground transition-colors text-sm">GitHub</a>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Solado. Transparent • Secure • Decentralized
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};
