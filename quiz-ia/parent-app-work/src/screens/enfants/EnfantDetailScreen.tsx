import * as React from 'react';
import { Pressable, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import {
  BarChart3,
  ChevronRight,
  Clock,
  Globe,
  Grid3x3,
  Lock,
  Plus,
  Smartphone,
  Target,
  Unlock,
} from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Avatar } from '~/components/ui/Avatar';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useEnfant, useEnfantStats } from '~/hooks/enfants';
import { useLockDevice } from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'EnfantDetail'>;
type R = RouteProp<AppStackParamList, 'EnfantDetail'>;

const formatDuration = (seconds: number) => {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m} min`;
};

export const EnfantDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const enfant = useEnfant(route.params.id);
  const stats = useEnfantStats(route.params.id);
  const lock = useLockDevice();

  const appareils = enfant.data?.appareils ?? [];
  const hasDevice = appareils.length > 0;

  const lockNow = () => {
    if (!hasDevice) return;
    lock.mutate(
      { deviceId: appareils[0].id },
      {
        onSuccess: () => Toast.show({ type: 'success', text1: 'Verrouillage envoyé' }),
        onError: () => Toast.show({ type: 'error', text1: 'Échec du verrouillage' }),
      },
    );
  };

  if (!enfant.data) {
    return (
      <Screen noPadding>
        <SubScreenHeader title="Profil enfant" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-kz-muted">Chargement…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title={enfant.data.prenom} />

      <View className="px-5 pb-10">
        <View className="items-center pt-2">
          <Avatar
            prenom={enfant.data.prenom}
            couleurTheme={enfant.data.couleurTheme}
            size={88}
          />
          <Text className="mt-3 font-bold text-[22px] text-kz-ink">{enfant.data.prenom}</Text>
          <Text className="text-[13px] text-kz-muted">
            {enfant.data.age ? `${enfant.data.age} ans · ` : ''}
            {enfant.data.niveauScolaire}
          </Text>
        </View>

        <View className="mt-6 flex-row gap-3">
          <Card className="flex-1">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-kz-soft">
              <Clock size={18} color={colors.primary} />
            </View>
            <Text className="mt-3 font-bold text-[22px] text-kz-ink">
              {stats.data ? formatDuration(stats.data.tempsEcranAujourdhuiSeconds) : '—'}
            </Text>
            <Text className="text-[12px] text-kz-muted">Temps d'écran</Text>
          </Card>
          <Card className="flex-1">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-kz-soft">
              <Target size={18} color={colors.primary} />
            </View>
            <Text className="mt-3 font-bold text-[22px] text-kz-ink">
              {stats.data?.nombreDefisAujourdhui ?? 0}
            </Text>
            <Text className="text-[12px] text-kz-muted">Défis du jour</Text>
          </Card>
        </View>

        <View className="mt-6">
          <Text className="mb-3 font-bold text-[14px] uppercase tracking-wider text-kz-muted">
            Appareils
          </Text>
          {(enfant.data.appareils ?? []).length === 0 ? (
            <Card className="items-center py-6">
              <Smartphone size={28} color={colors.muted} />
              <Text className="mt-2 text-center text-kz-muted">
                Aucun appareil n'est encore appairé.
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('Appairage', { profilEnfantId: route.params.id })
                }
                className="mt-4 flex-row items-center gap-1 rounded-full bg-kz-primary px-4 py-2"
              >
                <Plus size={16} color="#fff" />
                <Text className="font-semibold text-[13px] text-white">Appairer</Text>
              </Pressable>
            </Card>
          ) : (
            enfant.data.appareils!.map((a) => (
              <Card key={a.id} className="mb-2 flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-kz-soft">
                  <Smartphone size={18} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-[14px] text-kz-ink">{a.nomAffichage}</Text>
                  <Text className="text-[12px] text-kz-muted">
                    {a.plateforme} · {a.actif ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>

        <View className="mt-6">
          <Text className="mb-3 font-bold text-[14px] uppercase tracking-wider text-kz-muted">
            Contrôles parentaux
          </Text>
          {(
            [
              {
                key: 'ScreenTime',
                label: 'Horaires & quota',
                desc: 'Temps d’écran par jour',
                icon: <Clock size={18} color={colors.primary} />,
                onPress: () =>
                  navigation.navigate('ScreenTime', { childId: route.params.id }),
              },
              {
                key: 'WebFilter',
                label: 'Filtrage web',
                desc: 'Sites bloqués et catégories',
                icon: <Globe size={18} color={colors.primary} />,
                onPress: () =>
                  navigation.navigate('WebFilter', { childId: route.params.id }),
              },
              {
                key: 'Apps',
                label: 'Applications',
                desc: 'Règles par application',
                icon: <Grid3x3 size={18} color={colors.primary} />,
                onPress: () => navigation.navigate('Apps', { childId: route.params.id }),
              },
              {
                key: 'ActivityReport',
                label: "Rapport d'activité",
                desc: '7 derniers jours',
                icon: <BarChart3 size={18} color={colors.primary} />,
                onPress: () =>
                  navigation.navigate('ActivityReport', { childId: route.params.id }),
              },
              {
                key: 'UnlockRequests',
                label: 'Demandes de temps',
                desc: 'Demandes en attente',
                icon: <Unlock size={18} color={colors.primary} />,
                onPress: () =>
                  navigation.navigate('UnlockRequests', { childId: route.params.id }),
              },
            ] as const
          ).map((item) => (
            <Pressable key={item.key} onPress={item.onPress}>
              <Card className="mb-2 flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-kz-soft">
                  {item.icon}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-[14px] text-kz-ink">{item.label}</Text>
                  <Text className="text-[12px] text-kz-muted">{item.desc}</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </Card>
            </Pressable>
          ))}
        </View>

        <View className="mt-6 gap-3">
          <Button
            variant="default"
            disabled={!hasDevice}
            loading={lock.isPending}
            onPress={lockNow}
            leftIcon={<Lock size={18} color="#fff" />}
          >
            Verrouiller maintenant
          </Button>
          <Button
            variant="outline"
            disabled={!hasDevice}
            onPress={() =>
              navigation.navigate('UnlockRequests', { childId: route.params.id })
            }
          >
            + 15 minutes
          </Button>
        </View>
      </View>
    </Screen>
  );
};
