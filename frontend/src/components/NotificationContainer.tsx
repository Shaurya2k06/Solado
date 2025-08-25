import React from 'react';
import { AnimatedList, AnimatedListItem } from './magicui/animated-list';
import { useNotifications, type Notification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { removeNotification } = useNotifications();

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-cyan-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-background/95 dark:bg-gray-900/95',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-500/10',
          accent: 'bg-emerald-500/10'
        };
      case 'error':
        return {
          bg: 'bg-background/95 dark:bg-gray-900/95',
          border: 'border-red-500/30',
          glow: 'shadow-red-500/10',
          accent: 'bg-red-500/10'
        };
      case 'warning':
        return {
          bg: 'bg-background/95 dark:bg-gray-900/95',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/10',
          accent: 'bg-amber-500/10'
        };
      case 'info':
        return {
          bg: 'bg-background/95 dark:bg-gray-900/95',
          border: 'border-cyan-500/30',
          glow: 'shadow-cyan-500/10',
          accent: 'bg-cyan-500/10'
        };
      default:
        return {
          bg: 'bg-background/95 dark:bg-gray-900/95',
          border: 'border-gray-500/30',
          glow: 'shadow-gray-500/10',
          accent: 'bg-gray-500/10'
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative max-w-sm w-full rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-xl shadow-2xl ${styles.glow} overflow-hidden group`}
    >
      {/* Accent bar with subtle animation */}
      <motion.div 
        className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent.replace('bg-', 'bg-').replace('/10', '')}`}
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Success pulse effect */}
      {notification.type === 'success' && (
        <motion.div
          className="absolute inset-0 bg-emerald-500/5 rounded-2xl"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1, repeat: 2 }}
        />
      )}
      
      <div className="relative p-4">
        <div className="flex items-start space-x-3">
          <motion.div 
            className={`flex-shrink-0 mt-0.5 p-2 rounded-full ${styles.accent}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {getIcon()}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.p 
                  className="text-sm font-semibold text-white mb-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  {notification.title}
                </motion.p>
                {notification.message && (
                  <motion.p 
                    className="text-xs text-gray-300 leading-relaxed"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    {notification.message}
                  </motion.p>
                )}
              </div>
              
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 ml-3 p-1.5 hover:bg-white/10 rounded-full transition-all duration-200 group/btn opacity-60 hover:opacity-100"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 group-hover/btn:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-3 max-h-screen overflow-hidden pointer-events-none">
      <AnimatedList delay={100} className="space-y-3">
        {notifications.slice(0, 4).map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <AnimatedListItem>
              <NotificationItem notification={notification} />
            </AnimatedListItem>
          </div>
        ))}
      </AnimatedList>
    </div>
  );
};
