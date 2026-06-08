import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enfantsApi } from '~/services/api/enfants';
import { qk } from '~/lib/query-keys';
import type { CreateChildInput } from '~/schemas/enfants';

export const useEnfants = () =>
  useQuery({ queryKey: qk.enfants.list, queryFn: () => enfantsApi.list() });

export const useEnfant = (id: string | undefined) =>
  useQuery({
    queryKey: id ? qk.enfants.detail(id) : ['enfants', 'noop'],
    queryFn: () => enfantsApi.get(id!),
    enabled: !!id,
  });

export const useEnfantStats = (id: string | undefined) =>
  useQuery({
    queryKey: id ? qk.enfants.stats(id) : ['enfants', 'stats', 'noop'],
    queryFn: () => enfantsApi.stats(id!),
    enabled: !!id,
  });

export const useCreateEnfant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChildInput) => enfantsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.enfants.list });
    },
  });
};

export const useDeleteEnfant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enfantsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.enfants.list });
    },
  });
};
