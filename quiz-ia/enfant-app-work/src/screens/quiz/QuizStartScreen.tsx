import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Sparkles } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import { useGeneratePhotoQuiz, useGenerateTopicQuiz } from '~/hooks/quiz';
import { useAuthStore } from '~/store/auth.store';
import { cn } from '~/lib/cn';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'QuizStart'>;

/** Matières couvertes par le Cerveau IA (cf. mappings backend ; `autres` exclu). */
const MATIERES: Array<{ value: string; label: string; emoji: string }> = [
  { value: 'maths', label: 'Maths', emoji: '🔢' },
  { value: 'francais', label: 'Français', emoji: '📖' },
  { value: 'histoire_geo', label: 'Histoire-Géo', emoji: '🗺️' },
  { value: 'sciences', label: 'Sciences', emoji: '🔬' },
  { value: 'anglais', label: 'Anglais', emoji: '🇬🇧' },
];

export const QuizStartScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profilEnfant = useAuthStore((s) => s.profilEnfant);
  const topicMutation = useGenerateTopicQuiz();
  const photoMutation = useGeneratePhotoQuiz();

  const [matiere, setMatiere] = React.useState<string>('maths');
  const [chapitre, setChapitre] = React.useState('');

  const loading = topicMutation.isPending || photoMutation.isPending;

  const fail = (message: string) =>
    Toast.show({ type: 'error', text1: 'Oups', text2: message });

  const onGenerateTopic = async () => {
    if (!profilEnfant) return;
    try {
      const quiz = await topicMutation.mutateAsync({
        profilEnfantId: profilEnfant.id,
        matiere,
        niveau: profilEnfant.niveauScolaire,
        chapitre: chapitre.trim() || undefined,
      });
      navigation.replace('QuizPlay', { quizId: quiz.id });
    } catch {
      fail("La génération du quiz a échoué. Réessaie dans un instant.");
    }
  };

  const onGeneratePhoto = async () => {
    if (!profilEnfant) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      fail("Autorise l'accès à l'appareil photo pour scanner ton devoir.");
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (shot.canceled || !shot.assets[0]) return;
    const asset = shot.assets[0];
    try {
      const quiz = await photoMutation.mutateAsync({
        profilEnfantId: profilEnfant.id,
        photo: {
          uri: asset.uri,
          name: asset.fileName ?? 'devoir.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        },
      });
      navigation.replace('QuizPlay', { quizId: quiz.id });
    } catch {
      fail("Impossible de lire la photo. Vérifie que le devoir est bien net.");
    }
  };

  if (loading) {
    return (
      <Screen glow>
        <View className="flex-1 items-center justify-center gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-kz-cyan/15">
            <Sparkles size={40} color={colors.cyan} strokeWidth={2} />
          </View>
          <Text className="font-heading text-[22px] text-kz-ink dark:text-kz-white">
            Je prépare ton quiz…
          </Text>
          <Text className="text-center text-[14px] text-kz-ink-soft dark:text-kz-white/70">
            Quelques secondes, l'IA fabrique des questions rien que pour toi.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Nouveau quiz" subtitle="Choisis une matière et c'est parti !" />
      <View className="px-6 pb-10">
        <Text className="font-bold text-[14px] tracking-wider text-kz-cyan">MATIÈRE</Text>
        <View className="mt-3 flex-row flex-wrap gap-2.5">
          {MATIERES.map((m) => {
            const active = matiere === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setMatiere(m.value)}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center rounded-2xl border-2 px-4 py-3',
                  active
                    ? 'border-kz-cyan bg-kz-cyan/10 shadow-cyan-soft'
                    : 'border-kz-stroke bg-kz-surface/40',
                )}
              >
                <Text className="mr-2 text-[16px]">{m.emoji}</Text>
                <Text
                  className={cn(
                    'text-[15px]',
                    active ? 'font-bold text-kz-cyan' : 'text-kz-ink dark:text-kz-white',
                  )}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-7 font-bold text-[14px] tracking-wider text-kz-cyan">
          CHAPITRE (FACULTATIF)
        </Text>
        <View className="mt-3">
          <Input
            value={chapitre}
            onChangeText={setChapitre}
            placeholder="Ex : les fractions, la conjugaison…"
          />
        </View>

        <Button className="mt-8" onPress={onGenerateTopic} leftIcon={<Sparkles size={18} color={colors.white} />}>
          Générer mon quiz
        </Button>

        <View className="my-6 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-kz-stroke" />
          <Text className="text-[13px] text-kz-ink-soft dark:text-kz-white/60">ou</Text>
          <View className="h-px flex-1 bg-kz-stroke" />
        </View>

        <Button
          variant="outline"
          onPress={onGeneratePhoto}
          leftIcon={<Camera size={18} color={colors.cyan} />}
        >
          Photographier mon devoir
        </Button>
      </View>
    </Screen>
  );
};
