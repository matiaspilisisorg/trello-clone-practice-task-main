import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header.jsx';
import * as boardsApi from '../api/boards.js';

const PRESET_COLORS = [
  '#4f46e5', // indigo
  '#0891b2', // cyan
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#7c3aed', // violet
];

function BoardCard({ board, onNavigate, onDelete }) {
  return (
    <div
      onClick={() => onNavigate(board.id)}
      className="relative group rounded-2xl cursor-pointer overflow-hidden flex flex-col justify-between"
      style={{
        minHeight: '130px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.18), 0 0 0 1px ${board.color || '#4f46e5'}55, 0 0 24px ${board.color || '#4f46e5'}22`;
        e.currentTarget.style.borderColor = `${board.color || '#4f46e5'}55`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: board.color || '#4f46e5' }}
      />
      {/* Subtle color tint in top-right corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 pointer-events-none"
        style={{ background: board.color || '#4f46e5' }}
      />

      {/* Delete button */}
      <button
        onClick={(e) => onDelete(e, board.id, board.title)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 transition-all duration-150 z-10"
        style={{ background: 'rgba(0,0,0,0.18)', color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = 'var(--text-danger)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.18)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        title="Delete board"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <div className="p-4 pt-5">
        <h3 className="font-display font-bold text-base pr-7 leading-snug" style={{ color: 'var(--text-primary)' }}>
          {board.title}
        </h3>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 flex gap-1.5 flex-wrap">
        <span
          className="text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium"
          style={{ background: 'var(--bg-stat)', color: 'var(--text-muted)' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {board.stats?.listCount ?? 0} {(board.stats?.listCount ?? 0) === 1 ? 'list' : 'lists'}
        </span>
        <span
          className="text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium"
          style={{ background: 'var(--bg-stat)', color: 'var(--text-muted)' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {board.stats?.totalCards ?? 0} {(board.stats?.totalCards ?? 0) === 1 ? 'task' : 'tasks'}
        </span>
        {(board.stats?.pastDue ?? 0) > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-semibold"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {board.stats.pastDue} overdue
          </span>
        )}
        {(board.stats?.dueSoon ?? 0) > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-semibold"
            style={{ background: 'rgba(234,179,8,0.12)', color: '#d97706' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {board.stats.dueSoon} due soon
          </span>
        )}
      </div>
    </div>
  );
}

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const data = await boardsApi.getBoards();
      setBoards(data);
    } catch {
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const board = await boardsApi.createBoard({ title: newTitle.trim(), color: newColor });
      setBoards((prev) => [...prev, board]);
      setNewTitle('');
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
      toast.success('Board created');
    } catch {
      toast.error('Failed to create board');
    }
  }

  async function handleDeleteBoard(e, boardId, boardTitle) {
    e.stopPropagation();
    if (!window.confirm(`Delete board "${boardTitle}"? This cannot be undone.`)) return;
    try {
      await boardsApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success('Board deleted');
    } catch {
      toast.error('Failed to delete board');
    }
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-base)' }}>
      {/* Background glows */}
      <div style={{
        position: 'fixed', top: '10%', left: '-5%', width: '40%', height: '40%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '-5%', width: '40%', height: '40%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 70%)',
      }} />
      <div className="bg-grid fixed inset-0 pointer-events-none" />

      <Header />

      <main className="pt-12 relative z-10">
        <div className="max-w-5xl mx-auto px-5 py-10">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-gradient mb-1">Your Boards</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {boards.length} workspace{boards.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-cyber flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New board
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onNavigate={(id) => navigate(`/boards/${id}`)}
                  onDelete={handleDeleteBoard}
                />
              ))}

              {/* Create new board form / button */}
              {showForm ? (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    boxShadow: '0 0 20px rgba(99,102,241,0.08)',
                    minHeight: '130px',
                  }}
                >
                  <form onSubmit={handleCreateBoard}>
                    <input
                      type="text"
                      placeholder="Board title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      className="input-cyber w-full rounded-lg px-3 py-2 text-sm mb-3"
                    />

                    <div className="flex gap-2 mb-4">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className="w-6 h-6 rounded-full transition-all duration-150"
                          style={{
                            backgroundColor: color,
                            transform: newColor === color ? 'scale(1.25)' : 'scale(1)',
                            boxShadow: newColor === color ? `0 0 8px ${color}99` : 'none',
                            outline: newColor === color ? `2px solid ${color}` : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn-cyber px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); setNewTitle(''); }}
                        className="px-3 py-1.5 text-xs rounded-lg transition-colors duration-150"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div
                  onClick={() => setShowForm(true)}
                  className="rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all duration-150"
                  style={{
                    minHeight: '130px',
                    border: '1px dashed var(--border-dashed)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)';
                    e.currentTarget.style.color = 'var(--text-link)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-dashed)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">New board</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
