/**
 * Event progression route ("/person/[id]/[event]"). The [id] segment is the
 * competitor's WCA id, [event] is the event id. Thin like every route file: set
 * navigation options and render the screen from src/ui/screens. All param
 * reading/logic lives in the screen and below.
 */
import { Stack } from 'expo-router';

import EventProgressionScreen from '@/ui/screens/EventProgressionScreen';

export default function EventProgressionRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Progression' }} />
      <EventProgressionScreen />
    </>
  );
}
