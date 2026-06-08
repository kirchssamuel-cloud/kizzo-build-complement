import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = 8000;

const isLoopback = (host: string) => host === 'localhost' || host === '127.0.0.1';

const extractHost = (hostUri?: string | null): string | null => {
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host) return null;
  if (host.endsWith('.exp.direct')) return null;
  if (isLoopback(host)) {
    return Platform.OS === 'android' ? '10.0.2.2' : null;
  }
  return host;
};

const resolveApiUrl = (): string => {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && !/^https?:\/\/localhost(:\d+)?(\/|$)/.test(explicit)) {
    return explicit;
  }

  if (__DEV__) {
    const metroHost = extractHost(
      (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
        (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
          ?.debuggerHost,
    );
    if (metroHost) {
      return `http://${metroHost}:${DEFAULT_API_PORT}/api`;
    }
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
    }
  }

  return explicit ?? `http://localhost:${DEFAULT_API_PORT}/api`;
};

export const env = {
  API_URL: resolveApiUrl(),
  GOOGLE_CLIENT_ID_IOS: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '',
  GOOGLE_CLIENT_ID_ANDROID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '',
  GOOGLE_CLIENT_ID_WEB: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '',
  APPLE_CLIENT_ID:
    process.env.EXPO_PUBLIC_APPLE_CLIENT_ID ?? 'com.appstronaute.kizzo.parent',
} as const;
