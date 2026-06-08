import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, LogOut, Moon, Sun, Smartphone } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { Avatar } from '~/components/ui/Avatar';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useLogout, useMe } from '~/hooks/auth';
import { useTheme } from '~/theme/theme-provider';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const ThemeRow: React.FC = () => {
  const { mode, setMode, isDark } = useTheme();
  return (
    <Card>
      <Text className="mb-3 font-bold text-[14px] uppercase tracking-wider text-kz-muted">
        Apparence
      </Text>
      <View className="flex-row gap-2">
        {(['light', 'dark', 'system'] as const).map((m) => {
          const active = mode === m;
          const Icon = m === 'light' ? Sun : m === 'dark' ? Moon : Smartphone;
          const label = m === 'light' ? 'Clair' : m === 'dark' ? 'Sombre' : 'Auto';
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`flex-1 items-center rounded-2xl border py-3 ${
                active ? 'border-kz-primary bg-kz-soft' : 'border-kz-stroke'
              }`}
            >
              <Icon size={20} color={active ? colors.primary : colors.muted} />
              <Text
                className={`mt-1 text-[12px] font-semibold ${
                  active ? 'text-kz-primary' : 'text-kz-ink-soft'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-3 text-[11px] text-kz-muted">
        Thème courant : {isDark ? 'sombre' : 'clair'}
      </Text>
    </Card>
  );
};

export const ReglagesScreen: React.FC = () => {
  const me = useMe();
  const logout = useLogout();
  const navigation = useNavigation<Nav>();

  const menu: { label: string; onPress?: () => void }[] = [
    { label: 'Mon compte', onPress: () => navigation.navigate('Account') },
    { label: 'Sécurité (PIN, biométrie)' },
    {
      label: 'Notifications',
      onPress: () => navigation.navigate('NotificationPreferences'),
    },
    { label: 'Abonnement', onPress: () => navigation.navigate('Abonnement') },
    { label: 'Confidentialité (RGPD)', onPress: () => navigation.navigate('Account') },
    { label: 'Aide & support' },
  ];

  return (
    <Screen scroll>
      <View className="pt-4 pb-4">
        <Text className="font-bold text-[24px] text-kz-ink">Réglages</Text>
      </View>

      {me.data ? (
        <Card className="mb-4 flex-row items-center">
          <Avatar prenom={me.data.prenom ?? 'P'} size={48} />
          <View className="ml-3 flex-1">
            <Text className="font-bold text-[15px] text-kz-ink">
              {me.data.prenom} {me.data.nom}
            </Text>
            <Text className="text-[12px] text-kz-muted">{me.data.email}</Text>
          </View>
          <View className="rounded-full bg-kz-soft px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase text-kz-ink-soft">
              {me.data.plan}
            </Text>
          </View>
        </Card>
      ) : null}

      <ThemeRow />

      <View className="mt-3 gap-2">
        {menu.map((item) => (
          <Pressable key={item.label} onPress={item.onPress} disabled={!item.onPress}>
            <Card className="flex-row items-center justify-between py-3">
              <Text className="font-medium text-[14px] text-kz-ink">{item.label}</Text>
              <ChevronRight size={18} color={colors.muted} />
            </Card>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => logout.mutate()} className="mt-8">
        <Card className="flex-row items-center justify-center gap-2 bg-transparent shadow-none">
          <LogOut size={18} color={colors.danger} />
          <Text className="font-semibold text-[14px] text-kz-danger">Se déconnecter</Text>
        </Card>
      </Pressable>

      <View className="h-8" />
    </Screen>
  );
};
