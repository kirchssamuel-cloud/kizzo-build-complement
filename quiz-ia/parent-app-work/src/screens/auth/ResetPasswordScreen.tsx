import * as React from "react";
import { View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useNavigation,
  type RouteProp,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { Screen } from "~/components/layout/Screen";
import { SubScreenHeader } from "~/components/layout/SubScreenHeader";
import { Button } from "~/components/ui/Button";
import { FormField } from "~/components/forms/FormField";
import { PasswordStrengthBar } from "~/components/ui/PasswordStrengthBar";
import { useUpdatePasswordWithCode } from "~/hooks/auth";
import {
  passwordResetUpdateSchema,
  passwordStrength,
  type PasswordResetUpdateInput,
} from "~/schemas/auth";
import type { AuthStackParamList } from "~/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
type R = RouteProp<AuthStackParamList, "ResetPassword">;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const update = useUpdatePasswordWithCode();
  const form = useForm<PasswordResetUpdateInput>({
    resolver: zodResolver(passwordResetUpdateSchema),
    defaultValues: { email: route.params.email, code: "", password: "" },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const score = passwordStrength(password ?? "");

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await update.mutateAsync(data);
      Toast.show({ type: "success", text1: "Mot de passe mis à jour" });
      navigation.navigate("Login");
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Code invalide",
        text2: e?.response?.data?.message ?? "Vérifie le code reçu",
      });
    }
  });

  return (
    <Screen scroll noPadding glow>
      <View className="px-6 pt-3 pb-8">
        <SubScreenHeader
          title="Nouveau mot de passe"
          subtitle="Saisis le code reçu et choisis un nouveau mot de passe."
        />
      </View>

      <View className="px-6">
        <FormField
          control={form.control}
          name="code"
          label="Code reçu"
          placeholder="123456"
          keyboardType="number-pad"
        />
        <View className="mt-[22px]">
          <FormField
            control={form.control}
            name="password"
            label="Nouveau mot de passe"
            type="password"
            placeholder="••••••••"
          />
          {password ? (
            <PasswordStrengthBar score={score} className="mt-2" />
          ) : null}
        </View>
        <Button className="mt-6" onPress={onSubmit} loading={update.isPending}>
          Valider
        </Button>
      </View>
    </Screen>
  );
};
