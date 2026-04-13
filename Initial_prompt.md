# Trello Clone — Claude Code Spec

## Project Overview

Build a full-stack Trello clone as a portfolio/learning project. The app lets users sign up, create boards, organise work into lists and cards, and add rich details to each card (labels, due dates, descriptions, checklists). Drag-and-drop reordering is a core part of the experience.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) |
| Styling | Tailwind CSS v3 |
| Drag & Drop | @hello-pangea/dnd |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access token in memory, refresh token in httpOnly cookie) |
| API style | REST |

---

## Project Structure

```
trello-clone/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/             # Axios instance + API call functions
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── context/         # AuthContext, BoardContext
│   │   ├── hooks/           # Custom hooks
│   │   └── main.jsx
│   ├── src/__tests__/       # Vitest unit + integration tests
│   ├── index.html
│   └── vite.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # Express routers
│   │   ├── controllers/     # Route handler logic
│   │   ├── middleware/       # Auth, error handling
│   │   ├── prisma/          # schema.prisma + migrations
│   │   └── index.js
│   ├── src/__tests__/       # Jest unit + integration tests
│   └── package.json
├── e2e/                     # Playwright end-to-end tests
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── boards.spec.ts
│   │   ├── lists-cards.spec.ts
│   │   └── card-detail.spec.ts
│   ├── fixtures/
│   ├── playwright.config.ts
│   └── package.json
├── docs/
│   └── features/
│       ├── index.md         # Documentation index
│       ├── architecture.md
│       ├── auth.md
│       ├── boards.md
│       ├── cards.md
│       └── drag-and-drop.md
├── CLAUDE.md                # Claude Code guidance for this project
├── .env.example
└── README.md
```

---

## Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  boards    Board[]
  createdAt DateTime @default(now())
}

model Board {
  id        String   @id @default(cuid())
  title     String
  color     String   @default("#0079bf")   // background colour
  owner     User     @relation(fields: [ownerId], references: [id])
  ownerId   String
  lists     List[]
  createdAt DateTime @default(now())
}

model List {
  id        String   @id @default(cuid())
  title     String
  position  Float                           // for ordering
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  boardId   String
  cards     Card[]
  createdAt DateTime @default(now())
}

model Card {
  id          String      @id @default(cuid())
  title       String
  description String?
  position    Float                         // for ordering within list
  dueDate     DateTime?
  list        List        @relation(fields: [listId], references: [id], onDelete: Cascade)
  listId      String
  labels      Label[]
  checklists  Checklist[]
  createdAt   DateTime    @default(now())
}

model Label {
  id     String @id @default(cuid())
  text   String
  color  String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  cardId String
}

model Checklist {
  id     String          @id @default(cuid())
  title  String
  card   Card            @relation(fields: [cardId], references: [id], onDelete: Cascade)
  cardId String
  items  ChecklistItem[]
}

