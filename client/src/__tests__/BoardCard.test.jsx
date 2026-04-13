import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import * as boardsApi from '../api/boards.js';
import BoardsPage from '../pages/BoardsPage.jsx';

vi.mock('../api/boards.js', () => ({
  getBoards: vi.fn(),
  createBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockAuthValue = {
  user: { name: 'Test User', email: 'test@example.com' },
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

function renderBoardsPage() {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <MemoryRouter>
        <BoardsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('BoardCard (within BoardsPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders board title', async () => {
    boardsApi.getBoards.mockResolvedValue([
      { id: 'b1', title: 'Project Alpha', color: '#0079bf' },
      { id: 'b2', title: 'Sprint Board', color: '#d29034' },
    ]);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Sprint Board')).toBeInTheDocument();
  });

  it('renders board color as background', async () => {
    boardsApi.getBoards.mockResolvedValue([
      { id: 'b1', title: 'My Board', color: '#519839' },
    ]);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('My Board')).toBeInTheDocument();
    });

    const boardCard = screen.getByText('My Board').closest('div[style]');
    expect(boardCard).toHaveStyle({ backgroundColor: '#519839' });
  });

  it('uses default color when board has no color', async () => {
    boardsApi.getBoards.mockResolvedValue([
      { id: 'b1', title: 'No Color Board' },
    ]);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('No Color Board')).toBeInTheDocument();
    });

    const boardCard = screen.getByText('No Color Board').closest('div[style]');
    expect(boardCard).toHaveStyle({ backgroundColor: '#0079bf' });
  });

  it('shows delete button that triggers confirmation', async () => {
    const user = userEvent.setup();

    boardsApi.getBoards.mockResolvedValue([
      { id: 'b1', title: 'Delete Me', color: '#b04632' },
    ]);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete board');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Delete board "Delete Me"? This cannot be undone.');

    confirmSpy.mockRestore();
  });

  it('deletes board when user confirms', async () => {
    const user = userEvent.setup();

    boardsApi.getBoards.mockResolvedValue([
      { id: 'b1', title: 'Keep Me', color: '#0079bf' },
      { id: 'b2', title: 'Remove Me', color: '#d29034' },
    ]);
    boardsApi.deleteBoard.mockResolvedValue({});

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('Remove Me')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete board');
    await user.click(deleteButtons[1]);

    await waitFor(() => {
      expect(boardsApi.deleteBoard).toHaveBeenCalledWith('b2');
    });

    await waitFor(() => {
      expect(screen.queryByText('Remove Me')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Keep Me')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('does not delete board when user cancels confirmation', async () => {
    const user = userEvent.setup();

    boardsApi.getBoards.mockResolvedValue([
      { id: 'b1', title: 'Stay Here', color: '#0079bf' },
    ]);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('Stay Here')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete board');
    await user.click(deleteButton);

    expect(boardsApi.deleteBoard).not.toHaveBeenCalled();
    expect(screen.getByText('Stay Here')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('shows "Create new board" button', async () => {
    boardsApi.getBoards.mockResolvedValue([]);

    renderBoardsPage();

    await waitFor(() => {
      expect(screen.getByText('Create new board')).toBeInTheDocument();
    });
  });
});
