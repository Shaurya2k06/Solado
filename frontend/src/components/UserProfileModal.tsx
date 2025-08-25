import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useProgramContext } from '../contexts/ProgramContext';
import { useNotifications } from '../contexts/NotificationContext';
import { AnimatedCard } from './ui/animated-card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  UserIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  StarIcon,
  TrophyIcon,
  HeartIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface UserProfileModalProps {
  userAddress: string;
  children: React.ReactNode;
  className?: string;
}

interface UserStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRaised: number;
  totalDonated: number;
  campaignsSupported: number;
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Global cache to prevent multiple API calls
const userCache = new Map<string, { data: any; timestamp: number; stats: UserStats; badges: UserBadge[] }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const UserProfileModal = ({ userAddress, children, className = '' }: UserProfileModalProps) => {
  const { program } = useProgramContext();
  const { showSuccess, showError } = useNotifications();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalRaised: 0,
    totalDonated: 0,
    campaignsSupported: 0
  });
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define available badges
  const availableBadges: UserBadge[] = [
    {
      id: 'first-campaign',
      name: 'Campaign Creator',
      description: 'Created their first campaign',
      icon: <SparklesIcon className="h-4 w-4" />,
      earned: false,
      rarity: 'common'
    },
    {
      id: 'fundraising-hero',
      name: 'Fundraising Hero',
      description: 'Raised over 10 SOL',
      icon: <TrophyIcon className="h-4 w-4" />,
      earned: false,
      rarity: 'rare'
    },
    {
      id: 'generous-donor',
      name: 'Generous Donor',
      description: 'Donated over 5 SOL total',
      icon: <HeartIcon className="h-4 w-4" />,
      earned: false,
      rarity: 'rare'
    },
    {
      id: 'campaign-success',
      name: 'Success Story',
      description: 'Completed a successful campaign',
      icon: <CheckCircleIcon className="h-4 w-4" />,
      earned: false,
      rarity: 'common'
    },
    {
      id: 'community-supporter',
      name: 'Community Supporter',
      description: 'Supported 10+ campaigns',
      icon: <StarIcon className="h-4 w-4" />,
      earned: false,
      rarity: 'epic'
    }
  ];

  const openModal = () => {
    setIsModalOpen(true);
    if (!userCache.has(userAddress) || 
        Date.now() - userCache.get(userAddress)!.timestamp > CACHE_DURATION) {
      loadUserData();
    } else {
      const cached = userCache.get(userAddress)!;
      setUserStats(cached.stats);
      setUserBadges(cached.badges);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const loadUserData = async () => {
    if (!program || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user's campaigns using the correct API structure
      const allCampaigns = await (program.account as any).campaign.all();
      const userCampaigns = allCampaigns.filter(
        (campaign: any) => campaign.account.creator.toString() === userAddress
      );

      // Calculate stats
      let totalRaised = 0;
      let activeCampaigns = 0;
      let completedCampaigns = 0;

      userCampaigns.forEach((campaign: any) => {
        const raisedAmount = campaign.account.donatedAmount.toNumber() / LAMPORTS_PER_SOL;
        totalRaised += raisedAmount;

        if (campaign.account.isActive) {
          activeCampaigns++;
        } else {
          completedCampaigns++;
        }
      });

      // Calculate donation stats
      let totalDonated = 0;
      let campaignsSupported = 0;
      const supportedCampaigns = new Set();

      try {
        // For now, we'll use a simplified approach since donation tracking
        // might not be implemented in the current program structure
        // This can be enhanced when donation history is available
      } catch (donationError) {
        console.warn('Error calculating donation stats:', donationError);
      }

      campaignsSupported = supportedCampaigns.size;

      const stats: UserStats = {
        totalCampaigns: userCampaigns.length,
        activeCampaigns,
        completedCampaigns,
        totalRaised,
        totalDonated,
        campaignsSupported
      };

      // Calculate badges
      const badges = availableBadges.map(badge => {
        let earned = false;
        
        switch (badge.id) {
          case 'first-campaign':
            earned = stats.totalCampaigns > 0;
            break;
          case 'fundraising-hero':
            earned = stats.totalRaised >= 10;
            break;
          case 'generous-donor':
            earned = stats.totalDonated >= 5;
            break;
          case 'campaign-success':
            earned = stats.completedCampaigns > 0;
            break;
          case 'community-supporter':
            earned = stats.campaignsSupported >= 10;
            break;
        }

        return { ...badge, earned };
      });

      setUserStats(stats);
      setUserBadges(badges);

      // Cache the results
      userCache.set(userAddress, {
        data: userCampaigns,
        timestamp: Date.now(),
        stats,
        badges
      });

    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user profile data');
      showError('Profile Error', 'Failed to load user profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(userAddress);
      showSuccess('Address Copied!', 'User address has been copied to clipboard.');
    } catch (error) {
      showError('Copy Failed', 'Failed to copy address to clipboard.');
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getBadgeColor = (rarity: string, earned: boolean) => {
    if (!earned) return 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700';
    
    switch (rarity) {
      case 'common': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'rare': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'epic': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'legendary': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <>
      <div
        className={`inline-block cursor-pointer ${className}`}
        onClick={openModal}
      >
        {children}
      </div>

      {isModalOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatedCard className="bg-background/98 backdrop-blur-xl border shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">User Profile</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {truncateAddress(userAddress)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeModal}
                    className="h-8 w-8 p-0"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-sm text-muted-foreground">Loading profile...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadUserData}
                        className="mt-3"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <p className="text-2xl font-bold text-primary">{userStats.totalCampaigns}</p>
                          <p className="text-xs text-muted-foreground">Campaigns Created</p>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <p className="text-2xl font-bold text-green-600">{userStats.activeCampaigns}</p>
                          <p className="text-xs text-muted-foreground">Active Campaigns</p>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <p className="text-2xl font-bold text-blue-600">{userStats.totalRaised.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">SOL Raised</p>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <p className="text-2xl font-bold text-purple-600">{userStats.totalDonated.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">SOL Donated</p>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/10 rounded-lg border border-border/30">
                          <p className="text-lg font-semibold text-orange-600">{userStats.completedCampaigns}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center p-3 bg-muted/10 rounded-lg border border-border/30">
                          <p className="text-lg font-semibold text-pink-600">{userStats.campaignsSupported}</p>
                          <p className="text-xs text-muted-foreground">Supported</p>
                        </div>
                      </div>

                      {/* Badges Section */}
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <TrophyIcon className="h-4 w-4 text-primary" />
                          Achievements
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {userBadges.map((badge) => (
                            <div
                              key={badge.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${getBadgeColor(badge.rarity, badge.earned)} ${
                                badge.earned ? 'shadow-sm hover:shadow-md' : ''
                              }`}
                            >
                              <div className={`flex-shrink-0 ${badge.earned ? 'text-current' : 'opacity-40'}`}>
                                {badge.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-xs ${badge.earned ? 'text-current' : 'opacity-60'}`}>
                                  {badge.name}
                                </p>
                                <p className={`text-xs ${badge.earned ? 'opacity-75' : 'opacity-40'}`}>
                                  {badge.description}
                                </p>
                              </div>
                              {badge.earned && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs px-2 py-1 font-semibold ${
                                    badge.rarity === 'legendary' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                    badge.rarity === 'epic' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                    badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {badge.rarity}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-border/50">
                        <Button
                          onClick={copyAddress}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 hover:bg-primary/5"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          Copy Full Address
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </AnimatedCard>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default UserProfileModal;
