import * as React from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/cn';
import { Text } from './Text';

type AvatarProps = {
  prenom: string;
  couleurTheme?: string;
  size?: number;
  className?: string;
};

export const Avatar: React.FC<AvatarProps> = ({
  prenom,
  couleurTheme = '#3db4d9',
  size = 48,
  className,
}) => (
  <View
    className={cn('items-center justify-center rounded-full', className)}
    style={{
      width: size,
      height: size,
      backgroundColor: couleurTheme,
      shadowColor: couleurTheme,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
    }}
  >
    <Text className="font-bold text-white" style={{ fontSize: size * 0.4 }}>
      {prenom.charAt(0).toUpperCase()}
    </Text>
  </View>
);
