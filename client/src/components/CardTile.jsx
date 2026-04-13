import { Draggable } from '@hello-pangea/dnd';
import DueDateBadge from './DueDateBadge.jsx';

export default function CardTile({ card, index, onClick }) {
  const totalItems = card.checklists?.reduce((acc, cl) => acc + (cl.items?.length || 0), 0) ?? 0;
  const checkedItems = card.checklists?.reduce((acc, cl) => acc + (cl.items?.filter((i) => i.checked).length || 0), 0) ?? 0;
  const checklistComplete = totalItems > 0 && checkedItems === totalItems;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className="rounded-xl mb-2 cursor-pointer group"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            padding: '10px 12px',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease',
            ...(snapshot.isDragging
              ? {
                  transform: 'rotate(2deg) scale(1.02)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.45), 0 0 24px rgba(99,102,241,0.2)',
                  borderColor: 'rgba(99,102,241,0.45)',
                }
              : {}),
          }}
          onMouseEnter={e => {
            if (!snapshot.isDragging) {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              e.currentTarget.style.boxShadow = '0 0 16px var(--glow-indigo), 0 4px 12px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            if (!snapshot.isDragging) {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {/* Label strips */}
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map((label) => (
                <span
                  key={label.id}
                  className="h-1.5 rounded-full inline-block"
                  style={{
                    width: '28px',
                    backgroundColor: label.color,
                    boxShadow: `0 0 6px ${label.color}88`,
                  }}
                  title={label.text}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-sm leading-snug font-medium" style={{ color: 'var(--text-card)' }}>
            {card.title}
          </p>

          {/* Metadata row */}
          {(card.dueDate || (card.checklists && card.checklists.length > 0)) && (
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {card.dueDate && <DueDateBadge date={card.dueDate} />}
              {card.checklists && card.checklists.length > 0 && (
                <span
                  className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium"
                  style={{
                    background: checklistComplete ? 'rgba(34,197,94,0.15)' : 'var(--bg-stat)',
                    color: checklistComplete ? '#4ade80' : 'var(--text-muted)',
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {checkedItems}/{totalItems}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
