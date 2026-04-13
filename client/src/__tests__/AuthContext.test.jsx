import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext } from '../context/AuthContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import * as authApi from '../api/auth.js';
import { setAccessToken } from '../api/axios.js';

vi.mock('../api/auth.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock('../api/axios.js', () => ({
  setAccessToken: vi.fn(),
  default: {},
}));

function TestConsumer() {
  const { user, isLoading, login, register, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={() => register('Test', 'test@example.com', 'password123')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authApi.refreshToken.mockRejectedValue(new Error('no session'));
  });

  it('shows loading state on mount then resolves', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
  });

  it('attempts to refresh token on mount', async () => {
    authApi.refreshToken.mockResolvedValue({
      data: { data: { accessToken: 'refreshed-token', user: { name: 'Refreshed User' } } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Refreshed User');
    expect(setAccessToken).toHaveBeenCalledWith('refreshed-token');
  });

  it('sets user to null when refresh token fails', async () => {
    authApi.refreshToken.mockRejectedValue(new Error('expired'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it('login() stores token and sets user', async () => {
    const user = userEvent.setup();

    authApi.login.mockResolvedValue({
      data: { data: { accessToken: 'abc-token', user: { name: 'John' } } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    expect(setAccessToken).toHaveBeenCalledWith('abc-token');
    expect(screen.getByTestId('user')).toHaveTextContent('John');
  });

  it('logout() clears user and calls logout API', async () => {
    const user = userEvent.setup();

    authApi.refreshToken.mockResolvedValue({
      data: { data: { accessToken: 'token', user: { name: 'Jane' } } },
    });
    authApi.logout.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Jane');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalledTimes(1);
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('logout() clears user even when API call fails', async () => {
    const user = userEvent.setup();

    authApi.refreshToken.mockResolvedValue({
      data: { data: { accessToken: 'token', user: { name: 'Jane' } } },
    });
    authApi.logout.mockRejectedValue(new Error('network error'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Jane');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it('register() calls register API then logs in', async () => {
    const user = userEvent.setup();

    authApi.register.mockResolvedValue({});
    authApi.login.mockResolvedValue({
      data: { data: { accessToken: 'new-token', user: { name: 'Test' } } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith('Test', 'test@example.com', 'password123');
    });

    expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(screen.getByTestId('user')).toHaveTextContent('Test');
  });
});
