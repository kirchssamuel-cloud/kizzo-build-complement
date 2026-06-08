import * as React from 'react';
import { Pressable, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Ban, Check, Plus, Trash2 } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import { useApps, useDeleteApp, useUpsertApp } from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { CategorieApp, RegleApp } from '~/types/controls';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'Apps'>;

const CATEGORIE_LABEL: Record<CategorieApp, string> = {
  jeux: 'Jeux',
  reseaux_sociaux: 'Réseaux sociaux',
  education: 'Éducation',
  communication: 'Communication',
  divertissement: 'Divertissement',
  productivite: 'Productivité',
  systeme: 'Système',
  autres: 'Autres',
};

export const AppsScreen: React.FC = () => {
  const route = useRoute<R>();
  const childId = route.params.childId;
  const apps = useApps(childId);
  const upsert = useUpsertApp(childId);
  const del = useDeleteApp(childId);

  const [nomApp, setNomApp] = React.useState('');
  const [bundleId, setBundleId] = React.useState('');

  const toggle = (app: RegleApp) => {
    upsert.mutate({
      bundleId: app.bundleId,
      nomApp: app.nomApp,
      categorie: app.categorie,
      autorisee: !app.autorisee,
      limiteQuotidienne: app.limiteQuotidienne,
    });
  };

  const add = () => {
    const nom = nomApp.trim();
    const bundle = bundleId.trim().toLowerCase();
    if (!nom || !bundle) {
      Toast.show({ type: 'error', text1: "Nom et identifiant de l'app requis" });
      return;
    }
    upsert.mutate(
      { bundleId: bundle, nomApp: nom, autorisee: true },
      {
        onSuccess: () => {
          setNomApp('');
          setBundleId('');
          Toast.show({ type: 'success', text1: 'Application ajoutée' });
        },
        onError: () => Toast.show({ type: 'error', text1: "Échec de l'ajout" }),
      },
    );
  };

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Applications" subtitle="Autorise ou bloque les apps" />

      <View className="px-5 pb-10">
        <Card className="mb-5">
          <Text className="mb-3 font-heading-semi text-[15px] text-kz-ink">
            Ajouter une application
          </Text>
          <View className="mb-2">
            <Input placeholder="Nom (ex. TikTok)" value={nomApp} onChangeText={setNomApp} />
          </View>
          <View className="mb-3">
            <Input
              placeholder="Identifiant (ex. com.tiktok)"
              value={bundleId}
              onChangeText={setBundleId}
              autoCapitalize="none"
            />
          </View>
          <Button
            size="sm"
            loading={upsert.isPending}
            onPress={add}
            leftIcon={<Plus size={18} color={colors.white} />}
          >
            Ajouter
          </Button>
        </Card>

        {apps.isLoading ? (
          <Text className="text-kz-ink-muted">Chargement…</Text>
        ) : apps.data && apps.data.length > 0 ? (
          apps.data.map((app) => (
            <Card key={app.id} className="mb-2.5 flex-row items-center">
              <View className="flex-1">
                <Text className="font-heading-semi text-[15px] text-kz-ink">{app.nomApp}</Text>
                <Text className="text-[12px] text-kz-ink-muted">
                  {CATEGORIE_LABEL[app.categorie]}
                  {app.limiteQuotidienne != null ? ` · ${app.limiteQuotidienne} min/j` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => toggle(app)}
                className={`mr-2 h-9 flex-row items-center rounded-full px-3 ${app.autorisee ? 'bg-kz-green/20' : 'bg-kz-red/20'}`}
              >
                {app.autorisee ? (
                  <Check size={16} color={colors.green} />
                ) : (
                  <Ban size={16} color={colors.red} />
                )}
                <Text
                  className={`ml-1.5 text-[13px] ${app.autorisee ? 'text-kz-green' : 'text-kz-red'}`}
                >
                  {app.autorisee ? 'Autorisée' : 'Bloquée'}
                </Text>
              </Pressable>
              <Pressable onPress={() => del.mutate(app.bundleId)} hitSlop={8}>
                <Trash2 size={18} color={colors.muted} />
              </Pressable>
            </Card>
          ))
        ) : (
          <Text className="text-center text-kz-ink-muted">Aucune application configurée.</Text>
        )}
      </View>
    </Screen>
  );
};
