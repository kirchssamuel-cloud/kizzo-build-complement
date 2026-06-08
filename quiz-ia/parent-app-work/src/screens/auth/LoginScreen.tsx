import * as React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { Screen } from "~/components/layout/Screen";
import { SubScreenHeader } from "~/components/layout/SubScreenHeader";
import { Button } from "~/components/ui/Button";
import { OrDivider } from "~/components/ui/Divider";
import { FormField } from "~/components/forms/FormField";
import { Text } from "~/components/ui/Text";
import { useLogin, useSignInWithApple } from "~/hooks/auth";
import { loginSchema, type LoginInput } from "~/schemas/auth";
import type { AuthStackParamList } from "~/navigation/types";
import { useTheme } from "~/theme/theme-provider";
import { cn } from "~/lib/cn";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.5 0 19.4-7.5 19.4-19.5 0-1.3-.1-2.3-.4-3.5z"
    />
    <Path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.6 8.7 6.3 14.7z"
    />
    <Path
      fill="#4CAF50"
      d="M24 43.5c5.4 0 10.3-2 14-5.3l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.5 39.2 16.2 43.5 24 43.5z"
    />
    <Path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.5 5.5c-.5.5 7.1-5.1 7.1-15 0-1.3-.1-2.3-.4-3.5z"
    />
  </Svg>
);

const AppleIcon = ({
  size = 20,
  color = "#fafafa",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M16.365 1.43c0 1.14-.41 2.234-1.244 3.078-.834.844-2.083 1.49-3.249 1.41-.085-1.18.45-2.418 1.244-3.246.913-.95 2.244-1.586 3.249-1.242zM20.84 17.6c-.514 1.182-.752 1.703-1.434 2.747-.953 1.456-2.296 3.27-3.962 3.286-1.482.014-1.864-.967-3.875-.957-2.012.011-2.43.974-3.913.96-1.667-.016-2.94-1.654-3.893-3.11-2.668-4.07-2.948-8.847-1.302-11.388 1.171-1.806 3.022-2.864 4.762-2.864 1.77 0 2.882.972 4.346.972 1.42 0 2.286-.974 4.333-.974 1.546 0 3.183.842 4.351 2.295-3.825 2.092-3.207 7.555.587 9.033z" />
  </Svg>
);
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const login = useLogin();
  const apple = useSignInWithApple();
  const { isDark } = useTheme();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await login.mutateAsync(data);
    } catch (e: any) {
      const details = e?.response?.data?.details;
      if (details?.code === "EMAIL_NOT_VERIFIED") {
        Toast.show({
          type: "info",
          text1: "Vérification requise",
          text2: "On a renvoyé un code à ton email.",
        });
        navigation.navigate("VerifyEmail", {
          email: details.email ?? data.email,
        });
        return;
      }
      Toast.show({
        type: "error",
        text1: "Connexion impossible",
        text2: e?.response?.data?.message ?? "Identifiants invalides",
      });
    }
  });

  return (
    <Screen scroll noPadding glow>
      <View className="px-6 pt-3 pb-8">
        <SubScreenHeader
          title="Bienvenue sur Kizzo"
          subtitle="Votre copilote parental numérique"
        />
      </View>

      <View
        className={cn(
          "rounded-[40px] border px-6 pt-10 pb-10 border-kz-orange-light/50",
          isDark && "border-kz-cyan-light/50",
        )}
      >
        <FormField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="nom@exemple.com"
          autoComplete="email"
        />

        <View className="mt-[22px]">
          <FormField
            control={form.control}
            name="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
          />
          <View className="mt-2 items-end">
            <Text
              className="font-medium text-[12px] text-kz-orange"
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              Mot de passe oublié ?
            </Text>
          </View>
        </View>

        <Button className="mt-6" onPress={onSubmit} loading={login.isPending}>
          Se connecter
        </Button>

        <OrDivider className="my-6" />

        <View className="gap-3.5">
          <Button variant="outline-blue" leftIcon={<GoogleIcon />}>
            Continuer avec Google
          </Button>
          <Button
            variant="outline-blue"
            leftIcon={<AppleIcon color={isDark ? "#fafafa" : "#1e293b"} />}
            onPress={() => apple.mutate()}
            loading={apple.isPending}
          >
            Continuer avec Apple
          </Button>
        </View>

        <View className="mt-8 flex-row items-center justify-center gap-2">
          <Text className="font-medium text-[12px] text-kz-ink dark:text-kz-white">
            Vous n'avez pas de compte ?
          </Text>
          <Text
            className="font-semibold text-[16px] text-kz-orange"
            onPress={() => navigation.navigate("Signup")}
          >
            Créer un
          </Text>
        </View>
      </View>
    </Screen>
  );
};
