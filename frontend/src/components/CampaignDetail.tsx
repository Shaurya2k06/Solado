import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AnimatedCard } from './ui/animated-card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import SimpleUserProfile from './SimpleUserProfile';
import { 
  HeartIcon,
  ShareIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  UserIcon,
  ArrowLeftIcon,
  LinkIcon
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

const CampaignDetail = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const { program } = useProgramContext();
  const { showSuccess, showError } = useNotifications();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId, program]);

  const fetchCampaign = async () => {
    if (!program || !campaignId) {
      setLoading(false);
      return;
    }

    try {
      const campaignPubkey = new PublicKey(campaignId);
      const campaignAccount = await (program.account as any).campaign.fetch(campaignPubkey);
      
      setCampaign({
        publicKey: campaignPubkey,
        creator: campaignAccount.creator,
        title: campaignAccount.title,
        description: campaignAccount.description,
        goalAmount: campaignAccount.goalAmount ? new BN(campaignAccount.goalAmount) : new BN(0),
        donatedAmount: campaignAccount.donatedAmount ? new BN(campaignAccount.donatedAmount) : new BN(0),
        deadline: campaignAccount.deadline ? new BN(campaignAccount.deadline) : new BN(0),
        metadataUri: campaignAccount.metadataUri,
        isActive: campaignAccount.isActive,
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      showError('Campaign Not Found', 'The requested campaign could not be found or has been deleted.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!program || !publicKey || !campaign || !donationAmount) return;
    
    try {
      setDonating(true);
      const amountLamports = Math.floor(parseFloat(donationAmount) * LAMPORTS_PER_SOL);

      if (amountLamports <= 0) {
        showError('Invalid Amount', 'Please enter a valid donation amount');
        return;
      }

      // Generate a unique timestamp for this donation
      const timestamp = Date.now();
      
      // Convert timestamp to 8-byte little-endian buffer (same as Rust's .to_le_bytes())
      const timestampBuffer = Buffer.alloc(8);
      timestampBuffer.writeBigInt64LE(BigInt(timestamp), 0);

      const [donationRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('donation'),
          campaign.publicKey.toBuffer(),
          publicKey.toBuffer(),
          timestampBuffer,
        ],
        program.programId
      );

      const tx = await program.methods
        .donate(new BN(amountLamports), new BN(timestamp))
        .accounts({
          campaign: campaign.publicKey,
          donor: publicKey,
          donationRecord: donationRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Donation transaction:', tx);

      // Clear donation amount and refresh campaign
      setDonationAmount('');
      await fetchCampaign();
      showSuccess('Donation Successful!', `Your donation of ${donationAmount} SOL has been processed successfully.`);
    } catch (error: any) {
      console.error('Donation failed:', error);
      showError('Donation Failed', error.message || 'Failed to process donation. Please try again.');
    } finally {
      setDonating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Link Copied!', 'Campaign link has been copied to clipboard.');
    } catch (error) {
      showError('Copy Failed', 'Failed to copy link to clipboard.');
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: LinkIcon,
      action: () => copyToClipboard(window.location.href),
    },
    {
      name: 'Share on Twitter',
      icon: ShareIcon,
      action: () => {
        const text = `Check out this amazing campaign: "${campaign?.title}" - Help them reach their goal! 🚀`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
      },
    },
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted/20 rounded w-1/4"></div>
            <div className="h-96 bg-muted/20 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted/20 rounded w-3/4"></div>
              <div className="h-4 bg-muted/20 rounded"></div>
              <div className="h-4 bg-muted/20 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AnimatedCard className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-4">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </AnimatedCard>
      </div>
    );
  }

  const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
  const expired = isExpired(campaign.deadline);
  const daysLeft = getDaysLeft(campaign.deadline);
  const isGoalReached = progress >= 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Campaign Image and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AnimatedCard className="overflow-hidden">
                <div className="h-96 relative">
                  {campaign.metadataUri ? (
                    <img 
                      src={campaign.metadataUri} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center">
                      <TrophyIcon className="h-24 w-24 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge 
                      variant={expired ? "destructive" : isGoalReached ? "secondary" : "default"}
                      className="text-sm font-medium"
                    >
                      {expired ? 'Expired' : isGoalReached ? 'Successful' : campaign.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>

            {/* Campaign Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <AnimatedCard className="p-6">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                      {campaign.title}
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <SimpleUserProfile userAddress={campaign.creator.toString()}>
                        <code className="text-sm font-mono text-foreground hover:text-primary cursor-pointer transition-colors">
                          {campaign.creator.toString().slice(0, 8)}...{campaign.creator.toString().slice(-8)}
                        </code>
                      </SimpleUserProfile>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          </div>

          {/* Donation Panel */}
          <div className="space-y-6">
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <AnimatedCard className="p-6">
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Progress</span>
                      <span className="text-sm font-bold text-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-3">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-green-500">
                        {formatSOL(campaign.donatedAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Raised</p>
                    </div>
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrophyIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-blue-500">
                        {formatSOL(campaign.goalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Goal</p>
                    </div>
                  </div>

                  {/* Time Left */}
                  <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {expired ? (
                          `Ended ${Math.abs(daysLeft)} days ago`
                        ) : daysLeft === 0 ? (
                          'Ending today'
                        ) : (
                          `${daysLeft} days remaining`
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(campaign.deadline.toNumber() * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>

            {/* Donation Form */}
            {!expired && campaign.isActive && !isGoalReached && connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <AnimatedCard className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-foreground">Support This Campaign</h3>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Donation Amount (SOL)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="w-full px-4 py-3 text-lg bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        step="0.01"
                        min="0"
                      />
                      
                      <Button
                        onClick={handleDonate}
                        disabled={donating || !donationAmount}
                        className="w-full bg-primary hover:bg-primary/90 h-12"
                      >
                        {donating ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <HeartIcon className="h-5 w-5 mr-2" />
                            Donate Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            )}

            {/* Share Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AnimatedCard className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Share Campaign</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {shareOptions.map((option) => (
                      <Button
                        key={option.name}
                        variant="outline"
                        onClick={option.action}
                        className="justify-start"
                      >
                        <option.icon className="h-4 w-4 mr-2" />
                        {option.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
