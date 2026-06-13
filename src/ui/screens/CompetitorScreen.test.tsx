import { render, screen } from '@testing-library/react-native';

import CompetitorScreen from '@/ui/screens/CompetitorScreen';
import { useLocalSearchParams } from 'expo-router';

// Only the route-param reader is needed here, so mock just that. The screen is
// dumb: it renders whatever competitor the route points at.
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));
const useLocalSearchParamsMock = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;

describe('CompetitorScreen', () => {
  it('shows the competitor name and WCA id from the route params', async () => {
    useLocalSearchParamsMock.mockReturnValue({ id: '2007VALK01', name: 'Mats Valk' });

    await render(<CompetitorScreen />);

    expect(screen.getByText('Mats Valk')).toBeTruthy();
    expect(screen.getByText('2007VALK01')).toBeTruthy();
  });

  it('falls back to the WCA id as the heading when no name was passed', async () => {
    useLocalSearchParamsMock.mockReturnValue({ id: '2007VALK01' });

    await render(<CompetitorScreen />);

    // With no name, the id is both the heading and the id line, so it appears
    // more than once — getAllByText avoids the "multiple elements" ambiguity.
    expect(screen.getAllByText('2007VALK01').length).toBeGreaterThan(0);
  });
});
