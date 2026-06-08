import * as React from "react";
import { Linking, View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { Screen } from "~/components/layout/Screen";
import { SubScreenHeader } from "~/components/layout/SubScreenHeader";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { FormField } from "~/components/forms/FormField";
import { PasswordStrengthBar } from "~/components/ui/PasswordStrengthBar";
import { Text } from "~/components/ui/Text";
import { useSignup } from "~/hooks/auth";
import {
  passwordStrength,
  signupSchema,
  type SignupInput,
} from "~/schemas/auth";
import type { AuthStackParamList } from "~/navigation/types";
import { useTheme } from "~/theme/theme-provider";
import { cn } from "~/lib/cn";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Signup">;
export const SignupScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const signup = useSignup();
  const { isDark } = useTheme();
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptCgu: false as unknown as true,
      optInNewsletter: false,
    },
  });

  const password = useWatch({ control: form.control, name: "password" });
  const accept = useWatch({ control: form.control, name: "acceptCgu" });
  const score = passwordStrength(password ?? "");

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await signup.mutateAsync(data);
      navigation.replace("VerifyEmail", { email: data.email });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Inscription impossible",
        text2: e?.response?.data?.message ?? "Erreur réseau",
      });
    }
  });

  return (
    <Screen scroll noPadding glow>
      <View className="px-6 pt-3">
        <SubScreenHeader
          title="Créer un compte"
          subtitle="Rejoignez Kizzo dès aujourd'hui"
        />
      </View>

      <View
        className={cn(
          "rounded-[40px] border px-6 pt-10 pb-10 border-kz-orange-light/50",
          isDark && "border-kz-cyan-light/50",
        )}
      >
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              control={form.control}
              name="prenom"
              label="Prénom"
              placeholder="Jean"
              autoComplete="name-given"
            />
          </View>
          <View className="flex-1">
            <FormField
              control={form.control}
              name="nom"
              label="Nom"
              placeholder="Dupont"
              autoComplete="name-family"
            />
          </View>
        </View>

        <View className="mt-[22px]">
          <FormField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="nom@exemple.com"
            autoComplete="email"
          />
        </View>

        <View className="mt-[22px]">
          <FormField
            control={form.control}
            name="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
          />
          {password ? (
            <PasswordStrengthBar score={score} className="mt-2" />
          ) : null}
        </View>

        <View className="mt-[22px]">
          <FormField
            control={form.control}
            name="confirmPassword"
            label="Confirmer mot de passe"
            type="password"
            placeholder="••••••••"
          />
        </View>

        <View className="mt-6 flex-row items-start gap-3">
          <View className="mt-0.5">
            <Checkbox
              checked={!!accept}
              onCheckedChange={(v) =>
                form.setValue("acceptCgu", v as unknown as true, {
                  shouldValidate: true,
                })
              }
            />
          </View>
          <Text className="flex-1 text-[12px] leading-[18px] text-kz-ink-soft">
            J'accepte{" "}
            <Text
              className="text-[12px] underline"
              onPress={() =>
                Linking.openURL("https://kizzo.app/cgu").catch(() => null)
              }
            >
              les conditions
            </Text>{" "}
            et la{" "}
            <Text
              className="text-[12px] underline"
              onPress={() =>
                Linking.openURL("https://kizzo.app/confidentialite").catch(
                  () => null,
                )
              }
            >
              politique de confidentialité
            </Text>
          </Text>
        </View>

        <Button className="mt-6" onPress={onSubmit} loading={signup.isPending}>
          Créer un compte
        </Button>

        <View className="mt-8 flex-row items-center justify-center gap-2">
          <Text className="font-medium text-[12px] text-kz-ink dark:text-kz-white">
            Déjà un compte ?
          </Text>
          <Text
            className="font-semibold text-[16px] text-kz-orange"
            onPress={() => navigation.navigate("Login")}
          >
            Se connecter
          </Text>
        </View>
      </View>
    </Screen>
  );
};
