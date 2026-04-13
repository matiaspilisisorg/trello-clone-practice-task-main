import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardModal from '../components/CardModal.jsx';
import * as cardDetailsApi from '../api/cardDetails.js';
import * as cardsApi from '../api/cards.js';

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

vi.mock('../api/cards.js', () => ({
  updateCard: vi.fn(),
  createCard: vi.fn(),
  deleteCard: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const baseCard = {
  id: 'card1',
  title: 'Test Card',
  description: 'A test description',
  labels: [],
  checklists: [],
  dueDate: null,
};

const defaultProps = {
  card: baseCard,
  listId: 'list1',
  onClose: vi.fn(),
  onUpdate: vi.fn(),
};

function renderCardModal(props = {}) {
  return render(<CardModal {...defaultProps} {...props} />);
}

describe('CardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cardDetailsApi.getCard.mockResolvedValue(baseCard);
  });

  describe('rendering', () => {
    it('opens with correct card title', async () => {
      renderCardModal();

      await waitFor(() => {
        expect(cardDetailsApi.getCard).toHaveBeenCalledWith('card1');
      });

      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('opens with correct card description', async () => {
      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('A test description')).toBeInTheDocument();
      });
    });

    it('shows placeholder when description is empty', async () => {
      const cardWithoutDesc = { ...baseCard, description: '' };
      cardDetailsApi.getCard.mockResolvedValue(cardWithoutDesc);

      renderCardModal({ card: cardWithoutDesc });

      await waitFor(() => {
        expect(screen.getByText('Add a more detailed description...')).toBeInTheDocument();
      });
    });

    it('displays existing labels as colored pills', async () => {
      const cardWithLabels = {
        ...baseCard,
        labels: [
          { id: 'lbl1', text: 'Urgent', color: '#eb5a46' },
          { id: 'lbl2', text: 'Feature', color: '#61bd4f' },
        ],
      };
      cardDetailsApi.getCard.mockResolvedValue(cardWithLabels);

      renderCardModal({ card: cardWithLabels });

      await waitFor(() => {
        expect(screen.getByText('Urgent')).toBeInTheDocument();
      });

      expect(screen.getByText('Feature')).toBeInTheDocument();

      const urgentLabel = screen.getByText('Urgent').closest('span');
      expect(urgentLabel).toHaveStyle({ backgroundColor: '#eb5a46' });
    });
  });

  describe('editing title', () => {
    it('shows input when title is clicked', async () => {
      const user = userEvent.setup();

      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Card'));

      const titleInput = screen.getByDisplayValue('Test Card');
      expect(titleInput).toBeInTheDocument();
      expect(titleInput.tagName).toBe('INPUT');
    });

    it('saves title on blur', async () => {
      const user = userEvent.setup();

      cardsApi.updateCard.mockResolvedValue({ ...baseCard, title: 'Updated Title' });

      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Card'));

      const titleInput = screen.getByDisplayValue('Test Card');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      await user.tab();

      await waitFor(() => {
        expect(cardsApi.updateCard).toHaveBeenCalledWith('list1', 'card1', {
          title: 'Updated Title',
        });
      });
    });

    it('saves title on Enter key', async () => {
      const user = userEvent.setup();

      cardsApi.updateCard.mockResolvedValue({ ...baseCard, title: 'Enter Title' });

      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Card'));

      const titleInput = screen.getByDisplayValue('Test Card');
      await user.clear(titleInput);
      await user.type(titleInput, 'Enter Title{Enter}');

      await waitFor(() => {
        expect(cardsApi.updateCard).toHaveBeenCalledWith('list1', 'card1', {
          title: 'Enter Title',
        });
      });
    });
  });

  describe('adding labels', () => {
    it('shows label form when "+ Add Label" is clicked', async () => {
      const user = userEvent.setup();

      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Label'));

      expect(screen.getByPlaceholderText('Label text')).toBeInTheDocument();
    });

    it('adds a label and renders a new colored pill', async () => {
      const user = userEvent.setup();

      const cardWithNewLabel = {
        ...baseCard,
        labels: [{ id: 'lbl-new', text: 'Bug', color: '#61bd4f' }],
      };
      cardDetailsApi.addLabel.mockResolvedValue(cardWithNewLabel);

      // After addLabel, refreshCard calls getCard again
      cardDetailsApi.getCard
        .mockResolvedValueOnce(baseCard) // initial refreshCard on mount
        .mockResolvedValueOnce(cardWithNewLabel); // refreshCard after addLabel

      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Label'));

      const labelInput = screen.getByPlaceholderText('Label text');
      await user.type(labelInput, 'Bug');

      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const addLabelButton = addButtons.find(
        (btn) => btn.closest('.bg-gray-50') || btn.textContent === 'Add'
      );
      await user.click(addLabelButton);

      await waitFor(() => {
        expect(cardDetailsApi.addLabel).toHaveBeenCalledWith('card1', {
          text: 'Bug',
          color: '#61bd4f',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const labelPill = screen.getByText('Bug').closest('span');
      expect(labelPill).toHaveStyle({ backgroundColor: '#61bd4f' });
    });
  });

  describe('checklists', () => {
    it('shows checklist form when "+ Add Checklist" is clicked', async () => {
      const user = userEvent.setup();

      renderCardModal();

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Checklist'));

      expect(screen.getByPlaceholderText('Checklist title...')).toBeInTheDocument();
    });

    it('renders checklist with progress', async () => {
      const cardWithChecklist = {
        ...baseCard,
        checklists: [
          {
            id: 'cl1',
            title: 'Tasks',
            items: [
              { id: 'item1', text: 'Do thing 1', checked: true },
              { id: 'item2', text: 'Do thing 2', checked: false },
            ],
          },
        ],
      };
      cardDetailsApi.getCard.mockResolvedValue(cardWithChecklist);

      renderCardModal({ card: cardWithChecklist });

      await waitFor(() => {
        expect(screen.getByText('Tasks')).toBeInTheDocument();
      });

      expect(screen.getByText('Do thing 1')).toBeInTheDocument();
      expect(screen.getByText('Do thing 2')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('toggling a checklist item calls the API and updates progress', async () => {
      const user = userEvent.setup();

      const cardWithChecklist = {
        ...baseCard,
        checklists: [
          {
            id: 'cl1',
            title: 'Todo',
            items: [
              { id: 'item1', text: 'First task', checked: false },
              { id: 'item2', text: 'Second task', checked: false },
            ],
          },
        ],
      };
      cardDetailsApi.getCard.mockResolvedValue(cardWithChecklist);

      const updatedCard = {
        ...baseCard,
        checklists: [
          {
            id: 'cl1',
            title: 'Todo',
            items: [
              { id: 'item1', text: 'First task', checked: true },
              { id: 'item2', text: 'Second task', checked: false },
            ],
          },
        ],
      };
      cardDetailsApi.toggleChecklistItem.mockResolvedValue(updatedCard);

      renderCardModal({ card: cardWithChecklist });

      await waitFor(() => {
        expect(screen.getByText('First task')).toBeInTheDocument();
      });

      // After toggle, refreshCard calls getCard again with updatedCard
      cardDetailsApi.getCard.mockResolvedValue(updatedCard);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(cardDetailsApi.toggleChecklistItem).toHaveBeenCalledWith('card1', 'cl1', 'item1');
      });

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderCardModal({ onClose });

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      // The close button is the first button (absolute top-right) with an SVG X icon
      const closeButtons = screen.getAllByRole('button');
      // The close button is at the top of the modal
      await user.click(closeButtons[0]);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
