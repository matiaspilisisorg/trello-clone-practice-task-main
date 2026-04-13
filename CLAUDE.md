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

## CRITICAL: Test database safety
**NEVER run server or E2E tests against the development database.** The test suite truncates ALL tables (users, boards, cards, etc.) between runs, which will destroy all existing data. Before running any tests, ensure a separate test database is configured in `server/.env.test`. If `.env.test` does not exist or does not contain a different `DATABASE_URL`, **do not run the tests** — warn the user and help them set up the test database first.

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
