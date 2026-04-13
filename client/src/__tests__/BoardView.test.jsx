import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import * as boardsApi from '../api/boards.js';
import * as listsApi from '../api/lists.js';
import * as cardsApi from '../api/cards.js';
import BoardView from '../pages/BoardView.jsx';

vi.mock('../api/boards.js', () => ({
  getBoards: vi.fn(),
  getBoard: vi.fn(),
  createBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));

vi.mock('../api/lists.js', () => ({
  createList: vi.fn(),
  updateList: vi.fn(),
  moveList: vi.fn(),
  deleteList: vi.fn(),
}));

vi.mock('../api/cards.js', () => ({
  createCard: vi.fn(),
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
}));

vi.mock('../api/cardDetails.js', () => ({
  getCard: vi.fn(),
  addLabel: vi.fn(),
  deleteLabel: vi.fn(),
  addChecklist: vi.fn(),
  deleteChecklist: vi.fn(),
  addChecklistItem: vi.fn(),
  toggleChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
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

const mockBoard = {
  id: 'board1',
  title: 'Sprint Board',
  color: '#0079bf',
  lists: [
    {
      id: 'list1',
      title: 'To Do',
      position: 65536,
      cards: [
        { id: 'card1', title: 'Setup project', labels: [], checklists: [] },
        { id: 'card2', title: 'Write tests', labels: [], checklists: [] },
      ],
    },
    {
      id: 'list2',
      title: 'In Progress',
      position: 131072,
      cards: [
        { id: 'card3', title: 'Build UI', labels: [], checklists: [] },
      ],
    },
  ],
};

function renderBoardView(boardId = 'board1') {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <MemoryRouter initialEntries={[`/boards/${boardId}`]}>
        <Routes>
          <Route path="/boards/:id" element={<BoardView />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('BoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders board title after loading', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Sprint Board')).toBeInTheDocument();
    });
  });

  it('renders lists from mock data', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders cards within their lists', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Setup project')).toBeInTheDocument();
    });

    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Build UI')).toBeInTheDocument();
  });

  it('shows "Board not found" when board data is null', async () => {
    boardsApi.getBoard.mockRejectedValue(new Error('Not found'));

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Board not found')).toBeInTheDocument();
    });
  });

  it('"Add another list" button shows input form on click', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    const user = userEvent.setup();

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Add another list')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Add another list'));

    expect(screen.getByPlaceholderText('Enter list title...')).toBeInTheDocument();
    expect(screen.getByText('Add list')).toBeInTheDocument();
  });

  it('creates a new list when form is submitted', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    const newList = { id: 'list3', title: 'Done', position: 196608 };
    listsApi.createList.mockResolvedValue(newList);

    const user = userEvent.setup();

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Add another list')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Add another list'));

    const input = screen.getByPlaceholderText('Enter list title...');
    await user.type(input, 'Done');
    await user.click(screen.getByText('Add list'));

    await waitFor(() => {
      expect(listsApi.createList).toHaveBeenCalledWith('board1', { title: 'Done' });
    });

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  it('"Add a card" button shows card input form on click', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    const user = userEvent.setup();

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    const addCardButtons = screen.getAllByText('Add a card');
    await user.click(addCardButtons[0]);

    expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument();
    expect(screen.getByText('Add card')).toBeInTheDocument();
  });

  it('creates a new card when the add card form is submitted', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    const newCard = { id: 'card-new', title: 'New task', labels: [], checklists: [] };
    cardsApi.createCard.mockResolvedValue(newCard);

    const user = userEvent.setup();

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    const addCardButtons = screen.getAllByText('Add a card');
    await user.click(addCardButtons[0]);

    const textarea = screen.getByPlaceholderText('Enter a title for this card...');
    await user.type(textarea, 'New task');
    await user.click(screen.getByText('Add card'));

    await waitFor(() => {
      expect(cardsApi.createCard).toHaveBeenCalledWith('list1', { title: 'New task' });
    });

    await waitFor(() => {
      expect(screen.getByText('New task')).toBeInTheDocument();
    });
  });

  it('renders board background color', async () => {
    boardsApi.getBoard.mockResolvedValue(mockBoard);

    const { container } = renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Sprint Board')).toBeInTheDocument();
    });

    const boardContainer = container.querySelector('div[style]');
    expect(boardContainer).toHaveStyle({ backgroundColor: '#0079bf' });
  });
});
