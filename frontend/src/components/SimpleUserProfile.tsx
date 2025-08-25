import { useState } from 'react';
import { AnimatedCard } from './ui/animated-card';
import { motion } from 'framer-motion';
import {
  UserIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';

interface SimpleUserProfileProps {
  userAddress: string;
  children: React.ReactNode;
  className?: string;
}

const SimpleUserProfile = ({ userAddress, children, className = '' }: SimpleUserProfileProps) => {
  const { showSuccess, showError } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top 
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
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

      {/* Simple Hover Card */}
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
            <AnimatedCard className="w-60 p-4 bg-background/95 backdrop-blur-xl border shadow-2xl pointer-events-auto">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {truncateAddress(userAddress)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solana Address
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 border-t border-border/50">
                  <button
                    onClick={copyAddress}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3" />
                    Copy Address
                  </button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Click to copy full address
                  </p>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default SimpleUserProfile;
