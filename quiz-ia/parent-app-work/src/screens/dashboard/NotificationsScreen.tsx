import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { colors } from '~/theme/colors';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '~/hooks/controls';
import type { NiveauNotification } from '~/types/controls';

const couleurNiveau = (niveau: NiveauNotification): string => {
  switch (niveau) {
    case 'critique':
    case 'alerte':
      return colors.red;
    case 'succes':
      return colors.green;
    default:
      return colors.primary;
  }
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NotificationsScreen: React.FC = () => {
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = data?.items ?? [];
  const nonLues = items.filter((n) => !n.lue).length;

  return (
    <Screen noPadding scroll>
      <SubScreenHeader title="Notifications" withDivider />
      <View className="px-5 pt-4 pb-10">
        {nonLues > 0 && (
          <Pressable
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="mb-4 flex-row items-center justify-end"
          >
            <CheckCheck size={16} color={colors.primary} />
            <Text className="ml-1.5 text-[13px] text-kz-cyan">Tout marquer comme lu</Text>
          </Pressable>
        )}

        {isLoading && (
          <View className="mt-10 items-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {isError && (
          <Card className="items-center py-8">
            <Text className="text-center text-[13px] text-kz-muted">
              Impossible de charger les notifications.
            </Text>
          </Card>
        )}

        {data && items.length === 0 && (
          <Card className="items-center py-8">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-kz-soft">
              <Bell size={26} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center font-bold text-[16px] text-kz-ink">
              Aucune notification
            </Text>
            <Text className="mt-1 text-center text-[13px] text-kz-muted">
              Tu verras ici les alertes : fin de quota, contenus bloqués, défis réussis…
            </Text>
          </Card>
        )}

        {items.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => !n.lue && markRead.mutate(n.id)}
            className="mb-2"
          >
            <Card className="flex-row items-start" style={{ opacity: n.lue ? 0.6 : 1 }}>
              <View
                className="mt-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: couleurNiveau(n.niveau) }}
              />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-[14px] text-kz-ink">{n.titre}</Text>
                <Text className="mt-0.5 text-[13px] text-kz-ink-muted">{n.corps}</Text>
                <Text className="mt-1 text-[11px] text-kz-muted">
                  {formatDate(n.dateCreation)}
                </Text>
              </View>
              <Pressable onPress={() => remove.mutate(n.id)} hitSlop={8} className="ml-2 pt-1">
                <Trash2 size={16} color={colors.muted} />
              </Pressable>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
};
