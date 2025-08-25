import { useState, useRef, useEffect } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useProgramContext } from '../contexts/ProgramContext';
import { AnimatedCard } from './ui/animated-card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import {
  UserIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  HeartIcon,
  StarIcon,
  SparklesIcon,
  ExclamationTriangleIcon
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

interface DonationRecord {
  donor: PublicKey;
  campaign: PublicKey;
  amount: BN;
  timestamp: BN;
}

interface UserStats {
  totalCampaigns: number;
  activeCampaigns: number;
  successfulCampaigns: number;
  totalRaised: BN;
  totalDonated: BN;
  donationCount: number;
  memberSince: string;
}

interface UserProfileHoverProps {
  userAddress: string;
  children: React.ReactNode;
  className?: string;
}

// Global cache to avoid repeated requests
const userDataCache = new Map<string, { data: UserStats | null; campaigns: Campaign[]; timestamp: number; error?: boolean }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

// Global request queue to prevent concurrent requests for the same user
const activeRequests = new Set<string>();

const UserProfileHover = ({ userAddress, children, className = '' }: UserProfileHoverProps) => {
  const { program } = useProgramContext();
  const [isVisible, setIsVisible] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchUserData = async () => {
    if (!program || loading || activeRequests.has(userAddress)) return;
    
    // Check cache first
    const cached = userDataCache.get(userAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setUserStats(cached.data);
      setUserCampaigns(cached.campaigns);
      setError(cached.error || false);
      return;
    }

    activeRequests.add(userAddress);
    setLoading(true);
    setError(false);
    
    try {
      // Add a small delay to prevent rapid requests
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      
      // Fetch user's created campaigns with error handling
      let userCreatedCampaigns: Campaign[] = [];
      try {
        const allCampaigns = await (program.account as any).campaign.all();
        userCreatedCampaigns = allCampaigns
          .filter((account: any) => account.account.creator.toString() === userAddress)
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
          })) as Campaign[];
      } catch (campaignError) {
        console.warn('Error fetching user campaigns:', campaignError);
        // Continue with empty campaigns array
      }

      // Fetch user's donation records with error handling
      let userDonations: DonationRecord[] = [];
      try {
        const allDonations = await (program.account as any).donationRecord.all([
          {
            memcmp: {
              offset: 8,
              bytes: userAddress,
            },
          },
        ]);

        userDonations = allDonations.map((record: any) => ({
          donor: record.account.donor,
          campaign: record.account.campaign,
          amount: new BN(record.account.amount),
          timestamp: new BN(record.account.timestamp),
        })) as DonationRecord[];
      } catch (donationError) {
        console.warn('Error fetching user donations:', donationError);
        // Continue with empty donations array
      }

      // Calculate stats
      const totalCampaigns = userCreatedCampaigns.length;
      const activeCampaigns = userCreatedCampaigns.filter(c => c.isActive && !isExpired(c.deadline)).length;
      const successfulCampaigns = userCreatedCampaigns.filter(c => 
        getProgressPercentage(c.donatedAmount, c.goalAmount) >= 100
      ).length;
      
      const totalRaised = userCreatedCampaigns.reduce((sum, campaign) => 
        sum.add(campaign.donatedAmount), new BN(0)
      );
      
      const totalDonated = userDonations.reduce((sum, donation) => 
        sum.add(donation.amount), new BN(0)
      );

      const stats: UserStats = {
        totalCampaigns,
        activeCampaigns,
        successfulCampaigns,
        totalRaised,
        totalDonated,
        donationCount: userDonations.length,
        memberSince: 'Recent'
      };

      const topCampaigns = userCreatedCampaigns.slice(0, 3);

      // Cache the results
      userDataCache.set(userAddress, {
        data: stats,
        campaigns: topCampaigns,
        timestamp: Date.now(),
        error: false
      });

      setUserStats(stats);
      setUserCampaigns(topCampaigns);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(true);
      
      // Cache the error state
      userDataCache.set(userAddress, {
        data: null,
        campaigns: [],
        timestamp: Date.now(),
        error: true
      });
    } finally {
      setLoading(false);
      activeRequests.delete(userAddress);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Clear any existing timeout
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top 
    });
    setIsVisible(true);
    
    // Debounce the data fetch
    hoverTimeout.current = setTimeout(() => {
      fetchUserData();
    }, 300); // 300ms delay before fetching data
  };

  const handleMouseLeave = () => {
    // Clear timeout if user leaves before delay
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

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

  const getUserBadges = (stats: UserStats) => {
    const badges = [];
    
    if (stats.totalCampaigns >= 5) {
      badges.push({ name: 'Creator', icon: TrophyIcon, color: 'bg-yellow-500', description: '5+ Campaigns' });
    }
    
    if (stats.successfulCampaigns >= 3) {
      badges.push({ name: 'Successful', icon: StarIcon, color: 'bg-green-500', description: '3+ Successful' });
    }
    
    if (stats.totalRaised.toNumber() >= 10 * LAMPORTS_PER_SOL) {
      badges.push({ name: 'Fundraiser', icon: CurrencyDollarIcon, color: 'bg-blue-500', description: '10+ SOL Raised' });
    }
    
    if (stats.donationCount >= 10) {
      badges.push({ name: 'Supporter', icon: HeartIcon, color: 'bg-pink-500', description: '10+ Donations' });
    }
    
    if (stats.totalDonated.toNumber() >= 5 * LAMPORTS_PER_SOL) {
      badges.push({ name: 'Generous', icon: SparklesIcon, color: 'bg-purple-500', description: '5+ SOL Donated' });
    }

    return badges;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <div
        className={`inline-block cursor-pointer ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* Hover Card Portal */}
      {isVisible && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y - 20}px`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatedCard className="w-80 p-6 bg-background/95 backdrop-blur-xl border shadow-2xl pointer-events-auto">
              {loading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted/20 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted/20 rounded"></div>
                      <div className="h-3 bg-muted/20 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Unable to load profile</p>
                  <p className="text-xs text-muted-foreground">Rate limited - try again later</p>
                </div>
              ) : userStats ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {truncateAddress(userAddress)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Member since {userStats.memberSince}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  {getUserBadges(userStats).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {getUserBadges(userStats).map((badge, index) => (
                        <div
                          key={index}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${badge.color}`}
                          title={badge.description}
                        >
                          <badge.icon className="h-3 w-3" />
                          {badge.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <p className="font-bold text-primary">{userStats.totalCampaigns}</p>
                      <p className="text-muted-foreground">Campaigns</p>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <p className="font-bold text-green-500">{formatSOL(userStats.totalRaised)}</p>
                      <p className="text-muted-foreground">SOL Raised</p>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <p className="font-bold text-blue-500">{userStats.donationCount}</p>
                      <p className="text-muted-foreground">Donations</p>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <p className="font-bold text-purple-500">{formatSOL(userStats.totalDonated)}</p>
                      <p className="text-muted-foreground">SOL Donated</p>
                    </div>
                  </div>

                  {/* Recent Campaigns */}
                  {userCampaigns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Recent Campaigns</p>
                      <div className="space-y-1">
                        {userCampaigns.map((campaign, index) => {
                          const progress = getProgressPercentage(campaign.donatedAmount, campaign.goalAmount);
                          return (
                            <div key={index} className="p-2 bg-muted/10 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-foreground truncate flex-1">
                                  {campaign.title}
                                </p>
                                <Badge 
                                  variant={campaign.isActive ? "default" : "secondary"} 
                                  className="text-xs py-0 px-1"
                                >
                                  {progress >= 100 ? 'Success' : campaign.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="w-full bg-muted/30 rounded-full h-1">
                                <div
                                  className="bg-gradient-to-r from-primary to-accent h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      Click to view full profile
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              )}
            </AnimatedCard>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default UserProfileHover;
