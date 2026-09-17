// Custom React hooks for API integration
import { useState, useEffect, useCallback } from 'react';
import { api, apiEndpoints, clearTokens, getStoredAccessToken, storeTokens } from './api';
import { extractApiErrorMessage } from './api';

// Generic data fetching hook
export function useApi<T>(
  endpoint: string,
  initialData: T | null = null,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<T>(endpoint);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Always set data even if it's null/undefined to prevent loading state from getting stuck
        setData(response.data ?? initialData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint, initialData]);

  useEffect(() => {
    fetchData();
  }, [endpoint, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

// Authentication hook
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await api.get<any>(apiEndpoints.me);
      
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if we have a token, if so verify authentication
    const token = getStoredAccessToken();
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const response = await api.post<any>(apiEndpoints.login, credentials);

    const payload = response.data as any;
    const user = payload?.user || payload;
    const access = payload?.access;
    const refresh = payload?.refresh;
    
    if (!response.error && user && (user.username || user.id)) {
      // Store JWT tokens in cookies
      if (access && refresh) {
        storeTokens(access, refresh);
      }
      
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true };
    }

    return { success: false, error: extractApiErrorMessage(response) };
  };

  const logout = async () => {
    const refreshToken = getStoredRefreshToken();
    await api.post<any>(apiEndpoints.logout, { refresh: refreshToken });
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refetch: checkAuth,
  };
}

// Dashboard hook
export function useDashboard() {
  return useApi<any>(apiEndpoints.dashboard, null);
}

// Tasks hook
export function useTasks(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.tasks}?${filters}` : apiEndpoints.tasks;
  return useApi<any[]>(endpoint, []);
}

// My tasks hook
export function useMyTasks() {
  return useApi<any[]>(apiEndpoints.myTasks, []);
}

// Pending tasks hook
export function usePendingTasks() {
  return useApi<any[]>(apiEndpoints.pendingTasks, []);
}

// Overdue tasks hook
export function useOverdueTasks() {
  return useApi<any[]>(apiEndpoints.overdueTasks, []);
}

// Today's tasks hook
export function useTodayTasks() {
  return useApi<any[]>(apiEndpoints.todayTasks, []);
}

// Upcoming tasks hook
export function useUpcomingTasks(days: number = 7) {
  return useApi<any[]>(`${apiEndpoints.upcomingTasks}?days=${days}`, []);
}

// Pending from previous days hook
export function usePendingPreviousTasks() {
  return useApi<any[]>(apiEndpoints.pendingPreviousTasks, []);
}

// Clients hook
export function useClients(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.clients}?${filters}` : apiEndpoints.clients;
  return useApi<any[]>(endpoint, []);
}

// Active clients hook
export function useActiveClients() {
  return useApi<any[]>(`${apiEndpoints.clients}active/`, []);
}

// Client progress hook
export function useClientProgress(clientId: number) {
  return useApi<any>(apiEndpoints.clientProgress(clientId), null);
}

// Monthly targets hook
export function useMonthlyTargets(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.monthlyTargets}?${filters}` : apiEndpoints.monthlyTargets;
  return useApi<any[]>(endpoint, []);
}

// Videos hook
export function useVideos(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.videos}?${filters}` : apiEndpoints.videos;
  return useApi<any[]>(endpoint, []);
}

// My videos hook
export function useMyVideos() {
  return useApi<any[]>(apiEndpoints.myVideos, []);
}

// Notifications hook
export function useNotifications() {
  return useApi<any[]>(apiEndpoints.notifications, []);
}

// Unread notifications hook
export function useUnreadNotifications() {
  return useApi<any[]>(apiEndpoints.unreadNotifications, []);
}

// Notification count hook
export function useNotificationCount() {
  return useApi<any>(apiEndpoints.notificationCount, { total: 0, unread: 0, urgent: 0 });
}

