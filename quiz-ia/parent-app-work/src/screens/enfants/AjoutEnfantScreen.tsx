import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { FormField } from '~/components/forms/FormField';
import { Label } from '~/components/ui/Label';
import { Text } from '~/components/ui/Text';
import { cn } from '~/lib/cn';
import { useCreateEnfant } from '~/hooks/enfants';
import { createChildSchema, type CreateChildInput } from '~/schemas/enfants';
import type { AppStackParamList } from '~/navigation/types';
import type { NiveauScolaire } from '~/types/auth';

type Nav = NativeStackNavigationProp<AppStackParamList, 'AjoutEnfant'>;

const NIVEAUX: { value: NiveauScolaire; label: string }[] = [
  { value: 'maternelle', label: 'Maternelle' },
  { value: 'cp', label: 'CP' },
  { value: 'ce1', label: 'CE1' },
  { value: 'ce2', label: 'CE2' },
  { value: 'cm1', label: 'CM1' },
  { value: 'cm2', label: 'CM2' },
  { value: 'sixieme', label: '6e' },
  { value: 'cinquieme', label: '5e' },
  { value: 'quatrieme', label: '4e' },
  { value: 'troisieme', label: '3e' },
  { value: 'seconde', label: 'Seconde' },
  { value: 'premiere', label: 'Première' },
  { value: 'terminale', label: 'Terminale' },
];

const COULEURS = [
  '#4C6971',
  '#3B8CFF',
  '#EA3FA1',
  '#FF9450',
  '#28A75A',
  '#9344CE',
  '#F39526',
  '#FFD45B',
  '#3F455F',
  '#5B6BF5',
];

export const AjoutEnfantScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const create = useCreateEnfant();
  const form = useForm<CreateChildInput>({
    resolver: zodResolver(createChildSchema),
    defaultValues: {
      prenom: '',
      // 8 ans par défaut
      dateNaissance: new Date(new Date().setFullYear(new Date().getFullYear() - 8)),
      niveauScolaire: 'ce2',
      avatarId: 0,
      couleurTheme: '#4C6971',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const enfant = await create.mutateAsync(data);
      Toast.show({ type: 'success', text1: `${enfant.prenom} ajouté(e) 🎉` });
      navigation.replace('Appairage', { profilEnfantId: enfant.id });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Création impossible',
        text2: e?.response?.data?.message ?? 'Réessaye plus tard',
      });
    }
  });

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Ajouter un enfant" withDivider />

      <View className="px-5 pt-6 pb-10">
        <FormField
          control={form.control}
          name="prenom"
          label="Prénom de l'enfant"
          placeholder="Lina"
        />

        <Label>Niveau scolaire</Label>
        <Controller
          control={form.control}
          name="niveauScolaire"
          render={({ field }) => (
            <View className="mb-4 flex-row flex-wrap gap-2">
              {NIVEAUX.map((n) => {
                const active = field.value === n.value;
                return (
                  <Pressable
                    key={n.value}
                    onPress={() => field.onChange(n.value)}
                    className={cn(
                      'rounded-full px-4 py-2',
                      active ? 'bg-kz-primary' : 'bg-kz-soft',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[13px] font-semibold',
                        active ? 'text-white' : 'text-kz-ink-soft',
                      )}
                    >
                      {n.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />

        <Label>Couleur de profil</Label>
        <Controller
          control={form.control}
          name="couleurTheme"
          render={({ field }) => (
            <View className="mb-6 flex-row flex-wrap gap-3">
              {COULEURS.map((c) => {
                const active = field.value === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => field.onChange(c)}
                    accessibilityLabel={`Couleur ${c}`}
                    className={cn(
                      'h-11 w-11 rounded-full',
                      active && 'border-[3px] border-kz-ink',
                    )}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </View>
          )}
        />

        <Text className="mb-4 text-[12px] leading-[18px] text-kz-muted">
          La date de naissance détaillée se règle après l'appairage de l'appareil. Pour le test
          rapide, on prend 8 ans par défaut.
        </Text>

        <Button onPress={onSubmit} loading={create.isPending}>
          Créer le profil
        </Button>
      </View>
    </Screen>
  );
};
