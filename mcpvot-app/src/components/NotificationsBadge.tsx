'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Notification {
    type: string;
    cast?: {
        hash: string;
        text: string;
        author: {
            username: string;
            displayName: string;
        };
    };
    reactor?: {
        username: string;
        displayName: string;
    };
    timestamp: string;
}

interface NotificationsResponse {
    success: boolean;
    notifications: Notification[];
}

interface NotificationsBadgeProps {
    fid: number;
}

export default function NotificationsBadge({ fid }: NotificationsBadgeProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/neynar/notifications/${fid}?limit=10`);
                const data: NotificationsResponse = await response.json();

                if (data.success && data.notifications) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.notifications.length);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        // Refresh every 30s (matches API cache)
        const interval = setInterval(fetchNotifications, 30 * 1000);
        return () => clearInterval(interval);
    }, [fid]);

    const handleMarkAsRead = () => {
        setUnreadCount(0);
    };

    const getNotificationText = (notification: Notification): string => {
        switch (notification.type) {
            case 'cast-reply':
                return `${notification.cast?.author.displayName} replied to your cast`;
            case 'cast-mention':
                return `${notification.cast?.author.displayName} mentioned you`;
            case 'cast-like':
                return `${notification.reactor?.displayName} liked your cast`;
            case 'follow':
                return `${notification.reactor?.displayName} followed you`;
            default:
                return 'New notification';
        }
    };

    const getNotificationEmoji = (type: string): string => {
        switch (type) {
            case 'cast-reply': return '💬';
            case 'cast-mention': return '📢';
            case 'cast-like': return '💜';
            case 'follow': return '👋';
            default: return '🔔';
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) handleMarkAsRead();
                }}
                className="relative p-2 hover:bg-[#00FFFF]/10 rounded-lg transition-colors"
            >
                <svg
                    className="w-6 h-6 text-[#00FFFF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-[#FF8800] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_15px_rgba(255,136,0,0.8)]"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                )}

                {/* Pulse Animation */}
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF8800] rounded-full animate-ping opacity-75" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-black/95 border-2 border-[#00FFFF]/60 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.5)] backdrop-blur-xl z-50"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-black/95 border-b border-[#00FFFF]/30 p-3">
                            <h3 className="text-sm font-mono font-bold text-[#00FFFF] uppercase tracking-wider">
                                Notifications
                            </h3>
                        </div>

                        {/* Notifications List */}
                        <div className="divide-y divide-[#00FFFF]/20">
                            {loading ? (
                                <div className="p-4 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No new notifications
                                </div>
                            ) : (
                                notifications.map((notification, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3 hover:bg-[#00FFFF]/5 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl flex-shrink-0">
                                                {getNotificationEmoji(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white">
                                                    {getNotificationText(notification)}
                                                </p>
                                                {notification.cast?.text && (
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                        &ldquo;{notification.cast.text}&rdquo;
                                                    </p>
                                                )}
                                                <p className="text-xs text-[#00FF88]/60 mt-1">
                                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="sticky bottom-0 bg-black/95 border-t border-[#00FFFF]/30 p-3">
                                <button
                                    onClick={handleMarkAsRead}
                                    className="w-full py-2 text-xs font-mono text-[#00FFFF] hover:bg-[#00FFFF]/10 rounded transition-colors uppercase tracking-wider"
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
