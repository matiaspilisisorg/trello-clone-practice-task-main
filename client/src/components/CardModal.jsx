import { useState, useEffect, useRef, useContext } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import * as cardDetailsApi from '../api/cardDetails.js';
import * as cardsApi from '../api/cards.js';
import * as commentsApi from '../api/comments.js';
import DueDateBadge from './DueDateBadge.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

const LABEL_COLORS = [
  '#4ade80', // green
  '#facc15', // yellow
  '#fb923c', // orange
  '#f87171', // red
  '#c084fc', // purple
  '#38bdf8', // cyan
];

export default function CardModal({ card: initialCard, listId, onClose, onUpdate }) {
  const authCtx = useContext(AuthContext);
  const user = authCtx?.user ?? null;
  const [card, setCard] = useState(initialCard);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(initialCard.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(initialCard.description || '');
  const [dueDate, setDueDate] = useState(initialCard.dueDate ? initialCard.dueDate.slice(0, 10) : '');
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [comments, setComments] = useState([]);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  async function refreshCard() {
    try {
      const fullCard = await cardDetailsApi.getCard(card.id);
      setCard(fullCard);
      onUpdate(fullCard);
    } catch {
      // keep existing data
    }
  }

  useEffect(() => { refreshCard(); }, []);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    function handleEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  async function saveTitle() {
    if (!title.trim()) { setTitle(card.title); setEditingTitle(false); return; }
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { title: title.trim() });
      setCard((prev) => ({ ...prev, title: updated.title }));
      onUpdate({ ...card, title: updated.title });
    } catch {
      toast.error('Failed to update title');
      setTitle(card.title);
    }
    setEditingTitle(false);
  }

  async function saveDescription() {
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { description });
      setCard((prev) => ({ ...prev, description: updated.description }));
      onUpdate({ ...card, description: updated.description });
    } catch {
      toast.error('Failed to update description');
    }
    setEditingDesc(false);
  }

  async function saveDueDate(value) {
    setDueDate(value);
    try {
      const payload = value ? { dueDate: value } : { dueDate: null };
      const updated = await cardsApi.updateCard(listId, card.id, payload);
      setCard((prev) => ({ ...prev, dueDate: updated.dueDate }));
      onUpdate({ ...card, dueDate: updated.dueDate });
    } catch {
      toast.error('Failed to update due date');
    }
  }

  async function handleAddLabel() {
    if (!labelText.trim()) return;
    try {
      await cardDetailsApi.addLabel(card.id, { text: labelText.trim(), color: labelColor });
      await refreshCard();
      setLabelText('');
      setShowLabelForm(false);
    } catch {
      toast.error('Failed to add label');
    }
  }

  async function handleDeleteLabel(labelId) {
    try {
      await cardDetailsApi.deleteLabel(card.id, labelId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete label');
    }
  }

  async function handleAddChecklist() {
    if (!newChecklistTitle.trim()) return;
    try {
      await cardDetailsApi.addChecklist(card.id, { title: newChecklistTitle.trim() });
      await refreshCard();
      setNewChecklistTitle('');
      setShowChecklistForm(false);
    } catch {
      toast.error('Failed to add checklist');
    }
  }

  async function handleDeleteChecklist(checklistId) {
    try {
      await cardDetailsApi.deleteChecklist(card.id, checklistId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete checklist');
    }
  }

  async function handleAddChecklistItem(checklistId) {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      await cardDetailsApi.addChecklistItem(card.id, checklistId, { text });
      await refreshCard();
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
    } catch {
      toast.error('Failed to add item');
    }
  }

  async function handleToggleItem(checklistId, itemId) {
    try {
      await cardDetailsApi.toggleChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch {
      toast.error('Failed to toggle item');
    }
  }

  async function handleDeleteItem(checklistId, itemId) {
    try {
      await cardDetailsApi.deleteChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete item');
    }
  }

  async function loadComments(cursor) {
    try {
      const result = await commentsApi.getComments(card.id, cursor);
      setComments((prev) => cursor ? [...prev, ...result.data] : result.data);
      setCommentsHasMore(result.meta.hasMore);
    } catch {
      // non-critical — comments load failure doesn't block the modal
    }
  }

  useEffect(() => { loadComments(); }, []);

  async function handleAddComment() {
    const text = newCommentText.trim();
    if (!text) return;
    const previous = comments;
    setIsSubmittingComment(true);
    const optimistic = { id: '__temp__', text, createdAt: new Date().toISOString(), user };
    setComments([optimistic, ...previous]);
    setNewCommentText('');
    try {
      const comment = await commentsApi.addComment(card.id, { text });
      setComments((prev) => [comment, ...prev.filter((c) => c.id !== '__temp__')]);
    } catch {
      setComments(previous);
      setNewCommentText(text);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await commentsApi.deleteComment(card.id, commentId);
    } catch {
      setComments(previous);
      toast.error('Failed to delete comment');
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center z-50 overflow-y-auto py-12 px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-2xl p-6 relative"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Title ── */}
        <div className="mb-6 pr-8">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') { setTitle(card.title); setEditingTitle(false); }
              }}
              className="input-cyber w-full rounded-xl px-3 py-2 text-xl font-bold font-display"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="font-display text-xl font-bold cursor-pointer rounded-xl px-3 py-2 -mx-3 transition-colors duration-150"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* ── Labels ── */}
        <div className="mb-6">
          <p className="section-label mb-2.5">Labels</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {card.labels?.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white"
                style={{
                  backgroundColor: label.color + '28',
                  border: `1px solid ${label.color}55`,
                  color: label.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: label.color, boxShadow: `0 0 5px ${label.color}` }}
                />
                {label.text}
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors duration-100"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {showLabelForm ? (
            <div
              className="rounded-xl p-3"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-form)' }}
            >
              <input
                type="text"
                placeholder="Label name..."
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="input-cyber w-full rounded-lg px-3 py-1.5 text-sm mb-3"
              />
              <div className="flex gap-2 mb-3">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setLabelColor(color)}
                    className="w-7 h-7 rounded-full transition-all duration-150"
                    style={{
                      backgroundColor: color,
                      transform: labelColor === color ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: labelColor === color ? `0 0 10px ${color}99, 0 0 0 2px ${color}66` : 'none',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddLabel} className="btn-cyber px-3 py-1.5 rounded-lg text-xs font-semibold">
                  Add
                </button>
                <button
                  onClick={() => setShowLabelForm(false)}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors duration-100"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLabelForm(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 font-medium"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-form)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-link)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-form)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add label
            </button>
          )}
        </div>

        {/* ── Due Date ── */}
        <div className="mb-6">
          <p className="section-label mb-2.5">Due Date</p>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => saveDueDate(e.target.value)}
              className="input-cyber rounded-lg px-3 py-1.5 text-sm"
            />
            {card.dueDate && (
              <>
                <DueDateBadge date={card.dueDate} />
                <button
                  onClick={() => saveDueDate('')}
                  className="p-1.5 rounded-lg transition-all duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <div className="mb-6">
          <p className="section-label mb-2.5">Description</p>
          {editingDesc ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input-cyber w-full rounded-xl px-3 py-2 text-sm resize-y"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveDescription} className="btn-cyber px-3 py-1.5 rounded-lg text-xs font-semibold">
                  Save
                </button>
                <button
                  onClick={() => { setDescription(card.description || ''); setEditingDesc(false); }}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors duration-100"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className="min-h-[56px] rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-150 whitespace-pre-wrap"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: card.description ? 'var(--text-secondary)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              {card.description || 'Click to add a description...'}
            </div>
          )}
        </div>

        {/* ── Checklists ── */}
        <div className="mb-4">
          <p className="section-label mb-3">Checklists</p>

          {card.checklists?.map((checklist) => {
            const total = checklist.items?.length || 0;
            const checked = checklist.items?.filter((i) => i.checked).length || 0;
            const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
            const isComplete = percent === 100;

            return (
              <div
                key={checklist.id}
                className="mb-4 rounded-xl p-3.5"
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-card)' }}>
                    {checklist.title}
                  </h4>
                  <button
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    className="text-xs px-2 py-1 rounded-lg transition-all duration-150 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    Delete
                  </button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xs font-mono font-bold w-8 text-right flex-shrink-0" style={{ color: isComplete ? '#4ade80' : 'var(--text-muted)' }}>
                    {percent}%
                  </span>
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ height: '4px', background: 'var(--bg-active)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        background: isComplete
                          ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                          : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                        boxShadow: isComplete ? '0 0 8px rgba(74,222,128,0.5)' : '0 0 8px rgba(99,102,241,0.4)',
                      }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {checklist.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 group rounded-lg px-1.5 py-1 transition-colors duration-100"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(checklist.id, item.id)}
                        className="rounded cursor-pointer flex-shrink-0"
                        style={{ width: '14px', height: '14px' }}
                      />
                      <span
                        className="flex-1 text-sm"
                        style={{
                          color: item.checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                          textDecoration: item.checked ? 'line-through' : 'none',
                        }}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-100"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an item..."
                    value={newItemTexts[checklist.id] || ''}
                    onChange={(e) => setNewItemTexts((prev) => ({ ...prev, [checklist.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                    className="input-cyber flex-1 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => handleAddChecklistItem(checklist.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                    style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--text-link)', border: '1px solid rgba(99,102,241,0.2)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(99,102,241,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add checklist */}
          {showChecklistForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Checklist title..."
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                autoFocus
                className="input-cyber flex-1 rounded-xl px-3 py-2 text-sm"
              />
              <button onClick={handleAddChecklist} className="btn-cyber px-3 py-2 rounded-xl text-xs font-semibold">
                Add
              </button>
              <button
                onClick={() => { setShowChecklistForm(false); setNewChecklistTitle(''); }}
                className="px-3 py-2 text-xs rounded-xl transition-colors duration-100"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowChecklistForm(true)}
              className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all duration-150"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-form)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-link)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-form)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add checklist
            </button>
          )}
        </div>

        {/* ── Comments ── */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="section-label">Comments</p>
            {comments.length > 0 && (
              <span
                className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--text-link)' }}
              >
                {comments.length}
              </span>
            )}
          </div>

          {/* Comment list */}
          <div className="max-h-64 overflow-y-auto space-y-3 mb-4 pr-1">
            {comments.length === 0 ? (
              <p className="text-sm py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                No comments yet. Be the first!
              </p>
            ) : (
              comments.map((comment) => {
                const initials = comment.user?.name
                  ? comment.user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                  : '?';
                const isOwn = comment.user?.id === user?.id;
                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 group rounded-xl px-2 py-2 transition-colors duration-100"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        color: '#fff',
                        boxShadow: '0 0 8px rgba(99,102,241,0.3)',
                      }}
                    >
                      {initials}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-card)' }}>
                          {comment.user?.name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {comment.id === '__temp__'
                            ? 'just now'
                            : formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
                        {comment.text}
                      </p>
                    </div>

                    {/* Delete (own comments only) */}
                    {isOwn && comment.id !== '__temp__' && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg flex-shrink-0 transition-all duration-100 self-start mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Load more */}
            {commentsHasMore && (
              <button
                onClick={() => loadComments(comments[comments.length - 1]?.id)}
                className="w-full text-xs py-2 rounded-lg transition-all duration-150 font-medium"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-form)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-link)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-form)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Load more comments
              </button>
            )}
          </div>

          {/* New comment input */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-form)' }}
          >
            <textarea
              placeholder="Write a comment... (Ctrl+Enter to submit)"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              rows={3}
              maxLength={1000}
              className="input-cyber w-full rounded-lg px-3 py-2 text-sm resize-none mb-2"
            />
            <div className="flex items-center justify-between">
              {newCommentText.length > 0 ? (
                <span
                  className="text-xs font-mono"
                  style={{ color: newCommentText.length > 900 ? 'var(--text-danger)' : 'var(--text-muted)' }}
                >
                  {newCommentText.length} / 1000
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={handleAddComment}
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{
                  background: newCommentText.trim() ? 'rgba(99,102,241,0.2)' : 'var(--bg-subtle)',
                  color: newCommentText.trim() ? 'var(--text-link)' : 'var(--text-muted)',
                  border: newCommentText.trim() ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-form)',
                  cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => { if (newCommentText.trim()) { e.currentTarget.style.background = 'rgba(99,102,241,0.3)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(99,102,241,0.2)'; } }}
                onMouseLeave={e => { if (newCommentText.trim()) { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                {isSubmittingComment ? 'Adding...' : 'Add comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
