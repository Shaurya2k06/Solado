import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AnimatedCard } from './ui/animated-card';
import { BN } from '@coral-xyz/anchor';

interface Campaign {
  publicKey: PublicKey;
  creator: PublicKey;
  title: string;
  description: string;
  goalAmount: BN;
  donatedAmount: BN;
  deadline: BN;
  metadataUri: string;
  isActive: boolean;
}

const MyCampaigns: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgramContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch wallet balance using Helius API
  const fetchBalance = async () => {
    if (!publicKey) return;
    
    try {
      const apiKey = import.meta.env.VITE_HELIUS_API_KEY;
      const response = await fetch(`https://api.helius.xyz/v0/addresses/${publicKey.toString()}/balances?api-key=${apiKey}`);
      const data = await response.json();
      
      // Find SOL balance
      const solBalance = data.tokens.find((token: any) => token.mint === 'So11111111111111111111111111111111111111111112');
      if (solBalance) {
        setBalance(solBalance.amount / LAMPORTS_PER_SOL);
      } else {
        // Fallback to connection.getBalance if Helius doesn't return SOL
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Fallback to connection.getBalance
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (fallbackError) {
        console.error('Error with fallback balance fetch:', fallbackError);
      }
    }
  };

  // Fetch campaigns created by the user
  const fetchMyCampaigns = async () => {
    if (!program || !publicKey) return;
    
    try {
      const campaignAccounts = await (program.account as any).campaign.all();
      const myCampaignsData = campaignAccounts
        .filter((account: any) => account.account.creator.toString() === publicKey.toString())
        .map((account: any) => ({
          publicKey: account.publicKey,
          creator: account.account.creator,
          title: account.account.title,
          description: account.account.description,
          goalAmount: account.account.goal_amount ? new BN(account.account.goal_amount) : new BN(0),
          donatedAmount: account.account.donated_amount ? new BN(account.account.donated_amount) : new BN(0),
          deadline: account.account.deadline ? new BN(account.account.deadline) : new BN(0),
          metadataUri: account.account.metadata_uri,
          isActive: account.account.is_active,
        }));
      setCampaigns(myCampaignsData);
    } catch (error) {
      console.error('Error fetching my campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey && program) {
      fetchBalance();
      fetchMyCampaigns();
    }
  }, [publicKey, program]);

  const formatSOL = (amount: BN) => {
    return (amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2);
  };

  const getProgressPercentage = (current: BN, goal: BN) => {
    if (goal.isZero()) return 0;
    return (current.toNumber() / goal.toNumber()) * 100;
  };

  const isExpired = (deadline: BN) => {
    const now = Math.floor(Date.now() / 1000);
    return deadline.toNumber() < now;
  };

  const getDaysLeft = (deadline: BN) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline.toNumber() - now;
    if (timeLeft <= 0) return 0;
    return Math.ceil(timeLeft / (24 * 60 * 60));
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your campaigns.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">My Campaigns</h1>
              <p className="text-gray-600">Manage and track your crowdfunding campaigns</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Wallet Balance</div>
              <div className="text-2xl font-bold text-green-600">
                {balance.toFixed(4)} SOL
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => c.isActive && !isExpired(c.deadline)).length}
              </div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatSOL(campaigns.reduce((sum, c) => sum.add(c.donatedAmount), new BN(0)))} SOL
              </div>
              <div className="text-sm text-gray-600">Total Raised</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatSOL(campaigns.reduce((sum, c) => sum.add(c.goalAmount), new BN(0)))} SOL
              </div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Campaigns Yet</h3>
            <p className="text-gray-600 mb-4">You haven't created any campaigns yet. Start your first campaign!</p>
            <Button onClick={() => window.location.href = '/create'} className="bg-blue-600 hover:bg-blue-700">
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
              const expired = isExpired(campaign.deadline);
              const daysLeft = getDaysLeft(campaign.deadline);
              const campaignKey = campaign.publicKey.toString();
              
              return (
                <AnimatedCard key={campaignKey} className="group relative overflow-hidden">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant={expired ? "destructive" : "default"} className="text-xs">
                      {expired ? 'Expired' : campaign.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Campaign Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold mb-1 line-clamp-2">{campaign.title}</h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 pt-4 space-y-4">
                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3">{campaign.description}</p>

                    {/* Progress Section */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xl font-bold text-foreground">
                            {formatSOL(campaign.donatedAmount)} SOL
                          </div>
                          <div className="text-sm text-muted-foreground">
                            of {formatSOL(campaign.goalAmount)} SOL
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            {progress.toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {expired ? 'Expired' : `${daysLeft} days left`}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Campaign Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.location.href = `/campaign/${campaignKey}`}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/campaign/${campaignKey}`);
                          // You could add a toast notification here
                        }}
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCampaigns;
