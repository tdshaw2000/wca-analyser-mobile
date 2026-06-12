/**
 * Home route ("/"). Route files stay thin: set navigation options and render the
 * screen component from src/ui/screens. All fetching/logic lives below the UI.
 */
import { Stack } from 'expo-router';

import CompetitionsScreen from '@/ui/screens/CompetitionsScreen';

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ title: 'Competitions' }} />
      <CompetitionsScreen />
    </>
  );
}
