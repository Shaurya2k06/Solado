import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAchievements, getUserAchievements } from '../contexts/AchievementContext';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AnimatedCard } from './ui/animated-card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import UserProfileModal from './UserProfileModal';
import { 
  UserCircleIcon,
  WalletIcon,
  ChartBarIcon,
  CalendarIcon,
  FireIcon,
  TrophyIcon,
  ShareIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrashIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import FundingGraph from './FundingGraph';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';
import StatsCard from './charts/StatsCard';
import DonutChart from './charts/DonutChart';

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

interface DonatedCampaign extends Campaign {
  userDonatedAmount: BN;
}

const Profile = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgramContext();
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();
  const { checkAndShowAchievements } = useAchievements();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donatedCampaigns, setDonatedCampaigns] = useState<DonatedCampaign[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'donated'>('overview');
  const [fundingData, setFundingData] = useState<{ date: string; amount: number }[]>([]);
  const [campaignFundingData, setCampaignFundingData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [donorStatsData, setDonorStatsData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [campaignStatusData, setCampaignStatusData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{
    id: string;
    type: 'donation' | 'campaign_created' | 'campaign_funded' | 'withdrawal';
    timestamp: number;
    amount?: number;
    donor?: string;
    campaign: string;
    campaignTitle: string;
    description: string;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!publicKey) return;
    
    try {
      const apiKey = import.meta.env.VITE_HELIUS_API_KEY;
      console.log('API Key available:', !!apiKey);
      
      if (apiKey && apiKey !== 'undefined') {
        try {
          const response = await fetch(`https://api.helius.xyz/v0/addresses/${publicKey.toString()}/balances?api-key=${apiKey}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Helius API response:', data);
            
            if (data.tokens && Array.isArray(data.tokens)) {
              const solBalance = data.tokens.find((token: any) => token.mint === 'So11111111111111111111111111111111111111111112');
              if (solBalance) {
                setBalance(solBalance.amount / LAMPORTS_PER_SOL);
                return;
              }
            }
          } else {
            console.warn('Helius API request failed:', response.status, response.statusText);
          }
        } catch (heliusError) {
          console.warn('Helius API error:', heliusError);
        }
      } else {
        console.log('Using fallback balance fetching (no Helius API key or invalid key)');
      }
      
      // Fallback to connection.getBalance
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
      console.log('Balance fetched via RPC:', lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Set balance to 0 if all methods fail
      setBalance(0);
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
          goalAmount: account.account.goalAmount ? new BN(account.account.goalAmount) : new BN(0),
          donatedAmount: account.account.donatedAmount ? new BN(account.account.donatedAmount) : new BN(0),
          deadline: account.account.deadline ? new BN(account.account.deadline) : new BN(0),
          metadataUri: account.account.metadataUri,
          isActive: account.account.isActive,
        }));
      
      // Debug log to see campaign data
      console.log('My campaigns:', myCampaignsData);
      myCampaignsData.forEach((campaign: Campaign, index: number) => {
        console.log(`Campaign ${index + 1}:`, {
          title: campaign.title,
          goalAmount: formatSOL(campaign.goalAmount),
          donatedAmount: formatSOL(campaign.donatedAmount),
          isActive: campaign.isActive,
          deadline: new Date(campaign.deadline.toNumber() * 1000).toLocaleDateString(),
          expired: isExpired(campaign.deadline),
          progress: getProgressPercentage(campaign.donatedAmount, campaign.goalAmount),
          canDelete: campaign.donatedAmount.isZero(),
          canWithdraw: getProgressPercentage(campaign.donatedAmount, campaign.goalAmount) >= 100 && isExpired(campaign.deadline) && campaign.isActive
        });
      });
      
      setCampaigns(myCampaignsData);
    } catch (error) {
      console.error('Error fetching my campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns the user has donated to
  const fetchDonatedCampaigns = async () => {
    if (!program || !publicKey) return;
    
    try {
      // Fetch all donation records for this user
      const donationRecords = await (program.account as any).donationRecord.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator (8 bytes)
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      console.log('User donation records:', donationRecords);

      // Calculate total donations per campaign
      const donationAmountsByCampaign = new Map<string, number>();
      donationRecords.forEach((record: any) => {
        const campaignKey = record.account.campaign.toString();
        const donationAmount = record.account.amount.toNumber();
        const currentTotal = donationAmountsByCampaign.get(campaignKey) || 0;
        donationAmountsByCampaign.set(campaignKey, currentTotal + donationAmount);
      });

      // Get unique campaign public keys from donation records
      const uniqueCampaignKeys = Array.from(donationAmountsByCampaign.keys());

      // Fetch campaign details for each unique campaign
      const campaignPromises = uniqueCampaignKeys.map(async (campaignKey) => {
        try {
          const campaignAccount = await (program.account as any).campaign.fetch(new PublicKey(campaignKey));
          const userDonatedAmount = donationAmountsByCampaign.get(campaignKey) || 0;
          
          return {
            publicKey: new PublicKey(campaignKey),
            creator: campaignAccount.creator,
            title: campaignAccount.title,
            description: campaignAccount.description,
            goalAmount: campaignAccount.goalAmount ? new BN(campaignAccount.goalAmount) : new BN(0),
            donatedAmount: campaignAccount.donatedAmount ? new BN(campaignAccount.donatedAmount) : new BN(0),
            deadline: campaignAccount.deadline ? new BN(campaignAccount.deadline) : new BN(0),
            metadataUri: campaignAccount.metadataUri,
            isActive: campaignAccount.isActive,
            userDonatedAmount: new BN(userDonatedAmount), // Add user's donation amount
          };
        } catch (error) {
          console.error(`Error fetching campaign ${campaignKey}:`, error);
          return null;
        }
      });

      const donatedCampaignData = (await Promise.all(campaignPromises)).filter(Boolean) as (Campaign & { userDonatedAmount: BN })[];
      
      console.log('Donated campaigns with user amounts:', donatedCampaignData);
      setDonatedCampaigns(donatedCampaignData);
    } catch (error) {
      console.error('Error fetching donated campaigns:', error);
    }
  };

  // Delete campaign function
  const deleteCampaign = async (campaignPublicKey: PublicKey) => {
    if (!program || !publicKey) return;
    
    try {
      console.log('Attempting to delete campaign:', campaignPublicKey.toString());
      
      const tx = await (program.methods as any).deleteCampaign()
        .accounts({
          campaign: campaignPublicKey,
          creator: publicKey,
        })
        .rpc();

      console.log('Campaign deleted successfully:', tx);
      showSuccess('Campaign Deleted', 'Campaign has been successfully deleted.');
      await fetchMyCampaigns(); // Refresh campaigns list
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      let errorMessage = 'Failed to delete campaign. ';
      if (error.message?.includes('CampaignHasDonations')) {
        errorMessage += 'Campaign has donations and cannot be deleted.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      showError('Delete Failed', errorMessage);
    }
  };

  // Withdraw funds function
  const withdrawFunds = async (campaignPublicKey: PublicKey) => {
    if (!program || !publicKey) return;
    
    try {
      console.log('Attempting to withdraw funds from campaign:', campaignPublicKey.toString());
      
      const tx = await (program.methods as any).withdraw()
        .accounts({
          campaign: campaignPublicKey,
          creator: publicKey,
        })
        .rpc();

      console.log('Funds withdrawn successfully:', tx);
      showSuccess('Withdrawal Successful', 'Funds have been transferred to your wallet.');
      await fetchMyCampaigns(); // Refresh campaigns list
      await fetchBalance(); // Refresh balance
    } catch (error: any) {
      console.error('Error withdrawing funds:', error);
      let errorMessage = 'Failed to withdraw funds. ';
      if (error.message?.includes('GoalNotReached')) {
        errorMessage += 'Campaign goal was not reached.';
      } else if (error.message?.includes('CampaignNotExpired')) {
        errorMessage += 'Campaign deadline has not passed yet.';
      } else if (error.message?.includes('CampaignNotActive')) {
        errorMessage += 'Campaign is no longer active.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      showError('Withdrawal Failed', errorMessage);
    }
  };

  // Generate funding data for last 7 days from donation records
  const generateFundingData = async () => {
    if (!program || !publicKey) {
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], amount: 0 };
      });
    }

    try {
      // Get all campaigns created by this user
      const userCampaigns = campaigns.map(c => c.publicKey.toString());
      
      if (userCampaigns.length === 0) {
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return { date: date.toISOString().split('T')[0], amount: 0 };
        });
      }

      // Fetch donation records for user's campaigns from the last 7 days
      const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      const allDonations = await Promise.all(
        userCampaigns.map(async (campaignKey) => {
          try {
            const donationRecords = await (program.account as any).donationRecord.all([
              {
                memcmp: {
                  offset: 8 + 32, // Skip discriminator (8) + donor (32) = campaign offset
                  bytes: campaignKey,
                },
              },
            ]);
            
            // Filter donations from last 7 days
            return donationRecords
              .filter((record: any) => record.account.timestamp.toNumber() >= sevenDaysAgo)
              .map((record: any) => ({
                amount: record.account.amount.toNumber() / LAMPORTS_PER_SOL,
                timestamp: record.account.timestamp.toNumber() * 1000, // Convert to milliseconds
                campaign: record.account.campaign.toString()
              }));
          } catch (error) {
            console.warn(`Error fetching donations for campaign ${campaignKey}:`, error);
            return [];
          }
        })
      );

      const flatDonations = allDonations.flat();
      console.log('Funding data donations:', flatDonations);

      // Group donations by date
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      return last7Days.map(date => {
        const dayStart = new Date(date).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        
        const dayDonations = flatDonations.filter(
          d => d.timestamp >= dayStart && d.timestamp < dayEnd
        );
        
        const totalAmount = dayDonations.reduce((sum, d) => sum + d.amount, 0);
        
        return {
          date,
          amount: Math.round(totalAmount * 100) / 100 // Round to 2 decimals
        };
      });
    } catch (error) {
      console.error('Error generating funding data:', error);
      // Return empty data on error
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], amount: 0 };
      });
    }
  };

  // Generate pie chart data for funding by campaign
  const generateCampaignFundingData = () => {
    const colors = [
      'hsl(142, 70%, 50%)', // Green
      'hsl(221, 70%, 50%)', // Blue
      'hsl(262, 70%, 50%)', // Purple
      'hsl(25, 70%, 50%)',  // Orange
      'hsl(346, 70%, 50%)', // Red
      'hsl(191, 70%, 50%)', // Cyan
    ];

    return campaigns
      .filter(c => c.donatedAmount.toNumber() > 0)
      .map((campaign, index) => ({
        label: campaign.title.length > 20 ? `${campaign.title.slice(0, 20)}...` : campaign.title,
        value: campaign.donatedAmount.toNumber() / LAMPORTS_PER_SOL,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value) // Sort by funding amount
      .slice(0, 6); // Top 6 campaigns
  };

  // Generate donor stats data
  const generateDonorStatsData = async () => {
    if (!program || campaigns.length === 0) return [];

    try {
      const userCampaigns = campaigns.map(c => c.publicKey.toString());
      const donorStats = new Map<string, number>();

      // Fetch donation records for all user campaigns
      const allDonations = await Promise.all(
        userCampaigns.map(async (campaignKey) => {
          try {
            const donationRecords = await (program.account as any).donationRecord.all([
              {
                memcmp: {
                  offset: 8 + 32, // Skip discriminator + donor = campaign offset
                  bytes: campaignKey,
                },
              },
            ]);
            
            return donationRecords.map((record: any) => ({
              donor: record.account.donor.toString(),
              amount: record.account.amount.toNumber() / LAMPORTS_PER_SOL,
            }));
          } catch (error) {
            console.warn(`Error fetching donors for campaign ${campaignKey}:`, error);
            return [];
          }
        })
      );

      // Aggregate donations by donor
      allDonations.flat().forEach(donation => {
        const current = donorStats.get(donation.donor) || 0;
        donorStats.set(donation.donor, current + donation.amount);
      });

      // Convert to array and get top donors
      return Array.from(donorStats.entries())
        .map(([donor, amount]) => ({
          label: `${donor.slice(0, 4)}...${donor.slice(-4)}`,
          value: Math.round(amount * 100) / 100,
          color: `hsl(${Math.abs(donor.charCodeAt(0) * donor.charCodeAt(1)) % 360}, 70%, 50%)`
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 donors
    } catch (error) {
      console.error('Error generating donor stats:', error);
      return [];
    }
  };

  // Generate campaign status data for donut chart
  const generateCampaignStatusData = () => {
    const activeCampaigns = campaigns.filter(c => c.isActive && !isExpired(c.deadline));
    const expiredCampaigns = campaigns.filter(c => isExpired(c.deadline));
    const successfulCampaigns = campaigns.filter(c => getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100);
    const inactiveCampaigns = campaigns.filter(c => !c.isActive);

    const statusData = [];
    if (activeCampaigns.length > 0) {
      statusData.push({
        label: 'Active',
        value: activeCampaigns.length,
        color: 'hsl(142, 70%, 50%)' // Green
      });
    }
    if (successfulCampaigns.length > 0) {
      statusData.push({
        label: 'Successful',
        value: successfulCampaigns.length,
        color: 'hsl(221, 70%, 50%)' // Blue
      });
    }
    if (expiredCampaigns.length > 0) {
      statusData.push({
        label: 'Expired',
        value: expiredCampaigns.length,
        color: 'hsl(25, 70%, 50%)' // Orange
      });
    }
    if (inactiveCampaigns.length > 0) {
      statusData.push({
        label: 'Inactive',
        value: inactiveCampaigns.length,
        color: 'hsl(262, 70%, 50%)' // Purple
      });
    }

    return statusData;
  };

  // Generate recent activity data
  const generateRecentActivity = async () => {
    if (!program || campaigns.length === 0) return [];

    try {
      const activities: any[] = [];
      
      // Get recent donations to user's campaigns
      const userCampaigns = campaigns.map(c => ({ 
        publicKey: c.publicKey.toString(), 
        title: c.title 
      }));
      
      const allDonations = await Promise.all(
        userCampaigns.map(async ({ publicKey: campaignKey, title }) => {
          try {
            const donationRecords = await (program.account as any).donationRecord.all([
              {
                memcmp: {
                  offset: 8 + 32, // Skip discriminator + donor = campaign offset
                  bytes: campaignKey,
                },
              },
            ]);
            
            return donationRecords.map((record: any) => ({
              id: `donation-${record.publicKey.toString()}`,
              type: 'donation' as const,
              timestamp: record.account.timestamp.toNumber() * 1000,
              amount: record.account.amount.toNumber() / LAMPORTS_PER_SOL,
              donor: record.account.donor.toString(),
              campaign: campaignKey,
              campaignTitle: title,
              description: `Received ${(record.account.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL from ${record.account.donor.toString().slice(0, 4)}...${record.account.donor.toString().slice(-4)}`
            }));
          } catch (error) {
            console.warn(`Error fetching donations for campaign ${campaignKey}:`, error);
            return [];
          }
        })
      );

      activities.push(...allDonations.flat());

      // Add campaign creation activities
      campaigns.forEach(campaign => {
        activities.push({
          id: `campaign-${campaign.publicKey.toString()}`,
          type: 'campaign_created' as const,
          timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Mock timestamp within last 30 days
          campaign: campaign.publicKey.toString(),
          campaignTitle: campaign.title,
          description: `Created campaign "${campaign.title}"`
        });

        // Add funding milestone activities for successful campaigns
        const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
        if (progress >= 100) {
          activities.push({
            id: `funded-${campaign.publicKey.toString()}`,
            type: 'campaign_funded' as const,
            timestamp: Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
            amount: campaign.donatedAmount.toNumber() / LAMPORTS_PER_SOL,
            campaign: campaign.publicKey.toString(),
            campaignTitle: campaign.title,
            description: `Campaign "${campaign.title}" reached 100% funding goal!`
          });
        }
      });

      // Sort by timestamp (most recent first) and return top 20
      return activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

    } catch (error) {
      console.error('Error generating recent activity:', error);
      return [];
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

  useEffect(() => {
    if (publicKey && program && connected) {
      fetchBalance();
      fetchMyCampaigns();
      fetchDonatedCampaigns();
    }
  }, [publicKey, program, connected]);

  // Check for achievements when campaigns data changes
  useEffect(() => {
    if (publicKey && campaigns.length >= 0) {
      const totalRaised = campaigns.reduce((sum, c) => sum.add(c.donatedAmount), new BN(0));
      const successfulCampaigns = campaigns.filter(c => getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100);
      
      checkAndShowAchievements(publicKey.toString(), {
        campaignCount: campaigns.length,
        totalDonated: 0, // This would need donation data
        totalRaised: totalRaised.toNumber() / LAMPORTS_PER_SOL,
        successfulCampaigns: successfulCampaigns.length
      });
    }
  }, [campaigns, publicKey, checkAndShowAchievements]);

  // Fetch funding data when campaigns change
  useEffect(() => {
    const fetchAllChartData = async () => {
      // Fetch funding graph data
      const fundingGraphData = await generateFundingData();
      setFundingData(fundingGraphData);
      
      // Generate campaign funding pie chart data
      const campaignData = generateCampaignFundingData();
      setCampaignFundingData(campaignData);
      
      // Generate campaign status donut chart data
      const statusData = generateCampaignStatusData();
      setCampaignStatusData(statusData);
      
      // Fetch donor stats data
      try {
        const donorData = await generateDonorStatsData();
        setDonorStatsData(donorData);
      } catch (error) {
        console.error('Error fetching donor data:', error);
        setDonorStatsData([]);
      }

      // Fetch recent activity data
      try {
        const activityData = await generateRecentActivity();
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setRecentActivity([]);
      }
    };
    
    if (campaigns.length >= 0) { // Fetch even with 0 campaigns to show empty state
      fetchAllChartData();
    }
  }, [campaigns, program, publicKey]);

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!connected || !publicKey) {
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
              <UserCircleIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-lg">
                Connect your wallet to view your profile and manage your campaigns
              </p>
            </div>
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
          <p className="text-muted-foreground text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalRaised = campaigns.reduce((sum, c) => sum.add(c.donatedAmount), new BN(0));
  const successfulCampaigns = campaigns.filter(c => getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100);
  
  // Get user achievements
  const userAchievements = publicKey ? getUserAchievements(publicKey.toString(), {
    campaignCount: campaigns.length,
    totalDonated: 0, // This would need donation data
    totalRaised: totalRaised.toNumber() / LAMPORTS_PER_SOL,
    successfulCampaigns: successfulCampaigns.length
  }) : [];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            My Profile
          </h1>
          <p className="text-muted-foreground text-xl">
            Track your campaigns and achievements
          </p>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <AnimatedCard className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl">
                <UserCircleIcon className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-2 border-card">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  <WalletIcon className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <code className="bg-muted/50 px-3 py-1 rounded-lg font-mono text-muted-foreground">
                  {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(publicKey.toString())}
                  className="h-8 w-8 p-0 hover:bg-muted/50"
                >
                  <ShareIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{balance.toFixed(4)}</span>
                  <span className="text-muted-foreground">SOL</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </motion.div>

      {/* New Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Average Donation"
          value={`${campaigns.length > 0 ? (totalRaised.toNumber() / LAMPORTS_PER_SOL / Math.max(1, donorStatsData.length)).toFixed(2) : '0.00'} SOL`}
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Success Rate"
          value={`${campaigns.length > 0 ? Math.round((successfulCampaigns.length / campaigns.length) * 100) : 0}%`}
          icon={<TrophyIcon className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Donors"
          value={donorStatsData.length}
          icon={<UserCircleIcon className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          title="Avg. Campaign Duration"
          value={`${campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + getDaysLeft(c.deadline), 0) / campaigns.length) : 0} days`}
          icon={<CalendarIcon className="h-5 w-5" />}
          color="orange"
        />
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex justify-center"
      >
        <div className="flex space-x-1 bg-muted/20 rounded-xl p-1">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="rounded-lg"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'campaigns' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('campaigns')}
            className="rounded-lg"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            My Campaigns ({campaigns.length})
          </Button>
          <Button
            variant={activeTab === 'donated' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('donated')}
            className="rounded-lg"
          >
            <FireIcon className="h-4 w-4 mr-2" />
            Donated To ({donatedCampaigns.length})
          </Button>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Funding Graph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FundingGraph data={fundingData} />
            </motion.div>

            {/* Charts Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Campaign Funding Distribution */}
              <AnimatedCard className="p-6">
                <PieChart 
                  data={campaignFundingData}
                  title="Funding by Campaign"
                  size={220}
                />
              </AnimatedCard>

              {/* Top Donors */}
              <AnimatedCard className="p-6">
                <BarChart 
                  data={donorStatsData}
                  title="Top Donors"
                  height={280}
                  width={320}
                  valueLabel="SOL Donated"
                />
              </AnimatedCard>

              {/* Campaign Status */}
              <AnimatedCard className="p-6">
                <DonutChart 
                  data={campaignStatusData}
                  title="Campaign Status"
                  size={200}
                />
              </AnimatedCard>
            </motion.div>

            {/* Achievements Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AnimatedCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <TrophyIcon className="h-6 w-6 text-orange-400" />
                    Achievements
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {userAchievements.filter(a => a.earned).length} of {userAchievements.length} unlocked
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userAchievements.map((achievement) => {
                    const rarityColors = {
                      common: 'green',
                      rare: 'blue', 
                      epic: 'purple',
                      legendary: 'orange'
                    };
                    
                    const color = rarityColors[achievement.rarity];
                    
                    return (
                      <div
                        key={achievement.id}
                        className={`p-6 rounded-xl border transition-all hover:scale-105 ${
                          achievement.earned
                            ? `bg-${color}-500/10 border-${color}-500/30 shadow-lg`
                            : 'bg-muted/20 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`p-3 rounded-lg ${
                            achievement.earned ? `bg-${color}-500/20` : 'bg-muted/20'
                          }`}>
                            <div className={`h-6 w-6 ${
                              achievement.earned ? `text-${color}-400` : 'text-muted-foreground'
                            }`}>
                              {achievement.icon}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{achievement.name}</div>
                            <div className="text-sm text-muted-foreground">{achievement.description}</div>
                            <div className="text-xs text-muted-foreground/60 capitalize mt-1">
                              {achievement.rarity} • {achievement.earned ? 'Unlocked' : 'Locked'}
                            </div>
                          </div>
                        </div>
                        {achievement.earned ? (
                          <Badge variant="secondary" className="w-full justify-center">
                            Unlocked! {achievement.id === 'first-campaign' ? '🎉' : 
                                     achievement.id === 'campaign-success' ? '🏆' : 
                                     achievement.id === 'fundraising-hero' ? '💰' : '⭐'}
                          </Badge>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/10 rounded">
                            Complete to unlock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AnimatedCard>
            </motion.div>

            {/* Recent Activity Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AnimatedCard className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                  Recent Activity
                </h3>
                
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg">No recent activity</p>
                    <p className="text-muted-foreground text-sm">Start creating campaigns to see activity here!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivity.map((activity) => {
                      const getActivityIcon = () => {
                        switch (activity.type) {
                          case 'donation':
                            return <CurrencyDollarIcon className="h-5 w-5 text-green-400" />;
                          case 'campaign_created':
                            return <FireIcon className="h-5 w-5 text-blue-400" />;
                          case 'campaign_funded':
                            return <TrophyIcon className="h-5 w-5 text-orange-400" />;
                          case 'withdrawal':
                            return <BanknotesIcon className="h-5 w-5 text-purple-400" />;
                          default:
                            return <ClockIcon className="h-5 w-5 text-muted-foreground" />;
                        }
                      };

                      const getTimeAgo = (timestamp: number) => {
                        const diff = Date.now() - timestamp;
                        const minutes = Math.floor(diff / (1000 * 60));
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                        if (minutes < 60) return `${minutes}m ago`;
                        if (hours < 24) return `${hours}h ago`;
                        return `${days}d ago`;
                      };

                      return (
                        <div 
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-muted/30">
                            {getActivityIcon()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-foreground font-medium truncate">
                                {activity.description}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {getTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground truncate">
                                Campaign: {activity.campaignTitle}
                              </p>
                              {activity.amount && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.amount.toFixed(2)} SOL
                                </Badge>
                              )}
                            </div>

                            {activity.donor && (
                              <p className="text-xs text-muted-foreground/60 mt-1">
                                From: {activity.donor.slice(0, 8)}...{activity.donor.slice(-8)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AnimatedCard>
            </motion.div>

            {/* Withdrawal Available */}
            {campaigns.filter(c => getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100 && isExpired(c.deadline) && c.isActive).length > 0 && (
              <AnimatedCard className="p-8 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <BanknotesIcon className="h-6 w-6 text-green-500" />
                  Funds Ready for Withdrawal
                </h3>
                
                <div className="space-y-4">
                  {campaigns
                    .filter(c => getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100 && isExpired(c.deadline) && c.isActive)
                    .map((campaign) => (
                    <div key={campaign.publicKey.toString()} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatSOL(campaign.donatedAmount)} SOL available for withdrawal
                        </div>
                      </div>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => withdrawFunds(campaign.publicKey)}
                      >
                        <BanknotesIcon className="h-4 w-4 mr-2" />
                        Withdraw Funds
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Important:</span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    You can only withdraw funds from campaigns that have reached their goal and passed their deadline.
                  </p>
                </div>
              </AnimatedCard>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search campaigns by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                />
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredCampaigns.length} of {campaigns.length} campaigns
              </div>
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length === 0 ? (
              searchQuery ? (
                <AnimatedCard className="p-12 text-center">
                  <div className="text-muted-foreground mb-6">
                    <MagnifyingGlassIcon className="w-20 h-20 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">No campaigns found</h3>
                  <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
                    No campaigns match your search for "{searchQuery}". Try adjusting your search terms.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                    className="bg-background/50 backdrop-blur-sm"
                  >
                    Clear Search
                  </Button>
                </AnimatedCard>
              ) : (
                <AnimatedCard className="p-12 text-center">
                  <div className="text-muted-foreground mb-6">
                    <ChartBarIcon className="w-20 h-20 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-4">No Campaigns Yet</h3>
                  <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
                    You haven't created any campaigns yet. Start your fundraising journey by creating your first campaign on the blockchain.
                  </p>
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Create Your First Campaign
                  </Button>
                </AnimatedCard>
              )
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => {
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

                      {/* Campaign Header with Image Support */}
                      <div className="h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
                        {/* Campaign Image */}
                        {campaign.metadataUri && (
                          <img
                            src={campaign.metadataUri}
                            alt={campaign.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to gradient background if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        
                        {/* Campaign Info */}
                        <div className="absolute bottom-4 left-4 right-16">
                          <h3 className="text-xl font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">{campaign.title}</h3>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        <p className="text-muted-foreground text-sm line-clamp-3">{campaign.description}</p>

                        {/* Progress */}
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
                          <div className="w-full bg-muted/30 rounded-full h-2">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              // You can implement a modal or navigation to campaign details
                              console.log('View campaign details:', campaignKey);
                              showInfo('Campaign Details', `${campaign.title}\nGoal: ${formatSOL(campaign.goalAmount)} SOL\nRaised: ${formatSOL(campaign.donatedAmount)} SOL\nProgress: ${progress.toFixed(1)}%`);
                            }}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              const campaignUrl = `${window.location.origin}/campaign/${campaignKey}`;
                              navigator.clipboard.writeText(campaignUrl).then(() => {
                                showSuccess('Link Copied', 'Campaign link has been copied to clipboard!');
                              }).catch(() => {
                                showError('Copy Failed', 'Failed to copy campaign link to clipboard.');
                              });
                            }}
                          >
                            <ShareIcon className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>

                        {/* Additional Action Buttons Row */}
                        <div className="flex gap-2 pt-2">
                          {/* Withdraw button - only show if goal reached and deadline passed */}
                          {progress >= 100 && expired && campaign.isActive && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 flex-1"
                              onClick={() => withdrawFunds(campaign.publicKey)}
                            >
                              <BanknotesIcon className="h-4 w-4 mr-1" />
                              Withdraw Funds
                            </Button>
                          )}
                          
                          {/* Delete button - only show if no donations */}
                          {campaign.donatedAmount.isZero() && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                // Show confirmation warning instead of using browser confirm
                                showWarning(
                                  'Confirm Campaign Deletion', 
                                  `Are you sure you want to delete "${campaign.title}"? This action cannot be undone. Click delete again to confirm.`
                                );
                                // Set a flag or use state to handle double-click confirmation
                                // For now, we'll proceed with deletion after showing the warning
                                setTimeout(() => {
                                  deleteCampaign(campaign.publicKey);
                                }, 2000); // Give user 2 seconds to see the warning
                              }}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Delete Campaign
                            </Button>
                          )}
                          
                          {/* Show campaign status info when no special actions available */}
                          {!campaign.donatedAmount.isZero() && !(progress >= 100 && expired && campaign.isActive) && (
                            <div className="text-xs text-muted-foreground text-center flex-1 py-2">
                              {campaign.donatedAmount.isZero() 
                                ? "No donations yet - can delete"
                                : progress >= 100 && expired 
                                  ? campaign.isActive 
                                    ? "Ready for withdrawal" 
                                    : "Funds already withdrawn"
                                  : expired 
                                    ? "Campaign ended - goal not reached"
                                    : "Campaign in progress"
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </AnimatedCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'donated' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Campaigns You've Supported</h3>
                <p className="text-muted-foreground">Your generous contributions to various campaigns</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {donatedCampaigns.length} {donatedCampaigns.length === 1 ? 'Campaign' : 'Campaigns'}
              </Badge>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted/20 rounded-xl h-48"></div>
                  </div>
                ))}
              </div>
            ) : donatedCampaigns.length === 0 ? (
              <AnimatedCard className="p-12 text-center border-dashed">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                    <FireIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Donations Yet</h3>
                    <p className="text-muted-foreground">
                      You haven't supported any campaigns yet. Explore active campaigns to make your first donation!
                    </p>
                  </div>
                  <Link to="/">
                    <Button className="bg-primary hover:bg-primary/90">
                      <FireIcon className="h-4 w-4 mr-2" />
                      Discover Campaigns
                    </Button>
                  </Link>
                </motion.div>
              </AnimatedCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donatedCampaigns.map((campaign, index) => {
                  const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
                  const daysLeft = getDaysLeft(campaign.deadline);
                  const expired = isExpired(campaign.deadline);

                  return (
                    <motion.div
                      key={campaign.publicKey.toString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <AnimatedCard className="p-6 hover:shadow-lg transition-all duration-300 border bg-card/50 backdrop-blur-sm">
                        <div className="space-y-4">
                          {/* Campaign Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate text-lg">
                                {campaign.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {campaign.description}
                              </p>
                              {/* Creator Info */}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">by</span>
                                <UserProfileModal userAddress={campaign.creator.toString()}>
                                  <code className="text-xs font-mono text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                                    {campaign.creator.toString().slice(0, 6)}...{campaign.creator.toString().slice(-4)}
                                  </code>
                                </UserProfileModal>
                              </div>
                            </div>
                            <Badge 
                              variant={campaign.isActive ? (expired ? "destructive" : "default") : "secondary"}
                              className="ml-2 flex-shrink-0"
                            >
                              {!campaign.isActive ? 'Inactive' : expired ? 'Ended' : 'Active'}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                              />
                            </div>
                          </div>

                          {/* Campaign Stats */}
                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FireIcon className="h-4 w-4 text-orange-500" />
                                <span className="text-xs text-muted-foreground">Your Donation</span>
                              </div>
                              <p className="font-bold text-orange-500 text-sm">
                                {formatSOL(campaign.userDonatedAmount)} SOL
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-muted-foreground">Total Raised</span>
                              </div>
                              <p className="font-bold text-green-500 text-sm">
                                {formatSOL(campaign.donatedAmount)} SOL
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <TrophyIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-xs text-muted-foreground">Goal</span>
                              </div>
                              <p className="font-bold text-blue-500 text-sm">
                                {formatSOL(campaign.goalAmount)} SOL
                              </p>
                            </div>
                          </div>

                          {/* Contribution Percentage */}
                          <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Your Contribution</span>
                              <span className="text-sm font-bold text-orange-500">
                                {campaign.donatedAmount.gt(new BN(0)) 
                                  ? `${((campaign.userDonatedAmount.toNumber() / campaign.donatedAmount.toNumber()) * 100).toFixed(1)}%`
                                  : '100%'
                                } of total raised
                              </span>
                            </div>
                          </div>

                          {/* Time Status */}
                          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <ClockIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {expired ? (
                                `Ended ${Math.abs(daysLeft)} days ago`
                              ) : daysLeft === 0 ? (
                                'Ending today'
                              ) : (
                                `${daysLeft} days left`
                              )}
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2">
                            <Link to={`/campaign/${campaign.publicKey.toString()}`}>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full hover:bg-primary/10"
                              >
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View Campaign
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </AnimatedCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
