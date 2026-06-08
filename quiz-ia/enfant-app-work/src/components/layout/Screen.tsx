import * as React from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { BLUR_CYAN_XML, BLUR_ORANGE_XML } from '~/assets/blur-xml';
import { cn } from '~/lib/cn';
import { kizzoBgGradient } from '~/theme/colors';
import { useTheme } from '~/theme/theme-provider';

type ScreenProps = (ViewProps | ScrollViewProps) & {
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  noPadding?: boolean;
  /** Affiche les blurs atmosphériques cyan + orange (Welcome/onboarding). */
  glow?: boolean;
  /** Affiche un blur cyan en haut à gauche (auth screens). */
  glowTopLeft?: boolean;
  bgClassName?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

const Blur: React.FC<{
  xml: string;
  top: number;
  left: number;
  width: number;
  height: number;
}> = ({ xml, top, left, width, height }) => (
  <View pointerEvents="none" style={{ position: 'absolute', top, left, width, height }}>
    <SvgXml xml={xml} width={width} height={height} />
  </View>
);

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

  const inner = (
    <View className={cn('flex-1', !noPadding && 'px-6', contentClassName)}>{children}</View>
  );

  return (
    <View className={cn('flex-1', isDark && 'dark', bgClassName)}>
      <LinearGradient
        colors={gradient as unknown as [string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {glow ? (
        <>
          <Blur xml={BLUR_ORANGE_XML} top={250} left={-30} width={420} height={520} />
          <Blur xml={BLUR_CYAN_XML} top={-200} left={-200} width={520} height={640} />
        </>
      ) : glowTopLeft ? (
        <Blur xml={BLUR_CYAN_XML} top={-200} left={-180} width={520} height={640} />
      ) : null}

      <SafeAreaView
        edges={edges ?? ['top', 'bottom', 'left', 'right']}
        className={cn('flex-1', className)}
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
