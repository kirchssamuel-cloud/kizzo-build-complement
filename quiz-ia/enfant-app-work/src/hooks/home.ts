import { useQuery } from '@tanstack/react-query';
import { homeApi } from '~/services/api/home';
import { useAuthStore } from '~/store/auth.store';
import { qk } from '~/lib/query-keys';

export const useHomeState = () => {
  const token = useAuthStore((s) => s.token);
  const appareilId = useAuthStore((s) => s.appareilId);
  return useQuery({
    queryKey: qk.home,
    queryFn: () => homeApi.state(),
    enabled: !!token && !!appareilId,
    refetchInterval: 60_000,
  });
};
