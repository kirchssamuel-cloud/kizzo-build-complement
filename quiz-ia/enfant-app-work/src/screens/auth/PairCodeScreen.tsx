import * as React from "react";
import { Platform, View } from "react-native";
import * as Application from "expo-application";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { Smartphone } from "lucide-react-native";
import { Screen } from "~/components/layout/Screen";
import { SubScreenHeader } from "~/components/layout/SubScreenHeader";
import { Button } from "~/components/ui/Button";
import { FormField } from "~/components/forms/FormField";
import { Text } from "~/components/ui/Text";
import { usePairDevice } from "~/hooks/auth";
import { pairSchema, type PairInput } from "~/schemas/auth";
import { colors } from "~/theme/colors";

export const PairCodeScreen: React.FC = () => {
  const pair = usePairDevice();
  const form = useForm<PairInput>({
    resolver: zodResolver(pairSchema),
    defaultValues: {
      codeAppairage: "",
      nomAppareil: "Appareil enfant",
      plateforme: (Platform.OS === "ios" ? "ios" : "android") as
        | "ios"
        | "android",
      versionOs: String(Platform.Version),
      versionApp: Application.nativeApplicationVersion ?? "0.1.0",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await pair.mutateAsync(data);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Code invalide",
        text2:
          e?.response?.data?.message ??
          "Demande un nouveau code à tes parents.",
      });
    }
  });

  return (
    <Screen scroll noPadding glow>
      <View className="px-6 pt-3 pb-8">
        <SubScreenHeader
          title="Connecter mon appareil"
          subtitle="Saisis le code à 6 chiffres que tes parents te donnent."
        />
      </View>

      <View className="px-6">
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-kz-cyan/15">
            <Smartphone size={28} color={colors.cyan} strokeWidth={2} />
          </View>
        </View>

        <View className="mt-8">
          <FormField
            control={form.control}
            name="codeAppairage"
            label="Code à 6 chiffres"
            placeholder="123 456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
          />
          <View className="mt-[22px]">
            <FormField
              control={form.control}
              name="nomAppareil"
              label="Nom de l'appareil"
              placeholder="Tablette de Lina"
            />
          </View>

          <Button className="mt-6" onPress={onSubmit} loading={pair.isPending}>
            Connecter
          </Button>

          <Text className="mt-6 text-center text-[12px] text-kz-ink-muted">
            Tes parents trouveront ce code dans leur app Kizzo Parent.
          </Text>
        </View>
      </View>
    </Screen>
  );
};
