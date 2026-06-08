import * as React from 'react';
import { Pressable, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Globe, Plus, ShieldCheck, X } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Checkbox } from '~/components/ui/Checkbox';
import { Input } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import { useUpdateWebFilter, useWebFilter } from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { NiveauFiltre } from '~/types/controls';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'WebFilter'>;

const NIVEAUX: { value: NiveauFiltre; label: string; desc: string }[] = [
  { value: 'strict', label: 'Strict', desc: 'Bloque tout sauf les sites autorisés' },
  { value: 'modere', label: 'Modéré', desc: 'Bloque les catégories sensibles' },
  { value: 'personnalise', label: 'Personnalisé', desc: 'Tu choisis les règles' },
];

export const WebFilterScreen: React.FC = () => {
  const route = useRoute<R>();
  const childId = route.params.childId;
  const filtre = useWebFilter(childId);
  const update = useUpdateWebFilter(childId);

  const [niveau, setNiveau] = React.useState<NiveauFiltre>('modere');
  const [safeSearch, setSafeSearch] = React.useState(true);
  const [blacklist, setBlacklist] = React.useState<string[]>([]);
  const [whitelist, setWhitelist] = React.useState<string[]>([]);
  const [newBlack, setNewBlack] = React.useState('');
  const [newWhite, setNewWhite] = React.useState('');

  React.useEffect(() => {
    if (filtre.data) {
      setNiveau(filtre.data.niveau);
      setSafeSearch(filtre.data.safeSearch);
      setBlacklist(filtre.data.blacklistUrls);
      setWhitelist(filtre.data.whitelistUrls);
    }
  }, [filtre.data]);

  const addTo = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    reset: () => void,
  ) => {
    const v = value.trim().toLowerCase();
    if (!v || list.includes(v)) return;
    setList([...list, v]);
    reset();
  };

  const save = () => {
    update.mutate(
      { niveau, safeSearch, blacklistUrls: blacklist, whitelistUrls: whitelist },
      {
        onSuccess: () => Toast.show({ type: 'success', text1: 'Filtrage web enregistré' }),
        onError: () => Toast.show({ type: 'error', text1: "Échec de l'enregistrement" }),
      },
    );
  };

  if (filtre.isLoading) {
    return (
      <Screen noPadding>
        <SubScreenHeader title="Filtrage web" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-kz-ink-muted">Chargement…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Filtrage web" subtitle="Protège la navigation de ton enfant" />

      <View className="px-5 pb-10">
        <Text className="mb-3 font-heading-semi text-[15px] text-kz-ink">Niveau de filtrage</Text>
        {NIVEAUX.map((n) => {
          const active = niveau === n.value;
          return (
            <Pressable key={n.value} onPress={() => setNiveau(n.value)} className="mb-2.5">
              <Card
                className={active ? 'border-kz-cyan' : ''}
              >
                <View className="flex-row items-center">
                  <View
                    className={`h-5 w-5 rounded-full border-2 ${active ? 'border-kz-cyan' : 'border-kz-stroke'} items-center justify-center`}
                  >
                    {active ? <View className="h-2.5 w-2.5 rounded-full bg-kz-cyan" /> : null}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-heading-semi text-[15px] text-kz-ink">{n.label}</Text>
                    <Text className="text-[13px] text-kz-ink-muted">{n.desc}</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}

        <Card className="mt-4 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <ShieldCheck size={20} color={colors.cyan} />
            <View className="ml-3 flex-1">
              <Text className="font-heading-semi text-[15px] text-kz-ink">SafeSearch</Text>
              <Text className="text-[13px] text-kz-ink-muted">
                Filtre les résultats de recherche explicites
              </Text>
            </View>
          </View>
          <Checkbox checked={safeSearch} onCheckedChange={setSafeSearch} />
        </Card>

        <Text className="mb-2 mt-6 font-heading-semi text-[15px] text-kz-ink">
          Sites bloqués
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              placeholder="ex. casino.com"
              value={newBlack}
              onChangeText={setNewBlack}
              autoCapitalize="none"
            />
          </View>
          <Button
            size="icon"
            variant="destructive"
            onPress={() => addTo(newBlack, blacklist, setBlacklist, () => setNewBlack(''))}
          >
            <Plus size={20} color={colors.white} />
          </Button>
        </View>
        {blacklist.map((d) => (
          <View key={d} className="mt-2 flex-row items-center rounded-2xl bg-kz-surface-soft px-4 py-2.5">
            <Globe size={16} color={colors.red} />
            <Text className="ml-2 flex-1 text-[14px] text-kz-ink">{d}</Text>
            <Pressable onPress={() => setBlacklist(blacklist.filter((x) => x !== d))}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}

        <Text className="mb-2 mt-6 font-heading-semi text-[15px] text-kz-ink">
          Sites autorisés
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              placeholder="ex. wikipedia.org"
              value={newWhite}
              onChangeText={setNewWhite}
              autoCapitalize="none"
            />
          </View>
          <Button
            size="icon"
            onPress={() => addTo(newWhite, whitelist, setWhitelist, () => setNewWhite(''))}
          >
            <Plus size={20} color={colors.white} />
          </Button>
        </View>
        {whitelist.map((d) => (
          <View key={d} className="mt-2 flex-row items-center rounded-2xl bg-kz-surface-soft px-4 py-2.5">
            <Globe size={16} color={colors.green} />
            <Text className="ml-2 flex-1 text-[14px] text-kz-ink">{d}</Text>
            <Pressable onPress={() => setWhitelist(whitelist.filter((x) => x !== d))}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}

        <Button className="mt-8" loading={update.isPending} onPress={save}>
          Enregistrer
        </Button>
      </View>
    </Screen>
  );
};
