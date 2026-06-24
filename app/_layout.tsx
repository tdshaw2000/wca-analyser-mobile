/**
 * Root layout for expo-router. Defines a native stack navigator that wraps every
 * screen in the app/ directory. Per-screen options (like the title) are set on
 * each route via <Stack.Screen />.
 */
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/ui/theme/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </GestureHandlerRootView>
  );
}

// react-native-gesture-handler requires this provider at the app root for any
// GestureDetector below it (the chart's pinch-zoom/pan) to recognise gestures.
const styles = StyleSheet.create({
  root: { flex: 1 },
});
