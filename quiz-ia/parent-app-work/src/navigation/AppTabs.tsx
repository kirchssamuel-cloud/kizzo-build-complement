import * as React from "react";
import { Pressable, View } from "react-native";
import { BlurView } from "expo-blur";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { Clock, Home, Settings, Users } from "lucide-react-native";
import { DashboardScreen } from "~/screens/dashboard/DashboardScreen";
import { EnfantsScreen } from "~/screens/enfants/EnfantsScreen";
import { RapportsScreen } from "~/screens/dashboard/RapportsScreen";
import { ReglagesScreen } from "~/screens/reglages/ReglagesScreen";
import { Text } from "~/components/ui/Text";
import { useTheme } from "~/theme/theme-provider";
import { colors } from "~/theme/colors";
import { cn } from "~/lib/cn";
import type { AppTabsParamList } from "./types";

const Tab = createBottomTabNavigator<AppTabsParamList>();
const BottomNav: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { isDark } = useTheme();
  const items: Array<{
    key: keyof AppTabsParamList;
    label: string;
    Icon: typeof Home;
  }> = [
    { key: "Dashboard", label: "Dashboard", Icon: Home },
    { key: "Enfants", label: "Enfants", Icon: Users },
    { key: "Rapports", label: "Activités", Icon: Clock },
    { key: "Reglages", label: "Paramètres", Icon: Settings },
  ];
  const activeRoute = state.routes[state.index]?.name as keyof AppTabsParamList;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 16,
        height: 68,
      }}
    >
      <View
        className="h-[68px] w-full overflow-hidden rounded-full"
        style={{
          shadowColor: "#071325",
          shadowOpacity: 0.8,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: isDark
              ? "rgba(30,41,59,0.68)"
              : "rgba(255,255,255,0.75)",
          }}
        />
        <View className="h-full flex-row items-center justify-around px-6">
          {items.map(({ key, label, Icon }) => {
            const active = activeRoute === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                onPress={() => navigation.navigate(key as never)}
                className="items-center justify-center"
                style={{ opacity: active ? 1 : 0.6 }}
              >
                <Icon
                  size={20}
                  color={
                    active ? colors.cyan : isDark ? colors.grey : "#1e293b"
                  }
                  strokeWidth={active ? 2.5 : 1.8}
                  fill={active ? colors.cyan : "transparent"}
                />
                <Text
                  className={cn(
                    "mt-1 font-medium text-[12px]",
                    active
                      ? "text-kz-cyan"
                      : isDark
                        ? "text-kz-grey"
                        : "text-kz-ink-soft",
                  )}
                >
                  {label}
                </Text>
                {active ? (
                  <View
                    className="absolute -bottom-1.5 h-0.5 w-8 rounded-full bg-kz-cyan"
                    style={{
                      shadowColor: colors.cyan,
                      shadowOpacity: 1,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const AppTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomNav {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Enfants" component={EnfantsScreen} />
    <Tab.Screen name="Rapports" component={RapportsScreen} />
    <Tab.Screen name="Reglages" component={ReglagesScreen} />
  </Tab.Navigator>
);
