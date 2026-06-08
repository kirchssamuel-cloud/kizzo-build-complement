import * as React from 'react';
import { Switch, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Save } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useNotifPrefs, useUpdateNotifPrefs } from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { PreferenceNotification, TypeNotification } from '~/types/controls';

const TYPE_LABEL: Record<TypeNotification, string> = {
  acces_bloque: 'Accès bloqué',
  fin_quota: 'Fin du quota de temps',
  defi_reussi: 'Défi réussi',
  defi_echoue: 'Défi échoué',
  appareil_hors_ligne: 'Appareil hors ligne',
  appareil_appaire: 'Appareil appairé',
  demande_temps: 'Demande de temps',
  reponse_demande: 'Réponse à une demande',
  badge_debloque: 'Badge débloqué',
  resume_quotidien: 'Résumé quotidien',
  resume_hebdomadaire: 'Résumé hebdomadaire',
  systeme: 'Système',
};

export const NotificationPreferencesScreen: React.FC = () => {
  const prefs = useNotifPrefs();
  const update = useUpdateNotifPrefs();
  const [local, setLocal] = React.useState<PreferenceNotification[]>([]);

  React.useEffect(() => {
    if (prefs.data) setLocal(prefs.data);
  }, [prefs.data]);

  const setChannel = (
    type: TypeNotification,
    channel: 'canalPush' | 'canalEmail',
    value: boolean,
  ) => {
    setLocal((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [channel]: value } : p)),
    );
  };

  const save = () => {
    update.mutate(
      { preferences: local },
      {
        onSuccess: () => Toast.show({ type: 'success', text1: 'Préférences enregistrées' }),
        onError: () => Toast.show({ type: 'error', text1: "Échec de l'enregistrement" }),
      },
    );
  };

  return (
    <Screen scroll noPadding>
      <SubScreenHeader
        title="Notifications"
        subtitle="Choisis comment être prévenu(e)"
      />

      <View className="px-5 pb-10">
        {prefs.isLoading ? (
          <Text className="text-kz-ink-muted">Chargement…</Text>
        ) : (
          <>
            {local.map((p) => (
              <Card key={p.type} className="mb-2.5">
                <Text className="mb-2 font-heading-semi text-[15px] text-kz-ink">
                  {TYPE_LABEL[p.type]}
                </Text>
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-[14px] text-kz-ink-soft">Push</Text>
                  <Switch
                    value={p.canalPush}
                    onValueChange={(v) => setChannel(p.type, 'canalPush', v)}
                    trackColor={{ true: colors.cyan }}
                  />
                </View>
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-[14px] text-kz-ink-soft">E-mail</Text>
                  <Switch
                    value={p.canalEmail}
                    onValueChange={(v) => setChannel(p.type, 'canalEmail', v)}
                    trackColor={{ true: colors.cyan }}
                  />
                </View>
              </Card>
            ))}

            <View className="mt-3">
              <Button
                loading={update.isPending}
                onPress={save}
                leftIcon={<Save size={18} color={colors.white} />}
              >
                Enregistrer
              </Button>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
};
