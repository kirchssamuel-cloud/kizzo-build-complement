import * as React from 'react';
import { Pressable, View } from 'react-native';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message';
import { Text } from './Text';
import { colors } from '~/theme/colors';

const KizzoToastCell: React.FC<ToastConfigParams<unknown>> = ({
  type,
  text1,
  text2,
  onPress,
}) => {
  const Icon = type === 'error' ? XCircle : type === 'info' ? Info : CheckCircle2;
  return (
    <Pressable
      onPress={() => {
        onPress?.();
        Toast.hide();
      }}
      accessibilityRole="alert"
      className="mx-4 flex-row items-center rounded-[16px] bg-kz-cyan px-4 py-3"
      style={{
        shadowColor: colors.cyanLight,
        shadowOpacity: 0.85,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 0 },
        elevation: 14,
      }}
    >
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white/20">
        <Icon size={22} color={colors.white} strokeWidth={2.4} />
      </View>
      <View className="flex-1">
        {text1 ? (
          <Text className="font-bold text-[15px] text-white" numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="mt-0.5 text-[13px] text-white/85" numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export const kizzoToastConfig: ToastConfig = {
  success: (props) => <KizzoToastCell {...props} />,
  error: (props) => <KizzoToastCell {...props} />,
  info: (props) => <KizzoToastCell {...props} />,
};
