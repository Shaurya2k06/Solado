import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AnimatedCard } from './ui/animated-card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BoxReveal } from './magicui/box-reveal';
import { motion } from 'framer-motion';
import UserProfileModal from './UserProfileModal';
import { 
  UserIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ClockIcon,
  FireIcon,
  HeartIcon,
  ShareIcon,
  XMarkIcon,
  CalendarIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon
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
  const { connected, publicKey } = useWallet();
  const { program } = useProgramContext();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationAmounts, setDonationAmounts] = useState<{ [key: string]: string }>({});
  const [donatingTo, setDonatingTo] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'successful' | 'ending-soon'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [modalDonationAmount, setModalDonationAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCampaigns = async () => {
    if (!program) return;
    
    try {
      setLoading(true);
      const campaignAccounts = await (program.account as any).campaign.all();
      
      const campaignsData = campaignAccounts.map((account: any) => {
        // Handle both snake_case and camelCase field names
        const goalAmount = account.account.goal_amount || account.account.goalAmount || 0;
        const donatedAmount = account.account.donated_amount || account.account.donatedAmount || 0;
        
        return {
          publicKey: account.publicKey,
          creator: account.account.creator,
          title: account.account.title,
          description: account.account.description,
          goalAmount: new BN(goalAmount.toString()),
          donatedAmount: new BN(donatedAmount.toString()),
          deadline: account.account.deadline ? new BN(account.account.deadline) : new BN(0),
          metadataUri: account.account.metadata_uri || account.account.metadataUri || '',
          isActive: account.account.is_active !== false,
        };
      });
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

  const handleDonate = async (campaignKey: string) => {
    if (!program || !publicKey) return;

    const amount = donationAmounts[campaignKey];
    if (!amount || parseFloat(amount) <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid donation amount');
      return;
    }

    try {
      setDonatingTo(campaignKey);
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      // First, let's verify the campaign exists and is valid
      try {
        const campaignAccount = await (program.account as any).campaign.fetch(new PublicKey(campaignKey));
        console.log('Campaign account:', campaignAccount);
        
        // Check if campaign is active and not expired
        const now = Math.floor(Date.now() / 1000);
        if (!campaignAccount.isActive) {
          throw new Error('Campaign is not active');
        }
        if (campaignAccount.deadline.toNumber() < now) {
          throw new Error('Campaign has expired');
        }
      } catch (fetchError: any) {
        console.error('Failed to fetch campaign:', fetchError);
        throw new Error(`Invalid campaign: ${fetchError.message}`);
      }

      // Generate a unique timestamp for this donation
      const timestamp = Date.now();
      
      // Convert timestamp to 8-byte little-endian buffer (same as Rust's .to_le_bytes())
      const timestampBuffer = Buffer.alloc(8);
      timestampBuffer.writeBigInt64LE(BigInt(timestamp), 0);

      const [donationRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('donation'),
          new PublicKey(campaignKey).toBuffer(),
          publicKey.toBuffer(),
          timestampBuffer,
        ],
        program.programId
      );

      console.log('Donation details:', {
        campaignKey,
        donor: publicKey.toString(),
        donationRecordPda: donationRecordPda.toString(),
        amount: amountLamports,
        timestamp,
        programId: program.programId.toString()
      });

      // First, let's try to simulate the transaction
      try {
        const simulationResult = await program.methods
          .donate(new BN(amountLamports), new BN(timestamp))
          .accounts({
            campaign: new PublicKey(campaignKey),
            donor: publicKey,
            donationRecord: donationRecordPda,
            systemProgram: SystemProgram.programId,
          })
          .simulate();
        
        console.log('Simulation successful:', simulationResult);
      } catch (simError: any) {
        console.error('Simulation failed:', simError);
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }

      const tx = await program.methods
        .donate(new BN(amountLamports), new BN(timestamp))
        .accounts({
          campaign: new PublicKey(campaignKey),
          donor: publicKey,
          donationRecord: donationRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Donation transaction:', tx);

      // Clear donation amount and refresh campaigns
      setDonationAmounts(prev => ({ ...prev, [campaignKey]: '' }));
      await fetchCampaigns();
      showSuccess('Donation Successful!', `Your donation of ${amount} SOL has been processed successfully.`);
    } catch (error: any) {
      console.error('Donation failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error cause:', error.cause);
      console.error('Error stack:', error.stack);
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }
      if (error.transactionLogs) {
        console.error('Transaction logs:', error.transactionLogs);
      }
      
      let errorMessage = 'Donation failed. ';
      
      // Check for common error patterns
      if (error.message?.includes('insufficient funds') || error.message?.includes('InsufficientFunds')) {
        errorMessage += 'Insufficient funds in wallet.';
      } else if (error.message?.includes('InvalidAccount')) {
        errorMessage += 'Invalid account structure.';
      } else if (error.message?.includes('ProgramError')) {
        errorMessage += 'Program error: ' + (error.logs?.join(' ') || 'Unknown program error');
      } else if (error.message?.includes('expired') || error.message?.includes('CampaignExpired')) {
        errorMessage += 'Campaign has expired.';
      } else if (error.message?.includes('not active') || error.message?.includes('CampaignNotActive')) {
        errorMessage += 'Campaign is not active.';
      } else if (error.message?.includes('SendTransaction')) {
        errorMessage += 'Transaction failed to send. Please check your network connection and wallet.';
      } else {
        errorMessage += `Unknown error: ${error.message || 'Please try again.'}`;
      }
      
      showError('Donation Failed', errorMessage);
    } finally {
      setDonatingTo(null);
    }
  };

  const handleModalDonate = async () => {
    if (!selectedCampaign || !program || !publicKey) return;

    const amount = modalDonationAmount;
    if (!amount || parseFloat(amount) <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid donation amount');
      return;
    }

    try {
      setDonatingTo(selectedCampaign.publicKey.toString());
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      // Generate a unique timestamp for this donation
      const timestamp = Date.now();
      
      // Convert timestamp to 8-byte little-endian buffer (same as Rust's .to_le_bytes())
      const timestampBuffer = Buffer.alloc(8);
      timestampBuffer.writeBigInt64LE(BigInt(timestamp), 0);

      const [donationRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('donation'),
          selectedCampaign.publicKey.toBuffer(),
          publicKey.toBuffer(),
          timestampBuffer,
        ],
        program.programId
      );

      console.log('Modal donation details:', {
        campaignKey: selectedCampaign.publicKey.toString(),
        donor: publicKey.toString(),
        donationRecordPda: donationRecordPda.toString(),
        amount: amountLamports,
        timestamp,
        programId: program.programId.toString()
      });

      await program.methods
        .donate(new BN(amountLamports), new BN(timestamp))
        .accounts({
          campaign: selectedCampaign.publicKey,
          donor: publicKey,
          donationRecord: donationRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Clear donation amount and refresh campaigns
      setModalDonationAmount('');
      await fetchCampaigns();
      showSuccess('Donation Successful!', `Your donation of ${amount} SOL has been processed successfully.`);
      setSelectedCampaign(null); // Close modal
    } catch (error: any) {
      console.error('Donation failed:', error);
      console.error('Error details:', error.message, error.logs);
      
      let errorMessage = 'Donation failed. ';
      if (error.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds in wallet.';
      } else if (error.message?.includes('InvalidAccount')) {
        errorMessage += 'Invalid account structure.';
      } else if (error.message?.includes('ProgramError')) {
        errorMessage += 'Program error: ' + (error.logs?.join(' ') || 'Unknown program error');
      } else {
        errorMessage += 'Please check your wallet connection and try again.';
      }
      
      showError('Donation Failed', errorMessage);
    } finally {
      setDonatingTo(null);
    }
  };

  // Add sharing state
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (campaign: Campaign) => {
    // Prevent multiple simultaneous shares
    if (isSharing) return;
    
    setIsSharing(true);
    
    const url = `${window.location.origin}/campaign/${campaign.publicKey.toString()}`;
    const text = `Check out this amazing campaign: "${campaign.title}"`;
    
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({
        title: campaign.title,
        text: text,
        url: url,
      })) {
        await navigator.share({
          title: campaign.title,
          text: text,
          url: url,
        });
        showSuccess('Shared!', 'Campaign has been shared successfully.');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        showSuccess('Link Copied!', 'Campaign link has been copied to your clipboard.');
      }
    } catch (error: any) {
      // Handle different error types
      if (error.name === 'AbortError') {
        // User canceled the share - this is normal, no need to show error
        console.log('Share canceled by user');
      } else if (error.name === 'NotAllowedError') {
        showError('Share Failed', 'Sharing is not allowed. Link copied to clipboard instead.');
        try {
          await navigator.clipboard.writeText(url);
          showSuccess('Link Copied!', 'Campaign link has been copied to your clipboard.');
        } catch (clipboardError) {
          showError('Copy Failed', 'Failed to copy link to clipboard. Please try again.');
        }
      } else {
        console.error('Share error:', error);
        // Fallback to clipboard on any other error
        try {
          await navigator.clipboard.writeText(url);
          showSuccess('Link Copied!', 'Campaign link has been copied to your clipboard.');
        } catch (clipboardError) {
          showError('Share Failed', 'Failed to share or copy link. Please try again.');
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const formatSOL = (amount: BN) => {
    return (amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2);
  };

  const getProgressPercentage = (current: BN, goal: BN) => {
    if (goal.isZero()) return 0;
    return Math.min((current.toNumber() / goal.toNumber()) * 100, 100);
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

  const getFilteredCampaigns = () => {
    let filtered;
    switch (filter) {
      case 'active':
        filtered = campaigns.filter(c => c.isActive && !isExpired(c.deadline));
        break;
      case 'successful':
        filtered = campaigns.filter(c => getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100);
        break;
      case 'ending-soon':
        filtered = campaigns.filter(c => {
          const daysLeft = getDaysLeft(c.deadline);
          return c.isActive && daysLeft <= 7 && daysLeft > 0;
        });
        break;
      default:
        filtered = campaigns;
    }

    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      filtered = filtered.filter(campaign => 
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredCampaigns = getFilteredCampaigns();

  if (!connected) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
              <RocketLaunchIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <BoxReveal boxColor="#8B5CF6" duration={0.5}>
              <h2 className="text-3xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
            </BoxReveal>
            <BoxReveal boxColor="#8B5CF6" duration={0.5}>
              <p className="text-muted-foreground text-lg">
                Connect your wallet to explore and support amazing campaigns
              </p>
            </BoxReveal>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search campaigns by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 text-lg"
            />
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="bg-background/50 backdrop-blur-sm"
            >
              Clear
            </Button>
          )}
        </div>
        
        {searchQuery && (
          <div className="text-center text-sm text-muted-foreground mb-6">
            {getFilteredCampaigns().length} campaigns found for "{searchQuery}"
          </div>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="flex space-x-1 bg-muted/20 rounded-xl p-1">
          {[
            { key: 'all', label: 'All Campaigns', icon: ChartBarIcon },
            { key: 'active', label: 'Active', icon: FireIcon },
            { key: 'successful', label: 'Successful', icon: RocketLaunchIcon },
            { key: 'ending-soon', label: 'Ending Soon', icon: ClockIcon },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(key as any)}
              className="rounded-lg"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Campaigns Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {filteredCampaigns.length === 0 ? (
          searchQuery ? (
            <AnimatedCard className="p-12 text-center">
              <div className="text-muted-foreground mb-6">
                <MagnifyingGlassIcon className="w-20 h-20 mx-auto opacity-50" />
              </div>
              <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                <h3 className="text-3xl font-bold text-foreground mb-4">No campaigns found</h3>
              </BoxReveal>
              <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
                  No campaigns match your search for "<span className="text-primary font-semibold">{searchQuery}</span>". 
                  Try adjusting your search terms or browse all campaigns.
                </p>
              </BoxReveal>
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="bg-background/50 backdrop-blur-sm"
                >
                  Clear Search
                </Button>
                <Button 
                  onClick={() => {setSearchQuery(''); setFilter('all');}}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                >
                  Browse All Campaigns
                </Button>
              </div>
            </AnimatedCard>
          ) : (
            <AnimatedCard className="p-12 text-center">
              <div className="text-muted-foreground mb-6">
                <ChartBarIcon className="w-20 h-20 mx-auto opacity-50" />
              </div>
              <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                <h3 className="text-3xl font-bold text-foreground mb-4">No Campaigns Found</h3>
              </BoxReveal>
              <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                <p className="text-muted-foreground mb-8 text-lg">
                  {filter === 'all' 
                    ? 'No campaigns have been created yet. Be the first to start a campaign!'
                    : `No ${filter.replace('-', ' ')} campaigns found. Try a different filter.`
                  }
                </p>
              </BoxReveal>
            </AnimatedCard>
          )
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign, index) => {
              const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
              const expired = isExpired(campaign.deadline);
              const daysLeft = getDaysLeft(campaign.deadline);
              const campaignKey = campaign.publicKey.toString();
              const isGoalReached = progress >= 100;
              
              return (
                <motion.div
                  key={campaignKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <AnimatedCard className="group relative overflow-hidden h-full hover:shadow-xl transition-all duration-300">
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge 
                        variant={expired ? "destructive" : isGoalReached ? "secondary" : "default"} 
                        className="text-xs font-medium"
                      >
                        {expired ? 'Expired' : isGoalReached ? 'Successful' : campaign.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Campaign Header */}
                    <div className="h-48 relative overflow-hidden">
                      {/* Background Image or Gradient */}
                      {campaign.metadataUri ? (
                        <>
                          <img 
                            src={campaign.metadataUri} 
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to gradient if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20"
                            style={{ display: 'none' }}
                            onLoad={(e) => {
                              // Show gradient if image fails
                              const img = (e.target as HTMLElement).parentElement?.querySelector('img');
                              if (img && !img.complete) {
                                (e.target as HTMLElement).style.display = 'block';
                              }
                            }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-16">
                        <BoxReveal boxColor="#FFFFFF" duration={0.5}>
                          <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{campaign.title}</h3>
                        </BoxReveal>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <UserIcon className="h-4 w-4" />
                          <UserProfileModal userAddress={campaign.creator.toString()}>
                            <span className="font-mono hover:text-white cursor-pointer transition-colors">
                              {campaign.creator.toString().slice(0, 4)}...{campaign.creator.toString().slice(-4)}
                            </span>
                          </UserProfileModal>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 flex flex-col flex-1">
                      <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                        <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{campaign.description}</p>
                      </BoxReveal>

                      {/* Progress Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <BoxReveal boxColor="#10B981" duration={0.5}>
                              <div className="text-xl font-bold text-foreground">
                                {formatSOL(campaign.donatedAmount)} SOL
                              </div>
                            </BoxReveal>
                            <div className="text-sm text-muted-foreground">
                              of {formatSOL(campaign.goalAmount)} SOL
                            </div>
                          </div>
                          <div className="text-right">
                            <BoxReveal boxColor="#3B82F6" duration={0.5}>
                              <div className="text-lg font-semibold text-primary">
                                {progress.toFixed(0)}%
                              </div>
                            </BoxReveal>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {expired ? 'Expired' : `${daysLeft} days left`}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-muted/30 rounded-full h-3">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>

                      {/* Donation Section - Only visible on hover */}
                      {!expired && campaign.isActive && !isGoalReached && (
                        <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out space-y-3 pt-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Amount (SOL)"
                              value={donationAmounts[campaignKey] || ''}
                              onChange={(e) => setDonationAmounts(prev => ({
                                ...prev,
                                [campaignKey]: e.target.value
                              }))}
                              className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary backdrop-blur-sm"
                              step="0.01"
                              min="0"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleDonate(campaignKey)}
                              disabled={donatingTo === campaignKey || !donationAmounts[campaignKey]}
                              className="bg-primary hover:bg-primary/90 min-w-[80px] backdrop-blur-sm"
                            >
                              {donatingTo === campaignKey ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <HeartIcon className="h-4 w-4 mr-1" />
                                  Donate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Link 
                          to={`/campaign/${campaignKey}`}
                          className="flex-1"
                        >
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleShare(campaign)}
                          disabled={isSharing}
                          className="px-3"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="relative h-64 rounded-t-2xl overflow-hidden">
              {/* Background Image or Gradient */}
              {selectedCampaign.metadataUri ? (
                <>
                  <img 
                    src={selectedCampaign.metadataUri} 
                    alt={selectedCampaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.gradient-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div 
                    className="gradient-fallback absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/30 to-primary/30"
                    style={{ display: 'none' }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/30 to-primary/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCampaign(null)}
                className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
              
              <div className="absolute bottom-6 left-6 right-6">
                <BoxReveal boxColor="#FFFFFF" duration={0.5}>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedCampaign.title}</h2>
                </BoxReveal>
                <div className="flex items-center gap-3 text-white/80">
                  <UserIcon className="h-5 w-5" />
                  <UserProfileModal userAddress={selectedCampaign.creator.toString()}>
                    <span className="font-mono text-sm hover:text-white cursor-pointer transition-colors">
                      {selectedCampaign.creator.toString()}
                    </span>
                  </UserProfileModal>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Status and Stats */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={isExpired(selectedCampaign.deadline) ? "destructive" : 
                          getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount) >= 100 ? "secondary" : "default"} 
                  className="text-sm px-3 py-1"
                >
                  {isExpired(selectedCampaign.deadline) ? 'Expired' : 
                   getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount) >= 100 ? 'Successful' : 
                   selectedCampaign.isActive ? 'Active' : 'Inactive'}
                </Badge>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {isExpired(selectedCampaign.deadline) ? 'Expired' : `${getDaysLeft(selectedCampaign.deadline)} days left`}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                  <h3 className="text-lg font-semibold text-foreground mb-3">About This Campaign</h3>
                </BoxReveal>
                <p className="text-muted-foreground leading-relaxed">{selectedCampaign.description}</p>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-4">
                <AnimatedCard className="p-4 text-center">
                  <BoxReveal boxColor="#10B981" duration={0.5}>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {formatSOL(selectedCampaign.donatedAmount)}
                    </div>
                  </BoxReveal>
                  <div className="text-sm text-muted-foreground">SOL Raised</div>
                </AnimatedCard>
                
                <AnimatedCard className="p-4 text-center">
                  <BoxReveal boxColor="#3B82F6" duration={0.5}>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount).toFixed(0)}%
                    </div>
                  </BoxReveal>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </AnimatedCard>
                
                <AnimatedCard className="p-4 text-center">
                  <BoxReveal boxColor="#F97316" duration={0.5}>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {formatSOL(selectedCampaign.goalAmount)}
                    </div>
                  </BoxReveal>
                  <div className="text-sm text-muted-foreground">Goal</div>
                </AnimatedCard>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-4">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              {/* Donation Section */}
              {!isExpired(selectedCampaign.deadline) && selectedCampaign.isActive && 
               getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount) < 100 && (
                <AnimatedCard className="p-6 bg-primary/5 border-primary/20">
                  <BoxReveal boxColor="#8B5CF6" duration={0.5}>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <HeartIcon className="h-5 w-5 text-primary" />
                      Support This Campaign
                    </h3>
                  </BoxReveal>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Donation Amount (SOL)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={modalDonationAmount}
                        onChange={(e) => setModalDonationAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-lg"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <Button
                      onClick={handleModalDonate}
                      disabled={donatingTo === selectedCampaign.publicKey.toString() || !modalDonationAmount}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 text-lg"
                    >
                      {donatingTo === selectedCampaign.publicKey.toString() ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processing Donation...
                        </div>
                      ) : (
                        <>
                          <HeartIcon className="h-5 w-5 mr-2" />
                          Donate {modalDonationAmount ? `${modalDonationAmount} SOL` : 'Now'}
                        </>
                      )}
                    </Button>
                  </div>
                </AnimatedCard>
              )}

              {/* Campaign Completed */}
              {(isExpired(selectedCampaign.deadline) || getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount) >= 100) && (
                <AnimatedCard className="p-6 bg-green-500/10 border-green-500/20">
                  <div className="flex items-center justify-center gap-3 text-green-400">
                    <CheckCircleIcon className="h-6 w-6" />
                    <span className="text-lg font-semibold">
                      {getProgressPercentage(selectedCampaign.donatedAmount, selectedCampaign.goalAmount) >= 100 ? 
                       'Campaign Successfully Funded!' : 'Campaign Has Ended'}
                    </span>
                  </div>
                </AnimatedCard>
              )}

              {/* Share Section */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedCampaign)}
                  disabled={isSharing}
                  className="flex-1"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  {isSharing ? 'Sharing...' : 'Share Campaign'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCampaign(null)}
                  className="px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};