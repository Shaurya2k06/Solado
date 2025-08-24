import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AnimatedCard } from './ui/animated-card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Campaign {
  publicKey: PublicKey;
  creator: PublicKey;
  title: string;
  description: string;
  goalAmount: BN;
  donatedAmount: BN;
  deadline: BN;
  metadataUri?: string;
  isActive: boolean;
}

export const CampaignList = () => {
  const { connected } = useWallet();
  const { program } = useProgramContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationAmounts, setDonationAmounts] = useState<{ [key: string]: string }>({});
  const [donatingTo, setDonatingTo] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    if (!program) return;
    
    try {
      const campaignAccounts = await (program.account as any).campaign.all();
      const campaignsData = campaignAccounts.map((account: any) => ({
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
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [program]);

  const handleDonate = async (campaignKey: PublicKey) => {
    if (!program || !connected) return;
    
    const amount = donationAmounts[campaignKey.toString()];
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    setDonatingTo(campaignKey.toString());
    try {
      const donationAmountLamports = new BN(parseFloat(amount) * 1e9);

      const tx = await (program.methods as any)
        .donate(donationAmountLamports)
        .accounts({
          campaign: campaignKey,
          donor: (program.provider as any).publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Donation successful:', tx);
      
      // Reset amount and refresh campaigns
      setDonationAmounts(prev => ({
        ...prev,
        [campaignKey.toString()]: ''
      }));
      
      await fetchCampaigns();
    } catch (error) {
      console.error('Error donating:', error);
      alert('Failed to donate. Please try again.');
    } finally {
      setDonatingTo(null);
    }
  };

  const formatSOL = (lamports: BN) => {
    return (lamports.toNumber() / 1e9).toFixed(3);
  };

  const formatDate = (timestamp: BN) => {
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString();
  };

  const getProgressPercentage = (current: BN, goal: BN) => {
    if (goal.isZero()) return 0;
    return Math.min((current.toNumber() / goal.toNumber()) * 100, 100);
  };

  const isExpired = (deadline: BN) => {
    return new Date(deadline.toNumber() * 1000) < new Date();
  };

  const getTimeRemaining = (deadline: BN) => {
    const now = new Date().getTime();
    const deadlineTime = deadline.toNumber() * 1000;
    const diff = deadlineTime - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <AnimatedCard className="text-center py-16">
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <RocketLaunchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">No campaigns yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Be the first to create a campaign and start raising funds for your cause.
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ChartBarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Active Campaigns</h1>
            <p className="text-muted-foreground">Support innovative projects and causes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span>{campaigns.filter(c => c.isActive && !isExpired(c.deadline)).length} Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <span>{campaigns.filter(c => isExpired(c.deadline)).length} Expired</span>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
          const expired = isExpired(campaign.deadline);
          const campaignKey = campaign.publicKey.toString();
          
          return (
            <AnimatedCard key={campaignKey} className="group relative overflow-hidden">
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge variant={expired ? "destructive" : "default"} className="text-xs">
                  {expired ? 'Expired' : 'Active'}
                </Badge>
              </div>

              {/* Header Section */}
              <div className="p-6 pb-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold line-clamp-2 pr-16">
                    {campaign.title}
                  </h3>
                  
                  <p className="text-sm line-clamp-3 leading-relaxed text-muted-foreground">
                    {campaign.description}
                  </p>

                  {/* Creator Info */}
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-mono">
                      {campaign.creator.toString().slice(0, 8)}...{campaign.creator.toString().slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 pt-0 space-y-6">{/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
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
                      <div className="text-xs text-muted-foreground">funded</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatDate(campaign.deadline)}</span>
                  </div>
                  <div className={`flex items-center space-x-1 text-xs font-medium ${
                    expired ? 'text-destructive' : 'text-accent'
                  }`}>
                    <ClockIcon className="h-3 w-3" />
                    <span>{getTimeRemaining(campaign.deadline)}</span>
                  </div>
                </div>

                {/* Donation Section */}
                {!expired && connected && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Amount in SOL"
                          min="0.001"
                          step="0.001"
                          value={donationAmounts[campaignKey] || ''}
                          onChange={(e) => setDonationAmounts(prev => ({
                            ...prev,
                            [campaignKey]: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                      <Button
                        onClick={() => handleDonate(campaign.publicKey)}
                        disabled={donatingTo === campaignKey}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 hover-lift"
                      >
                        {donatingTo === campaignKey ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <CurrencyDollarIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Quick amount buttons */}
                    <div className="flex space-x-2">
                      {[0.1, 0.5, 1.0].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setDonationAmounts(prev => ({
                            ...prev,
                            [campaignKey]: amount.toString()
                          }))}
                          className="text-xs px-3 py-1 h-auto border-border hover:bg-muted hover:border-primary/50 transition-colors"
                        >
                          {amount} SOL
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!connected && (
                  <div className="text-center text-sm text-muted-foreground py-4 border-t border-border">
                    Connect your wallet to donate
                  </div>
                )}
              </div>
            </AnimatedCard>
          );
        })}
      </div>
    </div>
  );
};
