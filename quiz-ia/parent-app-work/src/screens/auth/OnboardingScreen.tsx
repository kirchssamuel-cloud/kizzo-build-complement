import * as React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import {
  useNavigation,
  type RouteProp,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Screen } from "~/components/layout/Screen";
import { Button } from "~/components/ui/Button";
import { Text } from "~/components/ui/Text";
import { cn } from "~/lib/cn";
import { useTheme } from "~/theme/theme-provider";
import { colors } from "~/theme/colors";
import type { AuthStackParamList, AuthTarget } from "~/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Onboarding">;
type R = RouteProp<AuthStackParamList, "Onboarding">;

type Step = 1 | 2 | 3;

type StepConfig = {
  title: string;
  titleLine2?: string;
  body: string;
  illustrationDark: number;
  illustrationLight: number;
};

const STEPS: Record<Step, StepConfig> = {
  1: {
    title: "Supervisez en toute",
    titleLine2: "simplicité",
    body: "Suivez l'activité de votre enfant, gérez le temps d'écran et recevez des alertes en temps réel.",
    illustrationDark: require("~/assets/illustrations/onboarding_dark_1.png"),
    illustrationLight: require("~/assets/illustrations/onboarding_light_1.png"),
  },
  2: {
    title: "Motivez plutôt que",
    titleLine2: "restreindre",
    body: "Votre enfant gagne du temps d'écran en relevant des défis éducatifs adaptés.",
    illustrationDark: require("~/assets/illustrations/onboarding_dark_2.png"),
    illustrationLight: require("~/assets/illustrations/onboarding_light_2.png"),
  },
  3: {
    title: "Sécurité et confiance",
    body: "Sans publicité. Données protégées. Conçu pour votre tranquillité.",
    illustrationDark: require("~/assets/illustrations/onboarding_dark_3.png"),
    illustrationLight: require("~/assets/illustrations/onboarding_light_3.png"),
  },
};

const DotIndicator: React.FC<{ active: Step }> = ({ active }) => (
  <View className="flex-row items-center gap-1.5">
    {[1, 2, 3].map((n) => {
      const isActive = n === active;
      return (
        <View
          key={n}
          className={cn(
            "rounded-full",
            isActive ? "h-2 w-8 bg-kz-cyan" : "h-2 w-2 bg-kz-cyan/40",
          )}
          style={
            isActive
              ? {
                  shadowColor: colors.cyan,
                  shadowOpacity: 0.6,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }
              : null
          }
        />
      );
    })}
  </View>
);

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { isDark } = useTheme();
  const target: AuthTarget = route.params?.target ?? "signup";
  const step = (route.params?.step ?? 1) as Step;
  const config = STEPS[step];
  const source = isDark ? config.illustrationDark : config.illustrationLight;
  const goNext = () => {
    if (step < 3) {
      navigation.push("Onboarding", { target, step: (step + 1) as Step });
    } else {
      navigation.replace(target === "login" ? "Login" : "Signup");
    }
  };
  const goPrev = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };
  const skip = () =>
    navigation.replace(target === "login" ? "Login" : "Signup");
  const swipe = React.useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-30, 30])
        .failOffsetY([-25, 25])
        .onEnd((event) => {
          const DIST = 60;
          const VEL = 500;
          if (event.translationX < -DIST || event.velocityX < -VEL) {
            goNext();
          } else if (event.translationX > DIST || event.velocityX > VEL) {
            goPrev();
          }
        }),
    [step, target],
  );

  return (
    <Screen noPadding glow>
      <GestureDetector gesture={swipe}>
        <View className="flex-1 px-2 pt-3 pb-6">
          <View className="items-end">
            <Pressable accessibilityRole="button" onPress={skip} hitSlop={12}>
              <Text className="font-medium text-[14px] text-kz-ink-soft dark:text-kz-white/60">
                Passer
              </Text>
            </Pressable>
          </View>

          <View
            className="mt-6 aspect-[408/399] w-full overflow-hidden rounded-[40px]"
            style={{
              shadowColor: colors.cyan,
              shadowOpacity: 0.18,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Image
              source={source}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          </View>

          <View className="mt-2 items-center">
            <Text className="text-center font-heading text-[28px] leading-[34px] text-kz-ink dark:text-kz-white">
              {config.title}
            </Text>
            {config.titleLine2 ? (
              <Text className="text-center font-heading text-[28px] leading-[34px] text-kz-ink dark:text-kz-white">
                {config.titleLine2}
              </Text>
            ) : null}
            <Text className="mt-4 text-center text-[14px] leading-[22px] text-kz-ink-soft dark:text-kz-white/70 px-6">
              {config.body}
            </Text>
          </View>

          <View className="mt-auto items-center gap-7 pt-10">
            <DotIndicator active={step} />
            <View className="w-full">
              <Button onPress={goNext}>Suivant</Button>
            </View>
          </View>
        </View>
      </GestureDetector>
    </Screen>
  );
};
