import { Draggable } from '@hello-pangea/dnd';
import DueDateBadge from './DueDateBadge.jsx';

export default function CardTile({ card, index, onClick }) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 mb-2 cursor-pointer
            hover:border-blue-400 hover:shadow-md transition-all group
            ${snapshot.isDragging ? 'shadow-lg rotate-2 ring-2 ring-blue-400' : ''}`}
        >
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {card.labels.map((label) => (
                <span
                  key={label.id}
                  className="w-8 h-2 rounded-full inline-block"
                  style={{ backgroundColor: label.color }}
                  title={label.text}
                />
              ))}
            </div>
          )}

          <p className="text-sm text-gray-800 leading-snug">{card.title}</p>

          {(card.dueDate || (card.checklists && card.checklists.length > 0)) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {card.dueDate && <DueDateBadge date={card.dueDate} />}
              {card.checklists && card.checklists.length > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {card.checklists.reduce(
                    (acc, cl) => acc + (cl.items?.filter((i) => i.checked).length || 0),
                    0
                  )}
                  /
                  {card.checklists.reduce(
                    (acc, cl) => acc + (cl.items?.length || 0),
                    0
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
