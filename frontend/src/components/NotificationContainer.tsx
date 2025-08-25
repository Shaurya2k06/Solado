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
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50/80 dark:border-green-800 dark:bg-green-950/50';
      case 'error':
        return 'border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-950/50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/80 dark:border-yellow-800 dark:bg-yellow-950/50';
      case 'info':
        return 'border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/50';
      default:
        return 'border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-950/50';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`relative max-w-sm w-full mx-auto rounded-xl border-2 p-4 shadow-lg backdrop-blur-sm ${getBorderColor()}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {notification.title}
              </p>
              {notification.message && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {notification.message}
                </p>
              )}
            </div>
            
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 p-1 hover:bg-background/50 rounded-full transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
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
    <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-hidden">
      <AnimatedList delay={0} className="space-y-2">
        {notifications.slice(0, 5).map((notification) => (
          <AnimatedListItem key={notification.id}>
            <NotificationItem notification={notification} />
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </div>
  );
};
