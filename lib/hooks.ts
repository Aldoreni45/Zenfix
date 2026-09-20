// Custom React hooks for API integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { api, apiEndpoints, clearTokens, getStoredAccessToken, storeTokens, type ApiResponse } from './api';
import { extractApiErrorMessage } from './api';
import { useAuth } from './auth-context';

// Generic data fetching hook
export function useApi<T>(
  endpoint: string,
  initialData: T | null = null,
  dependencies: any[] = [],
  enabled = true
) {
  const initialDataRef = useRef(initialData);
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Wait for the auth bootstrap to finish before firing requests: otherwise the
  // whole dashboard/hooks layer races the /me + refresh round trip and issues a
  // burst of 401s on every fresh load.
  const { initialized } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<T>(endpoint);
      
      if (response.error) {
        setError(response.error);
      } else {
        setData(response.data ?? initialDataRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!initialized || !enabled) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, initialized, enabled, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
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

function getLocalTodayDateString(): string {
  if (typeof window === 'undefined') return '';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Pending tasks hook
export function usePendingTasks() {
  return useApi<any[]>(apiEndpoints.pendingTasks, []);
}

// Overdue tasks hook
export function useOverdueTasks() {
  const localDate = getLocalTodayDateString();
  const endpoint = localDate ? `${apiEndpoints.overdueTasks}?date=${localDate}` : apiEndpoints.overdueTasks;
  return useApi<any[]>(endpoint, []);
}

// Today's tasks hook
export function useTodayTasks() {
  const localDate = getLocalTodayDateString();
  const endpoint = localDate ? `${apiEndpoints.todayTasks}?date=${localDate}` : apiEndpoints.todayTasks;
  return useApi<any[]>(endpoint, []);
}

// Upcoming tasks hook
export function useUpcomingTasks(days: number = 7) {
  const localDate = getLocalTodayDateString();
  const endpoint = localDate 
    ? `${apiEndpoints.upcomingTasks}?days=${days}&date=${localDate}` 
    : `${apiEndpoints.upcomingTasks}?days=${days}`;
  return useApi<any[]>(endpoint, [days]);
}

// Pending from previous days hook
export function usePendingPreviousTasks() {
  const localDate = getLocalTodayDateString();
  const endpoint = localDate ? `${apiEndpoints.pendingPreviousTasks}?date=${localDate}` : apiEndpoints.pendingPreviousTasks;
  return useApi<any[]>(endpoint, []);
}

// Clients hook
export function useClients(filters?: string) {
  const endpoint = filters ? `${apiEndpoints.clients}?${filters}` : apiEndpoints.clients;
  return useApi<any[]>(endpoint, []);
}

// Active clients hook
export function useActiveClients() {
  return useApi<any[]>(`${apiEndpoints.clients}/active/`, []);
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

// Task History (owner-only) hooks
type TaskHistoryOptions = { params?: string; enabled?: boolean };

function taskHistoryOptions(options?: string | TaskHistoryOptions) {
  if (typeof options === 'string') return { params: options, enabled: true };
  return { params: options?.params, enabled: options?.enabled ?? true };
}

export function useTaskHistorySummary(options?: string | TaskHistoryOptions) {
  const { params, enabled } = taskHistoryOptions(options);
  const endpoint = params ? `${apiEndpoints.taskHistorySummary}?${params}` : apiEndpoints.taskHistorySummary;
  return useApi<any>(endpoint, null, [], enabled);
}

export function useTaskHistoryUsers(options?: string | TaskHistoryOptions) {
  const { params, enabled } = taskHistoryOptions(options);
  const endpoint = params ? `${apiEndpoints.taskHistoryUsers}?${params}` : apiEndpoints.taskHistoryUsers;
  return useApi<any[]>(endpoint, [], [], enabled);
}

export function useTaskHistoryDaily(options?: string | TaskHistoryOptions) {
  const { params, enabled } = taskHistoryOptions(options);
  const endpoint = params ? `${apiEndpoints.taskHistoryDaily}?${params}` : apiEndpoints.taskHistoryDaily;
  return useApi<any[]>(endpoint, [], [], enabled);
}

export function useTaskHistoryUserDetail(userId: number, enabled = true) {
  return useApi<any>(apiEndpoints.taskHistoryUserDetail(userId), null, [], enabled);
}

export function useTaskHistoryTasks(options?: string | TaskHistoryOptions) {
  const { params, enabled } = taskHistoryOptions(options);
  const endpoint = params ? `${apiEndpoints.taskHistoryTasks}?${params}` : apiEndpoints.taskHistoryTasks;
  return useApi<any>(endpoint, { count: 0, page: 1, page_size: 20, items: [] }, [], enabled);
}

export function useTaskHistoryTaskDetail(taskId: number, enabled = true) {
  return useApi<any>(apiEndpoints.taskHistoryTaskDetail(taskId), null, [], enabled);
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
    setData(null);
    
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
  useAuth,
  useUserRole, 
  useIsOwner, 
  useIsManager, 
  useIsEmployee, 
  useCanManage,
  useCanManageUsers, 
  useCanApproveVideos,
  getRoleLandingPage
} from './auth-context';