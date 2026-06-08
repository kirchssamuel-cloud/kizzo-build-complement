import * as React from "react";
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, FeGaussianBlur, Filter } from "react-native-svg";
import { cn } from "~/lib/cn";
import { kizzoBgGradient } from "~/theme/colors";
import { useTheme } from "~/theme/theme-provider";

type ScreenProps = (ViewProps | ScrollViewProps) & {
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  noPadding?: boolean;
  glow?: boolean;
  glowTopLeft?: boolean;
  bgClassName?: string;
  edges?: ("top" | "bottom" | "left" | "right")[];
};

const GlowCircle: React.FC<{
  top: number;
  left: number;
  size: number;
  color: string;
  opacity?: number;
  blur?: number;
  id: string;
}> = ({ top, left, size, color, opacity = 0.1, blur, id }) => {
  const stdDeviation = blur ?? size * 0.1;
  const padding = stdDeviation * 3;
  const canvasSize = size + padding * 2;
  const cx = canvasSize / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: top - padding,
        left: left - padding,

        shadowColor: color,
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.2,
        shadowRadius: 100,
        elevation: 100,

        height: size,
        width: size,
        borderRadius: size / 2,
      }}
    >
      {/* <Defs>
        <Filter id={id} width="100%" height="100%">
          <FeGaussianBlur stdDeviation={stdDeviation} />
        </Filter>
      </Defs>
      <Circle
        cx={cx}
        cy={cx}
        r={size / 2}
        fill={color}
        opacity={opacity}
        filter={`url(#${id})`}
      /> */}
    </View>
  );
};

export const Screen: React.FC<ScreenProps> = ({
  className,
  contentClassName,
  scroll,
  noPadding,
  glow,
  glowTopLeft,
  bgClassName,
  edges,
  children,
  ...props
}) => {
  const { isDark } = useTheme();
  const gradient = isDark ? kizzoBgGradient.dark : kizzoBgGradient.light;
  const orangeOpacity = isDark ? 0.1 : 0.1;
  const cyanOpacity = isDark ? 0.1 : 0.1;

  const inner = (
    <View className={cn("flex-1", !noPadding && "px-6", contentClassName)}>
      {children}
    </View>
  );

  return (
    <View className={cn("flex-1", isDark && "dark", bgClassName)}>
      <LinearGradient
        colors={gradient as unknown as [string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {glow ? (
        <>
          <GlowCircle
            id="glow-orange"
            top={388}
            left={300}
            size={347}
            color="#f97316"
            opacity={orangeOpacity}
          />
          <GlowCircle
            id="glow-cyan"
            top={0}
            left={0}
            size={291}
            color="#3db4d9"
            opacity={cyanOpacity}
          />
        </>
      ) : glowTopLeft ? (
        <GlowCircle
          id="glow-cyan-tl"
          top={-90}
          left={-65}
          size={291}
          color="#3db4d9"
          opacity={cyanOpacity}
        />
      ) : null}

      <SafeAreaView
        edges={edges ?? ["top", "bottom", "left", "right"]}
        className={cn("flex-1", className)}
      >
        {scroll ? (
          <ScrollView
            {...(props as ScrollViewProps)}
            contentContainerStyle={[
              { flexGrow: 1 },
              (props as ScrollViewProps).contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </View>
  );
};
