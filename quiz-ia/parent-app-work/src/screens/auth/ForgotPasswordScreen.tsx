import * as React from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { KeyRound } from "lucide-react-native";
import { Screen } from "~/components/layout/Screen";
import { SubScreenHeader } from "~/components/layout/SubScreenHeader";
import { Button } from "~/components/ui/Button";
import { FormField } from "~/components/forms/FormField";
import { Text } from "~/components/ui/Text";
import { colors } from "~/theme/colors";
import { useSendPasswordResetCode } from "~/hooks/auth";
import {
  passwordResetSendCodeSchema,
  type PasswordResetSendCodeInput,
} from "~/schemas/auth";
import type { AuthStackParamList } from "~/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const send = useSendPasswordResetCode();
  const form = useForm<PasswordResetSendCodeInput>({
    resolver: zodResolver(passwordResetSendCodeSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await send.mutateAsync(data);
      navigation.navigate("ResetPassword", { email: data.email });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: e?.response?.data?.message ?? "Réessaye plus tard",
      });
    }
  });

  return (
    <Screen scroll noPadding glow>
      <View className="px-6 pt-3 pb-8">
        <SubScreenHeader
          title="Mot de passe oublié"
          subtitle="On t'envoie un code à 6 chiffres."
        />
      </View>

      <View className="px-6">
        <View className="mt-8">
          <FormField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="nom@exemple.com"
            autoComplete="email"
          />
          <Button className="mt-4" onPress={onSubmit} loading={send.isPending}>
            Envoyer le code
          </Button>
          <Text className="mt-4 text-center text-[12px] text-kz-ink-muted">
            Tu recevras un email avec un code à 6 chiffres.
          </Text>
        </View>
      </View>
    </Screen>
  );
};
