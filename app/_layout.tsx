/**
 * Root layout for expo-router. Defines a native stack navigator that wraps every
 * screen in the app/ directory. Per-screen options (like the title) are set on
 * each route via <Stack.Screen />.
 */
import { Stack } from 'expo-router';

import { colors } from '@/ui/theme/colors';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
