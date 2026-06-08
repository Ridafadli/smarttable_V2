import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import { getNotificationConfig } from '../lib/notificationUtils';
import NotificationCenter from '../components/notifications/NotificationCenter';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [centerOpen, setCenterOpen] = useState(false);
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 8000 : false,
  });

  const { data: listPage, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => api.get('/notifications', { params: { per_page: 30 } }).then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 8000 : false,
  });

  const notifications = listPage?.data ?? listPage ?? [];
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    if (!isAuthenticated) {
      knownIdsRef.current = new Set();
      initializedRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !notifications.length) {
      if (isAuthenticated && notifications.length === 0 && !initializedRef.current) {
        initializedRef.current = true;
      }
      return;
    }

    const newOnes = notifications.filter((n) => !knownIdsRef.current.has(n.id));

    if (!initializedRef.current) {
      notifications.forEach((n) => knownIdsRef.current.add(n.id));
      initializedRef.current = true;
      return;
    }

    newOnes.forEach((n) => {
      knownIdsRef.current.add(n.id);
      const cfg = getNotificationConfig(n.type);
      const toastFn = toast[cfg.toastType] || toast.info;
      toastFn(n.title + ' — ' + n.message);
    });
  }, [notifications, isAuthenticated, toast]);

  useEffect(() => {
    setCenterOpen(false);
  }, [location.pathname]);

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const value = useMemo(
    () => ({
      unreadCount,
      openCenter: () => setCenterOpen(true),
      closeCenter: () => setCenterOpen(false),
      toggleCenter: () => setCenterOpen((v) => !v),
      centerOpen,
    }),
    [unreadCount, centerOpen]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {isAuthenticated && (
        <NotificationCenter
          open={centerOpen}
          onClose={() => setCenterOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          loading={isLoading}
          onMarkRead={(id) => markReadMutation.mutate(id)}
          onMarkAllRead={() => markAllMutation.mutate()}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
