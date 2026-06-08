import * as React from 'react';
import { Pressable, Share, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Download, Globe, Mail, ShieldAlert } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Input, PasswordInput } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import { useDeleteAccount, useParentProfile, useUpdateProfile } from '~/hooks/controls';
import { rgpdApi } from '~/services/api/controls';
import { useAuthStore } from '~/store/auth.store';
import { colors } from '~/theme/colors';

export const AccountScreen: React.FC = () => {
  const profile = useParentProfile();
  const update = useUpdateProfile();
  const remove = useDeleteAccount();
  const clearSession = useAuthStore((s) => s.clearSession);

  const [prenom, setPrenom] = React.useState('');
  const [nom, setNom] = React.useState('');
  const [telephone, setTelephone] = React.useState('');

  const [dangerOpen, setDangerOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmText, setConfirmText] = React.useState('');
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    if (profile.data) {
      setPrenom(profile.data.prenom ?? '');
      setNom(profile.data.nom ?? '');
      setTelephone(profile.data.telephone ?? '');
    }
  }, [profile.data]);

  const save = () => {
    const payload: { prenom?: string; nom?: string; telephone?: string } = {};
    if (prenom.trim()) payload.prenom = prenom.trim();
    if (nom.trim()) payload.nom = nom.trim();
    if (telephone.trim()) payload.telephone = telephone.trim();
    update.mutate(payload, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Profil mis à jour' }),
      onError: () => Toast.show({ type: 'error', text1: 'Échec de la mise à jour' }),
    });
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await rgpdApi.export();
      await Share.share({
        title: 'Mes données Kizzo',
        message: JSON.stringify(data, null, 2),
      });
    } catch {
      Toast.show({ type: 'error', text1: "Échec de l'export" });
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () => {
    remove.mutate(
      { password: password || undefined, confirmation: 'SUPPRIMER' },
      {
        onSuccess: async () => {
          Toast.show({ type: 'success', text1: 'Compte supprimé' });
          await clearSession();
        },
        onError: () => Toast.show({ type: 'error', text1: 'Mot de passe incorrect' }),
      },
    );
  };

  if (profile.isLoading) {
    return (
      <Screen noPadding>
        <SubScreenHeader title="Mon compte" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-kz-ink-muted">Chargement…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Mon compte" subtitle="Gère tes informations personnelles" />

      <View className="px-5 pb-10">
        <Card className="mb-5">
          <View className="mb-4 flex-row items-center">
            <Mail size={16} color={colors.muted} />
            <Text className="ml-2 text-[14px] text-kz-ink-soft">{profile.data?.email}</Text>
          </View>
          <Text className="mb-1 text-[13px] text-kz-ink-muted">Prénom</Text>
          <View className="mb-3">
            <Input value={prenom} onChangeText={setPrenom} placeholder="Prénom" />
          </View>
          <Text className="mb-1 text-[13px] text-kz-ink-muted">Nom</Text>
          <View className="mb-3">
            <Input value={nom} onChangeText={setNom} placeholder="Nom" />
          </View>
          <Text className="mb-1 text-[13px] text-kz-ink-muted">Téléphone</Text>
          <View className="mb-4">
            <Input
              value={telephone}
              onChangeText={setTelephone}
              placeholder="Téléphone"
              keyboardType="phone-pad"
            />
          </View>
          <Button loading={update.isPending} onPress={save}>
            Enregistrer
          </Button>
        </Card>

        <Card className="mb-5 flex-row items-center">
          <Globe size={18} color={colors.cyan} />
          <View className="ml-3 flex-1">
            <Text className="font-heading-semi text-[14px] text-kz-ink">Plan d'abonnement</Text>
            <Text className="text-[13px] text-kz-ink-muted">{profile.data?.plan}</Text>
          </View>
        </Card>

        {/* Portabilité RGPD — droit d'accès / export (P35, CDC §18). */}
        <Card className="mb-5">
          <View className="flex-row items-center">
            <Download size={18} color={colors.cyan} />
            <Text className="ml-2 font-heading-semi text-[15px] text-kz-ink">
              Exporter mes données
            </Text>
          </View>
          <Text className="mt-2 text-[13px] text-kz-ink-muted">
            Télécharge une copie de tes données et de celles de tes enfants au format JSON
            (portabilité RGPD).
          </Text>
          <Button className="mt-4" variant="outline" loading={exporting} onPress={exportData}>
            Exporter (JSON)
          </Button>
        </Card>

        {/* Zone RGPD — droit à l'effacement (P35, CDC §18). */}
        <Card className="border-kz-red/40">
          <View className="flex-row items-center">
            <ShieldAlert size={18} color={colors.red} />
            <Text className="ml-2 font-heading-semi text-[15px] text-kz-red">
              Supprimer mon compte
            </Text>
          </View>
          <Text className="mt-2 text-[13px] text-kz-ink-muted">
            Cette action est irréversible. Toutes tes données et celles de tes enfants seront
            supprimées (RGPD).
          </Text>

          {dangerOpen ? (
            <View className="mt-4">
              <Text className="mb-1 text-[13px] text-kz-ink-muted">Mot de passe</Text>
              <View className="mb-3">
                <PasswordInput value={password} onChangeText={setPassword} placeholder="Mot de passe" />
              </View>
              <Text className="mb-1 text-[13px] text-kz-ink-muted">
                Tape SUPPRIMER pour confirmer
              </Text>
              <View className="mb-3">
                <Input
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="SUPPRIMER"
                  autoCapitalize="characters"
                />
              </View>
              <Button
                variant="destructive"
                loading={remove.isPending}
                disabled={confirmText !== 'SUPPRIMER'}
                onPress={confirmDelete}
              >
                Supprimer définitivement
              </Button>
              <Pressable className="mt-3 items-center" onPress={() => setDangerOpen(false)}>
                <Text className="text-[14px] text-kz-ink-soft">Annuler</Text>
              </Pressable>
            </View>
          ) : (
            <Button className="mt-4" variant="destructive" onPress={() => setDangerOpen(true)}>
              Supprimer mon compte
            </Button>
          )}
        </Card>
      </View>
    </Screen>
  );
};