model ChecklistItem {
  id          String    @id @default(cuid())
  text        String
  checked     Boolean   @default(false)
  checklist   Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  checklistId String
}
```

---

## REST API Endpoints

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account (name, email, password) |
| POST | `/login` | Returns access JWT + sets refresh cookie |
| POST | `/refresh` | Issue new access token from refresh cookie |
| POST | `/logout` | Clear refresh cookie |

### Boards — `/api/boards` *(protected)*
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all boards for the logged-in user |
| POST | `/` | Create a board |
| GET | `/:id` | Get a board with all its lists and cards |
| PATCH | `/:id` | Update board title or colour |
| DELETE | `/:id` | Delete a board |

### Lists — `/api/boards/:boardId/lists` *(protected)*
| Method | Path | Description |
|---|---|---|
| POST | `/` | Add a list to a board |
| PATCH | `/:id` | Rename a list |
| PATCH | `/:id/move` | Reorder (update position) |
| DELETE | `/:id` | Delete a list and its cards |

### Cards — `/api/lists/:listId/cards` *(protected)*
| Method | Path | Description |
|---|---|---|
| POST | `/` | Add a card to a list |
| PATCH | `/:id` | Update title, description, dueDate, listId, position |
| DELETE | `/:id` | Delete a card |

### Card details — `/api/cards/:cardId` *(protected)*
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get full card detail (labels, checklists) |
| POST | `/labels` | Add a label |
| DELETE | `/labels/:labelId` | Remove a label |
| POST | `/checklists` | Add a checklist |
| DELETE | `/checklists/:checklistId` | Remove a checklist |
| PATCH | `/checklists/:checklistId/items/:itemId` | Toggle checklist item |
| POST | `/checklists/:checklistId/items` | Add checklist item |

---

## Frontend Pages & Routes

```
/                    → redirect to /login or /boards
/login               → Login page
/register            → Register page
/boards              → Dashboard: grid of all user's boards
/boards/:id          → Board view: lists + cards, full drag-and-drop
```

---

## Feature Requirements

### Authentication
- Register with name, email, password (bcrypt hashed, min 8 chars)
- Login returns a short-lived JWT access token (15 min) stored in React state/memory
- Refresh token stored in httpOnly cookie (7 days), used to silently re-issue access tokens
- Logout clears the cookie and React auth state
- Protected routes redirect to `/login` if unauthenticated
- AuthContext wraps the app and exposes `user`, `login()`, `logout()`, `isLoading`

### Boards Dashboard (`/boards`)
- Show all boards belonging to the logged-in user as a grid of coloured cards
- "Create board" button opens a small inline form (title + colour picker with ~6 preset colours)
- Click a board card to navigate to `/boards/:id`
- Each board card shows a delete button (with confirmation)

### Board View (`/boards/:id`)
- Horizontal scrollable row of lists
- Each list has a title and a vertical stack of cards
- **"Add list"** button at the end of the row — click to reveal inline input
- Each list has a **"Add card"** button — click to reveal inline input at the bottom
- List title is editable inline (click to edit, Enter/blur to save)
- Lists and cards can be reordered via drag-and-drop using `@hello-pangea/dnd`
  - Drag cards within a list and between lists
  - Drag entire lists to reorder them
  - On drop, call the PATCH move endpoint to persist the new position (use the midpoint strategy to calculate float positions)
- Delete list button (with a confirmation popover)

### Card Detail Modal
- Clicking a card opens a modal overlay (do not navigate away)
- Editable fields:
  - **Title** — click to edit inline
  - **Description** — click to open a textarea with Save/Cancel
  - **Due date** — date picker input; display as a coloured badge (red if overdue, yellow if due today, grey otherwise)
  - **Labels** — click "+ Add label" to open a small popover: type label text, pick a colour (6 presets), click Add; existing labels shown as coloured pills with an × to remove
  - **Checklists** — click "+ Add checklist" to name it; each checklist shows a progress bar (X / total items checked) and a list of items with checkboxes; add/delete individual items; delete entire checklist
- All changes auto-save or have explicit Save buttons — be consistent across fields
- Close modal with the × button or clicking the backdrop

### UI & Styling (Tailwind CSS)
- Dark header bar with the app logo/name and user avatar + dropdown (logout)
- Board view: coloured/gradient background matching the board's colour setting
- Lists: white/light-grey cards with rounded corners and subtle shadow
- Cards: white tiles with hover shadow, show due-date badge and label colour dots if set
- Modal: centred overlay with white card, backdrop blur
- Toast notifications (react-hot-toast or similar) for success/error actions
- Fully responsive down to tablet width (mobile is not required but shouldn't break)

---

## Drag-and-Drop Implementation Notes

Use `@hello-pangea/dnd` (a maintained fork of react-beautiful-dnd).

- Wrap the board in a `<DragDropContext onDragEnd={handleDragEnd}>`
- Each list is a `<Droppable droppableId={list.id} direction="vertical">`
- The list row is a `<Droppable droppableId="board-lists" direction="horizontal" type="LIST">`
- Each card is a `<Draggable draggableId={card.id} index={...}>`
- In `handleDragEnd`:
  1. Update local state optimistically (reorder arrays)
  2. Call the backend PATCH endpoint with the new position float
  3. On error, revert local state and show a toast

**Position strategy**: Store position as a float. When inserting between two items, use `(prev.position + next.position) / 2`. Start items at positions 1, 2, 3, … and re-index (1, 2, 3, …) via a backend reindex if the gap becomes too small (< 0.001).

---

## Error Handling

- All API errors return `{ error: string }` JSON with appropriate HTTP status codes
- Frontend displays errors via toast notifications
- 401 responses trigger a token refresh attempt; if that fails, redirect to `/login`
- Validate all inputs server-side (use express-validator or zod)

---

## Environment Variables

Create a `.env` file in `server/`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/trelloclone"
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

Client `.env` in `client/`:
```
VITE_API_URL=http://localhost:4000/api
```

---

## Setup Instructions to Include in README

1. `cd server && npm install && npx prisma migrate dev --name init`
2. `cd client && npm install`
3. Start server: `npm run dev` (nodemon)
4. Start client: `npm run dev` (Vite)
5. Visit `http://localhost:5173`

