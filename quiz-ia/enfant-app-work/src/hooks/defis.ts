import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defisApi } from '~/services/api/defis';
import { qk } from '~/lib/query-keys';

export const useDefis = () => useQuery({ queryKey: qk.defis.list, queryFn: defisApi.list });

export const useDefi = (id: string | undefined) =>
  useQuery({
    queryKey: id ? qk.defis.detail(id) : ['defis', 'noop'],
    queryFn: () => defisApi.get(id!),
    enabled: !!id,
  });

export const useSubmitDefi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        profilEnfantId: string;
        reponses: Array<{ questionId: string; reponse: string }>;
        dureeSeconds?: number;
      };
    }) => defisApi.submit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.home });
    },
  });
};
