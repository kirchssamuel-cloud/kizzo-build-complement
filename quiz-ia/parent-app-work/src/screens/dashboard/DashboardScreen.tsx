import * as React from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bell, Clock, Lock } from "lucide-react-native";
import { Screen } from "~/components/layout/Screen";
import { Avatar } from "~/components/ui/Avatar";
import { Text } from "~/components/ui/Text";
import { useMe } from "~/hooks/auth";
import { useEnfants } from "~/hooks/enfants";
import { useTheme } from "~/theme/theme-provider";
import { cn } from "~/lib/cn";
import { colors } from "~/theme/colors";
import type { AppStackParamList } from "~/navigation/types";

type Nav = NativeStackNavigationProp<AppStackParamList>;
const formatToday = () => {
  const d = new Date();
  const jours = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];
  const mois = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const j = jours[d.getDay()] ?? "jour";
  const m = mois[d.getMonth()] ?? "mois";
  return `${j.charAt(0).toUpperCase() + j.slice(1)} ${d.getDate()} ${m} ${d.getFullYear()}`;
};

const NotificationBell: React.FC<{ count?: number; onPress?: () => void }> = ({
  count = 0,
  onPress,
}) => {
  const { isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "h-[35px] w-[35px] items-center justify-center rounded-[8px]",
        "bg-white shadow-cyan-soft dark:bg-white/[0.13] dark:shadow-none",
      )}
    >
      <Bell
        size={20}
        color={isDark ? colors.white : colors.ink}
        strokeWidth={1.6}
      />
      <View
        className={cn(
          "absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full",
          count > 0
            ? "bg-kz-orange"
            : "bg-kz-surface-strong dark:bg-kz-surface-soft",
        )}
      >
        <Text
          className={cn(
            "font-bold text-[10px]",
            count > 0 ? "text-white" : "text-kz-ink-muted",
          )}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
};

const StatusOnline: React.FC = () => (
  <View
    className="flex-row items-center gap-2 rounded-full border border-kz-green/30 bg-kz-green/10 px-[13px] py-[5px]"
    style={{
      shadowColor: colors.green,
      shadowOpacity: 0.5,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    }}
  >
    <View className="h-2 w-2 rounded-full bg-kz-green" />
    <Text className="font-medium text-[12px] text-kz-green">En ligne</Text>
  </View>
);

