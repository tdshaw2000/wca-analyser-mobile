/**
 * Home route ("/"). Temporary placeholder: expo-router needs an index route to
 * boot. This gets replaced by the first real vertical slice (person search) once
 * we build it test-first. Route files stay thin — when there's a real screen it
 * lives in src/ui/screens and is rendered from here.
 */
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ title: 'WCA Analyser' }} />
      <View style={styles.container}>
        <Text style={styles.text}>Coming soon</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16 },
});
