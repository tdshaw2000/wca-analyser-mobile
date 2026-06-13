/**
 * Competitor route ("/person/[id]"). The [id] segment is the competitor's WCA
 * id. Thin like every route file: set navigation options and render the screen
 * from src/ui/screens. All param reading/logic lives in the screen and below.
 */
import { Stack } from 'expo-router';

import CompetitorScreen from '@/ui/screens/CompetitorScreen';

export default function CompetitorRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Competitor' }} />
      <CompetitorScreen />
    </>
  );
}
