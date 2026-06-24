// react-native-gesture-handler needs its native module and a GestureHandlerRootView
// context that don't exist under jest. We don't unit-test the gestures themselves —
// the pinch/pan feel is a manual Expo Go check, and the window maths they drive is
// covered by useChartZoom's tests — so render GestureDetector as a passthrough and
// stub the gesture builders as chainable no-ops. (The factory is self-contained
// because jest.mock may not reference out-of-scope variables.)
jest.mock('react-native-gesture-handler', () => {
  const chainableGesture = () => {
    const gesture = {};
    const methods = [
      'onBegin',
      'onStart',
      'onUpdate',
      'onChange',
      'onEnd',
      'runOnJS',
      'enabled',
      'activeOffsetX',
      'activeOffsetY',
    ];
    for (const method of methods) {
      gesture[method] = () => gesture;
    }
    return gesture;
  };
  return {
    GestureDetector: ({ children }) => children,
    GestureHandlerRootView: ({ children }) => children,
    Gesture: {
      Pinch: chainableGesture,
      Pan: chainableGesture,
      Simultaneous: () => chainableGesture(),
    },
  };
});