---

## Testing

### Backend Unit & Integration Tests (Jest)

Install: `npm install --save-dev jest supertest @types/jest`

Write tests in `server/src/__tests__/`. Use a separate test PostgreSQL database (set `DATABASE_URL` in `.env.test`). Use Prisma's `$transaction` rollback or `prisma.$executeRaw('TRUNCATE ...')` in `beforeEach` to keep tests isolated.

**Required test files and coverage:**

`auth.test.js`
- POST `/api/auth/register` — success, duplicate email, missing fields, short password
- POST `/api/auth/login` — success (returns token + sets cookie), wrong password, unknown email
- POST `/api/auth/refresh` — valid cookie issues new token, missing/expired cookie returns 401
- POST `/api/auth/logout` — clears cookie

`boards.test.js`
- GET `/api/boards` — returns only the authed user's boards
- POST `/api/boards` — creates board, validates title required
- GET `/api/boards/:id` — returns full board with nested lists+cards; 404 for unknown id; 403 for another user's board
- PATCH `/api/boards/:id` — updates title and colour
- DELETE `/api/boards/:id` — deletes board and cascades

`lists.test.js`
- POST, PATCH (rename), PATCH (move/reorder), DELETE
- Verify cascade delete removes child cards

`cards.test.js`
- CRUD on cards
- Moving a card to a different list (PATCH with new `listId`)
- Labels: add, remove
- Checklists: create, delete, add item, toggle item, delete item

`middleware.test.js`
- `authenticate` middleware rejects missing token, expired token, malformed token

**Run command**: `cd server && npm test`

---

### Frontend Unit Tests (Vitest + React Testing Library)

Install: `npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`

Write tests in `client/src/__tests__/`. Mock API calls with `vi.mock('../api/...')`.

**Required test files and coverage:**

`AuthContext.test.jsx`
- `login()` stores token in state and sets `user`
- `logout()` clears user and calls the logout API
- Unauthenticated state redirects protected routes

`BoardCard.test.jsx`
- Renders board title and colour
- Delete button calls `onDelete` prop

`CardModal.test.jsx`
- Opens with correct card data
- Editing title triggers save on blur/Enter
- Adding a label renders a new pill
- Checking a checklist item updates progress bar

`BoardView.test.jsx`
- Renders lists and cards from mock data
- Inline "Add list" form appears on button click and submits correctly
- Inline "Add card" form appears on button click

`DueDateBadge.test.jsx`
- Red badge when overdue
- Yellow badge when due today
- Grey badge for future dates

**Run command**: `cd client && npm test`

---

### End-to-End Tests (Playwright)