const ChildSummaryCard: React.FC<{
  prenom: string;
  couleur?: string;
  tempsRestant?: string;
  quotaPct?: number;
  onAddTime?: () => void;
  onLock?: () => void;
}> = ({
  prenom,
  couleur,
  tempsRestant = "0 restantes",
  quotaPct = 0,
  onAddTime,
  onLock,
}) => {
  const { isDark } = useTheme();
  return (
    <View
      className={cn(
        "w-full overflow-hidden rounded-[15px] border py-[13px] shadow-cyan-soft",
        "bg-white border-kz-cyan/20",
        "dark:bg-kz-surface/30 dark:border-white/5",
      )}
    >
      {}
      <View className="flex-row items-center px-4 gap-4">
        <View className="h-[57px] w-[57px] items-center justify-center rounded-full border-2 border-kz-cyan/30">
          <View
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#E6F4FA] dark:bg-[#0e2c4b]"
            style={{
              shadowColor: colors.cyan,
              shadowOpacity: 0.24,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Avatar
              prenom={prenom}
              couleurTheme={couleur ?? colors.cyan}
              size={44}
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="font-heading-semi text-[18px] text-kz-ink dark:text-kz-white">
            {prenom}
          </Text>
          <StatusOnline />
        </View>
      </View>

      {}
      <View className="mt-4 px-[11px] gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="font-medium text-[12px] text-kz-ink-soft">
            Temps d'écran
          </Text>
          <Text className="font-bold text-[14px] text-kz-ink dark:text-kz-white">
            {tempsRestant}
          </Text>
        </View>
        <View className="h-3 w-full rounded-full bg-kz-surface-strong dark:bg-kz-surface-soft">
          {quotaPct > 0 ? (
            <View
              className="h-3 rounded-full bg-kz-cyan"
              style={{ width: `${Math.min(100, Math.max(0, quotaPct))}%` }}
            />
          ) : null}
        </View>
      </View>

      {}
      <View className="mt-4 flex-row items-center justify-center gap-3 px-[11px]">
        <Pressable
          onPress={onAddTime}
          className={cn(
            "h-[44px] flex-1 flex-row items-center justify-center gap-2.5 rounded-[16px] border-2 shadow-cyan-soft",
            "border-kz-surface-strong bg-white",
            "dark:bg-kz-ink/20",
          )}
        >
          <Clock
            size={18}
            color={isDark ? colors.white : colors.ink}
            strokeWidth={1.8}
          />
          <Text className="font-medium text-[14px] text-kz-ink dark:text-kz-white">
            +15 min
          </Text>
        </Pressable>
        <Pressable
          onPress={onLock}
          className="h-[44px] flex-1 flex-row items-center justify-center gap-2.5 rounded-[16px] border-2 border-kz-cyan bg-white/[0.01] shadow-cyan-glow"
        >
          <Lock size={18} color={colors.cyan} strokeWidth={1.8} />
          <Text className="font-medium text-[14px] text-kz-cyan">Bloquer</Text>
        </Pressable>
      </View>
    </View>
  );
};

const RecentActivityEmptyCard: React.FC = () => (
  <View
    className={cn(
      "w-full items-center rounded-[16px] border py-[26px] shadow-cyan-soft",
      "bg-white border-kz-cyan/20",
      "dark:bg-kz-surface/30 dark:border-white/5",
    )}
  >
    <Text className="font-medium text-[14px] text-kz-ink dark:text-kz-white">
      Aucune activité récente
    </Text>
    <View className="mt-4 h-14 w-14 items-center justify-center rounded-full bg-kz-orange/10">
      <Clock size={26} color={colors.orange} strokeWidth={2} />
    </View>
    <View className="mt-4 items-center">
      <Text className="text-center font-medium text-[12px] text-kz-ink-soft">
        Commencez par choisir les
      </Text>
      <Text className="text-center font-medium text-[12px] text-kz-ink-soft">
        applications à superviser.
      </Text>
    </View>
  </View>
);

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const me = useMe();
  const enfants = useEnfants();

  const refreshing = me.isFetching || enfants.isFetching;
  const onRefresh = () => {
    me.refetch();
    enfants.refetch();
  };

  const prenom = me.data?.prenom ?? "Parent";
  const today = formatToday();
  const premierEnfant = enfants.data?.[0];

  return (
    <Screen
      scroll
      glow
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.cyan}
        />
      }
    >
      {/* Header */}
      <View className="pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-[28px] text-kz-ink dark:text-kz-white">
            Bonjour {prenom}
          </Text>
          <NotificationBell
            count={0}
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>
        <Text className="mt-2 text-[14px] text-kz-ink-soft">{today}</Text>
      </View>

      {/* Carte enfant principal */}
      {premierEnfant ? (
        <Pressable
          onPress={() =>
            navigation.navigate("EnfantDetail", { id: premierEnfant.id })
          }
        >
          <ChildSummaryCard
            prenom={premierEnfant.prenom}
            couleur={premierEnfant.couleurTheme}
            tempsRestant="0 restantes"
            quotaPct={0}
            onAddTime={() =>
              navigation.navigate("UnlockRequests", {
                childId: premierEnfant.id,
              })
            }
            onLock={() =>
              navigation.navigate("EnfantDetail", { id: premierEnfant.id })
            }
          />
        </Pressable>
      ) : (
        <ChildSummaryCard
          prenom="Léo"
          tempsRestant="0 restantes"
          quotaPct={0}
        />
      )}

      {/* Activités récentes */}
      <View className="mt-7 flex-row items-end justify-between">
        <Text className="font-heading-semi text-[18px] text-kz-ink dark:text-kz-white">
          Activités récentes
        </Text>
        <Pressable
          onPress={() =>
            navigation.navigate("Tabs", { screen: "Rapports" })
          }
        >
          <Text className="font-medium text-[11.9px] text-kz-cyan">
            Voir tout
          </Text>
        </Pressable>
      </View>

      <View className="mt-4">
        <RecentActivityEmptyCard />
      </View>

      <View className="h-32" />
    </Screen>
  );
};
