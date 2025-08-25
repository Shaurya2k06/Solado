import { createContext, useContext, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import {
  StarIcon,
  TrophyIcon,
  HeartIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementContextType {
  checkAndShowAchievements: (userAddress: string, stats: any) => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

const achievements: Achievement[] = [
  {
    id: 'first-campaign',
    name: 'Campaign Creator',
    description: 'Created their first campaign',
    icon: <SparklesIcon className="h-6 w-6" />,
    rarity: 'common'
  },
  {
    id: 'fundraising-hero',
    name: 'Fundraising Hero',
    description: 'Raised over 10 SOL',
    icon: <TrophyIcon className="h-6 w-6" />,
    rarity: 'rare'
  },
  {
    id: 'generous-donor',
    name: 'Generous Donor',
    description: 'Donated over 5 SOL total',
    icon: <HeartIcon className="h-6 w-6" />,
    rarity: 'rare'
  },
  {
    id: 'campaign-success',
    name: 'Success Story',
    description: 'Completed a successful campaign',
    icon: <CheckCircleIcon className="h-6 w-6" />,
    rarity: 'common'
  },
  {
    id: 'community-supporter',
    name: 'Community Supporter',
    description: 'Supported 10+ campaigns',
    icon: <StarIcon className="h-6 w-6" />,
    rarity: 'epic'
  }
];

// Store user achievements in localStorage
const getStoredAchievements = (userAddress: string): string[] => {
  const stored = localStorage.getItem(`achievements_${userAddress}`);
  return stored ? JSON.parse(stored) : [];
};

const storeAchievement = (userAddress: string, achievementId: string) => {
  const stored = getStoredAchievements(userAddress);
  if (!stored.includes(achievementId)) {
    stored.push(achievementId);
    localStorage.setItem(`achievements_${userAddress}`, JSON.stringify(stored));
  }
};

interface AchievementProviderProps {
  children: React.ReactNode;
}

export const AchievementProvider = ({ children }: AchievementProviderProps) => {
  const { addNotification } = useNotifications();

  const checkAchievement = useCallback((achievement: Achievement, stats: any): boolean => {
    switch (achievement.id) {
      case 'first-campaign':
        return stats.totalCampaigns > 0;
      case 'fundraising-hero':
        return stats.totalRaised >= 10;
      case 'generous-donor':
        return stats.totalDonated >= 5;
      case 'campaign-success':
        return stats.completedCampaigns > 0;
      case 'community-supporter':
        return stats.campaignsSupported >= 10;
      default:
        return false;
    }
  }, []);

  const showAchievementNotification = useCallback((achievement: Achievement) => {
    // Show custom achievement notification
    addNotification({
      type: 'success',
      title: '🎉 Achievement Unlocked!',
      message: `${achievement.name}: ${achievement.description}`,
      duration: 6000 // Show longer for achievements
    });
  }, [addNotification]);

  const checkAndShowAchievements = useCallback(async (userAddress: string, stats: any) => {
    const storedAchievements = getStoredAchievements(userAddress);
    
    for (const achievement of achievements) {
      if (!storedAchievements.includes(achievement.id) && checkAchievement(achievement, stats)) {
        storeAchievement(userAddress, achievement.id);
        showAchievementNotification(achievement);
        
        // Add a small delay between multiple achievements
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [checkAchievement, showAchievementNotification]);

  const value = {
    checkAndShowAchievements,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};

// Helper function to get user achievements for display
export const getUserAchievements = (userAddress: string, stats: any) => {
  const storedAchievements = getStoredAchievements(userAddress);
  
  return achievements.map(achievement => ({
    ...achievement,
    earned: storedAchievements.includes(achievement.id) && checkAchievementCondition(achievement, stats)
  }));
};

const checkAchievementCondition = (achievement: Achievement, stats: any): boolean => {
  switch (achievement.id) {
    case 'first-campaign':
      return stats.totalCampaigns > 0;
    case 'fundraising-hero':
      return stats.totalRaised >= 10;
    case 'generous-donor':
      return stats.totalDonated >= 5;
    case 'campaign-success':
      return stats.completedCampaigns > 0;
    case 'community-supporter':
      return stats.campaignsSupported >= 10;
    default:
      return false;
  }
};
