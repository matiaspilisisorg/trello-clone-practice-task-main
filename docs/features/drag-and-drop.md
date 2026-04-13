# Drag and Drop

## Overview

The Trello Clone uses **@hello-pangea/dnd** for drag-and-drop functionality. This is a community-maintained fork of `react-beautiful-dnd` with the same API surface but active maintenance and bug fixes. It enables reordering of both lists (horizontal drag within the board) and cards (vertical drag within a list, or cross-list moves).

## Component Hierarchy

```mermaid
graph TD
    BV[BoardView] --> DDC[DragDropContext]
    DDC --> DRP[Droppable - board<br/>direction=horizontal<br/>type=LIST]
    DRP --> DR1[Draggable - List 1]
    DRP --> DR2[Draggable - List 2]
    DRP --> DR3[Draggable - List N]

    DR1 --> LC1[ListColumn]
    LC1 --> CDRP1[Droppable - list1<br/>type=CARD]
    CDRP1 --> CD1[Draggable - Card 1]
    CDRP1 --> CD2[Draggable - Card 2]

    DR2 --> LC2[ListColumn]
    LC2 --> CDRP2[Droppable - list2<br/>type=CARD]
    CDRP2 --> CD3[Draggable - Card 3]

    style BV fill:#e0f2fe,stroke:#0284c7
    style DDC fill:#fef3c7,stroke:#d97706
    style DRP fill:#f0fdf4,stroke:#16a34a
```

The component tree nests as follows:

1. **`BoardView`** wraps everything in a `<DragDropContext>` with a single `onDragEnd` handler.
2. The board-level `<Droppable>` (direction `"horizontal"`, type `"LIST"`) contains all list columns.
3. Each **`ListColumn`** is a `<Draggable>` (for reordering lists) that contains its own `<Droppable>` (type `"CARD"`) for card reordering.
4. Each **`CardTile`** is a `<Draggable>` within its parent list's droppable zone.

The `type` field ensures that lists can only be dropped into the board droppable and cards can only be dropped into list droppables.

## Float Position Strategy

Instead of using integer indices that require reindexing all items after every move, the application uses **float-based positions**. This approach is inspired by how Trello itself handles ordering.

### How It Works

Each `List` and `Card` has a `position` field of type `Float` in the database. When an item is placed between two existing items, its new position is calculated as the midpoint:

```
newPosition = (beforePosition + afterPosition) / 2
```

### Position Calculation

The `calculatePosition` function handles three cases:

| Scenario | Calculation | Example |
|---|---|---|
| Empty list / append to end | `lastPosition + 65536` | `65536 + 65536 = 131072` |
| Insert at beginning | `firstPosition / 2` | `65536 / 2 = 32768` |
| Insert between two items | `(before + after) / 2` | `(65536 + 131072) / 2 = 98304` |

The initial spacing of `65536` (2^16) provides ample room for insertions before precision becomes a concern. In practice, a user would need to perform hundreds of consecutive insertions at the same position to exhaust floating-point precision.

### When to Re-index

While not currently implemented, a re-indexing strategy would be needed when the gap between two adjacent positions becomes smaller than a threshold (e.g., `< 0.001`). At that point, all positions in the list should be reassigned evenly (e.g., `65536, 131072, 196608, ...`).

## The `onDragEnd` Handler

```mermaid
flowchart TD
    START[onDragEnd fires] --> CHECK{destination?}
    CHECK -->|No| NOOP[Return - no drop target]
    CHECK -->|Yes| SAME{Same position?}
    SAME -->|Yes| NOOP
    SAME -->|No| TYPE{type?}

    TYPE -->|LIST| REORDER_LIST[Reorder lists array locally]
    REORDER_LIST --> CALC_L[Calculate new float position]
    CALC_L --> API_L[PATCH .../lists/:id/move]
    API_L --> SUCCESS_L{API success?}
    SUCCESS_L -->|Yes| DONE[Done]
    SUCCESS_L -->|No| ROLLBACK_L[Rollback to previous state]

    TYPE -->|CARD| CROSS{Same list?}
    CROSS -->|Yes| REORDER_CARD[Reorder cards within list]
    CROSS -->|No| MOVE_CARD[Move card between lists]

    REORDER_CARD --> CALC_C[Calculate new float position]
    MOVE_CARD --> CALC_C

    CALC_C --> API_C[PATCH .../cards/:id]
    API_C --> SUCCESS_C{API success?}
    SUCCESS_C -->|Yes| DONE
    SUCCESS_C -->|No| ROLLBACK_C[Rollback to previous state]

    style NOOP fill:#f3f4f6,stroke:#9ca3af
    style DONE fill:#bbf7d0,stroke:#16a34a
    style ROLLBACK_L fill:#fecaca,stroke:#dc2626
    style ROLLBACK_C fill:#fecaca,stroke:#dc2626
```

## Optimistic Update Pattern

All drag-and-drop operations follow an optimistic update strategy:

1. **Snapshot** the current state before the drag.
2. **Apply** the reorder locally in React state immediately (the UI updates instantly).
3. **Send** the API request in the background with the calculated float position.
4. **On failure**, rollback to the snapshot and show an error toast.

This pattern ensures that the drag feels instantaneous to the user, with no visible delay while waiting for the server response. The code stores a `previousLists` snapshot before each operation:

```javascript
const previousLists = lists; // for list moves

const previousLists = lists.map((l) => ({
  ...l,
  cards: [...(l.cards || [])],
})); // for card moves (deep copy)
```

If the API call throws, the state is restored:

```javascript
catch {
  toast.error('Failed to move list');
  setLists(previousLists);
}
```

## Cross-List Card Moves

When a card is dragged from one list to another:

1. The card is removed from the source list's `cards` array.
2. The card is inserted into the destination list's `cards` array at the target index.
3. The new float position is calculated relative to the destination list's cards.
4. The API call sends both the new `listId` and the new `position`.

This is handled as a single `PATCH` request to the cards endpoint with `{ listId, position }` in the body.
