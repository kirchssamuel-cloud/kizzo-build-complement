import * as React from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useNavigation,
  type RouteProp,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { Mail } from "lucide-react-native";
import { Screen } from "~/components/layout/Screen";
import { SubScreenHeader } from "~/components/layout/SubScreenHeader";
import { Button } from "~/components/ui/Button";
import { FormField } from "~/components/forms/FormField";
import { Text } from "~/components/ui/Text";
import { useResendVerification, useVerifyEmail } from "~/hooks/auth";
import { verifyEmailSchema, type VerifyEmailInput } from "~/schemas/auth";
import { colors } from "~/theme/colors";
import type { AuthStackParamList } from "~/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "VerifyEmail">;
type R = RouteProp<AuthStackParamList, "VerifyEmail">;

export const VerifyEmailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const [cooldown, setCooldown] = React.useState(0);

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    mode: "onBlur",
    defaultValues: { email: route.params.email, code: "" },
  });

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await verify.mutateAsync(data);
      Toast.show({
        type: "success",
        text1: "Email vérifié 🎉",
        text2: "Connecte-toi pour accéder à ton compte",
      });
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Code invalide",
        text2: e?.response?.data?.message ?? "Vérifie ton code",
      });
    }
  });

  const onResend = async () => {
    try {
      await resend.mutateAsync(route.params.email);
      setCooldown(60);
      Toast.show({ type: "success", text1: "Code renvoyé" });
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors du renvoi" });
    }
  };

  return (
    <Screen scroll noPadding glow>
      <View className="px-6 pt-3 pb-8">
        <SubScreenHeader
          title="Vérification email"
          subtitle={`Code envoyé à ${route.params.email}`}
        />
      </View>

      <View className="px-6">
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-kz-cyan/15">
            <Mail size={28} color={colors.cyan} strokeWidth={2} />
          </View>
        </View>

        <View className="mt-8">
          <FormField
            control={form.control}
            name="code"
            label="Code à 6 chiffres"
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
          />

          <Button
            className="mt-4"
            onPress={onSubmit}
            loading={verify.isPending}
          >
            Valider
          </Button>

          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <Text className="text-[13px] text-kz-ink-soft">
              Code non reçu ?
            </Text>
            <Text
              onPress={cooldown > 0 ? undefined : onResend}
              className="text-[13px] font-semibold text-kz-orange"
              style={{ opacity: cooldown > 0 ? 0.4 : 1 }}
            >
              {cooldown > 0 ? `Renvoyer (${cooldown}s)` : "Renvoyer"}
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
};
