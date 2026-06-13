import { fireEvent, render, screen } from '@testing-library/react-native';

import PersonSearchScreen from '@/ui/screens/PersonSearchScreen';
import { useRouter } from 'expo-router';

import { useSearchPersons } from '@/hooks/useSearchPersons';
import type { UseSearchPersonsResult } from '@/hooks/useSearchPersons';
import type { Person } from '@/domain/models/person';

// The hook is mocked so each of the screen's four states (loading / error /
// empty / results) can be driven deterministically, with no network or timers.
jest.mock('@/hooks/useSearchPersons');
const useSearchPersonsMock = useSearchPersons as jest.MockedFunction<typeof useSearchPersons>;

// Mock the router so we can assert navigation without a real navigation tree.
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
const push = jest.fn();

const PERSON: Person = {
  name: 'Mats Valk',
  wcaId: '2007VALK01',
  profileUrl: 'https://www.worldcubeassociation.org/persons/2007VALK01',
  avatarThumbUrl: 'https://avatars.worldcubeassociation.org/2007VALK01_thumb.jpg',
};

const reload = jest.fn();

function mockHook(overrides: Partial<UseSearchPersonsResult> = {}) {
  useSearchPersonsMock.mockReturnValue({
    data: [],
    loading: false,
    error: null,
    reload,
    ...overrides,
  });
}

beforeEach(() => {
  useSearchPersonsMock.mockReset();
  reload.mockReset();
  push.mockReset();
  useRouterMock.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockHook();
});

describe('PersonSearchScreen', () => {
  it('lists the matching competitors with their WCA id', async () => {
    mockHook({ data: [PERSON] });

    await render(<PersonSearchScreen />);

    expect(screen.getByText(PERSON.name)).toBeTruthy();
    expect(screen.getByText(PERSON.wcaId)).toBeTruthy();
  });

  it('shows a loading indicator while a search is in flight', async () => {
    mockHook({ loading: true });

    await render(<PersonSearchScreen />);

    expect(screen.getByTestId('search-loading')).toBeTruthy();
  });

  it('shows the error message and retries via reload', async () => {
    mockHook({ error: new Error('Network request failed. Check your connection.') });

    await render(<PersonSearchScreen />);

    expect(screen.getByText(/network request failed/i)).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows an empty message after a search returns no competitors', async () => {
    mockHook({ data: [] });

    await render(<PersonSearchScreen />);
    // Nothing searched yet, so the empty message is not shown up front.
    expect(screen.queryByText(/no competitors found/i)).toBeNull();

    await fireEvent.changeText(screen.getByPlaceholderText(/search/i), 'nobody');
    await fireEvent.press(screen.getByText('Search'));

    expect(screen.getByText(/no competitors found/i)).toBeTruthy();
  });

  it('navigates to the competitor page, passing id and name, when a row is tapped', async () => {
    mockHook({ data: [PERSON] });

    await render(<PersonSearchScreen />);
    await fireEvent.press(screen.getByText(PERSON.name));

    expect(push).toHaveBeenCalledWith({
      pathname: '/person/[id]',
      params: { id: PERSON.wcaId, name: PERSON.name },
    });
  });

  it('passes the submitted query to the search hook', async () => {
    await render(<PersonSearchScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText(/search/i), 'Feliks Zemdegs');
    await fireEvent.press(screen.getByText('Search'));

    expect(useSearchPersonsMock).toHaveBeenLastCalledWith('Feliks Zemdegs');
  });
});
