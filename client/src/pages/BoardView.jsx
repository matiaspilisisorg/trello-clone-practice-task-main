import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import Header from '../components/Header.jsx';
import ListColumn from '../components/ListColumn.jsx';
import * as boardsApi from '../api/boards.js';
import * as listsApi from '../api/lists.js';
import * as cardsApi from '../api/cards.js';

export default function BoardView() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const addListInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchBoard();
  }, [id]);

  useEffect(() => {
    if (addingList && addListInputRef.current) {
      addListInputRef.current.focus();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }
  }, [addingList]);

  async function fetchBoard() {
    try {
      const boardData = await boardsApi.getBoard(id);
      setBoard(boardData);
      setLists(boardData.lists || []);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddList() {
    if (!newListTitle.trim()) return;
    try {
      const list = await listsApi.createList(id, { title: newListTitle.trim() });
      setLists((prev) => [...prev, { ...list, cards: [] }]);
      setNewListTitle('');
    } catch {
      toast.error('Failed to create list');
    }
  }

  function handleListUpdate(listId, updates) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, ...updates } : l)));
  }

  function handleListDelete(listId) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  function handleCardUpdate(listId, cards) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, cards } : l)));
  }

  function calculatePosition(items, destinationIndex) {
    if (items.length === 0) return 65536;
    if (destinationIndex === 0) return (items[0].position || 65536) / 2;
    if (destinationIndex >= items.length) return (items[items.length - 1].position || 65536) + 65536;
    const before = items[destinationIndex - 1].position || 0;
    const after = items[destinationIndex].position || before + 131072;
    return (before + after) / 2;
  }

  async function handleDragEnd(result) {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'LIST') {
      const reordered = Array.from(lists);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const previousLists = lists;
      setLists(reordered);
      const itemsWithoutMoved = reordered.filter((l) => l.id !== moved.id);
      const newPosition = calculatePosition(itemsWithoutMoved, destination.index);
      try {
        await listsApi.moveList(id, moved.id, { position: newPosition });
      } catch {
        toast.error('Failed to move list');
        setLists(previousLists);
      }
      return;
    }

    if (type === 'CARD') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;
      const previousLists = lists.map((l) => ({ ...l, cards: [...(l.cards || [])] }));

      if (sourceListId === destListId) {
        const list = lists.find((l) => l.id === sourceListId);
        if (!list) return;
        const reorderedCards = Array.from(list.cards || []);
        const [movedCard] = reorderedCards.splice(source.index, 1);
        reorderedCards.splice(destination.index, 0, movedCard);
        setLists((prev) => prev.map((l) => l.id === sourceListId ? { ...l, cards: reorderedCards } : l));
        const cardsWithoutMoved = reorderedCards.filter((c) => c.id !== movedCard.id);
        const newPosition = calculatePosition(cardsWithoutMoved, destination.index);
        try {
          await cardsApi.updateCard(sourceListId, movedCard.id, { position: newPosition });
        } catch {
          toast.error('Failed to move card');
          setLists(previousLists);
        }
      } else {
        const sourceList = lists.find((l) => l.id === sourceListId);
        const destList = lists.find((l) => l.id === destListId);
        if (!sourceList || !destList) return;
        const sourceCards = Array.from(sourceList.cards || []);
        const destCards = Array.from(destList.cards || []);
        const [movedCard] = sourceCards.splice(source.index, 1);
        destCards.splice(destination.index, 0, movedCard);
        setLists((prev) => prev.map((l) => {
          if (l.id === sourceListId) return { ...l, cards: sourceCards };
          if (l.id === destListId) return { ...l, cards: destCards };
          return l;
        }));
        const cardsWithoutMoved = destCards.filter((c) => c.id !== movedCard.id);
        const newPosition = calculatePosition(cardsWithoutMoved, destination.index);
        try {
          await cardsApi.updateCard(sourceListId, movedCard.id, { listId: destListId, position: newPosition });
        } catch {
          toast.error('Failed to move card');
          setLists(previousLists);
        }
      }
    }
  }

  const LoadingState = () => (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header />
      <div className="flex items-center justify-center pt-32">
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }}
        />
      </div>
    </div>
  );

  if (loading) return <LoadingState />;

  if (!board) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 gap-4">
          <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Board not found</p>
          <Link to="/boards" className="text-sm font-semibold" style={{ color: 'var(--text-link)' }}>
            ← Back to boards
          </Link>
        </div>
      </div>
    );
  }

  const boardColorHex = board.color || '#4f46e5';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Subtle board color glow in background */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '40%', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 50% -10%, ${boardColorHex}18 0%, transparent 65%)`,
      }} />
      <div className="bg-grid fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      <Header />

      {/* Board sub-header */}
      <div
        className="pt-12 relative z-10"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="px-5 py-2.5 flex items-center gap-3"
          style={{ background: 'var(--bg-subheader)', backdropFilter: 'blur(12px)' }}
        >
          {/* Color dot */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: boardColorHex, boxShadow: `0 0 8px ${boardColorHex}99` }}
          />
          <h1
            className="font-display text-base font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {board.title}
          </h1>
          <span
            className="text-xs ml-1 font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
          </span>
        </div>
      </div>

      {/* Board content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              ref={(el) => {
                provided.innerRef(el);
                scrollContainerRef.current = el;
              }}
              {...provided.droppableProps}
              className="flex-1 flex items-start gap-3 px-4 pb-6 overflow-x-auto overflow-y-hidden relative z-10"
              style={{ minHeight: 'calc(100vh - 96px)', paddingTop: '16px' }}
            >
              {lists.map((list, index) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  index={index}
                  boardId={id}
                  onListUpdate={handleListUpdate}
                  onListDelete={handleListDelete}
                  onCardUpdate={handleCardUpdate}
                />
              ))}
              {provided.placeholder}

              {/* Add list */}
              <div className="flex-shrink-0 w-72">
                {addingList ? (
                  <div
                    className="rounded-2xl p-3"
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <input
                      ref={addListInputRef}
                      type="text"
                      placeholder="List title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') { setAddingList(false); setNewListTitle(''); }
                      }}
                      className="input-cyber w-full rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddList}
                        className="btn-cyber px-4 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Add list
                      </button>
                      <button
                        onClick={() => { setAddingList(false); setNewListTitle(''); }}
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
                    onClick={() => setAddingList(true)}
                    className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-left flex items-center gap-2 transition-all duration-150"
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px dashed var(--border-dashed)',
                      color: 'var(--text-muted)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                      e.currentTarget.style.color = 'var(--text-link)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                      e.currentTarget.style.borderColor = 'var(--border-dashed)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add another list
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
