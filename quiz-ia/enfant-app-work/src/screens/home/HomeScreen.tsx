import * as React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, Clock, TrendingUp } from "lucide-react-native";
import { Screen } from "~/components/layout/Screen";
import { Avatar } from "~/components/ui/Avatar";
import { Button } from "~/components/ui/Button";
import { Text } from "~/components/ui/Text";
import { useAuthStore } from "~/store/auth.store";
import { useHomeState } from "~/hooks/home";
import { colors } from "~/theme/colors";
import type { AppStackParamList } from "~/navigation/types";

type Nav = NativeStackNavigationProp<AppStackParamList>;
const formatMin = (seconds: number) => Math.round(seconds / 60);

const HeroQuizCard: React.FC<{ minRestantes: number }> = ({ minRestantes }) => (
  <View className="h-[320px] w-full overflow-hidden rounded-[40px] border bg-white border-kz-cyan/40 dark:bg-kz-surface/40 dark:border-kz-cyan shadow-cyan-glow">
    {}
    <View
      pointerEvents="none"
      className="absolute -right-[60px] -top-[64px] h-32 w-32 rounded-full bg-kz-orange/50"
    />
    <View
      pointerEvents="none"
      className="absolute -left-[89px] -bottom-[60px] h-40 w-40 rounded-full bg-kz-cyan/50"
    />

    <View className="absolute inset-0 items-center justify-center px-8">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-kz-cyan/15">
        <Clock size={28} color={colors.cyan} strokeWidth={2.5} />
      </View>
      <Text className="mt-4 text-center font-heading text-[28px] text-kz-ink dark:text-kz-white">
        Il te reste {minRestantes} min
      </Text>
      <Text className="mt-2 font-heading-semi text-[18px] text-kz-ink-soft dark:text-kz-white/80">
        Avant le prochain quiz
      </Text>
      <View className="mt-6 rounded-full border border-white/10 bg-white/10 px-6 py-2">
        <Text className="font-medium text-[14px] text-kz-cyan">
          Prochain quiz dans 1h
        </Text>
      </View>
    </View>
  </View>
);

const EvolutionCard: React.FC<{
  points?: number;
  niveau?: number;
  nextLevelPts?: number;
  progressPct?: number;
}> = ({ points = 120, niveau = 3, nextLevelPts = 30, progressPct = 65 }) => (
  <View className="w-full rounded-[32px] border bg-white border-kz-cyan/20 dark:bg-kz-surface/30 dark:border-white/5 px-[17px] py-6">
    <View className="flex-row items-end justify-between">
      <View className="gap-1">
        <Text className="font-bold text-[12px] tracking-wider text-kz-cyan">
          TON ÉVOLUTION
        </Text>
        <View className="mt-1 flex-row items-center gap-2.5">
          <TrendingUp size={20} color={colors.cyan} strokeWidth={2} />
          <Text className="font-heading text-[22px] text-kz-ink dark:text-kz-white">
            {points} points
          </Text>
        </View>
      </View>
      <View className="rounded-full bg-kz-cyan px-4 py-1">
        <Text className="font-bold text-[14px] text-kz-surface-soft">
          Niveau {niveau}
        </Text>
      </View>
    </View>

    <View className="mt-3 gap-2">
      <View className="h-4 w-full overflow-hidden rounded-full bg-kz-ink/10 dark:bg-white/10">
        <View
          className="h-4 rounded-full bg-kz-orange"
          style={{
            width: `${Math.min(100, Math.max(0, progressPct))}%`,
            shadowColor: colors.cyan,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-[12px] text-kz-ink-soft dark:text-kz-white/70">
          Plus que {nextLevelPts} pts pour le Niveau {niveau + 1} !
        </Text>
        <Text className="font-bold text-[12px] text-kz-ink dark:text-kz-white">
          {progressPct}%
        </Text>
      </View>
    </View>
  </View>
);

const LastQuizCard: React.FC = () => (
  <View className="w-full rounded-[32px] border bg-white border-kz-cyan/20 dark:bg-kz-surface/30 dark:border-white/5 px-[17px] py-6 shadow-cyan-soft">
    <View className="flex-row items-center gap-4">
      <View className="h-10 w-10 items-center justify-center rounded-3xl bg-kz-cyan/10">
        <Check size={18} color={colors.cyan} strokeWidth={2.5} />
      </View>
      <View className="gap-1.5">
        <Text className="font-bold text-[14px] text-kz-ink dark:text-kz-white">
          Dernier quiz : 8/10 ✅
        </Text>
        <Text className="font-medium text-[12px] text-kz-ink-soft dark:text-kz-white/70">
          Fini il y a 2 heures
        </Text>
      </View>
    </View>
  </View>
);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profil = useAuthStore((s) => s.profilEnfant);
  const home = useHomeState();

  const prenom = home.data?.profilEnfant.prenom ?? profil?.prenom ?? "mon ami";
  const couleur =
    home.data?.profilEnfant.couleurTheme ?? profil?.couleurTheme ?? colors.cyan;
  const tempsUtiliseMin = home.data
    ? formatMin(home.data.tempsUtiliseSeconds)
    : 0;
  const QUOTA_DEFAUT_MIN = 60;
  const minRestantes = Math.max(0, QUOTA_DEFAUT_MIN - tempsUtiliseMin);

  React.useEffect(() => {
    if (home.data && minRestantes <= 0) {
      navigation.navigate("Locked", { raison: "quota" });
    }
  }, [home.data, minRestantes, navigation]);

  return (
    <Screen scroll glow>
      <View className="pt-4 pb-6">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-heading text-[28px] text-kz-ink dark:text-kz-white">
              Salut {prenom} <Text className="text-[28px]">👋</Text>
            </Text>
            <Text className="mt-2 text-[14px] text-kz-ink-soft dark:text-kz-white/70">
              C'est parti pour une nouvelle journée !
            </Text>
          </View>
          <View className="h-[57px] w-[57px] items-center justify-center rounded-full border-2 border-kz-cyan/30">
            <Avatar prenom={prenom} couleurTheme={couleur} size={44} />
          </View>
        </View>
      </View>

      <View className="gap-7">
        <HeroQuizCard minRestantes={minRestantes} />
        <EvolutionCard />
        <LastQuizCard />

        <View className="items-center opacity-60">
          <Text className="font-medium text-[12px] text-kz-ink-soft dark:text-kz-white/70">
            "Continue comme ça !"
          </Text>
        </View>
      </View>

      <View className="h-8" />

      {}
      <Button onPress={() => navigation.navigate("QuizStart")}>
        Lancer un quiz
      </Button>

      <View className="h-3" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            variant="outline"
            onPress={() => navigation.navigate("Badges")}
          >
            Mes badges
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="outline"
            onPress={() => navigation.navigate("QuizHistory")}
          >
            Historique
          </Button>
        </View>
      </View>

      <View className="h-3" />
      <Button variant="outline" onPress={() => navigation.navigate("Activity")}>
        Mon activité
      </Button>
      <View className="h-6" />
    </Screen>
  );
};
