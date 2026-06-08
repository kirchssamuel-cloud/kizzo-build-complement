import { useQuery } from '@tanstack/react-query';
import { badgesApi } from '~/services/api/badges';
import { useAuthStore } from '~/store/auth.store';
import { qk } from '~/lib/query-keys';

export const useBadges = () => {
  const token = useAuthStore((s) => s.token);
  const appareilId = useAuthStore((s) => s.appareilId);
  return useQuery({
    queryKey: qk.badges,
    queryFn: () => badgesApi.list(),
    enabled: !!token && !!appareilId,
  });
};
