import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  quizApi,
  type GenerateTopicPayload,
  type SubmitQuizPayload,
} from '~/services/api/quiz';
import { qk } from '~/lib/query-keys';

/** Clés react-query du module quiz (additives — n'altère pas `qk`). */
export const quizKeys = {
  detail: (id: string) => ['quiz', 'detail', id] as const,
  history: (childId: string) => ['quiz', 'history', childId] as const,
};

export const useQuiz = (id: string | undefined) =>
  useQuery({
    queryKey: id ? quizKeys.detail(id) : ['quiz', 'noop'],
    queryFn: () => quizApi.get(id!),
    enabled: !!id,
  });

export const useQuizHistory = (childId: string | undefined) =>
  useQuery({
    queryKey: childId ? quizKeys.history(childId) : ['quiz', 'history', 'noop'],
    queryFn: () => quizApi.history(childId!),
    enabled: !!childId,
  });

export const useGenerateTopicQuiz = () =>
  useMutation({
    mutationFn: (payload: GenerateTopicPayload) => quizApi.generateFromTopic(payload),
  });

export const useGeneratePhotoQuiz = () =>
  useMutation({
    mutationFn: ({
      profilEnfantId,
      photo,
    }: {
      profilEnfantId: string;
      photo: { uri: string; name: string; type: string };
    }) => quizApi.generateFromPhoto(profilEnfantId, photo),
  });

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: string; payload: SubmitQuizPayload }) =>
      quizApi.submit(quizId, payload),
    onSuccess: (_data, { payload }) => {
      queryClient.invalidateQueries({ queryKey: qk.home });
      queryClient.invalidateQueries({ queryKey: quizKeys.history(payload.profilEnfantId) });
    },
  });
};