Install in `e2e/`: `npm install --save-dev @playwright/test`

Configure `playwright.config.ts` to:
- Run against `http://localhost:5173` (start server + client before running)
- Use Chromium by default
- Store screenshots in `e2e/screenshots/` on failure
- Run tests serially (not parallel) to avoid DB conflicts

**Required test files:**

`auth.spec.ts`
- User can register with valid credentials and land on the boards dashboard
- User cannot register with a duplicate email (sees error toast)
- User can log in and log out
- Logged-out user visiting `/boards` is redirected to `/login`

`boards.spec.ts`
- Create a new board from the dashboard
- Board appears in the grid with correct title and colour
- Delete a board (confirm dialog → board disappears)
- Navigate to a board

`lists-cards.spec.ts`
- Add a list to a board
- Rename a list inline
- Add a card to a list
- Delete a list (and its cards disappear)
- Drag a card from one list to another and verify the new position persists after page reload

`card-detail.spec.ts`
- Open a card modal
- Edit the card title
- Add a description and save
- Set a due date
- Add a label
- Add a checklist and check an item (verify progress bar)
- Close modal with backdrop click

**Run command**: `cd e2e && npx playwright test`
**Headed mode for debugging**: `npx playwright test --headed`
**Playwright report**: `npx playwright show-report`

---

## Documentation (`docs/features/`)

Create all documentation files **after** the implementation is complete. Every doc should include at least one Mermaid diagram where it adds clarity.

### `docs/features/index.md`
The documentation hub. Must contain:
- A brief project description
- A table listing every doc file, its path, and one-line summary
- A high-level Mermaid architecture diagram, e.g.:

```mermaid
graph TD
  Browser["Browser (React + Vite)"]
  API["Express REST API"]
  DB[(PostgreSQL)]
  Prisma["Prisma ORM"]

  Browser -->|JWT in header| API
  API --> Prisma
  Prisma --> DB
```

### `docs/features/architecture.md`
- Full-stack architecture overview
- Monorepo layout explanation
- Mermaid ER diagram of the full database schema
- Sequence diagram of the JWT refresh flow:

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  C->>A: POST /auth/login
  A-->>C: { accessToken } + Set-Cookie: refreshToken
  C->>A: GET /api/boards (Authorization: Bearer <accessToken>)
  A-->>C: 200 boards data
  Note over C,A: access token expires after 15 min
  C->>A: POST /auth/refresh (cookie sent automatically)
  A-->>C: { accessToken } (new)
```

### `docs/features/auth.md`
- Registration and login flow description
- Password hashing strategy (bcrypt, cost factor)
- Token storage rationale (access in memory, refresh in httpOnly cookie)
- API reference table for `/api/auth` endpoints
- Mermaid flowchart of the auth flow

### `docs/features/boards.md`
- Board creation, listing, and deletion
- Board colour options
- API reference for boards and lists
- Mermaid state diagram of board/list/card lifecycle

### `docs/features/cards.md`
- Card creation and editing
- Card detail fields: description, due date, labels, checklists
- Due date badge colour logic
- Checklist progress calculation
- API reference for cards and card-detail endpoints

### `docs/features/drag-and-drop.md`
- Library choice (@hello-pangea/dnd) and rationale
- Component hierarchy (DragDropContext → Droppable → Draggable)
- Float position strategy with midpoint formula
- Re-indexing logic when gap < 0.001
- Optimistic update + rollback pattern
- Mermaid flowchart of the `onDragEnd` handler logic

---

## CLAUDE.md

Create `CLAUDE.md` in the project root. This file gives Claude Code context about the project whenever it's opened in future sessions. It must contain:

```markdown
# Trello Clone — CLAUDE.md

## What this project is
A full-stack Trello clone (portfolio project). React + Vite frontend, Node.js/Express REST API, PostgreSQL via Prisma.

