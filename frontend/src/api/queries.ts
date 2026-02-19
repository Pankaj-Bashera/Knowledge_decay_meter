import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface KnowledgeItem {
  id: number;
  user_id: number;
  topic: string;
  content?: string;
  attention: number;
  interest: number;
  difficulty: number;
  k0_initial_strength: number;
  decay_rate: number;
  revision_frequency: number;
  usage_frequency: number;
  base_memory: number;
  sleep_quality: number;
  memory_floor: number;
  last_reviewed?: string;
  last_used?: string;
  created_at: string;
  current_retention: number;
  half_life_days: number;
  days_to_forget: number;
  days_since_review: number;
}

export interface ItemCreate {
  topic: string;
  content?: string;
  attention: number;
  interest: number;
  difficulty: number;
  base_memory: number;
  sleep_quality: number;
  memory_floor: number;
}

export interface WeakItem {
  id: number;
  topic: string;
  retention: number;
  half_life: number;
  days_since_review: number;
}

export interface InsightSummary {
  total_items: number;
  avg_retention: number;
  avg_half_life: number;
  items_below_60: number;
  items_below_40: number;
  items_near_floor: number;
}

export interface DailyRetention {
  date: string;
  retention: number;
}

// ── Items ──────────────────────────────────────────────────────────────────────

export const useItems = () =>
  useQuery<KnowledgeItem[]>({
    queryKey: ['items'],
    queryFn:  () => apiClient.get('/items/').then((r) => r.data),
  });

export const useDecayingItems = (threshold = 60) =>
  useQuery<KnowledgeItem[]>({
    queryKey: ['items', 'decaying', threshold],
    queryFn:  () => apiClient.get(`/items/decaying?threshold=${threshold}`).then((r) => r.data),
    refetchInterval: 1000 * 60 * 5,   // Refresh every 5 min
  });

export const useItem = (id: number) =>
  useQuery<KnowledgeItem>({
    queryKey: ['items', id],
    queryFn:  () => apiClient.get(`/items/${id}`).then((r) => r.data),
    enabled:  !!id,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation<KnowledgeItem, Error, ItemCreate>({
    mutationFn: (payload) => apiClient.post('/items/', payload).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => apiClient.delete(`/items/${id}`).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation<KnowledgeItem, Error, { id: number; data: Partial<ItemCreate> }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/items/${id}`, data).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

// ── Reviews ────────────────────────────────────────────────────────────────────

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation<KnowledgeItem, Error, { id: number; used_in_practice: boolean }>({
    mutationFn: ({ id, used_in_practice }) =>
      apiClient.post(`/items/${id}/review`, { used_in_practice }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['items', id] });
    },
  });
};

// ── Insights ───────────────────────────────────────────────────────────────────

export const useInsightSummary = () =>
  useQuery<InsightSummary>({
    queryKey: ['insights', 'summary'],
    queryFn:  () => apiClient.get('/insights/summary').then((r) => r.data),
  });

export const useWeakestTopics = (limit = 10) =>
  useQuery<WeakItem[]>({
    queryKey: ['insights', 'weakest', limit],
    queryFn:  () => apiClient.get(`/insights/weakest?limit=${limit}`).then((r) => r.data),
  });

export const useHardestTopics = (limit = 10) =>
  useQuery<WeakItem[]>({
    queryKey: ['insights', 'hardest', limit],
    queryFn:  () => apiClient.get(`/insights/hardest?limit=${limit}`).then((r) => r.data),
  });

export const useRetentionTimeline = () =>
  useQuery<DailyRetention[]>({
    queryKey: ['insights', 'timeline'],
    queryFn:  () => apiClient.get('/insights/timeline').then((r) => r.data),
  });

export const useUpcomingForgets = (days = 30) =>
  useQuery({
    queryKey: ['insights', 'upcoming-forgets', days],
    queryFn:  () => apiClient.get(`/insights/upcoming-forgets?days=${days}`).then((r) => r.data),
  });

export const useMostReviewed = (limit = 10) =>
  useQuery({
    queryKey: ['insights', 'most-reviewed', limit],
    queryFn:  () => apiClient.get(`/insights/most-reviewed?limit=${limit}`).then((r) => r.data),
  });

export const useSleepImpact = () =>
  useQuery({
    queryKey: ['insights', 'sleep-impact'],
    queryFn:  () => apiClient.get('/insights/sleep-impact').then((r) => r.data),
  });

// ── Auth ───────────────────────────────────────────────────────────────────────

export const useLogin = () =>
  useMutation<{ access_token: string }, Error, { username: string; password: string }>({
    mutationFn: (creds) => apiClient.post('/auth/login', creds).then((r) => r.data),
    onSuccess: (data) => localStorage.setItem('jwt_token', data.access_token),
  });

export const useRegister = () =>
  useMutation<{ access_token: string }, Error, { username: string; password: string }>({
    mutationFn: (creds) => apiClient.post('/auth/register', creds).then((r) => r.data),
    onSuccess: (data) => localStorage.setItem('jwt_token', data.access_token),
  });
