import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery(
    'notifications',
    () => api.get('/api/notifications').then(res => res.data),
    {
      enabled: isAuthenticated,
      refetchInterval: 30000, // Poll every 30 seconds
      refetchIntervalInBackground: true,
      onSuccess: (data) => {
        setUnreadCount(data.unreadCount || 0);
      },
    }
  );

  // Fetch unread count separately for real-time updates
  const { data: unreadCountData } = useQuery(
    'notifications-unread-count',
    () => api.get('/api/notifications/unread-count').then(res => res.data),
    {
      enabled: isAuthenticated,
      refetchInterval: 10000, // Poll every 10 seconds for unread count
      refetchIntervalInBackground: true,
      onSuccess: (data) => {
        setUnreadCount(data.unreadCount || 0);
      },
    }
  );

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('notifications-unread-count');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [queryClient]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/notifications/read-all');
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('notifications-unread-count');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [queryClient]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('notifications-unread-count');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [queryClient]);

  return {
    notifications: notificationsData?.notifications || [],
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
