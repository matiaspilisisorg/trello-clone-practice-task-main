export default function DueDateBadge({ date }) {
  if (!date) return null;

  const dueDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.round((dueDateNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let bg, color, glow;
  if (diffDays < 0) {
    bg = 'rgba(239,68,68,0.18)';
    color = '#f87171';
    glow = 'rgba(239,68,68,0.3)';
  } else if (diffDays === 0) {
    bg = 'rgba(234,179,8,0.18)';
    color = '#facc15';
    glow = 'rgba(234,179,8,0.3)';
  } else {
    bg = 'var(--bg-stat)';
    color = 'var(--text-muted)';
    glow = null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{
        background: bg,
        color,
        ...(glow ? { boxShadow: `0 0 8px ${glow}` } : {}),
      }}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {formatted}
    </span>
  );
}
