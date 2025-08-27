import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Clés de query pour React Query
export const queryKeys = {
  questions: ['questions'] as const,
  question: (id: string) => ['question', id] as const,
  comments: (questionId: string) => ['comments', questionId] as const,
};

// Hook pour récupérer les questions
export const useQuestions = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: queryKeys.questions,
    queryFn: async () => {
      const { data } = await api.get('/questions', { params });
      return data;
    },
  });
};

// Hook pour récupérer une question spécifique
export const useQuestion = (id: string) => {
  return useQuery({
    queryKey: queryKeys.question(id),
    queryFn: async () => {
      const { data } = await api.get(`/questions/${id}`);
      return data;
    },
  });
};

// Hook pour créer une question avec mise à jour optimiste
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionData: any) => {
      const { data } = await api.post('/questions', questionData);
      return data;
    },
    onSuccess: (newQuestion) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(queryKeys.questions, (old: any[]) => {
        return [newQuestion, ...(old || [])];
      });
    },
  });
};

// Hook pour voter
export const useVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, voteType }: { questionId: string; voteType: 'up' | 'down' }) => {
      const { data } = await api.post(`/questions/${questionId}/vote`, { voteType });
      return data;
    },
    onSuccess: (updatedQuestion) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(
        queryKeys.question(updatedQuestion.id),
        updatedQuestion
      );
    },
  });
};
