# Cards

## Overview

Cards are the primary work items in the Trello Clone. Each card belongs to a list and can have a title, description, due date, labels, and checklists. Cards are displayed as tiles within their parent list column and can be clicked to open a detail modal.

## Card Creation and Editing

### Creating a Card

1. Click "Add a card" at the bottom of a list column.
2. Enter a title in the textarea.
3. Press Enter or click "Add card" to create.
4. The card appears at the bottom of the list with an auto-assigned position.

### Editing a Card

Click on a card tile to open the **Card Detail Modal**, which provides access to:

- **Title** -- Click the title text to toggle inline editing. Press Enter to save or Escape to cancel.
- **Description** -- Click the description area to open a textarea editor. Click "Save" to persist.
- **Due Date** -- Use the date picker to set or clear a due date.
- **Labels** -- Add colored labels with custom text. Click the X on a label to remove it.
- **Checklists** -- Create named checklists, add items, and toggle completion.

## Due Date Badge Color Logic

The `DueDateBadge` component displays the due date with color coding based on how close the date is:

| Condition | Badge Style | Meaning |
|---|---|---|
| Due date is in the past (`diffDays < 0`) | Red background, white text | Overdue |
| Due date is today (`diffDays === 0`) | Yellow background, dark text | Due today |
| Due date is in the future (`diffDays > 0`) | Gray background, dark text | Upcoming |

The date is displayed in `"MMM D"` format (e.g., "Jan 15") using `toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`.

## Checklist Progress

Each checklist displays a progress bar calculated as:

```
percent = total > 0 ? Math.round((checked / total) * 100) : 0
```

- The progress bar turns **green** when all items are completed (100%).
- Otherwise it is **blue**.
- The card tile in the list view shows an aggregate count: `checked / total` across all checklists on that card.

## Label Colors

Labels can be added with custom text and one of six preset colors:

| Color Name | Hex Code |
|---|---|
| Green | `#61bd4f` |
| Yellow | `#f2d600` |
| Orange | `#ff9f1a` |
| Red | `#eb5a46` |
| Purple | `#c377e0` |
| Blue | `#0079bf` |

Labels are displayed as colored pills on the card tile (compact, color-only dots) and in the card modal (full text with background color).

## API Reference

### Cards

#### `POST /api/lists/:listId/cards`

Create a new card in a list.

**Request body:**
```json
{
  "title": "Implement login page"
}
```

**Response** (`201`):
```json
{
  "data": {
    "_id": "clx4jkl...",
    "title": "Implement login page",
    "description": null,
    "position": 65536,
    "dueDate": null,
    "listId": "clx3ghi...",
    "labels": [],
    "checklists": [],
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

#### `PATCH /api/lists/:listId/cards/:id`

Update card fields (title, description, dueDate, position, listId).

**Request body (examples):**
```json
{
  "title": "Updated title",
  "description": "A detailed description",
  "dueDate": "2025-02-01"
}
```

To move a card to another list:
```json
{
  "listId": "clx5mno...",
  "position": 98304
}
```

#### `DELETE /api/lists/:listId/cards/:id`

Delete a card and all associated labels, checklists, and items.

### Card Details

#### `GET /api/cards/:cardId`

Get a card with all related data (labels, checklists, checklist items).

**Response** (`200`):
```json
{
  "data": {
    "_id": "clx4jkl...",
    "title": "Implement login page",
    "description": "Build the login form with validation",
    "dueDate": "2025-02-01T00:00:00.000Z",
    "labels": [
      { "_id": "clx6pqr...", "text": "Frontend", "color": "#0079bf" }
    ],
    "checklists": [
      {
        "_id": "clx7stu...",
        "title": "Subtasks",
        "items": [
          { "_id": "clx8vwx...", "text": "Form layout", "completed": true },
          { "_id": "clx9yza...", "text": "Validation", "completed": false }
        ]
      }
    ]
  }
}
```

### Labels

#### `POST /api/cards/:cardId/labels`

Add a label to a card.

**Request body:**
```json
{
  "text": "Bug",
  "color": "#eb5a46"
}
```

#### `DELETE /api/cards/:cardId/labels/:labelId`

Remove a label from a card.

### Checklists

#### `POST /api/cards/:cardId/checklists`

Create a new checklist on a card.

**Request body:**
```json
{
  "title": "QA Steps"
}
```

#### `DELETE /api/cards/:cardId/checklists/:checklistId`

Delete a checklist and all its items.

### Checklist Items

#### `POST /api/cards/:cardId/checklists/:checklistId/items`

Add an item to a checklist.

**Request body:**
```json
{
  "text": "Test edge cases"
}
```

#### `PATCH /api/cards/:cardId/checklists/:checklistId/items/:itemId`

Toggle the `checked` state of a checklist item.

#### `DELETE /api/cards/:cardId/checklists/:checklistId/items/:itemId`

Delete a checklist item.