## Key commands
| Task | Command |
|---|---|
| Start API server | `cd server && npm run dev` |
| Start React client | `cd client && npm run dev` |
| Run DB migrations | `cd server && npx prisma migrate dev` |
| Open Prisma Studio | `cd server && npx prisma studio` |
| Run server tests | `cd server && npm test` |
| Run client tests | `cd client && npm test` |
| Run E2E tests | `cd e2e && npx playwright test` |
| View E2E report | `cd e2e && npx playwright show-report` |

## Project structure
See README.md for the full directory layout.

## Coding conventions
- JavaScript (not TypeScript) for server and client; TypeScript only in e2e/
- camelCase for JS identifiers; snake_case for DB columns
- Prisma models use PascalCase
- API responses: `{ data: ... }` for success, `{ error: "..." }` for errors
- All protected routes require `Authorization: Bearer <token>` header

## Environment setup
- Copy `.env.example` to `server/.env` and fill in values
- Requires PostgreSQL running locally (or via Docker: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`)
- A separate test DB is needed for running server tests (set in `server/.env.test`)

## Architecture decisions
- Access tokens stored in React state (not localStorage) to prevent XSS
- Refresh tokens in httpOnly cookies to prevent JS access
- Float positions for ordering to avoid full-list re-indexes on every drag
- @hello-pangea/dnd chosen over react-beautiful-dnd (maintained fork)

## Docs
Full feature documentation is in `docs/features/`. Start with `docs/features/index.md`.
```

---

## Post-Build Verification

After the entire implementation is complete, Claude must perform the following verification steps **in order**. Do not mark the project as done until all steps pass.

### Step 1 — Run all tests

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test

# E2E tests (requires both servers running)
cd e2e && npx playwright test
```

All test suites must pass (0 failures). If any test fails:
1. Read the failure output carefully
2. Fix the underlying code or test
3. Re-run until clean

### Step 2 — Take screenshots and visually inspect the app

Start both servers, then use Playwright (or a headless browser script) to take screenshots of every key screen and save them to `e2e/screenshots/manual/`:

| Filename | What to capture |
|---|---|
| `01-login.png` | Login page |
| `02-register.png` | Register page |
| `03-boards-empty.png` | Boards dashboard (no boards yet) |
| `04-boards-with-data.png` | Boards dashboard with 2–3 boards |
| `05-board-view.png` | A board with multiple lists and cards |
| `06-card-modal.png` | Card detail modal open with label + checklist visible |
| `07-card-modal-overdue.png` | Card modal showing an overdue due-date badge |
| `08-drag-in-progress.png` | Mid-drag state (a card being dragged) if capturable |

After capturing screenshots, Claude must **visually inspect each one** and verify:
- The layout matches the design intent described in "UI & Styling"
- No visible broken styles, overlapping elements, or missing content
- Colour-coded due-date badges render correctly
- The board background colour matches the board's setting
- Modals are centred and properly overlaid
- The header bar is present on authenticated pages
- Lists and cards are visually distinct

If any screenshot reveals a visual defect, fix it and retake that screenshot.

### Step 3 — Smoke test checklist

Manually verify (or automate as an additional Playwright script) that the following user journeys work end-to-end:

- [ ] Register a new account → redirected to `/boards`
- [ ] Create a board with a custom colour → board appears in grid
- [ ] Navigate to the board → empty board view loads
- [ ] Add three lists → lists appear in a row
- [ ] Add two cards to the first list
- [ ] Drag a card to the second list → position persists after page reload
- [ ] Open a card → modal appears
- [ ] Edit title, add description, set due date, add a label, add checklist with 2 items
- [ ] Check one checklist item → progress bar shows 1/2
- [ ] Close modal → card tile shows label dots
- [ ] Delete a list → list and its cards disappear
- [ ] Log out → redirected to `/login`; `/boards` redirects back to `/login`

---

## Demo Seed Data

Every new user must automatically receive **2 pre-filled demo boards** upon registration. Existing users without demo boards should also be seeded via a one-time script.

### Implementation

- Create `server/src/seed/demoBoards.js` exporting an async `seedDemoBoards(userId)` function
- Call `seedDemoBoards(user.id)` in the register controller (fire-and-forget, don't block the response)
- Create `server/src/seed/seedExisting.js` as a one-time script to seed existing users: `node src/seed/seedExisting.js`

### Board 1: "Product Launch Q2" (colour: `#0079bf`)

| List | Cards |
|---|---|
| Backlog | 5 cards — research, onboarding emails, blog post, demo video script, analytics dashboard |
| To Do | 4 cards — landing page design, Stripe integration, pricing page, error monitoring |
| In Progress | 3 cards — auth flow, dashboard UI, API rate limiting |
| Review | 2 cards — DB schema optimization, mobile responsive nav |
| Done | 3 cards — project setup/CI, design system, user stories |

**Labels** spread across cards: Design, High Priority, Backend, Frontend, Bug, DevOps, Research, Marketing (use the 6 preset colours).

**Checklists** (with partial progress — some items checked, some not):
- "Landing Page Tasks" on the landing page card (2/5 done)
- "Stripe Integration Steps" on the Stripe card (2/6 done)
- "Auth Implementation" on the auth card (3/5 done)
- "Dashboard Components" on the dashboard card (2/4 done)
- "DB Review Checklist" on the DB optimization card (2/3 done)

**Due dates**: mix of future dates (To Do, In Progress cards) and 1 overdue date (Review card).

### Board 2: "Marketing Campaign — Summer 2026" (colour: `#519839`)

| List | Cards |
|---|---|
| Ideas | 6 cards — TikTok series, YouTuber partnerships, referral program, virtual event, comparison pages, Reddit AMA |
| Planning | 4 cards — email drip campaign, social media calendar, SEO research, ad creatives |
| In Production | 3 cards — getting started guide, product walkthrough video, testimonial graphics |
| Scheduled | 3 cards — Product Hunt launch, Twitter thread, newsletter blast |
| Published | 4 cards — blog post, case study, LinkedIn carousel, press release |

**Labels**: Social, Video, Growth, Event, SEO, Community, Email, Content, Ads, Design, Launch, PR, High Priority.

**Checklists** (with partial progress):
- "Email Sequence" (3/9 done)
- "Content Calendar Tasks" (2/5 done)
- "Getting Started Guide" (3/6 done)
- "Product Hunt Prep" (5/7 done)
- "Video Production" (1/5 done)

**Due dates**: mix of near-future and further-out dates.

### Requirements
- Cards should have realistic titles, descriptions (where relevant), and varied data (some cards have labels only, some have checklists only, some have both, some have neither)
- Checklists should have realistic item text and varied completion percentages
- The seed should be idempotent-safe when called on registration (each call creates a fresh pair of boards)

---

## Out of Scope (do not build)

- Team/multi-user collaboration on the same board
- Real-time updates (WebSockets)
- File attachments
- Activity log / audit trail
- Board templates
- Search
- Mobile-specific layout

---

## CRITICAL: Test Database Safety

**NEVER run tests (`npm test`, `npx playwright test`) against the development database.** The test suite truncates ALL tables (users, boards, cards, etc.) between test runs, which will permanently destroy all existing data. Before running any tests:

1. Ensure `server/.env.test` exists with a **different** `DATABASE_URL` pointing to a dedicated test database.
2. If `.env.test` does not exist or does not contain a separate `DATABASE_URL`, **do not run the tests** — warn the user and help them set up the test database first.
3. Never assume the test database is configured. Always verify before running any test command.

---

## Quality Bar

This is a portfolio project, so prioritise:
- Clean, readable, well-commented code
- Sensible folder/file organisation
- Consistent naming conventions (camelCase JS, snake_case DB)
- Proper error handling at every layer
- No hard-coded secrets
