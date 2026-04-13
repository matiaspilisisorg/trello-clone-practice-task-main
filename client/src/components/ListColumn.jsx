import { useState, useRef, useEffect } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import * as listsApi from '../api/lists.js';
import * as cardsApi from '../api/cards.js';
import CardTile from './CardTile.jsx';
import CardModal from './CardModal.jsx';

export default function ListColumn({ list, index, boardId, onListUpdate, onListDelete, onCardUpdate }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const titleInputRef = useRef(null);
  const newCardInputRef = useRef(null);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (addingCard && newCardInputRef.current) {
      newCardInputRef.current.focus();
    }
  }, [addingCard]);

  async function saveTitle() {
    if (!title.trim()) {
      setTitle(list.title);
      setEditingTitle(false);
      return;
    }
    if (title.trim() !== list.title) {
      try {
        await listsApi.updateList(boardId, list.id, { title: title.trim() });
        onListUpdate(list.id, { title: title.trim() });
      } catch {
        toast.error('Failed to update list title');
        setTitle(list.title);
      }
    }
    setEditingTitle(false);
  }

  async function handleAddCard() {
    if (!newCardTitle.trim()) return;
    try {
      const card = await cardsApi.createCard(list.id, { title: newCardTitle.trim() });
      onCardUpdate(list.id, [...(list.cards || []), card]);
      setNewCardTitle('');
      setAddingCard(false);
    } catch {
      toast.error('Failed to create card');
    }
  }

  async function handleDeleteList() {
    if (!window.confirm(`Delete list "${list.title}" and all its cards?`)) return;
    try {
      await listsApi.deleteList(boardId, list.id);
      onListDelete(list.id);
    } catch {
      toast.error('Failed to delete list');
    }
  }

  function handleCardModalUpdate(updatedCard) {
    const updatedCards = (list.cards || []).map((c) =>
      c.id === updatedCard.id ? { ...c, ...updatedCard } : c
    );
    onCardUpdate(list.id, updatedCards);
  }

  const cardCount = (list.cards || []).length;

  return (
    <>
      <Draggable draggableId={list.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="rounded-2xl w-72 flex-shrink-0 flex flex-col"
            style={{
              maxHeight: 'calc(100vh - 112px)',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(12px)',
              ...(snapshot.isDragging && {
                boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.35), 0 0 30px rgba(99,102,241,0.15)',
                transform: 'rotate(1.5deg)',
              }),
            }}
          >
            {/* List header */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-between px-3.5 py-3 cursor-grab flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') { setTitle(list.title); setEditingTitle(false); }
                  }}
                  className="input-cyber flex-1 rounded-lg px-2 py-1 text-sm font-semibold mr-2"
                />
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3
                    onClick={() => setEditingTitle(true)}
                    className="font-semibold text-sm truncate cursor-pointer rounded-md px-1.5 py-0.5 transition-colors duration-100"
                    style={{ color: 'var(--text-card)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {list.title}
                  </h3>
                  <span
                    className="text-xs font-medium rounded-md px-1.5 py-0.5 flex-shrink-0"
                    style={{ background: 'var(--bg-stat)', color: 'var(--text-muted)' }}
                  >
                    {cardCount}
                  </span>
                </div>
              )}

              <button
                onClick={handleDeleteList}
                className="ml-1 p-1.5 rounded-lg flex-shrink-0 transition-all duration-150"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Cards droppable area */}
            <Droppable droppableId={list.id} type="CARD">
              {(droppableProvided, droppableSnapshot) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  className="flex-1 overflow-y-auto px-2 py-2 min-h-[8px] rounded-lg mx-1 transition-colors duration-150"
                  style={droppableSnapshot.isDraggingOver ? {
                    background: 'rgba(99,102,241,0.06)',
                    outline: '1px dashed rgba(99,102,241,0.3)',
                    outlineOffset: '-2px',
                  } : {}}
                >
                  {(list.cards || []).map((card, cardIndex) => (
                    <CardTile
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      onClick={() => setSelectedCard(card)}
                    />
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add card section */}
            <div className="px-2 pb-2.5 pt-1 flex-shrink-0">
              {addingCard ? (
                <div>
                  <textarea
                    ref={newCardInputRef}
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                      if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
                    }}
                    placeholder="Enter a title for this card..."
                    rows={2}
                    className="input-cyber w-full rounded-xl px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleAddCard}
                      className="btn-cyber px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      Add card
                    </button>
                    <button
                      onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                      className="p-1.5 rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCard(true)}
                  className="w-full text-left text-sm rounded-xl px-3 py-2 flex items-center gap-2 transition-all duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                    e.currentTarget.style.color = 'var(--text-link)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Add a card</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          listId={list.id}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardModalUpdate}
        />
      )}
    </>
  );
}