// Activity logs hook
export function useActivityLogs(limit?: number) {
  const endpoint = limit ? `${apiEndpoints.recentLogs}?limit=${limit}` : apiEndpoints.activityLogs;
  return useApi<any[]>(endpoint, []);
}

// My activity logs hook
export function useMyActivityLogs() {
  return useApi<any[]>(apiEndpoints.myLogs, []);
}

// Users hook
export function useUsers(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.users}?${filters}` : apiEndpoints.users;
  return useApi<any[]>(endpoint, []);
}

// Managers hook
export function useManagers() {
  return useApi<any[]>(apiEndpoints.managers, []);
}

// Employees hook
export function useEmployees() {
  return useApi<any[]>(apiEndpoints.employees, []);
}

// Approvals hook
export function useApprovals(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.approvals}?${filters}` : apiEndpoints.approvals;
  return useApi<any[]>(endpoint, []);
}

// Pending approvals hook
export function usePendingApprovals() {
  return useApi<any[]>(apiEndpoints.pendingApprovals, []);
}

// My approvals hook
export function useMyApprovals() {
  return useApi<any[]>(apiEndpoints.myApprovals, []);
}

// Social posts hook
export function useSocialPosts(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.socialPosts}?${filters}` : apiEndpoints.socialPosts;
  return useApi<any[]>(endpoint, []);
}

// Scheduled posts hook
export function useScheduledPosts() {
  return useApi<any[]>(apiEndpoints.scheduledPosts, []);
}

// My posts hook
export function useMyPosts() {
  return useApi<any[]>(apiEndpoints.myPosts, []);
}

// Mutations hook for POST/PUT/DELETE operations
export function useMutation<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (body?: any) => {
    setLoading(true);
    setError(null);
    
    let response: ApiResponse<T>;
    
    switch (method) {
      case 'POST':
        response = await api.post<T>(endpoint, body);
        break;
      case 'PUT':
        response = await api.put<T>(endpoint, body);
        break;
      case 'PATCH':
        response = await api.patch<T>(endpoint, body);
        break;
      case 'DELETE':
        response = await api.delete<T>(endpoint);
        break;
    }
    
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    
    setLoading(false);
    
    return response;
  }, [method, endpoint]);

  return { mutate, loading, error, data };
}

// Specific mutation hooks
export function useCreateTask() {
  return useMutation<any>('POST', apiEndpoints.tasks);
}

export function useUpdateTask(taskId: number) {
  return useMutation<any>('PATCH', apiEndpoints.task(taskId));
}

export function useDeleteTask(taskId: number) {
  return useMutation<any>('DELETE', apiEndpoints.task(taskId));
}

export function useCreateClient() {
  return useMutation<any>('POST', apiEndpoints.clients);
}

export function useUpdateClient(clientId: number) {
  return useMutation<any>('PATCH', apiEndpoints.client(clientId));
}

export function useCreateVideo() {
  return useMutation<any>('POST', apiEndpoints.videos);
}

export function useUpdateVideo(videoId: number) {
  return useMutation<any>('PATCH', apiEndpoints.video(videoId));
}

export function useCreateApproval() {
  return useMutation<any>('POST', apiEndpoints.approvals);
}

export function useApprove(approvalId: number) {
  return useMutation<any>('POST', apiEndpoints.approveApproval(approvalId));
}

export function useReject(approvalId: number) {
  return useMutation<any>('POST', apiEndpoints.rejectApproval(approvalId));
}

export function useMarkNotificationRead(notificationId: number) {
  return useMutation<any>('POST', apiEndpoints.markRead(notificationId));
}

export function useMarkAllNotificationsRead() {
  return useMutation<any>('POST', apiEndpoints.markAllRead);
}

// Re-export role helpers from auth-context for backward compatibility
export { 
  useUserRole, 
  useIsOwner, 
  useIsManager, 
  useIsEmployee, 
  useCanManageUsers, 
  useCanApproveVideos 
} from './auth-context';